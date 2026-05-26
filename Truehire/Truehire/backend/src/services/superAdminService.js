import { prisma } from '../config/database.js';

let superAdminRoleColumnReady = false;

export const ensureSuperAdminRoleColumn = async () => {
  if (superAdminRoleColumnReady) {
    return;
  }

  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE super_admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN'",
    );
  } catch (error) {
    const message = String(error?.message || '');
    const databaseCode = error?.meta?.code || error?.code;
    const duplicateColumn =
      databaseCode === '42701' ||
      (error?.code === 'P2010' &&
        (message.includes('Duplicate column') ||
          message.includes('ER_DUP_FIELDNAME') ||
          message.includes('already exists')));

    if (!duplicateColumn) {
      throw error;
    }
  }

  superAdminRoleColumnReady = true;
};
