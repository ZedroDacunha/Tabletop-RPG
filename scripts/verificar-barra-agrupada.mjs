// Verificação de navegador: barra de ferramentas do viewport agrupada por função.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const capturas = path.join(root, 'capturas');
const PORT = 4173;
// O build do GitHub Actions usa base "/<repositório>/".
const PREFIXO = process.env.BASE_PATH ?? '/Tabletop-RPG';
const BASE = `http://127.0.0.1:${PORT}${PREFIXO}/`;

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
};

const servidor = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (url === PREFIXO) url = '/';
  if (url.startsWith(`${PREFIXO}/`)) url = url.slice(PREFIXO.length);
  const relativo = url === '/' || url === '' ? 'index.html' : url.replace(/^\/+/, '');
  let arquivo = path.join(dist, relativo);
  if (!arquivo.startsWith(dist) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
    arquivo = path.join(dist, 'index.html');
  }
  res.writeHead(200, { 'content-type': tipos[path.extname(arquivo)] ?? 'application/octet-stream' });
  fs.createReadStream(arquivo).pipe(res);
});

const resultados = [];
const registrar = (ok, titulo, detalhe = '') => {
  resultados.push({ ok, titulo, detalhe });
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${titulo}${detalhe ? ` (${detalhe})` : ''}`);
};
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const grupos = (page) =>
  page.$$eval('[role="group"][aria-label]', (itens) =>
    itens.map((g) => ({
      nome: g.getAttribute('aria-label'),
      botoes: g.querySelectorAll('button').length,
    })),
  );

const caixas = (page) =>
  page.$$eval('[role="group"][aria-label]', (itens) =>
    itens.map((g) => {
      const r = g.getBoundingClientRect();
      return { nome: g.getAttribute('aria-label'), x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--window-size=1440,920',
  ],
  defaultViewport: { width: 1440, height: 920 },
});

try {
  fs.mkdirSync(capturas, { recursive: true });
  await new Promise((resolve) => servidor.listen(PORT, '127.0.0.1', resolve));
  registrar(true, 'servidor estático no ar', BASE);

  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', (erro) => {
    erros.push(String(erro));
    console.log('ERRO DE PÁGINA:', String(erro));
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      erros.push(msg.text());
      console.log('CONSOLE:', msg.text());
    }
  });

  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const pedido = indexedDB.deleteDatabase('tabletop-rpg');
        pedido.onsuccess = pedido.onerror = pedido.onblocked = () => resolve();
      }),
  );
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('button[aria-label="Novo mapa"]', { visible: true, timeout: 20000 });
  await esperar(1200);
  registrar(true, 'editor carregado com banco limpo');

  // 1) os cinco grupos existem, na ordem das funções
  const lista = await grupos(page);
  const nomes = lista.map((g) => g.nome);
  registrar(
    JSON.stringify(nomes) === JSON.stringify(['Ferramentas', 'Histórico', 'Câmera', 'Visualização', 'Saída']),
    'barra dividida em cinco grupos por função',
    nomes.join(' | '),
  );
  const esperado = { Ferramentas: 4, Histórico: 2, Câmera: 2, Visualização: 3, Saída: 2 };
  const contagens = lista.map((g) => `${g.nome}:${g.botoes}`).join(' ');
  registrar(
    lista.every((g) => g.botoes === esperado[g.nome]),
    'cada grupo tem os botões da sua função',
    contagens,
  );

  // 2) todo botão da barra tem nome acessível
  const semNome = await page.$$eval('[role="group"][aria-label] button', (itens) =>
    itens
      .map((b) => ({
        nome: (b.getAttribute('aria-label') ?? b.textContent ?? '').trim(),
        title: b.getAttribute('title'),
      }))
      .filter((b) => !b.nome),
  );
  registrar(semNome.length === 0, 'nenhum botão sem nome acessível', `${semNome.length} sem nome`);

  // 3) as ferramentas continuam funcionando: "Mover (2)" fica ativa
  await page.click('button[aria-label="Mover (2)"]');
  await esperar(200);
  const ativa = await page.$eval(
    '[role="group"][aria-label="Ferramentas"] .icon-button.active',
    (b) => b.getAttribute('aria-label'),
  );
  registrar(ativa === 'Mover (2)', 'clique na ferramenta ativa o botão do grupo', String(ativa));

  // 4) câmera: alternância de verdade, com estado anunciado (sem seta de menu)
  const antes = await page.$eval('.view-toggle', (b) => ({
    texto: b.textContent.trim(),
    pressionado: b.getAttribute('aria-pressed'),
    setas: b.querySelectorAll('svg').length,
  }));
  registrar(
    antes.texto === 'Perspectiva' && antes.pressionado === 'false' && antes.setas === 1,
    'alternância de câmera começa em perspectiva, sem seta falsa de menu',
    JSON.stringify(antes),
  );
  await page.click('.view-toggle');
  await esperar(600);
  const depois = await page.$eval('.view-toggle', (b) => ({
    texto: b.textContent.trim(),
    pressionado: b.getAttribute('aria-pressed'),
  }));
  registrar(
    depois.texto === 'Vista superior' && depois.pressionado === 'true',
    'clicar alterna para vista superior e anuncia o estado',
    JSON.stringify(depois),
  );
  await page.click('.view-toggle');
  await esperar(400);

  // 5) histórico: desfazer/refazer conversam com uma ação do grupo Visualização
  const estadoHistorico = () =>
    page.evaluate(() => ({
      desfazer: document.querySelector('button[aria-label="Desfazer (Ctrl+Z)"]')?.disabled,
      refazer: document.querySelector('button[aria-label="Refazer (Ctrl+Shift+Z)"]')?.disabled,
    }));
  const inicial = await estadoHistorico();
  registrar(
    inicial.desfazer === true && inicial.refazer === true,
    'desfazer e refazer começam desabilitados',
    JSON.stringify(inicial),
  );

  const grade = () => page.$eval('button[aria-label="Alternar grade (G)"]', (b) => b.getAttribute('aria-pressed'));
  const gradeAntes = await grade();
  await page.click('button[aria-label="Alternar grade (G)"]');
  await page.waitForFunction(
    () => !document.querySelector('button[aria-label="Desfazer (Ctrl+Z)"]')?.disabled,
    { timeout: 8000 },
  );
  const gradeDepois = await grade();
  registrar(
    gradeAntes === 'true' && gradeDepois === 'false' && (await estadoHistorico()).desfazer === false,
    'ação no grupo Visualização habilita o desfazer',
    `grade ${gradeAntes} → ${gradeDepois}`,
  );

  await page.click('button[aria-label="Desfazer (Ctrl+Z)"]');
  await page.waitForFunction(
    () => document.querySelector('button[aria-label="Alternar grade (G)"]')?.getAttribute('aria-pressed') === 'true',
    { timeout: 8000 },
  );
  const depoisDesfazer = await estadoHistorico();
  registrar(
    (await grade()) === 'true' && depoisDesfazer.refazer === false,
    'desfazer restaura a grade e habilita o refazer',
    `refazer desabilitado: ${depoisDesfazer.refazer}`,
  );

  // cena de exemplo só para as capturas
  await page.evaluate(() => {
    const botao = [...document.querySelectorAll('button')].find((b) =>
      b.textContent.replace(/\s+/g, ' ').includes('Explorar mapa de exemplo'),
    );
    botao?.click();
  });
  await esperar(3000);

  // 6) os grupos não se sobrepõem e ficam dentro do viewport
  const medidas = await caixas(page);
  const colide = (a, b) => {
    const sobreX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const sobreY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return sobreX > 2 && sobreY > 2;
  };
  let sobrepostos = [];
  for (let i = 0; i < medidas.length; i += 1)
    for (let j = i + 1; j < medidas.length; j += 1)
      if (colide(medidas[i], medidas[j])) sobrepostos.push(`${medidas[i].nome}×${medidas[j].nome}`);
  registrar(sobrepostos.length === 0, 'grupos não se sobrepõem', sobrepostos.join(' '));

  const viewport = await page.$eval('.viewport-wrap', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const fora = medidas.filter(
    (m) =>
      m.x < viewport.x - 1 ||
      m.y < viewport.y - 1 ||
      m.x + m.w > viewport.x + viewport.w + 1 ||
      m.y + m.h > viewport.y + viewport.h + 1,
  );
  registrar(fora.length === 0, 'todos os grupos cabem no viewport', fora.map((f) => f.nome).join(' '));

  await page.screenshot({ path: path.join(capturas, 'barra-agrupada.jpg'), type: 'jpeg', quality: 82 });
  registrar(true, 'captura da barra agrupada em 1440 px');

  // 7) em tela estreita continua sem estouro
  await page.setViewport({ width: 1024, height: 800 });
  await esperar(900);
  const estouro = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    largura: window.innerWidth,
  }));
  registrar(estouro.scroll <= estouro.largura + 1, 'sem estouro horizontal em 1024 px', JSON.stringify(estouro));
  const gruposEstreitos = await caixas(page);
  const foraEstreito = gruposEstreitos.filter(
    (m) => m.x < -1 || m.x + m.w > 1024 + 1,
  );
  registrar(
    foraEstreito.length === 0,
    'grupos continuam dentro da tela em 1024 px',
    gruposEstreitos.map((g) => `${g.nome}:${Math.round(g.w)}px`).join(' '),
  );
  await page.screenshot({ path: path.join(capturas, 'barra-agrupada-estreita.jpg'), type: 'jpeg', quality: 82 });
  registrar(true, 'captura da barra agrupada em 1024 px');

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
  } catch (falha) {
    console.log('não foi possível capturar a falha:', String(falha));
  }
} finally {
  await browser.close();
  servidor.close();
}

const falhas = resultados.filter((r) => !r.ok);
const relatorio = [
  'Barra de ferramentas agrupada — verificação de navegador',
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
