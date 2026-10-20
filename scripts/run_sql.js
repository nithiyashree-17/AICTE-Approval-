const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'add_officer.sql'), 'utf8');
  console.log('Executing add_officer.sql statements...');
  
  // Clean comments and split by semicolon
  const rawStatements = sql.split(';');

  for (const raw of rawStatements) {
    // Strip SQL comment lines
    const cleaned = raw
      .split('\n')
      .map((line) => (line.trim().startsWith('--') ? '' : line))
      .join('\n')
      .trim();

    if (cleaned && cleaned !== 'BEGIN' && cleaned !== 'COMMIT') {
      await prisma.$executeRawUnsafe(cleaned);
    }
  }
  
  console.log('All SQL statements executed successfully!');
  
  const officers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'regional.north@aicte-india.org',
          'scrutiny.officer@aicte-india.org',
          'admin@aicte-india.org',
        ],
      },
    },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  console.log('\nVerified Officers in Database:');
  officers.forEach((o) => {
    console.log(
      ` - ${o.fullName} (${o.email}) | Designation: ${o.designation} | Region: ${o.assignedRegion} | Role: ${o.roles.map((r) => r.role.name).join(', ')} | Status: ${o.status}`
    );
  });
}

run()
  .catch((e) => {
    console.error('Error running SQL:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
