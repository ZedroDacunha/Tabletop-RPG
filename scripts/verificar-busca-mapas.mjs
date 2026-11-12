// Verificação por navegador da busca e da ordenação em Meus mapas.
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
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--window-size=1280,860'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 860 });
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push(String(e)));

const url = `http://127.0.0.1:4173${base}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => new Promise(r => { const del = indexedDB.deleteDatabase('tabletop-rpg'); del.onsuccess = del.onerror = del.onblocked = () => r(); }));
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForSelector('.empty-world', { timeout: 60000 });

const clickText = (text, scope = 'button') => page.evaluate((text, scope) => {
  const el = [...document.querySelectorAll(scope)].find(b => (b.textContent ?? '').trim().includes(text));
  if (!el) throw new Error(`botão não encontrado: ${text}`);
  el.click();
}, text, scope);
const text = () => page.evaluate(() => document.body.textContent ?? '');
const cards = () => page.evaluate(() => [...document.querySelectorAll('.map-grid .map-card')].map(card => ({
  name: card.querySelector('.map-info strong')?.textContent ?? '',
  meta: card.querySelector('.map-info span')?.textContent ?? '',
})));
const count = () => page.evaluate(() => document.querySelector('.map-count')?.textContent ?? '');
const waitCards = n => page.waitForFunction(n => document.querySelectorAll('.map-grid .map-card').length === n, { timeout: 15000 }, n);
const search = value => page.evaluate(value => {
  const input = document.querySelector('input[aria-label="Buscar mapas"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}, value);
const sortBy = value => page.evaluate(value => {
  const select = document.querySelector('select[aria-label="Ordenar mapas"]');
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}, value);
const createMap = async (name, size) => {
  await clickText('Novo mapa');
  await page.waitForSelector('.modal', { timeout: 10000 });
  await page.evaluate((name, size) => {
    const input = document.querySelector('.modal input');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, name);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const select = document.querySelector('.modal select');
    select.value = size;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, name, size);
  await sleep(150);
  await clickText('Criar mapa', '.modal button');
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
  await page.waitForFunction(name => document.querySelector('input[aria-label="Nome do mapa"]')?.value === name, { timeout: 20000 }, name);
  await sleep(350);
};

let failure = null;
try {
  // 1. Três mapas com nomes e tamanhos diferentes.
  await createMap('Bosque', '30');
  await createMap('Ruína do portão', '50');
  await createMap('acampamento', '20');
  await clickText('Meus mapas');
  await page.waitForSelector('.modal .map-card', { timeout: 10000 });
  await waitCards(3);
  let list = await cards();
  check('a biblioteca mostra os três mapas', list.length === 3, list.map(m => m.name).join(' · '));
  check('a contagem aparece no topo', (await count()).includes('3 de 3'), await count());
  check('cada cartão mostra o tamanho do mapa', list.every(m => /(20|30|50) m/.test(m.meta)), list[0].meta);

  // 2. Busca por nome.
  await search('bos');
  await waitCards(1);
  list = await cards();
  check('buscar "bos" deixa só o Bosque', list.length === 1 && list[0].name === 'Bosque', list[0]?.name ?? 'nada');
  check('a contagem acompanha a busca', (await count()).includes('1 de 3'), await count());

  await search('ruina');
  await waitCards(1);
  list = await cards();
  check('buscar sem acento acha "Ruína do portão"', list.length === 1 && list[0].name === 'Ruína do portão', list[0]?.name ?? 'nada');

  await search('CAMP');
  await waitCards(1);
  check('maiúsculas e busca no meio da palavra funcionam', (await cards())[0]?.name === 'acampamento', (await cards())[0]?.name ?? 'nada');

  await search('zzz');
  await waitCards(0);
  check('busca sem resultado explica o vazio', (await text()).includes('Nenhum mapa com esse nome'), 'mensagem visível');
  check('a contagem zera', (await count()).includes('0 de 3'), await count());

  await page.evaluate(() => document.querySelector('[aria-label="Limpar busca de mapas"]').click());
  await waitCards(3);
  check('limpar a busca devolve os três mapas', (await cards()).length === 3, '3 mapas');
  const searchValue = await page.evaluate(() => document.querySelector('input[aria-label="Buscar mapas"]').value);
  check('o campo de busca fica vazio', searchValue === '', `"${searchValue}"`);

  // 3. Ordenação.
  await sortBy('nome');
  await sleep(250);
  list = await cards();
  check('ordenar por nome põe em ordem alfabética', list.map(m => m.name).join('|') === 'acampamento|Bosque|Ruína do portão', list.map(m => m.name).join(' · '));

  await sortBy('tamanho');
  await sleep(250);
  list = await cards();
  check('ordenar por tamanho começa pelo mapa maior', list.map(m => m.meta.match(/(\d+) m/)?.[1]).join('|') === '50|30|20', list.map(m => m.name).join(' · '));
  await page.screenshot({ path: 'capturas/busca-mapas.jpg', type: 'jpeg', quality: 88 });

  await sortBy('recentes');
  await sleep(250);
  list = await cards();
  check('ordenar por recentes volta ao último criado', list[0]?.name === 'acampamento', list.map(m => m.name).join(' · '));

  // 4. A busca continua funcionando junto com a ordem.
  await sortBy('nome');
  await search('o');
  await sleep(300);
  list = await cards();
  const names = list.map(m => m.name);
  check('busca e ordem trabalham juntas', names.length === 3 && names.join('|') === 'acampamento|Bosque|Ruína do portão', names.join(' · '));

  // 5. Reabrir a biblioteca volta com a busca limpa.
  await page.evaluate(() => [...document.querySelectorAll('.modal button')].find(b => b.textContent.includes('Voltar ao mapa'))?.click());
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
  await clickText('Meus mapas');
  await page.waitForSelector('.modal .map-card', { timeout: 10000 });
  await waitCards(3);
  const reopened = await page.evaluate(() => document.querySelector('input[aria-label="Buscar mapas"]').value);
  check('reabrir a biblioteca começa com a busca limpa', reopened === '', `"${reopened}"`);

  const realErrors = consoleErrors.filter(t => !/favicon|WebGL|THREE\.WebGLRenderer|SwiftShader/i.test(t));
  check('console limpo', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
} catch (e) {
  failure = String(e && e.stack ? e.stack : e);
  check('fluxo completo', false, failure.split('\n').slice(0, 3).join(' | '));
  try { await page.screenshot({ path: 'capturas/erro.jpg', type: 'jpeg', quality: 80 }); } catch {}
}
await browser.close();
server.close();

const passed = results.filter(r => r.pass).length;
fs.writeFileSync('capturas/relatorio.txt', `${lines.join('\n')}\n\n${passed}/${results.length} verificações OK\n${failure ? `ERRO:\n${failure}` : ''}`);
console.log(`\n${passed}/${results.length} verificações OK`);
process.exit(results.every(r => r.pass) ? 0 : 1);
