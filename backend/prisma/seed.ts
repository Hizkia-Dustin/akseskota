import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Seed demo dinonaktifkan. Set ALLOW_DEMO_SEED=true hanya pada database development.');
  }
  const adminSeedPassword = process.env.DEMO_ADMIN_PASSWORD;
  const userSeedPassword = process.env.DEMO_USER_PASSWORD;
  if (!adminSeedPassword || adminSeedPassword.length < 12 || !userSeedPassword || userSeedPassword.length < 12) {
    throw new Error('DEMO_ADMIN_PASSWORD dan DEMO_USER_PASSWORD minimal 12 karakter wajib diisi.');
  }
  console.log('Seeding AksesKota database...');

  // --- Users ---
  const adminPassword = await hashPassword(adminSeedPassword);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@akseskota.id' },
    update: {},
    create: {
      name: 'Admin AksesKota',
      email: 'admin@akseskota.id',
      passwordHash: adminPassword,
      role: 'ADMIN',
      preferences: { create: {} },
    },
  });

  const moderatorPassword = await hashPassword(adminSeedPassword);
  await prisma.user.upsert({
    where: { email: 'moderator@akseskota.id' },
    update: {},
    create: {
      name: 'Moderator AksesKota',
      email: 'moderator@akseskota.id',
      passwordHash: moderatorPassword,
      role: 'MODERATOR',
      preferences: { create: {} },
    },
  });

  const userPassword = await hashPassword(userSeedPassword);
  const demoUser = await prisma.user.upsert({
    where: { email: 'user@akseskota.id' },
    update: {},
    create: {
      name: 'Warga Depok',
      email: 'user@akseskota.id',
      passwordHash: userPassword,
      role: 'USER',
      preferences: { create: { mode: 'WHEELCHAIR' } },
    },
  });

  // --- Road segment (Margonda Raya sample, Depok) ---
  const segment = await prisma.roadSegment.create({
    data: {
      surfaceCondition: 'good',
      widthMeters: 1.8,
      hasRamp: true,
      hasStairs: false,
      hasGuidingBlock: true,
      shadeLevel: 68,
      lightingAvailable: true,
      accessibilityScore: 88,
      comfortScore: 72,
      source: 'field_survey',
    },
  });
  await prisma.$executeRawUnsafe(
    `UPDATE road_segments SET geometry = ST_GeomFromGeoJSON(?, 1, 4326) WHERE id = ?`,
    JSON.stringify({
      type: 'LineString',
      coordinates: [
        [106.8236, -6.3728],
        [106.8241, -6.3721],
      ],
    }),
    segment.id,
  );

  // --- Facility (bench near the segment) ---
  const facility = await prisma.facility.create({
    data: { type: 'BENCH', name: 'Bangku Margonda', condition: 'good' },
  });
  await prisma.$executeRawUnsafe(
    `UPDATE facilities SET geometry = ST_GeomFromGeoJSON(?, 1, 4326) WHERE id = ?`,
    JSON.stringify({ type: 'Point', coordinates: [106.8238, -6.3724] }),
    facility.id,
  );

  // --- Obstacle (pothole example) ---
  const obstacle = await prisma.obstacle.create({
    data: {
      type: 'POTHOLE',
      status: 'TEMPORARY',
      description: 'Lubang kecil dekat halte',
      isActive: true,
    },
  });
  await prisma.$executeRawUnsafe(
    `UPDATE obstacles SET geometry = ST_GeomFromGeoJSON(?, 1, 4326) WHERE id = ?`,
    JSON.stringify({ type: 'Point', coordinates: [106.8239, -6.3725] }),
    obstacle.id,
  );

  // --- Sample report tying it together ---
  await prisma.report.create({
    data: {
      userId: demoUser.id,
      targetType: 'OBSTACLE',
      obstacleId: obstacle.id,
      photoUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      description: 'Lubang cukup dalam, hati-hati',
      verificationStatus: 'UNVERIFIED',
    },
  });

  console.log('Seed demo selesai. Password tidak dicetak ke log.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
