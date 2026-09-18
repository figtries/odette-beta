import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";

/* How wide each bloom is actually drawn, in CSS pixels, at the largest size any
   rule in globals.css asks for — then tripled, because a phone screen has three
   device pixels per CSS pixel and nothing gains from a fourth.

   Shipping more than this is not free. These are plain <img> tags, so nothing
   downsamples them on the way in: the browser decodes the full bitmap and keeps
   it, and the floating ones are re-composited for as long as the screen is
   open. lotus-bloom was arriving at 1092px wide to be drawn at 62.

   An entry left out is one whose source is already at or under what it needs —
   lotus-leaf-stem covers the whole help screen, so it uses every pixel it has.
   `withoutEnlargement` means a wrong guess here can only cost bytes, never
   sharpness. Re-measure before changing a width in globals.css. */
const maxWidth = {
  "lotus-bloom.webp": 192, // .today-value img — 62px
  "lotus-blossoms.webp": 248, // .overall > img — 79px
  "lotus-blue-stem.webp": 176, // .insight img — 56px
  "lotus-bud.webp": 200, // .auth-bud — 64px
  "lotus-bouquet.webp": 840, // .ready-bouquet — min(70vw, 273px)
};

await mkdir("public/images", { recursive: true });
let count = 0;
for (const name of await readdir("image")) {
  if (!name.endsWith(".webp")) continue;
  const pipeline = sharp(`image/${name}`).trim({ threshold: 12 });
  if (maxWidth[name])
    pipeline.resize({ width: maxWidth[name], withoutEnlargement: true });
  await pipeline.webp({ quality: 94 }).toFile(`public/images/${name}`);
  count += 1;
}
console.log(`Prepared ${count} named lotus assets`);
