import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const redirects=JSON.parse(await readFile('src/data/redirects.json','utf8'));
const port=Number(process.env.PORT||4321);
const types={'.pdf':'application/pdf','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=http.createServer(async(req,res)=>{
  const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Robots-Tag':'noindex, nofollow'};
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400,headers);res.end('Bad request');return;}
  if(pathname==='/en/index.html'||pathname==='/index.html'){res.writeHead(301,{...headers,Location:pathname.startsWith('/en/')?'/en/':'/'});res.end();return;}
  if(redirects[pathname]){res.writeHead(301,{...headers,Location:redirects[pathname]});res.end();return;}
  let target=path.resolve(root,'.'+pathname);
  if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403,headers);res.end('Forbidden');return;}
  try{if((await stat(target)).isDirectory())target=path.join(target,'index.html');const body=await readFile(target);res.writeHead(200,{...headers,'Content-Type':types[path.extname(target)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:body);}catch{res.writeHead(404,{...headers,'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(path.join(root,'404.html')).catch(()=>Buffer.from('Page not found')));}
});
server.listen(port,'127.0.0.1',()=>console.log(`Frydom Express preview: http://127.0.0.1:${port}/en/\nChinese home: http://127.0.0.1:${port}/\nPreview is noindex; live form submissions and analytics are disabled.`));
