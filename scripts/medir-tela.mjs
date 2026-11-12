// Mede a poluição visual da tela de edição: quantos controles flutuam sobre a cena e quanto cobrem.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const capturas = path.join(root, 'capturas');
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}/Tabletop-RPG/`;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

const servidor = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/Tabletop-RPG/, '');
  const relativo = url === '/' || url === '' ? 'index.html' : url.replace(/^\/+/, '');
  let arquivo = path.join(dist, relativo);
  if (!arquivo.startsWith(dist) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) arquivo = path.join(dist, 'index.html');
  res.writeHead(200, { 'content-type': tipos[path.extname(arquivo)] ?? 'application/octet-stream' });
  fs.createReadStream(arquivo).pipe(res);
});

const saida = [];
const medir = (page) => page.evaluate(() => {
  const wrap = document.querySelector('.viewport-wrap');
  const r = wrap.getBoundingClientRect();
  const overlays = [...wrap.querySelectorAll(':scope > div, :scope > .view-controls, :scope > .viewport-top-controls, :scope > .viewport-bottom-left, :scope > .viewport-bottom-right')]
    .filter((el) => getComputedStyle(el).position === 'absolute' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0)
    .map((el) => {
      const b = el.getBoundingClientRect();
      return { classe: el.className, botoes: el.querySelectorAll('button').length, area: Math.round((b.width * b.height) / 100) / 100 };
    });
  const botoesCanvas = wrap.querySelectorAll('button').length;
  const botoesTopo = document.querySelectorAll('.topbar button').length;
  return {
    canvas: { largura: Math.round(r.width), altura: Math.round(r.height) },
    sobreposicoes: overlays,
    botoesNoCanvas: botoesCanvas,
    botoesNoTopo: botoesTopo,
    areaCanvas: Math.round(r.width * r.height),
    areaSobreposta: Math.round(overlays.reduce((s, o) => s + o.area, 0) * 100),
  };
});

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--window-size=1440,920'],
  defaultViewport: { width: 1440, height: 900 },
});

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  fs.mkdirSync(capturas, { recursive: true });
  await new Promise((r) => servidor.listen(PORT, '127.0.0.1', r));
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('ERRO:', String(e)));
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('tabletop-rpg'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.empty-world button', { visible: true, timeout: 25000 });
  await esperar(800);

  // carrega o cenário de exemplo para ter conteúdo na cena
  await page.evaluate(() => [...document.querySelectorAll('.empty-world button')].find((b) => b.textContent.includes('exemplo'))?.click());
  await page.waitForSelector('.modal-heading h2', { visible: true });
  await page.evaluate(() => [...document.querySelectorAll('.modal-actions button')].find((b) => /Abrir|Exemplo|Cenário/i.test(b.textContent))?.click());
  await esperar(3000);
  await page.evaluate(() => document.querySelector('.scene-select')?.click());
  await esperar(1200);

  for (const [nome, largura, altura] of [['1440', 1440, 900], ['1180', 1180, 820], ['600', 600, 860]]) {
    await page.setViewport({ width: largura, height: altura });
    await esperar(900);
    const dados = await medir(page);
    saida.push(`--- ${largura}×${altura} ---`, JSON.stringify(dados, null, 1));
    await page.screenshot({ path: path.join(capturas, `tela-antes-${nome}.jpg`), type: 'jpeg', quality: 84 });
  }
} catch (e) {
  saida.push('FALHA: ' + String(e));
  console.log('falha', String(e));
} finally {
  await browser.close();
  servidor.close();
}

fs.mkdirSync(capturas, { recursive: true });
fs.writeFileSync(path.join(capturas, 'relatorio.txt'), saida.join('\n'));
console.log(saida.join('\n'));
