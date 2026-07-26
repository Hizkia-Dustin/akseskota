import { prisma } from '../../config/prisma';
import { UpdatePreferencesInput } from './preferences.schema';

export async function getMyPreferences(userId: string) {
  const prefs = await prisma.userPreference.findUnique({ where: { userId } });
  if (!prefs) {
    return prisma.userPreference.create({ data: { userId } });
  }
  return prefs;
}

export async function updateMyPreferences(userId: string, input: UpdatePreferencesInput) {
  return prisma.userPreference.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input },
  });
}
