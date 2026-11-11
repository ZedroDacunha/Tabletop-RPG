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

const num=async sel=>Number(await page.$eval(sel,e=>e.value).catch(()=>'NaN'));
const has=async sel=>Boolean(await page.$(sel));
const readout=async()=>{const el=await page.$('.ruler-readout');if(!el)return null;return page.evaluate(node=>({distance:(node.querySelector('strong')?.textContent||'').trim(),name:(node.querySelector('span')?.textContent||'').trim()}),el)};
const rowClick=async(i,shift=false)=>{const list=await page.$$('.scene-row');if(shift)await page.keyboard.down('Shift');await list[i].click();if(shift)await page.keyboard.up('Shift');await sleep(140)};
const press=async(key,...mods)=>{for(const m of mods)await page.keyboard.down(m);await page.keyboard.press(key);for(const m of mods.reverse())await page.keyboard.up(m);await sleep(250)};

try{
 await page.goto(BASE,{waitUntil:'networkidle2',timeout:60000});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await sleep(600);
 await page.click('.library-tabs button:nth-child(3)');
 await page.waitForSelector('.preset-card',{timeout:15000});
 await page.click('.preset-card');
 await page.waitForFunction(()=>/13\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:15000});
 await page.click('.library-tabs button:nth-child(2)');
 await page.waitForSelector('.scene-row',{timeout:15000});

 const pieces=[];
 const rows=await page.$$('.scene-row');
 for(let i=0;i<rows.length;i++){
  await rowClick(i);
  pieces.push({index:i,x:await num('input[aria-label="Posição X"]'),y:await num('input[aria-label="Posição Y"]'),z:await num('input[aria-label="Posição Z"]')});
 }
 ok('treze peças medidas pelo painel',pieces.length===13&&pieces.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)),`${pieces.length} peças`);

 await rowClick(0);
 const first=await readout();
 ok('régua aparece com uma peça selecionada',Boolean(first),first?`${first.distance} ${first.name}`:'sem selo');
 if(first){
  const shown=Number(first.distance.replace(/\s*m$/,'').replace(',','.'));
  const origin=pieces[0];
  const distances=pieces.filter(p=>p.index!==0).map(p=>Math.hypot(p.x-origin.x,p.y-origin.y,p.z-origin.z));
  const nearest=Math.min(...distances);
  ok('distância mostrada bate com a peça mais próxima',Math.abs(shown-nearest)<0.06,`mostrado ${shown} m · real ${nearest.toFixed(2)} m`);
 }

 await press('KeyM');
 ok('M esconde a régua',!(await has('.ruler-readout')));
 await press('KeyM');
 ok('M traz a régua de volta',await has('.ruler-readout'));

 const toggle='[role="switch"][aria-label="Régua e alinhamento"]';
 ok('interruptor do painel começa ligado',(await page.$eval(toggle,e=>e.getAttribute('aria-checked')))==='true');
 await page.click(toggle);await sleep(250);
 ok('interruptor desliga a régua',!(await has('.ruler-readout')));
 await page.click(toggle);await sleep(250);
 ok('interruptor religa a régua',await has('.ruler-readout'));

 await rowClick(1,true);
 ok('seleção múltipla não mostra régua de uma peça',!(await has('.ruler-readout')));
 await rowClick(1,true);

 await rowClick(0);
 const before=await readout();
 await press('ArrowRight');
 const after=await readout();
 ok('mover a peça atualiza a distância',Boolean(before)&&Boolean(after)&&before.distance!==after.distance,`${before?.distance} → ${after?.distance}`);

 await press('Digit2');await sleep(800);
 await page.screenshot({path:'capturas/regua.jpg',type:'jpeg',quality:72});
 ok('console sem erros',errors.length===0,errors.join(' | ').slice(0,160));
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.message:String(e)}`);failures++;
 await page.screenshot({path:'capturas/regua-erro.jpg',type:'jpeg',quality:72}).catch(()=>{});
}finally{
 await browser.close();
}
console.log('\n=== RELATÓRIO DA RÉGUA ===');
for(const line of results)console.log(line);
writeFileSync('capturas/relatorio.txt',results.join('\n')+`\n\n${failures?`${failures} FALHA(S)`:'TUDO OK'}\n`);
process.exit(failures?1:0);
