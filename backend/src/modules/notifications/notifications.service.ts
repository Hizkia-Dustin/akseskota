import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function readNotification(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notification) {
    throw new ApiError(404, 'Notifikasi tidak ditemukan.');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  return { updated: true };
}
