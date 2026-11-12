// Verificação por navegador da duplicação de mapas na biblioteca.
// Serve o build em /Tabletop-RPG/ e conduz o app com puppeteer-core.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const root = path.resolve('dist');
const base = '/Tabletop-RPG';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith(base)) { res.writeHead(404); res.end('fora do base'); return; }
  url = url.slice(base.length) || '/';
  let file = path.join(root, url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(4173, '127.0.0.1', r));

fs.mkdirSync('capturas', { recursive: true });
const lines = [];
const results = [];
function check(name, pass, detail = '') {
  const line = `${pass ? 'OK  ' : 'FALHA'} ${name}${detail ? ` — ${detail}` : ''}`;
  lines.push(line); results.push({ name, pass, detail }); console.log(line);
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--window-size=1440,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push(String(e)));

let failure=null;
try{
 const url = `http://127.0.0.1:4173${base}/`;
 await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
 await page.evaluate(() => new Promise(r => { const del = indexedDB.deleteDatabase('tabletop-rpg'); del.onsuccess = del.onerror = del.onblocked = () => r(); }));
 await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
 await page.waitForSelector('.empty-world', { timeout: 60000 });

 const clickText = (text, scope = 'button') => page.evaluate((text, scope) => {
   const el = [...document.querySelectorAll(scope)].find(b => (b.textContent ?? '').trim().includes(text));
   if (!el) throw new Error(`botão não encontrado: ${text}`);
   el.click();
 }, text, scope);
 const clickLabel = label => page.evaluate(label => {
   const el = document.querySelector(`[aria-label="${label}"]`);
   if (!el) throw new Error(`elemento não encontrado: ${label}`);
   el.click();
 }, label);
 const setName = value => page.evaluate(value => {
   const input = document.querySelector('input[aria-label="Nome do mapa"]');
   const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
   setter.call(input, value);
   input.dispatchEvent(new Event('input', { bubbles: true }));
 }, value);
 const headerName = () => page.$eval('input[aria-label="Nome do mapa"]', el => el.value);
 const cards = () => page.evaluate(() => [...document.querySelectorAll('.map-card')].map(card => ({
   name: card.querySelector('.map-info strong')?.textContent ?? '',
   meta: card.querySelector('.map-info span')?.textContent ?? '',
   current: Boolean(card.querySelector('.map-current')),
 })));
 const waitCards = n => page.waitForFunction(n => document.querySelectorAll('.map-card').length === n, { timeout: 20000 }, n);
 const waitName = value => page.waitForFunction(value => document.querySelector('input[aria-label="Nome do mapa"]')?.value === value, { timeout: 20000 }, value);

 // 1. Mapa de exemplo com peças, renomeado para "Acampamento".
 await clickText('Explorar mapa de exemplo');
 await page.waitForSelector('.modal', { timeout: 10000 });
 await clickText('Abrir exemplo', '.modal button');
 await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
 await page.waitForFunction(() => /objetos/.test(document.querySelector('.statusbar')?.textContent ?? ''), { timeout: 20000 });
 await setName('Acampamento');
 await page.waitForFunction(() => document.querySelector('.save-status')?.textContent.includes('Salvo'), { timeout: 20000 });
 check('mapa de exemplo carregado e renomeado', (await headerName()) === 'Acampamento', await headerName());

 // 2. Segundo mapa vazio, para haver mais de um na biblioteca.
 await clickText('Novo mapa');
 await page.waitForSelector('.modal', { timeout: 10000 });
 await setModalName('Meu novo mundo');
 await clickText('Criar mapa', '.modal button');
 await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
 await waitName('Meu novo mundo');
 check('segundo mapa criado', (await headerName()) === 'Meu novo mundo', await headerName());

 async function setModalName(value) {
   await page.evaluate(value => {
     const input = document.querySelector('.modal input');
     const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
     setter.call(input, value);
     input.dispatchEvent(new Event('input', { bubbles: true }));
   }, value);
 }

 // 3. Biblioteca com os dois mapas.
 await clickText('Meus mapas');
 await page.waitForSelector('.map-card', { timeout: 10000 });
 await waitCards(2);
 let list = await cards();
 check('biblioteca lista os dois mapas', list.length === 2, list.map(c => c.name).join(' · '));
 const original = list.find(c => c.name === 'Acampamento');
 check('mapa de exemplo tem peças', Boolean(original) && !/^0 /.test(original.meta), original?.meta ?? 'ausente');
 const pieces = Number((original?.meta ?? '').match(/\d+/)?.[0] ?? -1);

 // 4. Duplicar o mapa de exemplo.
 await clickLabel('Duplicar Acampamento');
 await waitCards(3);
 list = await cards();
 const copy1 = list.find(c => c.name === 'Acampamento (cópia)');
 check('duplicar cria "Acampamento (cópia)"', Boolean(copy1), list.map(c => c.name).join(' · '));
 check('a cópia tem as mesmas peças', Boolean(copy1) && copy1.meta.startsWith(`${pieces} `), copy1?.meta ?? 'ausente');
 check('o original continua igual', list.find(c => c.name === 'Acampamento')?.meta === original.meta, list.find(c => c.name === 'Acampamento')?.meta ?? 'ausente');
 check('duplicar não troca o mapa aberto', Boolean(list.find(c => c.name === 'Meu novo mundo' && c.current)), 'Aberto segue em "Meu novo mundo"');

 // 5. Segunda duplicata ganha um nome livre.
 await clickLabel('Duplicar Acampamento');
 await waitCards(4);
 list = await cards();
 check('segunda duplicata vira "Acampamento (cópia 2)"', Boolean(list.find(c => c.name === 'Acampamento (cópia 2)')), list.map(c => c.name).join(' · '));
 check('a segunda duplicata também tem as peças', list.find(c => c.name === 'Acampamento (cópia 2)')?.meta.startsWith(`${pieces} `), list.find(c => c.name === 'Acampamento (cópia 2)')?.meta ?? 'ausente');

 // 6. Recarregar depois de duplicar mantém o mapa que estava aberto.
 await clickText('Voltar ao mapa', '.modal button');
 await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
 await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
 await waitName('Meu novo mundo');
 check('recarregar abre o mesmo mapa de antes', (await headerName()) === 'Meu novo mundo', await headerName());

 // 7. Abrir a cópia: nome e peças preservados.
 await clickText('Meus mapas');
 await page.waitForSelector('.map-card', { timeout: 10000 });
 await waitCards(4);
 await page.screenshot({ path: 'capturas/duplicar.jpg', type: 'jpeg', quality: 88 });
 await clickLabel('Abrir Acampamento (cópia)');
 await waitName('Acampamento (cópia)');
 await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
 await page.waitForFunction(() => /objetos/.test(document.querySelector('.statusbar')?.textContent ?? ''), { timeout: 20000 });
 const status = await page.$eval('.statusbar', el => el.textContent ?? '');
 check('a cópia abre com o nome próprio', (await headerName()) === 'Acampamento (cópia)', await headerName());
 const objectsInCopy = Number(status.match(/(\d+) objetos?/)?.[1] ?? -1);
 check('a cópia abre com todas as peças', objectsInCopy === pieces, `${objectsInCopy} objetos (original: ${pieces})`);
 await page.screenshot({ path: 'capturas/duplicar-copia.jpg', type: 'jpeg', quality: 88 });

 // 8. O original segue intacto depois de tudo.
 await clickText('Meus mapas');
 await page.waitForSelector('.map-card', { timeout: 10000 });
 await waitCards(4);
 list = await cards();
 const stillThere = list.find(c => c.name === 'Acampamento');
 check('o original segue na biblioteca com as mesmas peças', stillThere?.meta === original.meta, stillThere?.meta ?? 'ausente');
 check('agora só a cópia aparece como aberta', Boolean(list.find(c => c.name === 'Acampamento (cópia)' && c.current)), 'Aberto em "Acampamento (cópia)"');

 const realErrors = consoleErrors.filter(text => !/favicon|WebGL|THREE\.WebGLRenderer|SwiftShader/i.test(text));
 check('console limpo', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

}catch(e){
 failure=String(e&&e.stack?e.stack:e);
 check('fluxo completo',false,failure.split('\n').slice(0,3).join(' | '));
 try{await page.screenshot({path:'capturas/erro.jpg',type:'jpeg',quality:80})}catch{}
}
await browser.close();
server.close();

fs.writeFileSync('capturas/relatorio.txt',`${lines.join('\n')}\n\n${results.filter(r=>r.pass).length}/${results.length} verificações OK\n${failure?`ERRO:\n${failure}`:''}`);
console.log(`\n${results.filter(r=>r.pass).length}/${results.length} verificações OK`);
process.exit(results.every(r=>r.pass)?0:1);
