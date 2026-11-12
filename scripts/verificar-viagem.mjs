// Verificação por navegador da viagem suave entre vistas do roteiro.
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

const url = `http://127.0.0.1:4173${base}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => new Promise(r => { const del = indexedDB.deleteDatabase('tabletop-rpg'); del.onsuccess = del.onerror = del.onblocked = () => r(); }));
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

const clickText = (text, scope = 'button') => page.evaluate((text, scope) => {
  const el = [...document.querySelectorAll(scope)].find(b => (b.textContent ?? '').trim().includes(text));
  if (!el) throw new Error(`botão não encontrado: ${text}`);
  el.click();
}, text, scope);
const text = () => page.evaluate(() => document.body.textContent ?? '');
const viewRows = () => page.evaluate(() => [...document.querySelectorAll('.view-row')].map(row => ({
  name: row.querySelector('input')?.value ?? '',
  travel: row.querySelector('.view-travel')?.value ?? '',
})));
const setTravel = (index, value) => page.evaluate((index, value) => {
  const select = document.querySelectorAll('.view-row .view-travel')[index];
  if (!select) throw new Error('seletor de tempo não encontrado');
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}, index, value);
const fingerprint = () => page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return 'sem canvas';
  const off = document.createElement('canvas'); off.width = 48; off.height = 27;
  const ctx = off.getContext('2d');
  ctx.drawImage(canvas, 0, 0, 48, 27);
  const data = ctx.getImageData(0, 0, 48, 27).data;
  let hash = 5381;
  for (let i = 0; i < data.length; i += 4) hash = ((hash * 33) ^ data[i] ^ (data[i + 1] << 3) ^ (data[i + 2] << 6)) >>> 0;
  return String(hash);
});
const settle = async (tries = 16) => {
  let previous = await fingerprint();
  for (let i = 0; i < tries; i++) {
    await sleep(250);
    const next = await fingerprint();
    if (next === previous) return next;
    previous = next;
  }
  return previous;
};

let failure = null;
try {
  // 1. Duas vistas no mapa de exemplo.
  await page.waitForSelector('.empty-world', { timeout: 60000 });
  await clickText('Explorar mapa de exemplo');
  await page.waitForFunction(() => /objetos/.test(document.querySelector('.statusbar')?.textContent ?? ''), { timeout: 20000 });
  await clickText('Salvar vista atual');
  await page.waitForFunction(() => document.querySelectorAll('.view-row').length === 1, { timeout: 10000 });
  await sleep(1200);
  await clickText('Perspectiva');
  await sleep(900);
  await clickText('Salvar vista atual');
  await page.waitForFunction(() => document.querySelectorAll('.view-row').length === 2, { timeout: 10000 });
  let rows = await viewRows();
  check('duas vistas salvas com o tempo padrão', rows.length === 2 && rows.every(r => r.travel === '1.2'), rows.map(r => `${r.name}=${r.travel}`).join(' | '));

  // 2. Tempo de viagem por vista.
  await setTravel(0, '0');
  await sleep(300);
  await setTravel(1, '3');
  await sleep(400);
  rows = await viewRows();
  check('cada vista tem seu próprio tempo de viagem', rows[0].travel === '0' && rows[1].travel === '3', rows.map(r => `${r.name}=${r.travel}`).join(' | '));
  await page.screenshot({ path: 'capturas/viagem.jpg', type: 'jpeg', quality: 88 });

  // 3. O tempo dado sobrevive ao recarregar.
  await page.waitForFunction(() => document.querySelector('.save-status')?.textContent.includes('Salvo'), { timeout: 20000 });
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll('.view-row').length === 2, { timeout: 20000 });
  rows = await viewRows();
  check('o tempo de viagem fica salvo no mapa', rows[0].travel === '0' && rows[1].travel === '3', rows.map(r => `${r.name}=${r.travel}`).join(' | '));

  // 4. Modo apresentação: primeira vista sem viagem, segunda com 3 s.
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('KeyP');
  await page.waitForSelector('.showcase-views', { timeout: 20000 });
  const firstView = await settle();
  check('a pílula começa na primeira vista', (await text()).includes('1 / 2'), '1 / 2');

  await page.keyboard.press('ArrowRight');
  await sleep(700);
  const early = await fingerprint();
  await page.screenshot({ path: 'capturas/meio.jpg', type: 'jpeg', quality: 80 });
  await sleep(700);
  const middle = await fingerprint();
  const lastView = await settle();
  const debug = await page.evaluate(() => (window.__viagem ?? null));
  check('a câmera se move durante a viagem', early !== firstView && middle !== firstView && middle !== lastView,
    `0,7 s ${early} · 1,4 s ${middle} · início ${firstView} · fim ${lastView}`);
  check('depuração da viagem', true, JSON.stringify(debug));
  check('a viagem termina em outro enquadramento', lastView !== firstView && lastView !== middle, `fim ${lastView}`);
  check('a pílula acompanha a troca de vista', (await text()).includes('2 / 2'), '2 / 2');
  await page.screenshot({ path: 'capturas/viagem-apresentacao.jpg', type: 'jpeg', quality: 88 });

  // 5. Vista com 0 s é corte seco.
  await page.keyboard.press('ArrowLeft');
  await sleep(250);
  const instant = await fingerprint();
  await sleep(1200);
  const instantLater = await fingerprint();
  check('vista com 0 s chega sem transição', instant === instantLater, `250 ms ${instant} = 1,4 s ${instantLater}`);
  check('e volta ao enquadramento da primeira vista', instant === firstView, `${instant} = ${firstView}`);

  // 6. De volta ao editor.
  await page.keyboard.press('Escape');
  await sleep(700);
  rows = await viewRows();
  check('o editor volta com o roteiro e os tempos', rows.length === 2 && rows[0].travel === '0' && rows[1].travel === '3', rows.map(r => `${r.name}=${r.travel}`).join(' | '));

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
