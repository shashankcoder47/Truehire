import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@truehire.com';
const ADMIN_PASSWORD = 'admin123';

async function main() {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.admins.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Seed completed successfully.');
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    if (error?.code === 'P2021') {
      console.error(
        'Seed failed because the database tables do not exist yet. Run `npx prisma db push` or your migrations first, then run the seed again.'
      );
    }
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
