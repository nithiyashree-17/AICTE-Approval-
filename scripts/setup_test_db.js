const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const user = process.env.DB_USER || 'postgres';
const pass = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : 'postgres';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5432';
const rootDbUrl = `postgresql://${user}:${pass}@${host}:${port}/postgres?schema=public`;

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: rootDbUrl,
      },
    },
  });

  const check = await prisma.$queryRawUnsafe(
    "SELECT 1 FROM pg_database WHERE datname = 'flowguard_test'"
  );

  if (check.length === 0) {
    await prisma.$executeRawUnsafe('CREATE DATABASE flowguard_test');
    console.log('Database flowguard_test created successfully');
  } else {
    console.log('Database flowguard_test already exists');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
