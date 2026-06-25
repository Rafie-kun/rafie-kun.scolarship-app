import fs from 'fs';
import path from 'path';

function copyData() {
  const distData = path.join(process.cwd(), 'dist', 'data');
  if (!fs.existsSync(distData)) {
    fs.mkdirSync(distData, { recursive: true });
  }

  const srcData = path.join(process.cwd(), 'public', 'data');
  if (fs.existsSync(srcData)) {
    const files = fs.readdirSync(srcData);
    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.db')) {
        fs.copyFileSync(
          path.join(srcData, file),
          path.join(distData, file)
        );
      }
    }
  }

  // Also copy from root data/ if present
  const rootData = path.join(process.cwd(), 'data');
  if (fs.existsSync(rootData)) {
    const files = fs.readdirSync(rootData);
    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.db')) {
        fs.copyFileSync(
          path.join(rootData, file),
          path.join(distData, file)
        );
      }
    }
  }
}

copyData();
console.log("Data files copied to dist/data.");
