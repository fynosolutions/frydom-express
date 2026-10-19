import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const origin = 'https://frydomexpress.com';
const capturedAt = new Date().toISOString();
const routes = ['/', '/index.html', '/about-us.html', '/menu.html', '/stores.html', '/franchise.html', '/fuwu.html', '/privacy-policy.html', '/terms-of-service.html', '/en/', '/en/index.html', '/en/about-us.html', '/en/menu.html', '/en/stores.html', '/en/franchise.html', '/en/support.html', '/en/privacy-policy.html', '/en/terms-of-service.html', '/robots.txt', '/sitemap.xml'];
await mkdir('sources/pages', { recursive: true });
await mkdir('sources/reference', { recursive: true });
await mkdir('public/assets/original', { recursive: true });
const pages = [];
const assets = new Map();
function addAsset(ref, base) {
  try {
    const url = new URL(ref.replaceAll('&amp;', '&'), base);
    if (url.origin !== origin || !/\.(avif|webp|png|jpe?g|gif|svg|ico|woff2?|ttf|otf|mp4|webm|pdf|css|js)(\?|$)/i.test(url.pathname)) return;
    url.hash = '';
    if (!assets.has(url.href)) assets.set(url.href, { sourceUrl: url.href, pages: new Set([base]) });
    else assets.get(url.href).pages.add(base);
  } catch {}
}
for (let offset = 0; offset < routes.length; offset += 5) {
  await Promise.all(routes.slice(offset, offset + 5).map(async route => {
    const url = origin + route;
    try {
      const response = await fetch(url);
      const body = await response.text();
      const file = 'sources/pages/' + (route === '/' ? 'zh-home' : route === '/en/' ? 'en-home' : route.replace(/^\//, '').replaceAll('/', '__')) + (route.endsWith('.html') || route.endsWith('.txt') || route.endsWith('.xml') ? '' : '.html');
      await writeFile(file, body);
      pages.push({ route, sourceUrl: url, finalUrl: response.url, status: response.status, file, capturedAt });
      if (response.ok && route !== '/robots.txt' && route !== '/sitemap.xml') {
        for (const match of body.matchAll(/(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) addAsset(match[1], url);
        for (const match of body.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/gi)) addAsset(match[1], url);
        for (const match of body.matchAll(/srcset\s*=\s*["']([^"']+)["']/gi)) for (const part of match[1].split(',')) addAsset(part.trim().split(/\s+/)[0], url);
      }
      console.log(response.status, route);
    } catch (error) { pages.push({ route, sourceUrl: url, error: error.message, capturedAt }); console.log('ERROR', route, error.message); }
  }));
}
const reference = await fetch('https://heynoodles.com/');
await writeFile('sources/reference/heynoodles.html', await reference.text());
const completed = new Set();
while ([...assets.keys()].some(url => !completed.has(url))) {
  const pending = [...assets.keys()].filter(url => !completed.has(url));
  for (let offset = 0; offset < pending.length; offset += 6) {
    await Promise.all(pending.slice(offset, offset + 6).map(async url => {
      completed.add(url);
      const asset = assets.get(url);
      const ext = path.extname(new URL(url).pathname).toLowerCase();
      const decoded = decodeURIComponent(path.basename(new URL(url).pathname));
      const name = decoded.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
      const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 8);
      asset.localPath = `/assets/original/${hash}-${name || 'asset' + ext}`;
      try {
        const response = await fetch(url);
        asset.status = response.status;
        asset.contentType = response.headers.get('content-type');
        if (!response.ok) return;
        const data = Buffer.from(await response.arrayBuffer());
        asset.bytes = data.length;
        await writeFile(path.join(root, 'public', asset.localPath), data);
        if (ext === '.css') for (const match of data.toString().matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/gi)) addAsset(match[1], url);
      } catch (error) { asset.error = error.message; }
    }));
  }
}
const manifest = { capturedAt, pages: pages.sort((a,b) => a.route.localeCompare(b.route)), assets: [...assets.values()].map(asset => ({ ...asset, pages: [...asset.pages] })) };
await writeFile('sources/manifest.json', JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ pages: pages.length, assets: assets.size, failedAssets: manifest.assets.filter(a => a.status !== 200).length }));
