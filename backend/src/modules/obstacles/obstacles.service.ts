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

  const obstacle = await prisma.obstacle.create({
    data: {
      type: input.type,
      status: input.status,
      description: input.description,
      expiresAt: input.expiresAt,
      // A community report is visible on the map immediately, but it must
      // not affect routing until a moderator verifies it.
      isActive: false,
    },
  });

  await insertPointGeometry('obstacles', obstacle.id, input.geometry);

  const report = await prisma.report.create({
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
