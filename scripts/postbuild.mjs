import { readFile, writeFile, access, mkdir, rename } from 'node:fs/promises';
const data=JSON.parse(await readFile('src/data/site.json','utf8'));
const origin='https://frydomexpress.com';
// Astro file-format emits the directory homepage as en.html; keep the legacy /en/ URL.
await mkdir('dist/en',{recursive:true});
await rename('dist/en.html','dist/en/index.html');
for(const route of data.routes){const file='dist'+(route.path.endsWith('/')?route.path+'index.html':route.path);await access(file);}
const urls=data.routes.map(route=>`  <url><loc>${origin+route.path}</loc><xhtml:link rel="alternate" hreflang="en" href="${origin+data.locales.en.routes[route.kind]}"/><xhtml:link rel="alternate" hreflang="zh-Hans" href="${origin+data.locales.zh.routes[route.kind]}"/></url>`);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
// Original root robots returned 404. No existing policy was overwritten.
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile('dist/_redirects','/index.html / 301\n/en/index.html /en/ 301\n');
await writeFile('dist/_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
console.log(`Validated ${data.routes.length} routes; generated sitemap, robots, redirects and headers.`);
