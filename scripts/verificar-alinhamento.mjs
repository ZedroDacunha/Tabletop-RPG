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
const rows=()=>page.$$('.scene-row');
const rowClick=async(i,shift=false)=>{const list=await rows();if(shift)await page.keyboard.down('Shift');await list[i].click();if(shift)await page.keyboard.up('Shift');await sleep(140)};
const press=async(key,...mods)=>{for(const m of mods)await page.keyboard.down(m);await page.keyboard.press(key);for(const m of mods.reverse())await page.keyboard.up(m);await sleep(300)};
const readAxis=async(index,axis)=>{await rowClick(index);return num(`input[aria-label="Posição ${axis}"]`)};
const byLabel=label=>`button[aria-label="${label}"]`;

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

 // alinhar em X
 await rowClick(0);await rowClick(1,true);await rowClick(2,true);
 ok('painel mostra as opções de alinhamento',await has(byLabel('Alinhar em X')),'Alinhar X/Y/Z');
 await page.click(byLabel('Alinhar em X'));await sleep(350);
 const xs=[await readAxis(0,'X'),await readAxis(1,'X'),await readAxis(2,'X')];
 ok('alinhar em X põe as três peças na mesma linha',new Set(xs.map(v=>v.toFixed(3))).size===1,xs.join(' · '));

 // alinhar em Z
 await rowClick(0);await rowClick(1,true);await rowClick(2,true);
 await page.click(byLabel('Alinhar em Z'));await sleep(350);
 const zs=[await readAxis(0,'Z'),await readAxis(1,'Z'),await readAxis(2,'Z')];
 ok('alinhar em Z põe as três peças na mesma coluna',new Set(zs.map(v=>v.toFixed(3))).size===1,zs.join(' · '));

 // distribuir em X
 await rowClick(3);await rowClick(4,true);await rowClick(5,true);await rowClick(6,true);
 await page.click(byLabel('Distribuir em X'));await sleep(350);
 const spread=[await readAxis(3,'X'),await readAxis(4,'X'),await readAxis(5,'X'),await readAxis(6,'X')].sort((a,b)=>a-b);
 const gaps=spread.slice(1).map((v,i)=>Math.round((v-spread[i])*1000)/1000);
 ok('distribuir em X deixa o espaçamento igual',new Set(gaps).size===1,`${spread.join(' · ')} → vãos ${gaps.join(', ')}`);

 // modo apresentação
 await page.click(byLabel('Modo apresentação (P)'));
 await page.waitForSelector('.showcase',{timeout:15000});
 await sleep(800);
 ok('modo apresentação abre a cena em tela cheia',await has('.showcase'));
 ok('nenhuma aba de edição fica visível',!(await has('.topbar'))&&!(await has('.library'))&&!(await has('.inspector'))&&!(await has('.statusbar'))&&!(await has('.toolstrip')));
 ok('a cena continua renderizando',await has('.showcase canvas'));
 ok('o nome do mapa aparece na apresentação',/Meu novo mundo/.test(await page.$eval('.showcase-title',e=>e.textContent||'').catch(()=>'')));
 await page.screenshot({path:'capturas/apresentacao.jpg',type:'jpeg',quality:72});

 await press('Escape');
 ok('Esc volta ao editor',!(await has('.showcase'))&&await has('.topbar'));

 await press('KeyP');
 ok('P entra no modo apresentação',await has('.showcase'));
 await press('KeyP');
 ok('P sai do modo apresentação',!(await has('.showcase')));

 await rowClick(0);await rowClick(1,true);
 await page.click(byLabel('Alinhar em Y'));await sleep(400);
 const lastToast=await page.$eval('.toast',e=>(e.textContent||'').trim()).catch(()=>'');
 ok('alinhar em Y funciona com duas peças',/alinhadas em Y/.test(lastToast),lastToast.slice(0,40));
 await sleep(1400);
 await page.screenshot({path:'capturas/alinhamento.jpg',type:'jpeg',quality:72});
 ok('console sem erros',errors.length===0,errors.join(' | ').slice(0,160));
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.message:String(e)}`);failures++;
 await page.screenshot({path:'capturas/alinhamento-erro.jpg',type:'jpeg',quality:72}).catch(()=>{});
}finally{
 await browser.close();
}
console.log('\n=== RELATÓRIO DE ALINHAMENTO E APRESENTAÇÃO ===');
for(const line of results)console.log(line);
writeFileSync('capturas/relatorio.txt',results.join('\n')+`\n\n${failures?`${failures} FALHA(S)`:'TUDO OK'}\n`);
process.exit(failures?1:0);
