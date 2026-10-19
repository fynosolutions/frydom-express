import sharp from 'sharp';
import{readFile}from'node:fs/promises';
const report=JSON.parse(await readFile('docs/qa/screenshot-report.json','utf8'));
const tiles=[];
for(const r of report){
  const s=sharp('docs/screenshots/'+r.name+'.png');const m=await s.metadata();
  const b=await s.extract({left:0,top:0,width:m.width,height:Math.min(m.height,1000)}).resize(360,280,{fit:'contain',background:'#fff7e8'}).extend({top:30,background:'#fff7e8'}).composite([{input:Buffer.from(`<svg width="360" height="30"><text x="10" y="20" font-family="Arial" font-size="14">${r.name}</text></svg>`),top:0,left:0}]).png().toBuffer();
  const i=tiles.length;tiles.push({input:b,left:(i%4)*360,top:Math.floor(i/4)*310});
}
await sharp({create:{width:1440,height:Math.ceil(tiles.length/4)*310,channels:3,background:'#fff7e8'}}).composite(tiles).png().toFile('docs/screenshots/review-contact-sheet.png');
console.log('Contact sheet updated: '+tiles.length+' views.');
