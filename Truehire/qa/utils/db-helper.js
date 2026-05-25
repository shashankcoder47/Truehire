export async function getPrismaClient() {
  try {
    const { PrismaClient } = await import('../../Truehire/backend/node_modules/@prisma/client/default.js');
    return new PrismaClient();
  } catch {
    return null;
  }
}

export async function withPrisma(callback) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;

  try {
    return await callback(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
