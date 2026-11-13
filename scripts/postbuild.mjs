import { readFile, writeFile, access, mkdir, rename } from 'node:fs/promises';
const data=JSON.parse(await readFile('src/data/site.json','utf8'));
const redirects=JSON.parse(await readFile('src/data/redirects.json','utf8'));
const origin='https://frydomexpress.com';
// Astro file-format emits the directory homepage as en.html; keep the legacy /en/ URL.
await mkdir('dist/en',{recursive:true});
await rename('dist/en.html','dist/en/index.html');
for(const route of data.routes){const file='dist'+(route.path.endsWith('/')?route.path+'index.html':route.path);await access(file);}
const urls=data.routes.map(route=>`  <url><loc>${origin+route.path}</loc><xhtml:link rel="alternate" hreflang="en" href="${origin+data.locales.en.routes[route.kind]}"/><xhtml:link rel="alternate" hreflang="zh-Hans" href="${origin+data.locales.zh.routes[route.kind]}"/></url>`);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
// Original root robots returned 404. No existing policy was overwritten.
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile('dist/_redirects','/index.html / 301\n/en/index.html /en/ 301\n'+Object.entries(redirects).map(([from,to])=>`${from} ${to} 301`).join('\n')+'\n');
// Static-host fallback; production and local preview serve HTTP 301 redirects.
for(const [from,to] of Object.entries(redirects)) await writeFile('dist'+from,`<!doctype html><html lang="${from.startsWith('/en/')?'en':'zh-Hans'}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${to}"><link rel="canonical" href="${origin+to.split('#')[0]}"><title>Frydom Express</title></head><body><a href="${to}">Frydom Express</a></body></html>`);
await writeFile('dist/_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
console.log(`Validated ${data.routes.length} routes; generated sitemap, robots, redirects and headers.`);

// Symbol characters (arrows, stars, hearts) render as colour emoji or tofu on real phones.
// Replace them in visible text with inline SVG icons that inherit size and colour.
{
  const { readdir } = await import('node:fs/promises');
  const { load } = await import('cheerio');
  const s = d => `<svg class="ico" aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-.12em">${d}</svg>`;
  const icons = {
    '↗': s('<path d="M7 17 17 7M8 7h9v9"/>'), '→': s('<path d="M4 12h16M13 5l7 7-7 7"/>'), '←': s('<path d="M20 12H4M11 5l-7 7 7 7"/>'),
    '↑': s('<path d="M12 20V4M5 11l7-7 7 7"/>'), '↓': s('<path d="M12 4v16M5 13l7 7 7-7"/>'), '⤢': s('<path d="M4 20 20 4M14 4h6v6M10 20H4v-6"/>'),
    '✳': s('<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>'), '✓': s('<path d="m4 12.5 5 5L20 6.5"/>'),
    '♡': s('<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>'),
    '×': s('<path d="M6 6l12 12M18 6 6 18"/>'), '＋': s('<path d="M12 5v14M5 12h14"/>'),
    'Ⅱ': s('<path d="M9 5v14M15 5v14"/>'), '▶': s('<path d="M8 5v14l11-7Z" fill="currentColor"/>'),
  };
  const re = new RegExp('[' + Object.keys(icons).join('') + ']', 'g');
  const walk = async dir => (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? walk(dir + '/' + e.name) : e.name.endsWith('.html') ? [dir + '/' + e.name] : []))).flat();
  let n = 0;
  for (const file of await walk('dist')) {
    const $ = load(await readFile(file, 'utf8'), { decodeEntities: false });
    $('body *').not('script,style,svg,svg *,textarea,option').contents().each((_, node) => {
      if (node.type !== 'text' || !re.test(node.data)) return;
      re.lastIndex = 0;
      const esc = node.data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      $(node).replaceWith(esc.replace(re, c => { n++; return icons[c]; }));
    });
    await writeFile(file, $.html());
  }
  console.log(`Replaced ${n} symbol characters with inline SVG icons.`);
}
