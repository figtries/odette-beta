/* Writes a pretty-printed copy of the exported HTML into out-readable/.
 *
 * The real export in out/ has to stay exactly as Next wrote it: the markup is
 * one long line on purpose, and adding whitespace to it makes React hydration
 * fail (error #418) because the client no longer sees the text nodes it
 * rendered on the server. These copies are for reading only -- edit the pages
 * in app/ and run `npm run build` to change what ships. */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";

const source = "out";
const target = "out-readable";

const pages = (await readdir(source)).filter((file) => file.endsWith(".html"));
if (!pages.length) {
  console.error(`No HTML in ${source}/ -- run "npm run build" first.`);
  process.exit(1);
}

await mkdir(target, { recursive: true });
for (const page of pages) {
  const html = await readFile(`${source}/${page}`, "utf8");
  await writeFile(`${target}/${page}`, await format(html, { parser: "html" }));
  console.log(`${target}/${page}`);
}
