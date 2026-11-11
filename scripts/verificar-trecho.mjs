import puppeteer from 'puppeteer-core';
import {mkdirSync,readFileSync,readdirSync,writeFileSync,rmSync} from 'node:fs';

const BASE='http://127.0.0.1:4173/Tabletop-RPG/';
const DOWNLOADS='/tmp/trechos';
const results=[];const errors=[];let failures=0;
const ok=(name,pass,detail='')=>{results.push(`${pass?'ok':'FALHOU'} — ${name}${detail?` (${detail})`:''}`);if(!pass)failures++;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
mkdirSync('capturas',{recursive:true});
rmSync(DOWNLOADS,{recursive:true,force:true});mkdirSync(DOWNLOADS,{recursive:true});

const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader','--window-size=1440,900']});
const page=await browser.newPage();
await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
const cdp=await page.createCDPSession();
await cdp.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:DOWNLOADS});
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
page.on('pageerror',e=>errors.push(String(e)));

const text=sel=>page.$eval(sel,e=>(e.textContent||'').trim()).catch(()=>'');
const count=async sel=>(await page.$$(sel)).length;
const objectCount=async()=>{const t=await text('footer');const m=t.match(/(\d+)\s+objetos?/);return m?Number(m[1]):-1};
const multiCount=async()=>{const t=await text('[aria-label="Seleção múltipla"] strong');const m=t.match(/(\d+)/);return m?Number(m[1]):0};
const rows=()=>page.$$('.scene-row');
const rowClick=async(i,shift=false)=>{const list=await rows();if(shift)await page.keyboard.down('Shift');await list[i].click();if(shift)await page.keyboard.up('Shift');await sleep(140)};
const byLabel=label=>`button[aria-label="${label}"]`;
const clickText=async label=>{await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(e=>(e.textContent||'').trim()===t);if(b)b.click()},label);await sleep(400)};
const waitForDownload=async()=>{for(let i=0;i<40;i++){const files=readdirSync(DOWNLOADS).filter(f=>!f.endsWith('.crdownload'));if(files.length)return files[0];await sleep(250)}return null};

try{
 await page.goto(BASE,{waitUntil:'networkidle2',timeout:60000});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await sleep(700);
 await page.click('.library-tabs button:nth-child(3)');
 await page.waitForSelector('.preset-card',{timeout:15000});
 await page.click('.preset-card');
 await page.waitForFunction(()=>/13\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:15000});
 await page.click('.library-tabs button:nth-child(2)');
 await page.waitForSelector('.scene-row',{timeout:15000});

 await rowClick(0);await rowClick(1,true);await rowClick(2,true);
 await clickText('Agrupar');
 await page.waitForSelector('.scene-group',{timeout:10000});
 await page.evaluate(()=>document.querySelector('.group-name')?.click());
 await sleep(300);
 ok('grupo pronto para exportar',(await multiCount())===3,`${await multiCount()} selecionados`);

 await clickText('Exportar trecho');
 const file=await waitForDownload();
 ok('exportar trecho baixa o arquivo',Boolean(file),file??'nada baixado');
 let clip=null;
 if(file){const raw=readFileSync(`${DOWNLOADS}/${file}`,'utf8');clip=JSON.parse(raw);
  ok('arquivo é um trecho com as três peças',clip.format==='trecho'&&clip.objects.length===3,`${clip.format} · ${clip.objects?.length} peças`);
  ok('o grupo viaja junto',Array.isArray(clip.groups)&&clip.groups.length===1,clip.groups?.[0]?.name??'sem grupo');
 }

 // novo mapa vazio e importação
 await page.click('.header-actions button:nth-child(2)');
 await page.waitForSelector('.modal[aria-label="Um novo mundo"]',{timeout:10000});
 await page.evaluate(()=>[...document.querySelectorAll('.modal button')].find(b=>(b.textContent||'').includes('Criar mapa'))?.click());
 await page.waitForFunction(()=>/0\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:15000});
 ok('mapa novo começa vazio',(await objectCount())===0);

 const input=await page.$('input[accept=".trecho,.json"]');
 ok('entrada de importação existe',Boolean(input));
 await input.uploadFile(`${DOWNLOADS}/${file}`);
 await page.waitForFunction(()=>/3\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:20000});
 ok('importar trecho cola as três peças',(await objectCount())===3,`${await objectCount()} objetos`);
 ok('aviso confirma a origem do trecho',/peças coladas/.test(await text('.toast')),await text('.toast'));
 ok('as peças coladas ficam selecionadas',(await multiCount())===3,`${await multiCount()} selecionados`);
 await page.click('.library-tabs button:nth-child(2)');
 await page.waitForSelector('.scene-row',{timeout:10000});
 ok('o grupo do trecho é recriado',(await count('.scene-group'))===1,`${await count('.scene-group')} grupo`);
 await page.screenshot({path:'capturas/trecho.jpg',type:'jpeg',quality:72});

 await page.keyboard.down('Control');await page.keyboard.press('KeyZ');await page.keyboard.up('Control');
 await sleep(400);
 ok('um Ctrl+Z desfaz a colagem inteira',(await objectCount())===0&&(await count('.scene-group'))===0,`${await objectCount()} objetos`);
 ok('console sem erros',errors.length===0,errors.join(' | ').slice(0,160));
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.message:String(e)}`);failures++;
 await page.screenshot({path:'capturas/trecho-erro.jpg',type:'jpeg',quality:72}).catch(()=>{});
}finally{
 await browser.close();
}
console.log('\n=== RELATÓRIO DOS TRECHOS ===');
for(const line of results)console.log(line);
writeFileSync('capturas/relatorio.txt',results.join('\n')+`\n\n${failures?`${failures} FALHA(S)`:'TUDO OK'}\n`);
process.exit(failures?1:0);
