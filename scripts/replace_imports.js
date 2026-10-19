const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../apps/api/src');
const enumsFile = path.resolve(srcDir, 'common/enums.ts');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  if (file === enumsFile || file.endsWith('prisma.service.ts')) return;

  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("from '@prisma/client'")) {
    const dir = path.dirname(file);
    let relPath = path.relative(dir, enumsFile).replace(/\\/g, '/').replace('.ts', '');
    if (!relPath.startsWith('.')) relPath = './' + relPath;

    // Check if it imports PrismaClient AND enums, or only enums
    if (content.includes('PrismaClient') && content.includes('RoleType')) {
      content = content.replace(
        /import\s*\{\s*PrismaClient,\s*RoleType\s*\}\s*from\s*'@prisma\/client';/,
        `import { PrismaClient } from '@prisma/client';\nimport { RoleType } from '${relPath}';`
      );
    } else {
      content = content.replace(/from '@prisma\/client'/g, `from '${relPath}'`);
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${path.basename(file)} -> imported from ${relPath}`);
  }
});
