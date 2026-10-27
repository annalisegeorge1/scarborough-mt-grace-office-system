import { readFile, copyFile, cp, mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '.cloudflare-dist');
const source = await readFile(join(root, 'server/src/app.js'), 'utf8');
const htmlFile = join(root, 'index-self-contained.html');

function assetList(name) {
  const match = source.match(new RegExp('const ' + name + '=\\[([\\s\\S]*?)\\];'));
  if (!match) throw new Error('Cannot find ' + name + ' in server/src/app.js; review the build before deploying.');
  const list = [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  if (!list.length) throw new Error('Empty ' + name);
  return list;
}

const styles = assetList('styleAssets');
const scripts = assetList('scriptAssets');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// Explicit public allow-list: never deploy server/, staff/, operational docs, or private data.
for (const dir of ['assets', 'track', 'es', 'portals', 'resident-guide']) {
  if (!existsSync(join(root, dir))) throw new Error('Missing public directory: ' + dir);
  await cp(join(root, dir), join(out, dir), { recursive: true });
}
for (const filename of ['manifest.webmanifest', 'sw.js', 'offline.html', '404.html']) {
  await copyFile(join(root, filename), join(out, filename));
}
for (const filename of [...styles, ...scripts]) {
  const file = join(root, 'assets', filename);
  if (!existsSync(file) || !(await stat(file)).isFile()) {
    throw new Error('Missing runtime asset: ' + filename);
  }
}

let html = await readFile(htmlFile, 'utf8');
html = html
  .replaceAll('Calder Hall Main Phases 1, 2 and 3', 'Calder Hall Main Road, Virgil Alley, Phases 2 and 3')
  .replaceAll('Phases 1, 2 and 3', 'Virgil Alley, Phases 2 and 3')
  .replaceAll('Phases 1, 2 &amp; 3', 'Virgil Alley, Phases 2 &amp; 3')
  .replace('calder hall main road phases darrel spring', 'calder hall main road virgil alley phases 2 3 darrel spring');

// The Render server adds these at request time. Materialize exactly those
// release CSS/JS references so Cloudflare can serve the existing UI without redesigning it.
const addAsset = async (filename, type) => {
  const marker = '/assets/' + filename;
  if (html.includes(marker)) return;
  const hash = createHash('sha256')
    .update(await readFile(join(root, 'assets', filename))).digest('hex').slice(0, 12);
  const tag = type === 'css'
    ? '<link rel="stylesheet" href="' + marker + '?v=' + hash + '">'
    : '<script src="' + marker + '?v=' + hash + '" defer></script>';
  const end = type === 'css' ? /<\/head>/i : /<\/body>/i;
  const closing = type === 'css' ? '</head>' : '</body>';
  html = end.test(html) ? html.replace(end, tag + closing) : html + tag;
};
for (const name of styles) await addAsset(name, 'css');
if (!html.includes('/manifest.webmanifest')) {
  html = html.replace(/<\/head>/i, '<link rel="manifest" href="/manifest.webmanifest"><link rel="icon" type="image/svg+xml" href="/assets/district-app-icon-v229.svg">' +
    '<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">' +
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">' +
    '<meta name="apple-mobile-web-app-title" content="SMG Office"></head>');
}
if (!html.includes('/api/public/feed.xml')) {
  html = html.replace(/<\/head>/i, '<link rel="alternate" type="application/rss+xml" title="Scarborough / Mt. Grace District Office Updates" href="/api/public/feed.xml"></head>');
}
for (const name of scripts) await addAsset(name, 'js');

// Metadata is inserted per URL by the Worker, as it was by Express on Render.
html = html
  .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
  .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:title|og:description|og:type|og:url|og:site_name|og:locale|twitter:card|twitter:title|twitter:description)["'][^>]*>/gi, '')
  .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '')
  .replace(/<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["']en-TT["'][^>]*>/gi, '')
  .replace(/<script\b[^>]*data-v223-structured[^>]*>[\s\S]*?<\/script>/gi, '');

await import('node:fs/promises').then(fs => fs.writeFile(join(out, 'index.html'), html, 'utf8'));
console.log('Cloudflare public assets built:', [...styles, ...scripts].length, 'runtime assets; protected backend and staff files excluded.');
