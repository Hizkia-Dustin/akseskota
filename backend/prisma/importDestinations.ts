import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Prisma, VerificationStatus } from '@prisma/client';
import { prisma } from '../src/config/prisma';

type Destination = {
  externalId: string;
  name: string;
  category?: string | null;
  placeType?: string | null;
  description?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  priceRange?: string | null;
  businessStatus?: string | null;
  phone?: string | null;
  website?: string | null;
  mapsUrl?: string | null;
  menuUrl?: string | null;
  plusCode?: string | null;
  openingHours?: Prisma.InputJsonValue | null;
  popularTimes?: Prisma.InputJsonValue | null;
  wheelchairEntrance?: boolean | null;
  wheelchairSeating?: boolean | null;
  wheelchairRestroom?: boolean | null;
  wheelchairParking?: boolean | null;
  accessibilityReviewCount?: number | null;
  accessibilityStatus?: string | null;
  collectedAt?: string | null;
};

type Evidence = {
  externalPlaceId: string;
  featureCode: string;
  featureName: string;
  available?: boolean | null;
  evidenceSource?: string | null;
  sourceUrl?: string | null;
  collectedAt?: string | null;
};

type PlaceImageInput = {
  externalPlaceId: string;
  order?: number | null;
  imageUrl: string;
  sourceUrl?: string | null;
};

type ReviewInput = {
  externalPlaceId: string;
  rating?: number | null;
  text?: string | null;
  matchedKeywords?: string[];
  publishedAt?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
};

type Payload = {
  schemaVersion: string;
  destinations: Destination[];
  accessibilityEvidence: Evidence[];
  accessibilityReviews: ReviewInput[];
  placeImages: PlaceImageInput[];
};

function inputPath(): string {
  const explicit = process.argv[2] || process.env.DESTINATIONS_JSON_PATH;
  if (explicit) return path.resolve(explicit);
  return path.resolve(process.cwd(), '..', '..', '..', 'bogor-place-scraper', 'output', 'processed', 'database_import.json');
}

function dateOrUndefined(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function sourceId(...parts: Array<string | number | null | undefined>): string {
  return crypto.createHash('sha256').update(parts.map((part) => String(part ?? '')).join('|')).digest('hex');
}

async function inChunks<T>(
  label: string,
  rows: T[],
  size: number,
  operation: (row: T) => Prisma.PrismaPromise<unknown>,
) {
  if (rows.length === 0) {
    console.log(`${label}: tidak ada data.`);
    return;
  }

  for (let index = 0; index < rows.length; index += size) {
    await prisma.$transaction(rows.slice(index, index + size).map(operation));
    const completed = Math.min(index + size, rows.length);
    console.log(`${label}: ${completed}/${rows.length}`);
  }
}

async function main() {
  const jsonPath = inputPath();
  if (!fs.existsSync(jsonPath)) throw new Error(`JSON destinasi tidak ditemukan: ${jsonPath}`);
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as Payload;
  if (!Array.isArray(payload.destinations)) throw new Error('JSON belum memiliki array destinations. Jalankan ulang run.bat menu 8 pada scraper.');
  console.log(`Mulai impor dari ${jsonPath}`);

  const firstImages = new Map<string, string>();
  for (const image of payload.placeImages || []) {
    if (image.imageUrl && !firstImages.has(image.externalPlaceId)) firstImages.set(image.externalPlaceId, image.imageUrl);
  }

  await inChunks('Destinasi', payload.destinations, 20, (destination) => {
    const data = {
      name: destination.name,
      category: destination.category || undefined,
      placeType: destination.placeType || undefined,
      description: destination.description || undefined,
      address: destination.address || undefined,
      latitude: destination.latitude,
      longitude: destination.longitude,
      googleRating: destination.googleRating ?? undefined,
      googleReviewCount: destination.googleReviewCount ?? undefined,
      priceRange: destination.priceRange || undefined,
      businessStatus: destination.businessStatus || undefined,
      phone: destination.phone || undefined,
      website: destination.website || undefined,
      mapsUrl: destination.mapsUrl || undefined,
      menuUrl: destination.menuUrl || undefined,
      plusCode: destination.plusCode || undefined,
      openingHours: destination.openingHours ?? undefined,
      popularTimes: destination.popularTimes ?? undefined,
      wheelchairEntrance: destination.wheelchairEntrance ?? undefined,
      wheelchairSeating: destination.wheelchairSeating ?? undefined,
      wheelchairRestroom: destination.wheelchairRestroom ?? undefined,
      wheelchairParking: destination.wheelchairParking ?? undefined,
      accessibilityReviewCount: destination.accessibilityReviewCount ?? 0,
      accessibilityStatus: destination.accessibilityStatus || undefined,
      sourceVerificationStatus: VerificationStatus.UNVERIFIED,
      primaryImageUrl: firstImages.get(destination.externalId),
      scrapedAt: dateOrUndefined(destination.collectedAt),
    };
    return prisma.communityPlace.upsert({
      where: { externalId: destination.externalId },
      update: data,
      create: { externalId: destination.externalId, ...data },
    });
  });

  const places = await prisma.communityPlace.findMany({ select: { id: true, externalId: true } });
  const placeIds = new Map(places.map((place) => [place.externalId, place.id]));
  const evidence = (payload.accessibilityEvidence || []).filter((row) => placeIds.has(row.externalPlaceId));
  await inChunks('Bukti aksesibilitas', evidence, 25, (row) => {
    const placeId = placeIds.get(row.externalPlaceId)!;
    const evidenceSource = row.evidenceSource || 'GOOGLE_ABOUT';
    const data = {
      featureName: row.featureName,
      available: row.available ?? undefined,
      verificationStatus: VerificationStatus.UNVERIFIED,
      sourceUrl: row.sourceUrl || undefined,
      collectedAt: dateOrUndefined(row.collectedAt),
    };
    return prisma.placeAccessibilityEvidence.upsert({
      where: { placeId_featureCode_evidenceSource: { placeId, featureCode: row.featureCode, evidenceSource } },
      update: data,
      create: { placeId, featureCode: row.featureCode, evidenceSource, ...data },
    });
  });

  const images = (payload.placeImages || []).filter((row) => placeIds.has(row.externalPlaceId) && row.imageUrl);
  await inChunks('Gambar', images, 25, (row) => {
    const placeId = placeIds.get(row.externalPlaceId)!;
    const id = sourceId(row.externalPlaceId, row.imageUrl);
    const data = { placeId, order: row.order || 0, imageUrl: row.imageUrl, sourceUrl: row.sourceUrl || undefined };
    return prisma.placeImage.upsert({ where: { sourceId: id }, update: data, create: { sourceId: id, ...data } });
  });

  const reviews = (payload.accessibilityReviews || []).filter((row) => placeIds.has(row.externalPlaceId));
  await inChunks('Ulasan aksesibilitas', reviews, 25, (row) => {
    const placeId = placeIds.get(row.externalPlaceId)!;
    const id = sourceId(row.externalPlaceId, row.text, row.publishedAt);
    const data = {
      placeId,
      rating: row.rating ?? undefined,
      text: row.text || undefined,
      matchedKeywords: row.matchedKeywords || [],
      publishedAt: row.publishedAt || undefined,
      source: row.source || 'Google Maps',
      sourceUrl: row.sourceUrl || undefined,
      verificationStatus: VerificationStatus.UNVERIFIED,
    };
    return prisma.scrapedPlaceReview.upsert({ where: { sourceId: id }, update: data, create: { sourceId: id, ...data } });
  });

  console.log(`Import selesai dari ${jsonPath}`);
  console.log(`Destinasi: ${payload.destinations.length}`);
  console.log(`Bukti aksesibilitas: ${evidence.length}`);
  console.log(`Gambar: ${images.length}`);
  console.log(`Ulasan aksesibilitas: ${reviews.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
