import { prisma } from '../../config/prisma';
import {
  CreateDirectoryContributionInput,
  CreatePlacePostInput,
  ListDirectoryContributionsInput,
  SearchCommunityPlacesInput,
  VoteDirectoryContributionInput,
} from './communityPlaces.schema';
import { deletePersistedPhoto } from '../../middlewares/upload';
import { ApiError } from '../../middlewares/errorHandler';
import { Prisma } from '@prisma/client';

const featureList = (posts: Array<{ features: unknown }>) => [...new Set(posts.flatMap((post) => Array.isArray(post.features) ? post.features.filter((feature): feature is string => typeof feature === 'string') : []))];
const importedFeatureList = (place: {
  wheelchairEntrance: boolean | null;
  wheelchairRestroom: boolean | null;
  wheelchairParking: boolean | null;
}) => [
  place.wheelchairEntrance ? 'RAMP' : null,
  place.wheelchairRestroom ? 'ACCESSIBLE_TOILET' : null,
  place.wheelchairParking ? 'ACCESSIBLE_PARKING' : null,
].filter((feature): feature is string => Boolean(feature));
const average = (values: number[]) => values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;
const confidence = (count: number) => count >= 4 ? 'TINGGI' : count >= 2 ? 'SEDANG' : 'RENDAH';

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
      confidence: confidence(place.posts.length),
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
      accessibilityEvidence: {
        select: { featureCode: true, available: true, verificationStatus: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  const stopWords = new Set(['aku', 'saya', 'kami', 'pakai', 'menggunakan', 'cari', 'carikan', 'tempat', 'yang', 'bisa', 'dekat', 'untuk', 'dengan', 'ramah', 'disabilitas', 'difabel', 'kursi', 'roda', 'ada', 'punya', 'tanpa', 'dan', 'atau', 'di', 'ramp', 'lift', 'toilet', 'aksesibel', 'parkir', 'guiding', 'block', 'tangga', 'bebas']);
  const terms = input.query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !stopWords.has(term));

  return places.map((place) => {
    const communityFeatures = featureList(place.posts);
    const verifiedFeatures = place.accessibilityEvidence
      .filter((evidence) => evidence.available === true && evidence.verificationStatus === 'VERIFIED')
      .map((evidence) => evidence.featureCode);
    const directoryFeatures = importedFeatureList(place);
    const features = [...new Set([...communityFeatures, ...verifiedFeatures, ...directoryFeatures])];
    const verifiedCount = verifiedFeatures.length;
    const communityCount = place.posts.length;
    const searchable = [place.name, place.address, place.category, place.placeType, place.description, ...place.posts.flatMap((post) => [post.title, post.content])].filter(Boolean).join(' ').toLowerCase();
    const matchedTerms = terms.filter((term) => searchable.includes(term)).length;
    const dataSource = verifiedCount > 0
      ? 'Terverifikasi komunitas'
      : communityCount > 0
        ? 'Pengalaman komunitas'
        : 'Data direktori — perlu verifikasi';
    return {
      id: place.id,
      externalId: place.externalId,
      name: place.name,
      address: place.address,
      coordinates: [place.longitude, place.latitude],
      rating: average(place.posts.map((post) => post.rating)),
      accessibilityRating: average(place.posts.map((post) => post.accessibilityRating)),
      evidenceCount: communityCount + verifiedCount,
      confidence: verifiedCount > 0 ? 'TINGGI' : communityCount > 0 ? confidence(communityCount) : 'RENDAH',
      dataSource,
      requiresVerification: verifiedCount === 0,
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
  let replacedPhotoUrl: string | null | undefined;
  const post = await prisma.$transaction(async (transaction) => {
    const place = await transaction.communityPlace.upsert({
      where: { externalId: input.externalId },
      update: { name: input.name, address: input.address, latitude: input.latitude, longitude: input.longitude },
      create: { externalId: input.externalId, name: input.name, address: input.address, latitude: input.latitude, longitude: input.longitude },
    });
    const existing = await transaction.placePost.findUnique({
      where: { placeId_authorId: { placeId: place.id, authorId: userId } },
      select: { photoUrl: true },
    });
    replacedPhotoUrl = photoUrl ? existing?.photoUrl : undefined;
    return transaction.placePost.upsert({
      where: { placeId_authorId: { placeId: place.id, authorId: userId } },
      update: {
        title: input.title,
        content: input.content,
        rating: input.rating,
        accessibilityRating: input.accessibilityRating,
        features: input.features,
        ...(photoUrl ? { photoUrl } : {}),
      },
      create: {
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
  });
  if (replacedPhotoUrl && replacedPhotoUrl !== photoUrl) await deletePersistedPhoto(replacedPhotoUrl);
  return post;
}

const directoryContributionInclude = {
  author: { select: { id: true, name: true } },
  place: { select: { externalId: true, name: true, address: true } },
  votes: {
    orderBy: { createdAt: 'asc' as const },
    include: { voter: { select: { id: true, name: true } } },
  },
};

function contributionCounts(votes: Array<{ decision: string }>) {
  return {
    agree: votes.filter((vote) => vote.decision === 'VERIFIED').length,
    disagree: votes.filter((vote) => vote.decision === 'REJECTED').length,
    recheck: votes.filter((vote) => vote.decision === 'NEEDS_RECHECK').length,
    required: 3,
  };
}

export function resolveDirectoryContributionStatus(votes: Array<{ decision: string }>) {
  const counts = contributionCounts(votes);
  if (counts.agree >= 3 && counts.agree > counts.disagree) return 'VERIFIED' as const;
  if (counts.disagree >= 3 && counts.disagree > counts.agree) return 'REJECTED' as const;
  if (counts.recheck >= 2 || (counts.agree >= 2 && counts.disagree >= 2)) return 'NEEDS_RECHECK' as const;
  return 'UNVERIFIED' as const;
}

function withContributionCounts<T extends { votes: Array<{ decision: string }> }>(contribution: T) {
  return { ...contribution, consensus: contributionCounts(contribution.votes) };
}

export async function listDirectoryContributions(input: ListDirectoryContributionsInput) {
  const rows = await prisma.directoryContribution.findMany({
    where: {
      status: input.status || { in: ['UNVERIFIED', 'NEEDS_RECHECK'] },
      ...(input.externalId ? { place: { externalId: input.externalId } } : {}),
    },
    include: directoryContributionInclude,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map(withContributionCounts);
}

export async function createDirectoryContribution(userId: string, input: CreateDirectoryContributionInput, photoUrl?: string) {
  if (!photoUrl) throw new ApiError(422, 'Foto bukti wajib diunggah agar usulan dapat diverifikasi.');

  let placeId: string | undefined;
  if (input.kind === 'FEATURE_STATUS') {
    const place = await prisma.communityPlace.findUnique({
      where: { externalId: input.externalId! },
      select: { id: true },
    });
    if (!place) throw new ApiError(404, 'Tempat direktori tidak ditemukan.');
    placeId = place.id;
  }

  const duplicate = await prisma.directoryContribution.findFirst({
    where: {
      authorId: userId,
      kind: input.kind,
      status: { in: ['UNVERIFIED', 'NEEDS_RECHECK'] },
      ...(placeId ? { placeId, featureCode: input.featureCode } : { proposedName: input.name }),
    },
  });
  if (duplicate) throw new ApiError(409, 'Kamu masih memiliki usulan serupa yang menunggu validasi.');

  const contribution = await prisma.directoryContribution.create({
    data: {
      kind: input.kind,
      placeId,
      authorId: userId,
      featureCode: input.featureCode,
      proposedAvailable: input.proposedAvailable,
      proposedName: input.name,
      proposedCategory: input.category,
      proposedAddress: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      note: input.note,
      photoUrl,
    },
    include: directoryContributionInclude,
  });
  return withContributionCounts(contribution);
}

async function applyVerifiedContribution(transaction: Prisma.TransactionClient, contribution: {
  id: string;
  kind: string;
  placeId: string | null;
  featureCode: string | null;
  proposedAvailable: boolean | null;
  proposedName: string | null;
  proposedCategory: string | null;
  proposedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string;
}) {
  if (contribution.kind === 'FEATURE_STATUS' && contribution.placeId && contribution.featureCode && contribution.proposedAvailable !== null) {
    await transaction.placeAccessibilityEvidence.upsert({
      where: {
        placeId_featureCode_evidenceSource: {
          placeId: contribution.placeId,
          featureCode: contribution.featureCode,
          evidenceSource: 'COMMUNITY_CONSENSUS',
        },
      },
      update: {
        available: contribution.proposedAvailable,
        verificationStatus: 'VERIFIED',
        sourceUrl: contribution.photoUrl,
        collectedAt: new Date(),
      },
      create: {
        placeId: contribution.placeId,
        featureCode: contribution.featureCode,
        featureName: contribution.featureCode,
        available: contribution.proposedAvailable,
        evidenceSource: 'COMMUNITY_CONSENSUS',
        verificationStatus: 'VERIFIED',
        sourceUrl: contribution.photoUrl,
        collectedAt: new Date(),
      },
    });
    return;
  }

  if (
    contribution.kind === 'NEW_PLACE'
    && contribution.proposedName
    && contribution.proposedAddress
    && contribution.latitude !== null
    && contribution.longitude !== null
  ) {
    const externalId = `community-${contribution.id}`;
    const place = await transaction.communityPlace.upsert({
      where: { externalId },
      update: {},
      create: {
        externalId,
        name: contribution.proposedName,
        category: contribution.proposedCategory,
        address: contribution.proposedAddress,
        latitude: contribution.latitude,
        longitude: contribution.longitude,
        sourceVerificationStatus: 'VERIFIED',
        primaryImageUrl: contribution.photoUrl,
      },
    });
    await transaction.placeImage.upsert({
      where: { sourceId: `community-${contribution.id}` },
      update: { imageUrl: contribution.photoUrl },
      create: {
        sourceId: `community-${contribution.id}`,
        placeId: place.id,
        imageUrl: contribution.photoUrl,
        sourceUrl: contribution.photoUrl,
      },
    });
  }
}

export async function voteDirectoryContribution(
  userId: string,
  contributionId: string,
  input: VoteDirectoryContributionInput,
) {
  const contribution = await prisma.directoryContribution.findUnique({
    where: { id: contributionId },
    include: { votes: true },
  });
  if (!contribution) throw new ApiError(404, 'Usulan direktori tidak ditemukan.');
  if (contribution.authorId === userId) throw new ApiError(422, 'Pengusul tidak dapat memvalidasi usulannya sendiri.');
  if (contribution.status === 'VERIFIED' || contribution.status === 'REJECTED') {
    throw new ApiError(409, 'Usulan ini sudah selesai divalidasi.');
  }

  await prisma.directoryContributionVote.upsert({
    where: { contributionId_voterId: { contributionId, voterId: userId } },
    update: { decision: input.decision, note: input.note },
    create: { contributionId, voterId: userId, decision: input.decision, note: input.note },
  });

  const updated = await prisma.$transaction(async (transaction) => {
    const current = await transaction.directoryContribution.findUniqueOrThrow({
      where: { id: contributionId },
      include: { votes: true },
    });
    const status = resolveDirectoryContributionStatus(current.votes);

    if (status === 'VERIFIED') await applyVerifiedContribution(transaction, current);
    return transaction.directoryContribution.update({
      where: { id: contributionId },
      data: {
        status,
        resolvedAt: status === 'VERIFIED' || status === 'REJECTED' ? new Date() : null,
      },
      include: directoryContributionInclude,
    });
  });
  return withContributionCounts(updated);
}
