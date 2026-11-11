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
const toast=()=>text('.toast');
const objectCount=async()=>{const t=await text('footer');const m=t.match(/(\d+)\s+objetos?/);return m?Number(m[1]):-1};
const byLabel=label=>`button[aria-label="${label}"]`;
const layerSummary=()=>page.$$eval('.layer-row',rows=>rows.map(r=>({name:(r.querySelector('.layer-name')?.childNodes[0]?.textContent||'').trim(),total:Number(r.querySelector('.layer-name small')?.textContent||0)})));

try{
 await page.goto(BASE,{waitUntil:'networkidle2',timeout:60000});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await sleep(600);
 await page.click('.library-tabs button:nth-child(3)');
 await page.waitForSelector('.preset-card',{timeout:15000});
 const cards=await page.$$('.preset-card');
 await cards[0].click();await sleep(400);
 await (await page.$$('.preset-card'))[1].click();
 await page.waitForFunction(()=>/26\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:15000});
 ok('dois cenários no mapa',(await objectCount())===26,`${await objectCount()} objetos`);

 await page.click('.library-tabs button:nth-child(2)');
 await page.waitForSelector('.scene-row',{timeout:15000});
 const summary=await layerSummary();
 ok('camadas listadas com contagem',summary.length>=2&&summary.every(l=>l.total>0),summary.map(l=>`${l.name} ${l.total}`).join(' · '));
 ok('a soma das camadas bate com o mapa',summary.reduce((a,l)=>a+l.total,0)===26,`${summary.reduce((a,l)=>a+l.total,0)} peças`);
 ok('camada vazia não aparece',!summary.some(l=>/Importados/.test(l.name)));

 const natureza=summary.find(l=>l.name.startsWith('Natureza'))?.total??0;
 await page.click(byLabel('Ocultar camada Natureza'));await sleep(350);
 ok('ocultar esconde só as peças da camada',(await count('.scene-row.hidden-object'))===natureza,`${await count('.scene-row.hidden-object')} de ${natureza}`);
 ok('nada é apagado do mapa',(await objectCount())===26,`${await objectCount()} objetos`);
 ok('aviso confirma a camada oculta',/Camada Natureza oculta/.test(await toast()),await toast());

 await page.click(byLabel('Travar camada Natureza'));await sleep(300);
 ok('travar atinge a camada inteira',/Camada Natureza travada/.test(await toast()),await toast());

 await sleep(1500);
 await page.reload({waitUntil:'networkidle2'});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await page.waitForFunction(()=>/26\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:20000});
 await page.click('.library-tabs button:nth-child(2)');
 await page.waitForSelector('.scene-row',{timeout:15000});
 ok('estado das camadas sobrevive ao recarregar',(await count('.scene-row.hidden-object'))===natureza,`${await count('.scene-row.hidden-object')} ocultas`);
 ok('trava da camada também persiste',(await page.$(byLabel('Destravar camada Natureza')))!==null);

 await page.evaluate(()=>document.querySelector('.layer-list')?.scrollIntoView({block:'center'}));
 await sleep(400);
 await page.screenshot({path:'capturas/camadas.jpg',type:'jpeg',quality:72});

 await page.click(byLabel('Destravar camada Natureza'));await sleep(300);
 ok('destravar libera a camada',/Camada Natureza destravada/.test(await toast()),await toast());
 await page.click(byLabel('Mostrar camada Natureza'));await sleep(300);
 ok('mostrar traz a camada de volta',(await count('.scene-row.hidden-object'))===0);
 ok('console sem erros',errors.length===0,errors.join(' | ').slice(0,160));
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.message:String(e)}`);failures++;
 await page.screenshot({path:'capturas/camadas-erro.jpg',type:'jpeg',quality:72}).catch(()=>{});
}finally{
 await browser.close();
}
console.log('\n=== RELATÓRIO DAS CAMADAS ===');
for(const line of results)console.log(line);
writeFileSync('capturas/relatorio.txt',results.join('\n')+`\n\n${failures?`${failures} FALHA(S)`:'TUDO OK'}\n`);
process.exit(failures?1:0);
