import puppeteer from 'puppeteer-core';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';

const BASE='http://127.0.0.1:4173/Tabletop-RPG/';
const results=[];const errors=[];let failures=0;
const ok=(name,pass,detail='')=>{results.push(`${pass?'ok':'FALHOU'} — ${name}${detail?` (${detail})`:''}`);if(!pass)failures++;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
mkdirSync('capturas',{recursive:true});

const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader','--window-size=1440,900']});
const page=await browser.newPage();
await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
page.on('pageerror',e=>errors.push(String(e)));

const text=sel=>page.$eval(sel,e=>(e.textContent||'').trim()).catch(()=>'');
const has=async sel=>Boolean(await page.$(sel));
const count=async sel=>(await page.$$(sel)).length;
const byLabel=label=>`button[aria-label="${label}"]`;
const press=async(key,...mods)=>{for(const m of mods)await page.keyboard.down(m);await page.keyboard.press(key);for(const m of mods.reverse())await page.keyboard.up(m);await sleep(350)};
const canvasHash=async()=>{const data=await page.evaluate(()=>{const c=document.querySelector('canvas');return c?c.toDataURL():''});return createHash('sha1').update(data).digest('hex').slice(0,12)};
const viewRows=()=>count('.view-row');

try{
 await page.goto(BASE,{waitUntil:'networkidle2',timeout:60000});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await sleep(800);
 await page.click('.library-tabs button:nth-child(3)');
 await page.waitForSelector('.preset-card',{timeout:15000});
 await page.click('.preset-card');
 await page.waitForFunction(()=>/13\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:15000});

 await page.click(byLabel('Salvar vista atual'));await sleep(400);
 ok('salvar vista cria a primeira entrada',(await viewRows())===1,`${await viewRows()} vista`);
 ok('vista recebe nome automático',(await page.$eval('input[aria-label="Nome da vista 1"]',e=>e.value).catch(()=>''))==='Vista 1');

 await page.click('.view-controls button:nth-child(1)');await sleep(900);
 await page.click(byLabel('Salvar vista atual'));await sleep(400);
 ok('segunda vista é criada em outra câmera',(await viewRows())===2,`${await viewRows()} vistas`);

 await page.click('input[aria-label="Nome da vista 2"]');
 await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');
 await page.keyboard.type('Vista do portao');
 await page.keyboard.press('Tab');await sleep(400);
 ok('renomear vista funciona',(await page.$eval('input[aria-label="Nome da vista 2"]',e=>e.value).catch(()=>''))==='Vista do portao');

 await page.click(byLabel('Modo apresentação (P)'));
 await page.waitForSelector('.showcase',{timeout:15000});
 await sleep(1200);
 ok('roteiro aparece na apresentação',await has('.showcase-views'));
 ok('começa na primeira vista',/Vista 1/.test(await text('.showcase-views'))&&/1 \/ 2/.test(await text('.showcase-views')),await text('.showcase-views'));
 const firstHash=await canvasHash();

 await press('ArrowRight');
 ok('seta direita avança para a segunda vista',/Vista do portao/.test(await text('.showcase-views'))&&/2 \/ 2/.test(await text('.showcase-views')),await text('.showcase-views'));
 const secondHash=await canvasHash();
 ok('a câmera realmente muda entre as vistas',Boolean(firstHash)&&firstHash!==secondHash,`${firstHash} → ${secondHash}`);
 await page.screenshot({path:'capturas/roteiro.jpg',type:'jpeg',quality:72});

 await press('ArrowRight');
 ok('o roteiro volta para o começo',/1 \/ 2/.test(await text('.showcase-views')),await text('.showcase-views'));
 await press('ArrowLeft');
 ok('seta esquerda volta uma vista',/2 \/ 2/.test(await text('.showcase-views')),await text('.showcase-views'));
 await press('Escape');
 ok('Esc volta ao editor',!(await has('.showcase'))&&await has('.topbar'));

 await sleep(1400);
 await page.reload({waitUntil:'networkidle2'});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await page.waitForFunction(()=>/13\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:20000});
 ok('o roteiro sobrevive ao recarregar',(await viewRows())===2,`${await viewRows()} vistas`);
 ok('nomes das vistas persistem',(await page.$eval('input[aria-label="Nome da vista 2"]',e=>e.value).catch(()=>''))==='Vista do portao');

 await page.click(byLabel('Ir para Vista 1'));await sleep(600);
 ok('ir para uma vista não gera erro',errors.length===0,errors.join(' | ').slice(0,160));

 await page.click(byLabel('Remover Vista do portao'));await sleep(400);
 ok('remover tira a vista do roteiro',(await viewRows())===1,`${await viewRows()} vista`);
 ok('console sem erros',errors.length===0,errors.join(' | ').slice(0,160));
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.message:String(e)}`);failures++;
 await page.screenshot({path:'capturas/roteiro-erro.jpg',type:'jpeg',quality:72}).catch(()=>{});
}finally{
 await browser.close();
}
console.log('\n=== RELATÓRIO DO ROTEIRO ===');
for(const line of results)console.log(line);
writeFileSync('capturas/relatorio.txt',results.join('\n')+`\n\n${failures?`${failures} FALHA(S)`:'TUDO OK'}\n`);
process.exit(failures?1:0);
