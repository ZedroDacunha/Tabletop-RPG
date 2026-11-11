import puppeteer from 'puppeteer-core';
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
const count=async sel=>(await page.$$(sel)).length;
const headerName=()=>page.$eval('input[aria-label="Nome do mapa"]',e=>e.value).catch(()=>'');
const objectCount=async()=>{const t=await text('footer');const m=t.match(/(\d+)\s+objetos?/);return m?Number(m[1]):-1};
const cards=()=>page.$$eval('.map-card',list=>list.map(c=>({name:(c.querySelector('.map-info strong')?.textContent||'').trim(),detail:(c.querySelector('.map-info span')?.textContent||'').trim(),thumb:Boolean(c.querySelector('svg.map-thumb')),current:Boolean(c.querySelector('.map-current'))})));
const openMaps=async()=>{await page.click('.header-actions button:nth-child(1)');await page.waitForSelector('.modal[aria-label="Meus mapas"]',{timeout:15000});await sleep(500)};
const closeMaps=async()=>{await page.click('button[aria-label="Fechar janela"]');await sleep(300)};
const insertPreset=async index=>{await page.click('.library-tabs button:nth-child(3)');await page.waitForSelector('.preset-card',{timeout:15000});const list=await page.$$('.preset-card');await list[index].click();await sleep(400)};
const renameMap=async name=>{await page.click('input[aria-label="Nome do mapa"]');await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');await page.keyboard.type(name);await sleep(300)};

try{
 await page.goto(BASE,{waitUntil:'networkidle2',timeout:60000});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await sleep(700);

 await openMaps();
 ok('biblioteca abre com o mapa atual',(await count('.map-card'))===1,`${await count('.map-card')} mapa`);
 ok('mapa atual aparece marcado como aberto',(await cards())[0]?.current===true);
 await closeMaps();

 await insertPreset(0);
 await renameMap('Bosque');
 await page.waitForFunction(()=>/13\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:15000});

 // novo mapa
 await page.click('.header-actions button:nth-child(2)');
 await page.waitForSelector('.modal',{timeout:10000});
 await page.click('.modal input');
 await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');
 await page.keyboard.type('Vilarejo');
 await page.evaluate(()=>[...document.querySelectorAll('.modal button')].find(b=>(b.textContent||'').includes('Criar mapa'))?.click());
 await sleep(800);
 ok('novo mapa começa vazio',(await objectCount())===0,`${await objectCount()} objetos`);
 ok('cabeçalho mostra o novo mapa',(await headerName())==='Vilarejo',await headerName());
 await insertPreset(2);
 await page.waitForFunction(()=>/12\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:15000});

 await openMaps();
 const list=await cards();
 ok('biblioteca lista os mapas salvos',list.length===3,list.map(m=>m.name).join(' · '));
 ok('cada mapa mostra a contagem de peças',list.some(m=>m.name==='Bosque'&&/^13 peças/.test(m.detail))&&list.some(m=>m.name==='Vilarejo'&&/^12 peças/.test(m.detail)),list.map(m=>m.detail).join(' | '));
 ok('todos os mapas têm miniatura',list.every(m=>m.thumb));
 ok('um único mapa marcado como aberto',list.filter(m=>m.current).length===1);
 await page.screenshot({path:'capturas/mapas.jpg',type:'jpeg',quality:72});

 await page.click('button[aria-label="Abrir Bosque"]');
 await page.waitForFunction(()=>/13\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:20000});
 ok('abrir outro mapa carrega as peças certas',(await objectCount())===13,`${await objectCount()} objetos`);
 ok('o mapa aberto passa a ser o do cabeçalho',(await headerName())==='Bosque',await headerName());

 await openMaps();
 await page.click('button[aria-label="Excluir Meu novo mundo"]');
 await page.waitForFunction(()=>document.querySelectorAll('.map-card').length===2,{timeout:15000});
 ok('excluir remove o mapa da biblioteca',(await count('.map-card'))===2,`${await count('.map-card')} mapas`);
 await closeMaps();

 await sleep(1200);
 await page.reload({waitUntil:'networkidle2'});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await page.waitForFunction(()=>/13\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:20000});
 ok('o último mapa aberto volta ao recarregar',(await headerName())==='Bosque'&&(await objectCount())===13,`${await headerName()} · ${await objectCount()} objetos`);
 await openMaps();
 ok('a biblioteca persiste entre sessões',(await count('.map-card'))===2,`${await count('.map-card')} mapas`);
 ok('console sem erros',errors.length===0,errors.join(' | ').slice(0,160));
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.message:String(e)}`);failures++;
 await page.screenshot({path:'capturas/mapas-erro.jpg',type:'jpeg',quality:72}).catch(()=>{});
}finally{
 await browser.close();
}
console.log('\n=== RELATÓRIO DOS MAPAS ===');
for(const line of results)console.log(line);
writeFileSync('capturas/relatorio.txt',results.join('\n')+`\n\n${failures?`${failures} FALHA(S)`:'TUDO OK'}\n`);
process.exit(failures?1:0);
