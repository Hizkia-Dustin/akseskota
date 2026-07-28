import { prisma } from '../../config/prisma';
import { SearchDestinationsInput } from './destinations.schema';
import { VerificationStatus } from '@prisma/client';

const average = (values: number[]) => values.length
  ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
  : null;

function accessibilitySummary(place: {
  wheelchairEntrance: boolean | null;
  wheelchairSeating: boolean | null;
  wheelchairRestroom: boolean | null;
  wheelchairParking: boolean | null;
  accessibilityEvidence?: Array<{
    featureCode: string;
    available: boolean | null;
    evidenceSource: string;
    verificationStatus: string;
  }>;
}) {
  const entries = [
    ['WHEELCHAIR_ENTRANCE', place.wheelchairEntrance],
    ['WHEELCHAIR_SEATING', place.wheelchairSeating],
    ['WHEELCHAIR_RESTROOM', place.wheelchairRestroom],
    ['WHEELCHAIR_PARKING', place.wheelchairParking],
  ] as const;
  const verifiedEvidence = (place.accessibilityEvidence || []).filter((item) => item.verificationStatus === 'VERIFIED');
  const verifiedByFeature = new Map(verifiedEvidence.map((item) => [item.featureCode, item.available]));
  const indicatedFeatures = entries.filter(([, value]) => value === true).map(([code]) => code);
  const known = [...verifiedByFeature.entries()].filter(([, value]) => value !== null);
  const available = known.filter(([, value]) => value === true).map(([code]) => code);
  const unavailable = known.filter(([, value]) => value === false).map(([code]) => code);
  return {
    availableFeatures: available,
    unavailableFeatures: unavailable,
    indicatedFeatures,
    knownFeatureCount: known.length,
    accessibilityScore: known.length ? Math.round((available.length / known.length) * 100) : null,
    dataCoverage: Math.round((known.length / 6) * 100),
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
          accessibilityEvidence: { some: { featureCode, available: true, verificationStatus: VerificationStatus.VERIFIED } },
        })),
      ],
    },
    select: {
      ...destinationSelect,
      accessibilityEvidence: {
        select: { featureCode: true, available: true, evidenceSource: true, verificationStatus: true },
      },
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
