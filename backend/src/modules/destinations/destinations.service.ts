import { prisma } from '../../config/prisma';
import { SearchDestinationsInput } from './destinations.schema';

const average = (values: number[]) => values.length
  ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
  : null;

function accessibilitySummary(place: {
  wheelchairEntrance: boolean | null;
  wheelchairSeating: boolean | null;
  wheelchairRestroom: boolean | null;
  wheelchairParking: boolean | null;
}) {
  const entries = [
    ['WHEELCHAIR_ENTRANCE', place.wheelchairEntrance],
    ['WHEELCHAIR_SEATING', place.wheelchairSeating],
    ['WHEELCHAIR_RESTROOM', place.wheelchairRestroom],
    ['WHEELCHAIR_PARKING', place.wheelchairParking],
  ] as const;
  const known = entries.filter(([, value]) => value !== null);
  const available = entries.filter(([, value]) => value === true).map(([code]) => code);
  return {
    availableFeatures: available,
    knownFeatureCount: known.length,
    accessibilityScore: known.length ? Math.round((available.length / known.length) * 100) : null,
    dataCoverage: Math.round((known.length / entries.length) * 100),
  };
}

const destinationSelect = {
  externalId: true,
  name: true,
  category: true,
  placeType: true,
  description: true,
  address: true,
  latitude: true,
  longitude: true,
  googleRating: true,
  googleReviewCount: true,
  priceRange: true,
  businessStatus: true,
  phone: true,
  website: true,
  mapsUrl: true,
  menuUrl: true,
  plusCode: true,
  openingHours: true,
  wheelchairEntrance: true,
  wheelchairSeating: true,
  wheelchairRestroom: true,
  wheelchairParking: true,
  accessibilityStatus: true,
  sourceVerificationStatus: true,
  primaryImageUrl: true,
  scrapedAt: true,
} as const;

export async function searchDestinations(input: SearchDestinationsInput) {
  const query = input.query.trim();
  const places = await prisma.communityPlace.findMany({
    where: {
      AND: [
        query ? { OR: [
          { name: { contains: query } },
          { address: { contains: query } },
          { category: { contains: query } },
          { description: { contains: query } },
        ] } : {},
        input.type ? { placeType: input.type } : {},
        ...input.features.map((featureCode) => ({
          accessibilityEvidence: { some: { featureCode, available: true } },
        })),
      ],
    },
    select: {
      ...destinationSelect,
      _count: { select: { posts: true, accessibilityEvidence: true } },
    },
    orderBy: [
      { googleReviewCount: 'desc' },
      { googleRating: 'desc' },
      { name: 'asc' },
    ],
    take: input.limit,
  });

  return places.map((place) => ({
    ...place,
    coordinates: [place.longitude, place.latitude],
    communityPostCount: place._count.posts,
    evidenceCount: place._count.accessibilityEvidence,
    ...accessibilitySummary(place),
    _count: undefined,
  }));
}

export async function getDestination(externalId: string) {
  const place = await prisma.communityPlace.findUnique({
    where: { externalId },
    select: {
      ...destinationSelect,
      popularTimes: true,
      accessibilityReviewCount: true,
      accessibilityEvidence: { orderBy: [{ featureCode: 'asc' }] },
      scrapedReviews: { orderBy: { createdAt: 'desc' }, take: 20 },
      images: { orderBy: { order: 'asc' }, take: 12 },
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
  if (!place) return null;
  return {
    ...place,
    coordinates: [place.longitude, place.latitude],
    ...accessibilitySummary(place),
    communitySummary: {
      postCount: place.posts.length,
      rating: average(place.posts.map((post) => post.rating)),
      accessibilityRating: average(place.posts.map((post) => post.accessibilityRating)),
    },
  };
}
