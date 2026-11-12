// Verificação de navegador: barra compacta com menu "Mais ações" em telas estreitas.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const capturas = path.join(root, 'capturas');
const PORT = 4173;
const PREFIXO = process.env.BASE_PATH ?? '/Tabletop-RPG';
const BASE = `http://127.0.0.1:${PORT}${PREFIXO}/`;

const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

const servidor = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (url === PREFIXO) url = '/';
  if (url.startsWith(`${PREFIXO}/`)) url = url.slice(PREFIXO.length);
  const relativo = url === '/' || url === '' ? 'index.html' : url.replace(/^\/+/, '');
  let arquivo = path.join(dist, relativo);
  if (!arquivo.startsWith(dist) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) arquivo = path.join(dist, 'index.html');
  res.writeHead(200, { 'content-type': tipos[path.extname(arquivo)] ?? 'application/octet-stream' });
  fs.createReadStream(arquivo).pipe(res);
});

const resultados = [];
const registrar = (ok, titulo, detalhe = '') => {
  resultados.push({ ok, titulo, detalhe });
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${titulo}${detalhe ? ` (${detalhe})` : ''}`);
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const grupos = (page) => page.$$eval('[role="group"][aria-label]', (itens) => itens.map((g) => g.getAttribute('aria-label')));

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--enable-webgl', '--window-size=1440,920'],
  defaultViewport: { width: 600, height: 860 },
});

try {
  fs.mkdirSync(capturas, { recursive: true });
  await new Promise((r) => servidor.listen(PORT, '127.0.0.1', r));
  registrar(true, 'servidor estático no ar', BASE);

  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', (e) => { erros.push(String(e)); console.log('ERRO:', e); });
  page.on('console', (m) => { if (m.type() === 'error') { erros.push(m.text()); console.log('CONSOLE:', m.text()); } });

  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('tabletop-rpg'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('button[aria-label="Novo mapa"]', { visible: true, timeout: 20000 });
  await esperar(1200);
  registrar(true, 'editor carregado com banco limpo em 600 px');

  // 1) no compacto só o grupo Ferramentas fica na barra
  const compactos = await grupos(page);
  registrar(
    JSON.stringify(compactos) === JSON.stringify(['Ferramentas']),
    'em 600 px sobra só o grupo Ferramentas',
    compactos.join(' | '),
  );
  registrar(
    (await page.$('button[aria-label="Mais ações"]')) !== null,
    'botão "Mais ações" aparece em 600 px',
  );
  const expansaoInicial = await page.$eval('button[aria-label="Mais ações"]', (b) => ({
    haspopup: b.getAttribute('aria-haspopup'),
    expandido: b.getAttribute('aria-expanded'),
  }));
  registrar(
    expansaoInicial.haspopup === 'menu' && expansaoInicial.expandido === 'false',
    'botão anuncia menu fechado',
    JSON.stringify(expansaoInicial),
  );

  // 2) abre o menu com as ações que saíram da barra
  await page.click('button[aria-label="Mais ações"]');
  await page.waitForSelector('[role="menu"][aria-label="Mais ações"]', { visible: true });
  const itens = await page.$$eval('[role="menu"][aria-label="Mais ações"] button', (bs) =>
    bs.map((b) => `${b.getAttribute('role')}:${b.querySelector('span')?.textContent ?? ''}`),
  );
  registrar(
    itens.length === 9 && itens[0] === 'menuitem:Desfazer',
    'menu agrupa as ações que saíram da barra',
    itens.join(' | '),
  );
  registrar(
    (await page.$eval('button[aria-label="Mais ações"]', (b) => b.getAttribute('aria-expanded'))) === 'true',
    'botão anuncia menu aberto',
  );

  const desabilitados = await page.$$eval('[role="menu"][aria-label="Mais ações"] button', (bs) =>
    bs.slice(0, 2).map((b) => b.disabled),
  );
  registrar(desabilitados.every(Boolean), 'desfazer e refazer começam desabilitados no menu', JSON.stringify(desabilitados));

  // 3) alternar a grade pelo menu muda o estado e habilita o desfazer
  const estadoGrade = () => page.evaluate(() => document.querySelector('[role="menuitemcheckbox"]')?.getAttribute('aria-checked'));
  const antesGrade = await estadoGrade();
  await page.evaluate(() => [...document.querySelectorAll('[role="menu"][aria-label="Mais ações"] button')].find((b) => b.textContent.includes('Grade'))?.click());
  await esperar(350);
  const depoisGrade = await estadoGrade();
  const desfazerHabilitado = await page.evaluate(() => !document.querySelector('[role="menu"][aria-label="Mais ações"] button')?.disabled);
  registrar(antesGrade === 'true' && depoisGrade === 'false', 'grade desliga pelo menu', `${antesGrade} → ${depoisGrade}`);
  registrar(desfazerHabilitado, 'ação pelo menu habilita o desfazer no próprio menu');

  // 4) desfazer pelo menu fecha e restaura
  await page.evaluate(() => [...document.querySelectorAll('[role="menu"][aria-label="Mais ações"] button')].find((b) => b.textContent.includes('Desfazer'))?.click());
  await esperar(500);
  const menuFechou = (await page.$('[role="menu"][aria-label="Mais ações"]')) === null;
  registrar(menuFechou, 'desfazer fecha o menu depois de agir');
  await page.click('button[aria-label="Mais ações"]');
  await page.waitForSelector('[role="menu"][aria-label="Mais ações"]', { visible: true });
  const gradeVoltou = await estadoGrade();
  registrar(gradeVoltou === 'true', 'desfazer pelo menu restaura a grade', String(gradeVoltou));

  await page.screenshot({ path: path.join(capturas, 'barra-compacta.jpg'), type: 'jpeg', quality: 84 });
  registrar(true, 'captura do menu aberto em 600 px');

  // 5) Esc e clique fora fecham
  await page.keyboard.press('Escape');
  await esperar(300);
  registrar((await page.$('[role="menu"][aria-label="Mais ações"]')) === null, 'Esc fecha o menu');
  await page.click('button[aria-label="Mais ações"]');
  await page.waitForSelector('[role="menu"][aria-label="Mais ações"]', { visible: true });
  await page.mouse.click(420, 700);
  await esperar(300);
  registrar((await page.$('[role="menu"][aria-label="Mais ações"]')) === null, 'clique fora fecha o menu');

  // 6) sem estouro horizontal
  const estouro = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, largura: window.innerWidth }));
  registrar(estouro.scroll <= estouro.largura + 1, 'sem estouro horizontal em 600 px', JSON.stringify(estouro));

  // 7) em tela larga os cinco grupos voltam e o botão desaparece
  await page.setViewport({ width: 1440, height: 920 });
  await esperar(700);
  const largos = await grupos(page);
  registrar(
    JSON.stringify(largos) === JSON.stringify(['Ferramentas', 'Histórico', 'Câmera', 'Visualização', 'Saída']),
    'em 1440 px voltam os cinco grupos',
    largos.join(' | '),
  );
  registrar((await page.$('button[aria-label="Mais ações"]')) === null, 'botão "Mais ações" some em tela larga');
  await page.screenshot({ path: path.join(capturas, 'barra-compacta-larga.jpg'), type: 'jpeg', quality: 82 });
  registrar(true, 'captura em 1440 px para comparar');

  const semErro = erros.filter((e) => !/Download the React DevTools|WebGL|SwiftShader|GroupMarkerNotSet/i.test(e));
  registrar(semErro.length === 0, 'nenhum erro de página no console', semErro.slice(0, 3).join(' // '));
} catch (erro) {
  registrar(false, 'execução interrompida', String(erro));
  try {
    const paginas = await browser.pages();
    const atual = paginas[paginas.length - 1];
    if (atual) {
      await atual.screenshot({ path: path.join(capturas, 'falha.jpg'), type: 'jpeg', quality: 80 });
      fs.writeFileSync(path.join(capturas, 'falha.html'), await atual.content());
    }
  } catch (falha) { console.log('captura da falha:', String(falha)); }
} finally {
  await browser.close();
  servidor.close();
}

const falhas = resultados.filter((r) => !r.ok);
const relatorio = [
  'Barra compacta em telas estreitas — verificação de navegador',
  `Data: ${new Date().toISOString()}`,
  '',
  ...resultados.map((r, i) => `${r.ok ? 'PASS' : 'FAIL'} ${i + 1}. ${r.titulo}${r.detalhe ? ` — ${r.detalhe}` : ''}`),
  '',
  `Total: ${resultados.length} checagens, ${resultados.length - falhas.length} aprovadas, ${falhas.length} falhas.`,
].join('\n');
fs.mkdirSync(capturas, { recursive: true });
fs.writeFileSync(path.join(capturas, 'relatorio.txt'), relatorio);
console.log(relatorio);
process.exit(falhas.length ? 1 : 0);
