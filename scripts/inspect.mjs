import { load } from 'cheerio';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const files = ['en__about-us.html', 'en__support.html', 'en__franchise.html', 'en__privacy-policy.html', 'en__terms-of-service.html', 'menu.html', 'zh-home.html'];
for (const file of files) {
  const q = load(await readFile('sources/pages/' + file, 'utf8'));
  console.log(JSON.stringify({ file, title: q('h1').text(), main: q('main').length, page: q('.page').length, headings: q('h2,h3').map((i,e)=>q(e).text().trim()).get(), children: q('main,.page').first().children().map((i,e)=>({ tag: e.tagName, class: q(e).attr('class'), id: q(e).attr('id') })).get() }));
}
const manifest = JSON.parse(await readFile('sources/manifest.json', 'utf8'));
const assets = manifest.assets.filter(a => a.status === 200 && /webp|jpg|png/.test(a.localPath) && !/220|favicon|apple-touch/.test(a.localPath));
const tiles = [];
for (const [i, asset] of assets.entries()) {
  const meta = await sharp('public' + asset.localPath).metadata();
  asset.width = meta.width; asset.height = meta.height;
  const label = asset.localPath.replace('/assets/original/', '').replace(/^[^-]+-/, '').slice(0,32);
  const tile = await sharp('public' + asset.localPath).resize(230,170,{fit:'contain',background:'#faeec9'}).extend({bottom:30,background:'#fff7e8'}).composite([{input:Buffer.from(`<svg width="230" height="30"><text x="7" y="19" font-family="Arial" font-size="11">${label}</text></svg>`),top:170,left:0}]).png().toBuffer();
  tiles.push({input:tile,left:(i%5)*230,top:Math.floor(i/5)*200});
}
await sharp({create:{width:1150,height:Math.ceil(assets.length/5)*200,channels:3,background:'#fff7e8'}}).composite(tiles).png().toFile('sources/contact-sheet.png');
