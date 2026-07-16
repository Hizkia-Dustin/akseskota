import { prisma } from '../../config/prisma';
import { CreatePlacePostInput, SearchCommunityPlacesInput } from './communityPlaces.schema';

const featureList = (posts: Array<{ features: unknown }>) => [...new Set(posts.flatMap((post) => Array.isArray(post.features) ? post.features.filter((feature): feature is string => typeof feature === 'string') : []))];
const average = (values: number[]) => values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;

export async function getCommunityPlace(externalId: string) {
  const place = await prisma.communityPlace.findUnique({
    where: { externalId },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
  if (!place) return { place: null, posts: [], summary: { postCount: 0, rating: null, accessibilityRating: null } };
  return {
    place: { id: place.id, externalId: place.externalId, name: place.name, address: place.address, latitude: place.latitude, longitude: place.longitude },
    posts: place.posts,
    summary: {
      postCount: place.posts.length,
      rating: average(place.posts.map((post) => post.rating)),
      accessibilityRating: average(place.posts.map((post) => post.accessibilityRating)),
      features: featureList(place.posts),
    },
  };
}

export async function searchCommunityPlaces(input: SearchCommunityPlacesInput) {
  const places = await prisma.communityPlace.findMany({
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { title: true, content: true, rating: true, accessibilityRating: true, features: true, photoUrl: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  const stopWords = new Set(['aku', 'saya', 'kami', 'pakai', 'menggunakan', 'cari', 'carikan', 'tempat', 'yang', 'bisa', 'dekat', 'untuk', 'dengan', 'ramah', 'disabilitas', 'difabel', 'kursi', 'roda', 'ada', 'punya', 'tanpa', 'dan', 'atau', 'di']);
  const terms = input.query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !stopWords.has(term));

  return places.map((place) => {
    const features = featureList(place.posts);
    const searchable = [place.name, place.address, ...place.posts.flatMap((post) => [post.title, post.content])].filter(Boolean).join(' ').toLowerCase();
    const matchedTerms = terms.filter((term) => searchable.includes(term)).length;
    return {
      id: place.id,
      externalId: place.externalId,
      name: place.name,
      address: place.address,
      coordinates: [place.longitude, place.latitude],
      rating: average(place.posts.map((post) => post.rating)),
      accessibilityRating: average(place.posts.map((post) => post.accessibilityRating)),
      evidenceCount: place.posts.length,
      features,
      latestPhotoUrl: place.posts.find((post) => post.photoUrl)?.photoUrl ?? null,
      matchedTerms,
    };
  }).filter((place) => place.evidenceCount > 0)
    .filter((place) => input.features.every((feature) => place.features.includes(feature)))
    .filter((place) => terms.length === 0 || place.matchedTerms > 0)
    .sort((a, b) => b.matchedTerms - a.matchedTerms || (b.accessibilityRating ?? 0) - (a.accessibilityRating ?? 0) || b.evidenceCount - a.evidenceCount)
    .slice(0, 20);
}

export async function createCommunityPlacePost(userId: string, input: CreatePlacePostInput, photoUrl?: string) {
  const place = await prisma.communityPlace.upsert({
    where: { externalId: input.externalId },
    update: { name: input.name, address: input.address, latitude: input.latitude, longitude: input.longitude },
    create: { externalId: input.externalId, name: input.name, address: input.address, latitude: input.latitude, longitude: input.longitude },
  });
  return prisma.placePost.create({
    data: {
      placeId: place.id,
      authorId: userId,
      title: input.title,
      content: input.content,
      rating: input.rating,
      accessibilityRating: input.accessibilityRating,
      features: input.features,
      photoUrl,
    },
    include: { author: { select: { id: true, name: true } } },
  });
}
