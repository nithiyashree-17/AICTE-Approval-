import { PrismaClient } from '@prisma/client';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const user = process.env.DB_USER || 'postgres';
const pass = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : 'postgres';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5432';

export const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  `postgresql://${user}:${pass}@${host}:${port}/flowguard_test?schema=public`;

export const prisma = new PrismaClient({
  datasources: {
    db: { url: testDbUrl },
  },
});
