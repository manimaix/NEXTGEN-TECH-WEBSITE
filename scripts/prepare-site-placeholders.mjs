import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const entries = JSON.parse(await readFile(new URL('../design/placeholder-images.json', import.meta.url), 'utf8'));
for (const entry of entries) {
  const output = resolve(entry.output);
  await mkdir(dirname(output), {recursive:true});
  const portrait = entry.name.startsWith('portrait');
  const result = await sharp(entry.source).resize({width:portrait ? 800 : 1536,withoutEnlargement:true})
    .withExifMerge({IFD0:{ImageDescription:entry.prompt,Artist:'OpenAI image_gen',Copyright:entry.origin}})
    .webp({quality:86}).toFile(output);
  console.log(`${entry.name}: ${result.width}x${result.height}, ${result.size} bytes`);
}
