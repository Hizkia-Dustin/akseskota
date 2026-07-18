import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Admin AksesKota';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi untuk membuat admin.');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD minimal 12 karakter.');
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: 'ADMIN' },
    create: {
      name,
      email,
      passwordHash,
      role: 'ADMIN',
      preferences: { create: {} },
    },
  });

  console.log(`Admin ${email} siap digunakan.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
