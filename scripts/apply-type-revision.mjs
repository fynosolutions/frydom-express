import postcss from 'postcss';
import{readFile,writeFile,mkdir}from'node:fs/promises';
const file='src/styles/global.css';const css=await readFile(file,'utf8');
if(css.includes('Typography revision: reference FuturaPT')){console.log('Typography revision already applied.');process.exit(0);}
await mkdir('sources/revisions',{recursive:true});await writeFile('sources/revisions/global-before-r2.css',css);
const root=postcss.parse(css);let headings=0,body=0;
root.walkDecls('font-size',decl=>{
 const selector=decl.parent.selector||'';
 const isHeading=/(?:^|[^\w-])h[1-6](?=[^\w-]|$)|\.(?:fr-title|flow-title)(?=[^\w-]|$)/.test(selector);
 const delta=isHeading?5:2;const value=decl.value;
 decl.value=/^[\d.]+px$/.test(value)?`${parseFloat(value)+delta}px`:`calc(${value} + ${delta}px)`;
 isHeading?headings++:body++;
});
let updated=root.toString();
updated=updated.replaceAll("'Barlow Condensed',Impact,'Arial Narrow','Microsoft YaHei',sans-serif","'FuturaPT','PingFang SC','Microsoft YaHei',sans-serif").replaceAll("'DM Sans',Arial,'PingFang SC','Microsoft YaHei',sans-serif","'FuturaPT','PingFang SC','Microsoft YaHei',sans-serif").replaceAll("'DM Sans','PingFang SC','Microsoft YaHei',sans-serif","'FuturaPT','PingFang SC','Microsoft YaHei',sans-serif").replaceAll("'Barlow Condensed',Impact,'Arial Narrow',sans-serif","'FuturaPT','PingFang SC','Microsoft YaHei',sans-serif").replaceAll("'Barlow Condensed',Impact,sans-serif","'FuturaPT','PingFang SC','Microsoft YaHei',sans-serif").replaceAll('font-family:Georgia,serif','font-family:var(--sans)');
await writeFile(file,'/* Typography revision: reference FuturaPT; body +2px, semantic headings +5px. */\n'+updated);
console.log(JSON.stringify({headingDeclarations:headings,bodyDeclarations:body}));
