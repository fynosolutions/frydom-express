import { spawn } from 'node:child_process';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
const pkg=JSON.parse(await readFile('node_modules/astro/package.json','utf8'));
const bin=typeof pkg.bin==='string'?pkg.bin:pkg.bin.astro;
const child=spawn(process.execPath,[path.resolve('node_modules/astro',bin),...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'}});
child.on('exit',code=>process.exit(code??1));
child.on('error',error=>{console.error(error.message);process.exit(1);});
