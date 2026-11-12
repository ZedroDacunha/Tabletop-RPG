// Verificação por navegador do menu Arquivo no topo.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const root = path.resolve('dist');
const base = '/Tabletop-RPG';
const downloads = '/tmp/baixados';
fs.rmSync(downloads, { recursive: true, force: true });
fs.mkdirSync(downloads, { recursive: true });
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
const client = await page.createCDPSession();
await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
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
const headerShape = () => page.evaluate(() => {
  const bar = document.querySelector('.topbar');
  const box = bar.getBoundingClientRect();
  const buttons = [...document.querySelectorAll('.header-actions button')];
  return {
    labels: buttons.map(b => (b.getAttribute('aria-label') || b.textContent || '').trim()),
    overflow: bar.scrollWidth - bar.clientWidth,
    outside: buttons.filter(b => { const r = b.getBoundingClientRect(); return r.right > box.right + 1 || r.left < box.left - 1; }).length,
    menuButton: buttons.filter(b => b.getAttribute('aria-haspopup') === 'menu').length,
    exportIcons: document.querySelectorAll('.header-actions [aria-label="Exportar projeto (.tabletop)"]').length,
    unnamed: buttons.filter(b => !((b.getAttribute('aria-label') || b.textContent || '').trim())).length,
  };
});
const waitToast = value => page.waitForFunction(value => (document.body.textContent ?? '').includes(value), { timeout: 15000 }, value);

let failure = null;
try {
  // 1. Topo largo: um lugar para os arquivos.
  let shape = await headerShape();
  check('o topo tem cinco ações, com Arquivo no lugar de Abrir/Exportar', shape.labels.length === 5, shape.labels.join(' · '));
  check('o botão de exportar solto saiu do topo', shape.exportIcons === 0, `${shape.exportIcons} ícones de exportar`);
  check('existe um botão de menu no topo', shape.menuButton === 1, 'Arquivo');
  check('todas as ações têm nome acessível', shape.unnamed === 0, `${shape.unnamed} sem nome`);

  // 2. Menu Arquivo.
  await page.evaluate(() => document.querySelector('.header-file button').click());
  await page.waitForSelector('.header-menu', { timeout: 5000 });
  const items = await page.evaluate(() => [...document.querySelectorAll('.header-menu button')].map(b => b.textContent.trim()));
  check('Arquivo abre com abrir e exportar', items.length === 2 && items[0].includes('Abrir projeto') && items[1].includes('Exportar projeto'), items.join(' | '));
  check('o botão avisa que o menu está aberto', (await page.evaluate(() => document.querySelector('.header-file button')?.getAttribute('aria-expanded'))) === 'true', 'aria-expanded=true');
  await page.screenshot({ path: 'capturas/topo.jpg', type: 'jpeg', quality: 88 });

  // 3. Exportar pelo menu grava o arquivo.
  await page.evaluate(() => [...document.querySelectorAll('.header-menu button')].find(b => b.textContent.includes('Exportar projeto'))?.click());
  await page.waitForFunction(() => !document.querySelector('.header-menu'), { timeout: 5000 });
  await waitToast('Cópia do projeto exportada');
  check('exportar avisa na tela', (await text()).includes('Cópia do projeto exportada com todos os modelos.'), 'aviso na tela');
  let saved = [];
  for (let i = 0; i < 20 && !saved.length; i++) {
    await sleep(250);
    saved = fs.readdirSync(downloads).filter(f => f.endsWith('.tabletop'));
  }
  const size = saved.length ? fs.statSync(path.join(downloads, saved[0])).size : 0;
  check('exportar baixa o arquivo .tabletop', saved.length === 1 && size > 1000, `${saved[0] ?? 'nada'} · ${size} bytes`);

  // 4. Fechar por Esc e por clique fora.
  await page.evaluate(() => document.querySelector('.header-file button').click());
  await page.waitForSelector('.header-menu', { timeout: 5000 });
  await page.keyboard.press('Escape');
  await sleep(200);
  check('Esc fecha o menu do topo', await page.evaluate(() => !document.querySelector('.header-menu')), 'fechado');

  await page.evaluate(() => document.querySelector('.header-file button').click());
  await page.waitForSelector('.header-menu', { timeout: 5000 });
  await page.mouse.click(700, 500);
  await sleep(200);
  check('clicar fora fecha o menu do topo', await page.evaluate(() => !document.querySelector('.header-menu')), 'fechado');

  // 5. Topo estreito: tudo dentro da barra, com nome acessível.
  await page.setViewport({ width: 900, height: 760 });
  await sleep(600);
  shape = await headerShape();
  check('no topo estreito nada vaza da barra', shape.overflow <= 1 && shape.outside === 0, `folga ${1 - shape.overflow}px · ${shape.outside} fora`);
  check('as ações do topo continuam nomeadas quando o rótulo some', shape.unnamed === 0, shape.labels.join(' · '));
  await page.screenshot({ path: 'capturas/topo-estreito.jpg', type: 'jpeg', quality: 88 });
  await page.evaluate(() => document.querySelector('.header-file button').click());
  await page.waitForSelector('.header-menu', { timeout: 5000 });
  const inside = await page.evaluate(() => {
    const menu = document.querySelector('.header-menu').getBoundingClientRect();
    return menu.left >= 0 && menu.right <= window.innerWidth && menu.top >= 0 && menu.bottom <= window.innerHeight;
  });
  check('o menu cabe na tela estreita', inside, 'sem vazar da janela');
  await page.screenshot({ path: 'capturas/topo-estreito-menu.jpg', type: 'jpeg', quality: 88 });

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
