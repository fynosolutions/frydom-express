import{mkdir,writeFile}from'node:fs/promises';
await mkdir('public/assets/fonts/reference',{recursive:true});
const weights=[['Book',300],['Medium',500],['Bold',600],['ExtraBold',800]];
const sources=[];const styles=[];
for(const[style,weight]of weights){
 const url=`https://heynoodles.com/wp-content/themes/Madhouse/fonts/FuturaPT-${style}-custom.otf`;
 let response;for(let attempt=0;attempt<3;attempt++){try{response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('HTTP '+response.status);break;}catch(error){if(attempt===2)throw error;}}
 const file=`FuturaPT-${style}.otf`;const bytes=Buffer.from(await response.arrayBuffer());
 await writeFile('public/assets/fonts/reference/'+file,bytes);
 styles.push(`@font-face{font-family:'FuturaPT';src:url('/assets/fonts/reference/${file}') format('opentype');font-style:normal;font-weight:${weight};font-display:swap;}`);
 sources.push({family:'FuturaPT',weight,sourceUrl:url,localFile:'public/assets/fonts/reference/'+file,bytes:bytes.length});
}
await writeFile('public/assets/fonts/fonts.css',styles.join('\n')+'\n');
await writeFile('sources/reference/font-manifest.json',JSON.stringify({capturedAt:new Date().toISOString(),stylesheet:'https://heynoodles.com/wp-content/themes/Madhouse/dist/css/main.css',fonts:sources},null,2));
console.log(JSON.stringify(sources.map(s=>({weight:s.weight,bytes:s.bytes}))));
