// Verificação por navegador do painel da biblioteca depois da reorganização.
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
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push(String(e)));

const url = `http://127.0.0.1:4173${base}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => new Promise(r => { const del = indexedDB.deleteDatabase('tabletop-rpg'); del.onsuccess = del.onerror = del.onblocked = () => r(); }));
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForSelector('.empty-world', { timeout: 60000 });
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').includes('Explorar mapa de exemplo'));
  button?.click();
});
await page.waitForFunction(() => /objetos/.test(document.querySelector('.statusbar')?.textContent ?? ''), { timeout: 20000 });

const text = () => page.evaluate(() => document.body.textContent ?? '');
const tabsFit = () => page.evaluate(() => {
  const tabs = document.querySelector('.library-tabs');
  const box = tabs.getBoundingClientRect();
  const buttons = [...tabs.querySelectorAll('button')];
  return {
    overflow: tabs.scrollWidth - tabs.clientWidth,
    clipped: buttons.filter(b => b.getBoundingClientRect().right > box.right + 1 || b.scrollWidth > b.clientWidth + 1).map(b => b.textContent.trim()),
    labels: buttons.map(b => b.textContent.trim()),
  };
});
const bottomShape = () => page.evaluate(() => ({
  children: document.querySelector('.library-bottom')?.children.length ?? -1,
  actions: [...document.querySelectorAll('.library-action')].map(b => b.textContent.trim()),
  buddies: document.querySelectorAll('.future-feature, .import-button, .trecho-button').length,
  scroll: Math.round(document.querySelector('.library-scroll')?.clientHeight ?? 0),
}));

let failure = null;
try {
  // 1. Painel largo.
  let tabs = await tabsFit();
  let bottom = await bottomShape();
  check('as abas cabem no painel largo', tabs.overflow <= 1 && tabs.clipped.length === 0, `${tabs.labels.join(' · ')} · folga ${1 - tabs.overflow}px`);
  check('o rodapé tem só as duas ações', bottom.children === 1 && bottom.actions.length === 2, bottom.actions.join(' · '));
  check('a pilha antiga de importações sumiu', bottom.buddies === 0, `${bottom.buddies} blocos antigos`);
  await page.screenshot({ path: 'capturas/painel-largo.jpg', type: 'jpeg', quality: 88 });

  // 2. Menu de importação.
  await page.evaluate(() => document.querySelector('[aria-label="Importar arquivo"]').click());
  await page.waitForSelector('.import-menu', { timeout: 5000 });
  const menu = await page.evaluate(() => [...document.querySelectorAll('.import-menu button')].map(b => b.textContent.trim()));
  check('Importar abre um menu com as duas opções', menu.length === 2 && menu[0].includes('Trecho') && menu[1].includes('Modelo 3D'), menu.join(' | '));
  const expanded = await page.evaluate(() => document.querySelector('[aria-label="Importar arquivo"]')?.getAttribute('aria-expanded'));
  check('o botão avisa que o menu está aberto', expanded === 'true', `aria-expanded=${expanded}`);
  await page.screenshot({ path: 'capturas/painel-importar.jpg', type: 'jpeg', quality: 88 });
  await page.keyboard.press('Escape');
  await sleep(200);
  check('Esc fecha o menu', (await page.evaluate(() => !document.querySelector('.import-menu'))), 'menu fechado');

  await page.evaluate(() => document.querySelector('[aria-label="Importar arquivo"]').click());
  await page.waitForSelector('.import-menu', { timeout: 5000 });
  await page.mouse.click(600, 300);
  await sleep(200);
  check('clicar fora fecha o menu', (await page.evaluate(() => !document.querySelector('.import-menu'))), 'menu fechado');

  // 3. Meus trechos continua funcionando pelo botão novo.
  await page.evaluate(() => document.querySelector('[aria-label="Meus trechos"]').click());
  await page.waitForSelector('.modal', { timeout: 10000 });
  check('Trechos abre a janela de trechos', (await text()).includes('Meus trechos'), 'janela aberta');
  await page.evaluate(() => [...document.querySelectorAll('.modal button')].find(b => b.textContent.includes('Voltar ao mapa'))?.click());
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });

  // 4. Painel estreito: abas inteiras e nada mais empilhado.
  await page.setViewport({ width: 900, height: 760 });
  await sleep(600);
  tabs = await tabsFit();
  bottom = await bottomShape();
  check('as abas cabem no painel estreito', tabs.overflow <= 1 && tabs.clipped.length === 0, `${tabs.labels.join(' · ')}`);
  check('as duas ações continuam lado a lado no estreito', bottom.actions.length === 2, bottom.actions.join(' · '));
  check('a lista de peças ganhou espaço', bottom.scroll > 170, `${bottom.scroll}px de altura para as peças`);
  await page.screenshot({ path: 'capturas/painel-estreito.jpg', type: 'jpeg', quality: 88 });

  await page.evaluate(() => document.querySelector('[aria-label="Importar arquivo"]').click());
  await page.waitForSelector('.import-menu', { timeout: 5000 });
  await page.screenshot({ path: 'capturas/painel-estreito-importar.jpg', type: 'jpeg', quality: 88 });
  const fits = await page.evaluate(() => {
    const menu = document.querySelector('.import-menu').getBoundingClientRect();
    const panel = document.querySelector('.library').getBoundingClientRect();
    return menu.left >= panel.left - 1 && menu.right <= panel.right + 1 && menu.top > 0;
  });
  check('o menu cabe dentro do painel estreito', fits, 'sem vazar para fora da biblioteca');

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
