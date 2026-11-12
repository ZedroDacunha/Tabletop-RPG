// Verificação de navegador: filtro por período em "Meus mapas".
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

async function clicarTexto(page, texto) {
  const handle = await page.evaluateHandle((alvo) => [...document.querySelectorAll('button')].find((b) => b.textContent.replace(/\s+/g, ' ').trim() === alvo) ?? null, texto);
  const el = handle.asElement();
  if (!el) throw new Error(`Botão "${texto}" não encontrado`);
  await el.click();
}

async function criarMapa(page, nome, tamanho) {
  await page.click('button[aria-label="Novo mapa"]');
  await page.waitForSelector('input[placeholder^="Ex.:"]', { visible: true });
  const campo = await page.$('input[placeholder^="Ex.:"]');
  await campo.click();
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(nome);
  const selects = await page.$$('.modal select');
  if (selects[0]) await selects[0].select(String(tamanho));
  await clicarTexto(page, 'Criar mapa');
  await page.waitForFunction(() => !document.querySelector('input[placeholder^="Ex.:"]'), { timeout: 8000 });
  await esperar(1400);
}

async function abrirMapas(page) {
  await page.click('button[aria-label="Meus mapas"]');
  await page.waitForSelector('select[aria-label="Período dos mapas"]', { visible: true });
  await esperar(250);
}

const nomes = (page) => page.$$eval('input.map-name', (itens) => itens.map((i) => i.value));
const contador = (page) => page.$eval('.map-count', (el) => el.textContent.replace(/\s+/g, ' ').trim());

async function escolherPeriodo(page, valor) {
  await page.select('select[aria-label="Período dos mapas"]', valor);
  await esperar(300);
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--enable-webgl', '--window-size=1440,920'],
  defaultViewport: { width: 1440, height: 920 },
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
  registrar(true, 'editor carregado com banco limpo');

  await criarMapa(page, 'Bosque', 20);
  await criarMapa(page, 'Ruína do portão', 50);
  await criarMapa(page, 'Acampamento', 30);

  // envelhece dois mapas direto no IndexedDB
  const envelheceu = await page.evaluate(async () => {
    const dia = 24 * 60 * 60 * 1000;
    const agora = Date.now();
    const quando = { 'Ruína do portão': agora - 10 * dia, 'Acampamento': agora - 45 * dia };
    const abrir = () => new Promise((resolve, reject) => { const r = indexedDB.open('tabletop-rpg'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const lerTudo = (db, loja) => new Promise((resolve, reject) => { const r = db.transaction(loja, 'readonly').objectStore(loja).getAll(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const db = await abrir();
    const resumos = await lerTudo(db, 'index');
    const projetos = new Map((await lerTudo(db, 'projects')).map((p) => [p.id, p]));
    const alvos = resumos.filter((r) => quando[r.name]);
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['projects', 'index'], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      for (const resumo of alvos) {
        const iso = new Date(quando[resumo.name]).toISOString();
        tx.objectStore('index').put({ ...resumo, updatedAt: iso }, resumo.id);
        const completo = projetos.get(resumo.id);
        if (completo) tx.objectStore('projects').put({ ...completo, updatedAt: iso }, completo.id);
      }
    });
    db.close();
    return alvos.length;
  });
  registrar(envelheceu === 2, 'dois mapas envelhecidos no banco (10 e 45 dias)', String(envelheceu));

  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('button[aria-label="Novo mapa"]', { visible: true });
  await abrirMapas(page);

  // filtro padrão
  const todos = await nomes(page);
  registrar(todos.length === 3, 'período "Qualquer data" mostra os três mapas', todos.join(' | '));
  registrar((await contador(page)) === '3 de 3 mapas', 'contador sem filtro', await contador(page));

  const opcoes = await page.$$eval('select[aria-label="Período dos mapas"] option', (os) => os.map((o) => `${o.value}:${o.textContent}`));
  registrar(
    JSON.stringify(opcoes) === JSON.stringify(['todos:Qualquer data', '7:Últimos 7 dias', '30:Últimos 30 dias']),
    'select de período com as três opções',
    opcoes.join(' | '),
  );

  await escolherPeriodo(page, '7');
  const sete = await nomes(page);
  registrar(sete.length === 1 && sete[0] === 'Bosque', 'últimos 7 dias mostra só o mapa recente', sete.join(' | '));
  registrar((await contador(page)) === '1 de 3 mapas', 'contador com 7 dias', await contador(page));

  await escolherPeriodo(page, '30');
  const trinta = await nomes(page);
  registrar(
    trinta.length === 2 && trinta.includes('Bosque') && trinta.includes('Ruína do portão'),
    'últimos 30 dias inclui o de 10 dias e deixa de fora o de 45',
    trinta.join(' | '),
  );

  // combina com a busca
  await page.type('input[aria-label="Buscar mapas"]', 'ruina');
  await esperar(350);
  const busca = await nomes(page);
  registrar(busca.length === 1 && busca[0] === 'Ruína do portão', 'período + busca combinam', busca.join(' | '));
  registrar((await contador(page)) === '1 de 3 mapas', 'contador com período + busca', await contador(page));

  // busca sem resultado com período ativo
  await page.click('button[aria-label="Limpar busca de mapas"]');
  await esperar(250);
  await page.type('input[aria-label="Buscar mapas"]', 'acamp');
  await esperar(350);
  const vazio = await page.$eval('.muted-note', (el) => el.textContent.trim());
  registrar(
    vazio.startsWith('Nenhum mapa com esses filtros'),
    'mensagem de vazio fala de filtros',
    vazio.slice(0, 60),
  );

  // ordenação continua funcionando com o período ligado
  await page.click('button[aria-label="Limpar busca de mapas"]');
  await esperar(250);
  await page.select('select[aria-label="Ordenar mapas"]', 'tamanho');
  await esperar(300);
  const porTamanho = await nomes(page);
  registrar(
    JSON.stringify(porTamanho) === JSON.stringify(['Ruína do portão', 'Bosque']),
    'período ligado mantém a ordenação por tamanho',
    porTamanho.join(' | '),
  );

  await escolherPeriodo(page, 'todos');
  await page.screenshot({ path: path.join(capturas, 'filtro-periodo.jpg'), type: 'jpeg', quality: 82 });
  registrar(true, 'captura da biblioteca com o filtro de período');

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
  'Filtro por período em Meus mapas — verificação de navegador',
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
