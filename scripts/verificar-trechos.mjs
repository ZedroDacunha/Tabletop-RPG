// Verificação por navegador da biblioteca de trechos salvos.
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
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => new Promise(r => { const del = indexedDB.deleteDatabase('tabletop-rpg'); del.onsuccess = del.onerror = del.onblocked = () => r(); }));
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

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
const text = () => page.evaluate(() => document.body.textContent ?? '');
const setName = (scope, value) => page.evaluate((scope, value) => {
  const input = document.querySelector(scope === 'header' ? 'input[aria-label="Nome do mapa"]' : '.modal input');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}, scope, value);
const headerName = () => page.$eval('input[aria-label="Nome do mapa"]', el => el.value);
const waitName = value => page.waitForFunction(value => document.querySelector('input[aria-label="Nome do mapa"]')?.value === value, { timeout: 20000 }, value);
const waitText = value => page.waitForFunction(value => (document.body.textContent ?? '').includes(value), { timeout: 20000 }, value);
const waitObjects = n => page.waitForFunction(n => new RegExp(`${n} objetos?`).test(document.querySelector('.statusbar')?.textContent ?? ''), { timeout: 20000 }, n);
const waitCards = (n) => page.waitForFunction(n => document.querySelectorAll('.map-card').length === n, { timeout: 20000 }, n);
const snippetName = () => page.evaluate(() => document.querySelector('.snippet-name')?.value ?? '');
const waitSnippetName = value => page.waitForFunction(value => document.querySelector('.snippet-name')?.value === value, { timeout: 20000 }, value);

let failure = null;
try {
  // 1. Mapa de exemplo com peças, renomeado.
  await page.waitForSelector('.empty-world', { timeout: 60000 });
  await clickText('Explorar mapa de exemplo');
  await waitObjects(67);
  await setName('header', 'Acampamento');
  await page.waitForFunction(() => document.querySelector('.save-status')?.textContent.includes('Salvo'), { timeout: 20000 });
  check('mapa de exemplo carregado e renomeado', (await headerName()) === 'Acampamento', await headerName());

  // 2. Selecionar todas e salvar como trecho.
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await waitText('67 objetos selecionados');
  await clickText('Salvar trecho');
  await waitText('“Trecho 1” salvo com 67 peças');
  check('seleção salva como "Trecho 1"', (await text()).includes('“Trecho 1” salvo com 67 peças'), 'aviso de confirmação na tela');

  // 3. Meus trechos lista o bloco com miniatura, contagem e origem.
  await clickText('Meus trechos');
  await page.waitForSelector('.modal .map-card', { timeout: 10000 });
  await waitCards(1);
  const card = await page.evaluate(() => {
    const el = document.querySelector('.modal .map-card');
    return { name: el.querySelector('.snippet-name')?.value ?? '', meta: el.querySelector('.map-info span')?.textContent ?? '', dots: el.querySelectorAll('.map-thumb circle').length };
  });
  check('Meus trechos mostra o bloco salvo', card.name === 'Trecho 1', `${card.name} · ${card.meta}`);
  check('a miniatura desenha as peças', card.dots > 0, `${card.dots} peças no desenho`);
  check('a contagem e a origem aparecem', card.meta.includes('67 peças') && card.meta.includes('de Acampamento'), card.meta);

  // 4. Renomear no próprio painel.
  await page.evaluate(() => {
    const input = document.querySelector('.snippet-name');
    input.focus();
    input.value = 'Ruína do portão';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelector('.snippet-name')?.value === 'Ruína do portão', { timeout: 10000 });
  await clickText('Voltar ao mapa', '.modal button');
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
  await clickText('Meus trechos');
  await page.waitForSelector('.modal .snippet-name', { timeout: 10000 });
  await waitSnippetName('Ruína do portão');
  check('o novo nome fica salvo no navegador', (await snippetName()) === 'Ruína do portão', 'reabrir mostra o nome novo');

  // 5. Novo mapa vazio e colar o trecho.
  await clickText('Voltar ao mapa', '.modal button');
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
  await clickText('Novo mapa');
  await page.waitForSelector('.modal', { timeout: 10000 });
  await setName('modal', 'Vilarejo');
  await clickText('Criar mapa', '.modal button');
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
  await waitName('Vilarejo');
  check('mapa novo começa vazio', (await text()).includes('0 objetos'), '0 objetos');

  await clickText('Meus trechos');
  await page.waitForSelector('.modal .map-card', { timeout: 10000 });
  await page.screenshot({ path: 'capturas/trechos.jpg', type: 'jpeg', quality: 88 });
  await clickLabel('Colar Ruína do portão');
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
  await waitObjects(67);
  await waitText('67 peças coladas');
  check('colar traz as 67 peças para o mapa novo', (await text()).includes('67 peças coladas'), 'aviso “Ruína do portão”');
  check('as peças coladas ficam selecionadas', (await text()).includes('67 objetos selecionados'), 'seleção ativa');
  await page.screenshot({ path: 'capturas/trechos-colado.jpg', type: 'jpeg', quality: 88 });

  // 6. O trecho continua salvo depois de recarregar.
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await waitName('Vilarejo');
  await waitObjects(67);
  check('o mapa com o trecho colado volta ao recarregar', (await headerName()) === 'Vilarejo', await headerName());
  await clickText('Meus trechos');
  await page.waitForSelector('.modal .map-card', { timeout: 10000 });
  await waitSnippetName('Ruína do portão');
  check('o trecho sobrevive ao recarregar', (await snippetName()) === 'Ruína do portão', 'nome preservado');

  // 7. Excluir o trecho.
  await clickLabel('Excluir trecho Ruína do portão');
  await waitText('Nenhum trecho salvo ainda');
  check('excluir limpa a lista', (await text()).includes('Nenhum trecho salvo ainda'), 'lista vazia');
  await clickText('Voltar ao mapa', '.modal button');
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });

  // 8. Os mapas continuam inteiros.
  await clickText('Meus mapas');
  await page.waitForSelector('.map-card', { timeout: 10000 });
  await waitCards(2);
  const maps = await page.evaluate(() => [...document.querySelectorAll('.map-card')].map(c => `${c.querySelector('.map-info strong')?.textContent}: ${c.querySelector('.map-info span')?.textContent}`));
  check('os dois mapas seguem na biblioteca', maps.length === 2, maps.join(' | '));
  check('o mapa colado guardou as peças', maps.some(m => m.startsWith('Vilarejo') && m.includes('67 peças')), maps.find(m => m.startsWith('Vilarejo')) ?? 'ausente');

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
