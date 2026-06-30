import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const replaceLogic = (match, quote, importPath) => {
    if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
      changed = true;
      return `from ${quote}${importPath}.js${quote}`;
    }
    return match;
  };

  content = content.replace(/from (['"])(\.[^'"]+)\1/g, replaceLogic);
  
  // also fix dynamic imports
  content = content.replace(/import\((['"])(\.[^'"]+)\1\)/g, (match, quote, importPath) => {
    if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
      changed = true;
      return `import(${quote}${importPath}.js${quote})`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed imports in ${filePath}`);
  }
}

const dirs = ['.', 'routes', 'db'];
for (const dir of dirs) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixFile(path.join(dir, file));
    }
  }
}
