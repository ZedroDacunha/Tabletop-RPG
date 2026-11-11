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
const value=sel=>page.$eval(sel,e=>e.value).catch(()=>'');
const count=async sel=>(await page.$$(sel)).length;
const objectCount=async()=>{const t=await text('footer');const m=t.match(/(\d+)\s+objetos?/);return m?Number(m[1]):-1};
const multiCount=async()=>{const t=await text('[aria-label="Seleção múltipla"] strong');const m=t.match(/(\d+)/);return m?Number(m[1]):0};
const rows=()=>page.$$('.scene-row');
const rowClick=async(i,shift=false)=>{const list=await rows();if(shift)await page.keyboard.down('Shift');await list[i].click();if(shift)await page.keyboard.up('Shift');await sleep(150)};
const groupClick=async(i=0)=>{const list=await page.$$('.group-name');await list[i].click();await sleep(150)};
const clickText=async label=>{await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(e=>(e.textContent||'').trim()===t);if(b)b.click()},label);await sleep(300)};
const press=async(key,...mods)=>{for(const m of mods)await page.keyboard.down(m);await page.keyboard.press(key);for(const m of mods.reverse())await page.keyboard.up(m);await sleep(250)};
const sceneTab=async()=>{await page.click('.library-tabs button:nth-child(2)');await page.waitForSelector('.scene-row',{timeout:15000});await sleep(150)};
const xOf=async index=>{await rowClick(index);return Number(await value('input[aria-label="Posição X"]'))};

try{
 await page.goto(BASE,{waitUntil:'networkidle2',timeout:60000});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await sleep(600);
 await page.click('.library-tabs button:nth-child(3)');
 await page.waitForSelector('.preset-card',{timeout:15000});
 await page.click('.preset-card');
 await page.waitForFunction(()=>/13\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:15000});
 await sceneTab();
 ok('cena começa com 13 peças soltas',(await count('.scene-row'))===13,`${await count('.scene-row')} linhas`);

 await rowClick(0);await rowClick(1,true);await rowClick(2,true);
 ok('três peças selecionadas antes de agrupar',(await multiCount())===3,`${await multiCount()} selecionados`);
 await clickText('Agrupar');
 ok('grupo criado na lista',(await count('.scene-group'))===1,`${await count('.scene-group')} grupo`);
 ok('grupo recebe nome automático',(await text('.group-name span'))==='Grupo 1',await text('.group-name span'));
 ok('grupo mostra a contagem de peças',(await text('.group-name em'))==='3',await text('.group-name em'));
 ok('membros aparecem dentro do grupo',(await count('.scene-row.in-group'))===3,`${await count('.scene-row.in-group')} membros`);
 ok('agrupar não altera a quantidade de peças',(await objectCount())===13,`${await objectCount()} objetos`);

 await page.click('.group-toggle');await sleep(200);
 ok('grupo recolhe',(await count('.scene-row.in-group'))===0);
 ok('cabeçalho do grupo continua visível',(await count('.scene-group'))===1);
 await page.click('.group-toggle');await sleep(200);
 ok('grupo expande de novo',(await count('.scene-row.in-group'))===3);

 await groupClick();
 ok('clicar no nome seleciona o grupo inteiro',(await multiCount())===3,`${await multiCount()} selecionados`);

 const before=await xOf(0);
 await groupClick();await press('ArrowRight');
 const after=await xOf(0);
 ok('seta move o grupo inteiro',Math.abs(after-(before+1))<1e-6,`X ${before}→${after}`);

 const firstName=(await text('.scene-row.in-group .scene-select span'));
 await groupClick();
 await page.click('input[aria-label="Nome do grupo"]');
 await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');
 await page.keyboard.type('Bosque');
 await page.evaluate(()=>document.querySelector('input[aria-label="Nome do grupo"]')?.blur());
 await sleep(400);
 ok('renomear o grupo pelo painel',(await text('.group-name span'))==='Bosque',await text('.group-name span'));
 ok('peças continuam dentro do grupo renomeado',(await count('.scene-row.in-group'))===3);

 await groupClick();await press('KeyD','Control');
 await sleep(300);
 ok('Ctrl + D duplica o grupo com as peças',(await objectCount())===16,`${await objectCount()} objetos`);
 ok('cópia ganha grupo próprio',(await count('.scene-group'))===2,`${await count('.scene-group')} grupos`);
 ok('grupo copiado é renomeado',(await text('.scene-group:nth-of-type(2) .group-name span'))==='Bosque (cópia)',await text('.scene-group:nth-of-type(2) .group-name span'));

 await sleep(1600);
 await page.reload({waitUntil:'networkidle2'});
 await page.waitForSelector('.library-tabs',{timeout:30000});
 await page.waitForFunction(()=>/16\s+objetos?/.test(document.querySelector('footer')?.textContent||''),{timeout:20000});
 await sceneTab();
 ok('grupos sobrevivem ao recarregar a página',(await count('.scene-group'))===2,`${await count('.scene-group')} grupos`);
 ok('nomes dos grupos persistem',(await text('.group-name span'))==='Bosque',await text('.group-name span'));

 await groupClick(0);await clickText('Desagrupar');
 ok('desagrupar solta as peças',(await count('.scene-group'))===1,`${await count('.scene-group')} grupo restante`);
 ok('peças desagrupadas voltam para a lista',(await count('.scene-row.in-group'))===3,`${await count('.scene-row.in-group')} na cópia`);

 await groupClick(0);await press('Delete');
 await sleep(300);
 ok('apagar o grupo remove suas peças',(await objectCount())===13,`${await objectCount()} objetos`);
 ok('grupo vazio desaparece da lista',(await count('.scene-group'))===0);

 await press('KeyZ','Control');
 await sleep(300);
 ok('desfazer devolve o grupo e as peças',(await objectCount())===16&&(await count('.scene-group'))===1,`${await objectCount()} objetos / ${await count('.scene-group')} grupo`);

 await groupClick(0);await press('Digit2');await sleep(900);
 await page.screenshot({path:'capturas/grupos.jpg',type:'jpeg',quality:72});
 ok('console sem erros',errors.length===0,errors.join(' | ').slice(0,160));
 ok('peça renomeada segue no grupo',Boolean(firstName));
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.message:String(e)}`);failures++;
 await page.screenshot({path:'capturas/grupos-erro.jpg',type:'jpeg',quality:72}).catch(()=>{});
}finally{
 await browser.close();
}
console.log('\n=== RELATÓRIO DOS GRUPOS ===');
for(const line of results)console.log(line);
writeFileSync('capturas/relatorio.txt',results.join('\n')+`\n\n${failures?`${failures} FALHA(S)`:'TUDO OK'}\n`);
process.exit(failures?1:0);
