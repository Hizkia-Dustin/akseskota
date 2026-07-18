import { prisma } from '../../config/prisma';
import { randomBytes } from 'crypto';
import { ApiError } from '../../middlewares/errorHandler';
import { insertPointGeometry } from '../../utils/spatial';
import { ReportObstacleInput } from './obstacles.schema';

// F012 - Laporkan Hambatan. Creates the obstacle + a linked Report so it
// enters the same moderator verification queue as everything else (F013).
export async function reportObstacle(userId: string | undefined, input: ReportObstacleInput, photoUrl: string | undefined) {
  if (!photoUrl) {
    throw new ApiError(422, 'Foto wajib diunggah untuk melaporkan hambatan.');
  }

  const duplicate = (await prisma.$queryRawUnsafe(
    `SELECT r.id
     FROM obstacles o
     JOIN reports r ON r.obstacleId = o.id
     WHERE o.type = ?
       AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       AND r.verificationStatus <> 'REJECTED'
       AND o.geometry IS NOT NULL
       AND ST_Distance_Sphere(o.geometry, ST_GeomFromGeoJSON(?, 1, 4326)) <= 15
     LIMIT 1`,
    input.type,
    JSON.stringify(input.geometry),
  )) as Array<{ id: string }>;
  if (duplicate.length) {
    throw new ApiError(409, `Laporan serupa sudah ada di sekitar titik ini (${duplicate[0].id}).`);
  }

  return prisma.$transaction(async (transaction) => {
    const obstacle = await transaction.obstacle.create({
      data: {
        type: input.type,
        status: input.status,
        description: input.description,
        expiresAt: input.expiresAt,
        // Visible on the map, but excluded from routing until verified.
        isActive: false,
      },
    });

    await insertPointGeometry('obstacles', obstacle.id, input.geometry, transaction);

    const report = await transaction.report.create({
      data: {
        userId,
        guestAccessKey: userId ? undefined : randomBytes(24).toString('hex'),
        title: input.title,
        targetType: 'OBSTACLE',
        obstacleId: obstacle.id,
        photoUrl,
        description: input.description,
        expiresAt: input.expiresAt,
      },
    });

    return { obstacle, report };
  });
}

export async function listObstacles(activeOnly = true) {
  return prisma.obstacle.findMany({
    where: activeOnly
      ? { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function deactivateExpiredObstacles() {
  // Intended to run on a schedule (cron / job queue) to flip `isActive`
  // false once `expiresAt` passes, per F010 "status: Aktif / Kedaluwarsa".
  return prisma.obstacle.updateMany({
    where: { isActive: true, expiresAt: { lt: new Date() } },
    data: { isActive: false },
  });
}
