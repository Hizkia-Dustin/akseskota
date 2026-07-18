import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function configureDatabaseTlsCertificate(): void {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    // Prisma will report a clearer connection-string error when it connects.
    return;
  }

  const configuredCertificate = parsedUrl.searchParams.get('sslcert');
  if (!configuredCertificate || path.isAbsolute(configuredCertificate)) return;

  const certificateName = path.basename(configuredCertificate);
  const candidates = [
    path.resolve(process.cwd(), configuredCertificate),
    path.resolve(process.cwd(), 'prisma', certificateName),
    path.resolve(process.cwd(), 'backend', 'prisma', certificateName),
    path.resolve(__dirname, '..', '..', 'prisma', certificateName),
  ];
  const certificatePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (certificatePath) {
    parsedUrl.searchParams.set('sslcert', certificatePath.replace(/\\/g, '/'));
    process.env.DATABASE_URL = parsedUrl.toString();
  }
}

configureDatabaseTlsCertificate();

// Singleton pattern to avoid exhausting DB connections during dev hot-reload
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
