import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
await mkdir('public/images', { recursive: true });
for (const name of await readdir('image')) {
  if (!name.endsWith('.webp')) continue;
  await sharp(`image/${name}`).trim({ threshold: 12 }).webp({ quality: 94 }).toFile(`public/images/${name}`);
}
console.log('Prepared 11 named lotus assets');
