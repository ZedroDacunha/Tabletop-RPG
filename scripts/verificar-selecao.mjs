import puppeteer from 'puppeteer-core';
import {mkdirSync} from 'node:fs';

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
const value=async sel=>page.$eval(sel,/** @param {HTMLInputElement} e */(e)=>e.value).catch(()=>'');
const objectCount=async()=>{const t=await text('footer');const m=t.match(/(\d+)\s+objetos?/);return m?Number(m[1]):-1};
const multiCount=async()=>{const t=await page.$$eval('[aria-label="Seleção múltipla"] strong',els=>els.map(e=>e.textContent||'').join(' ')).catch(()=>'');const m=t.match(/(\d+)/);return m?Number(m[1]):0};
const singleName=async()=>text('.selected-summary strong');
const clickRow=async(index,shift=false)=>{if(shift)await page.keyboard.down('Shift');await page.click(`.scene-row:nth-child(${index+1}) .scene-select`);if(shift)await page.keyboard.up('Shift');await sleep(120)};
const press=async(key,...mods)=>{for(const m of mods)await page.keyboard.down(m);await page.keyboard.press(key);for(const m of mods.reverse())await page.keyboard.up(m);await sleep(200)};
const selectRows=async(...indexes)=>{await clickRow(indexes[0]);for(const i of indexes.slice(1))await clickRow(i,true)};
const toast=()=>text('.toast');

try{
 await page.goto(BASE,{waitUntil:'networkidle2',timeout:60000});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await sleep(600);
 const empty=await page.$('.empty-world');
 ok('mapa inicia vazio',Boolean(empty));

 await page.click('.library-tabs button:nth-child(3)');
 await page.waitForSelector('.preset-card',{timeout:15000});
 await page.click('.preset-card');
 await page.waitForFunction(()=>/13\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:15000});
 ok('cenário inserido com 13 peças',(await objectCount())===13,`${await objectCount()} objetos`);

 await page.click('.library-tabs button:nth-child(2)');
 await page.waitForSelector('.scene-row',{timeout:15000});
 const rows=await page.$$eval('.scene-row',els=>els.length);
 ok('lista da cena mostra as 13 peças',rows===13,`${rows} linhas`);

 // Seleção simples
 await clickRow(0);
 const nameA=await singleName();const xA=Number(await value('input[aria-label="Posição X"]'));
 await clickRow(1);
 const nameB=await singleName();const xB=Number(await value('input[aria-label="Posição X"]'));
 ok('clique simples seleciona uma peça por vez',Boolean(nameA)&&nameA!==nameB,`${nameA} / ${nameB}`);
 ok('painel mostra a posição da peça',Number.isFinite(xA)&&Number.isFinite(xB),`X ${xA} e ${xB}`);

 // Shift + clique soma
 await clickRow(0);
 await clickRow(1,true);
 ok('Shift + clique soma à seleção',(await multiCount())===2,`${await multiCount()} selecionados`);
 ok('duas peças sombreadas na lista',(await page.$$eval('.scene-row.selected',e=>e.length))===2);
 await clickRow(2,true);
 ok('Shift + clique soma a terceira peça',(await multiCount())===3,`${await multiCount()} selecionados`);
 await clickRow(2,true);
 ok('Shift + clique novamente retira a peça',(await multiCount())===2,`${await multiCount()} selecionados`);

 // Setas movem o grupo
 await selectRows(0,1);
 await press('ArrowRight');
 await clickRow(0);const xA2=Number(await value('input[aria-label="Posição X"]'));
 await clickRow(1);const xB2=Number(await value('input[aria-label="Posição X"]'));
 ok('seta move as duas peças selecionadas',Math.abs(xA2-(xA+1))<1e-6&&Math.abs(xB2-(xB+1))<1e-6,`${xA}→${xA2} e ${xB}→${xB2}`);

 // Shift + clique na peça já selecionada esvazia a seleção
 await clickRow(1,true);
 ok('Shift + clique na peça já selecionada limpa a seleção',Boolean(await page.$('.empty-inspector')));

 // Remover duas de uma vez
 await selectRows(2,3);
 await press('Delete');
 await sleep(300);
 const afterDelete=await objectCount();
 ok('Delete remove as peças selecionadas',afterDelete===11,`${afterDelete} objetos`);
 ok('seleção limpa após remover',Boolean(await page.$('.empty-inspector')));

 // Ctrl+A e Ctrl+D
 await press('KeyA','Control');
 ok('Ctrl + A seleciona todas as peças',(await multiCount())===11,`${await multiCount()} selecionados`);
 await press('KeyD','Control');
 await sleep(400);
 ok('Ctrl + D duplica o grupo',(await objectCount())===22,`${await objectCount()} objetos`);
 ok('cópias ficam selecionadas',(await multiCount())===11,`${await multiCount()} selecionados`);

 // Travar e tentar mover
 await page.click('[aria-label="Seleção múltipla"] + .object-actions button:nth-child(3)');
 await sleep(300);
 ok('ação Travar atinge o grupo',/travad/.test(await toast()),await toast());
 await press('ArrowRight');
 await sleep(200);
 ok('peças travadas recusam o movimento',/Destrave/.test(await toast()),await toast());
 await page.click('[aria-label="Seleção múltipla"] + .object-actions button:nth-child(3)');
 await sleep(250);
 ok('ação Destravar libera o grupo',/destravad/.test(await toast()),await toast());

 // Gizmo no centro da seleção
 await selectRows(0,1);
 await press('Digit2');
 await sleep(900);
 await page.screenshot({path:'capturas/selecao-multipla.jpg',type:'jpeg',quality:72});
 ok('gizmo do grupo monta sem erro de renderização',errors.length===0,errors.join(' | ').slice(0,160));
 ok('console sem erros',errors.length===0,errors.join(' | ').slice(0,160));
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.message:String(e)}`);failures++;
 await page.screenshot({path:'capturas/selecao-erro.jpg',type:'jpeg',quality:72}).catch(()=>{});
}finally{
 await browser.close();
}
console.log('\n=== RELATÓRIO DA SELEÇÃO MÚLTIPLA ===');
for(const line of results)console.log(line);
console.log(`=== ${failures?`${failures} FALHA(S)`:'TUDO OK'} ===`);
process.exit(failures?1:0);
