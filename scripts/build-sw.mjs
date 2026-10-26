import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => entry.isDirectory() ? filesIn(join(directory, entry.name)) : [join(directory, entry.name)]));
  return groups.flat();
}
const files = (await filesIn(dist)).filter((file) => !file.endsWith('.map') && relative(dist, file) !== 'sw.js').sort();
if (!files.some((file) => relative(dist, file) === 'index.html')) throw new Error('Build the Vite app before generating the service worker.');
const hash = createHash('sha256');
for (const file of files) {
  hash.update(relative(dist, file).replaceAll('\\', '/'));
  hash.update(await readFile(file));
}
const version = hash.digest('hex').slice(0, 20);
const paths = files.map((file) => relative(dist, file).replaceAll('\\', '/').split('/').map(encodeURIComponent).join('/'));
const template = await readFile(join(root, 'public', 'sw.js'), 'utf8');
if (!template.includes('/* __PRECACHE_MANIFEST__ */ []') || !template.includes('__BUILD_VERSION__')) throw new Error('Service worker template markers are missing.');
const worker = template.replace('/* __PRECACHE_MANIFEST__ */ []', JSON.stringify(paths)).replaceAll('__BUILD_VERSION__', version);
await writeFile(join(dist, 'sw.js'), worker);
console.log(`Precached ${paths.length} files for offline build ${version}.`);
