import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';
import { env } from './env.js';

// Ensure global typing consistency
const globalForPrisma = globalThis;

// Create Prisma instance (singleton pattern)
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: env.databaseUrl,
      },
    },
    log:
      env.nodeEnv === 'development'
        ? ['query', 'warn', 'error']
        : ['error'],
  });

// Prevent multiple instances in development (hot reload fix)
if (env.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };

const buildMysqlPoolConfig = () => {
  const parsedUrl = new URL(env.databaseUrl);
  parsedUrl.searchParams.delete('connection_limit');
  parsedUrl.searchParams.delete('pool_timeout');

  return {
    uri: parsedUrl.toString(),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || process.env.PRISMA_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    multipleStatements: true,
  };
};

export const pool = mysql.createPool({
  ...buildMysqlPoolConfig(),
});

// Connect DB
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    const connection = await pool.getConnection();
    connection.release();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Disconnect DB
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    await pool.end();
    console.log('🔌 Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error);
  }
};
