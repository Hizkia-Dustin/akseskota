import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import type { Server } from 'http';
import { deactivateExpiredObstacles } from './modules/obstacles/obstacles.service';

let server: Server | undefined;
let expiryTimer: NodeJS.Timeout | undefined;

async function main() {
  await prisma.$connect();
  await deactivateExpiredObstacles();
  expiryTimer = setInterval(() => {
    void deactivateExpiredObstacles().catch((error) => console.error('Failed to expire obstacles:', error));
  }, 5 * 60 * 1000);
  expiryTimer.unref();
  server = app.listen(env.port, () => {
    console.log(`AksesKota backend listening on port ${env.port}`);
    console.log(`Environment: ${env.nodeEnv}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  if (expiryTimer) clearInterval(expiryTimer);
  server?.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
