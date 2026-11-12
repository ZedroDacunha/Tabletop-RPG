// Verificação de navegador: renomear mapa direto no cartão de "Meus mapas".
// Roda sobre o build (`dist`), com IndexedDB limpo e SwiftShader no lugar da GPU.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const capturas = path.join(root, 'capturas');
const PORT = 4173;
// O build feito no GitHub Actions usa base "/<repositório>/"; o servidor serve nesse prefixo.
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

async function clicarTexto(page, texto) {
  const handle = await page.evaluateHandle((alvo) => {
    const botoes = [...document.querySelectorAll('button')];
    return botoes.find((b) => b.textContent.replace(/\s+/g, ' ').trim() === alvo) ?? null;
  }, texto);
  const elemento = handle.asElement();
  if (!elemento) throw new Error(`Botão "${texto}" não encontrado`);
  await elemento.click();
}

const nomesCartoes = (page) => page.$$eval('input.map-name', (itens) => itens.map((i) => i.value));

async function camposCartao(page) {
  return page.$$eval('input.map-name', (itens) =>
    itens.map((i) => ({ nome: i.value, rotulo: i.getAttribute('aria-label') })),
  );
}

async function campoDoMapa(page, nome) {
  const campos = await page.$$('input.map-name');
  for (const campo of campos) {
    const rotulo = await campo.evaluate((el) => el.getAttribute('aria-label'));
    if (rotulo === `Renomear ${nome}`) return campo;
  }
  throw new Error(`Cartão de "${nome}" não encontrado`);
}

async function digitarNoCampo(page, nome, texto) {
  const campo = await campoDoMapa(page, nome);
  await campo.click({ clickCount: 3 });
  await page.keyboard.type(texto);
  return campo;
}

async function abrirMeusMapas(page) {
  await page.click('button[aria-label="Meus mapas"]');
  await page.waitForSelector('input.map-name', { visible: true });
  await esperar(250);
}

async function criarMapa(page, nome) {
  await page.click('button[aria-label="Novo mapa"]');
  await page.waitForSelector('input[placeholder^="Ex.:"]', { visible: true });
  const campo = await page.$('input[placeholder^="Ex.:"]');
  await campo.click({ clickCount: 3 });
  await page.keyboard.type(nome);
  await clicarTexto(page, 'Criar mapa');
  await page.waitForFunction(() => !document.querySelector('input[placeholder^="Ex.:"]'), { timeout: 8000 });
  await esperar(1400); // autosave de 850 ms + folga
}

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
  page.on('requestfailed', (req) => console.log('REQUISIÇÃO FALHOU:', req.url(), req.failure()?.errorText));

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
  registrar(true, 'editor carregado com banco limpo');

  await criarMapa(page, 'Bosque');
  await criarMapa(page, 'Ruína do portão');
  await abrirMeusMapas(page);

  const iniciais = await nomesCartoes(page);
  registrar(
    iniciais.length === 2 && iniciais.includes('Bosque') && iniciais.includes('Ruína do portão'),
    'dois mapas criados pelo editor',
    iniciais.join(' | '),
  );

  const contador = await page.$eval('.map-count', (el) => el.textContent.replace(/\s+/g, ' ').trim());
  registrar(contador === '2 de 2 mapas', 'contador antes de renomear', contador);

  // 1) renomear pelo campo do cartão, com Enter confirmando
  await digitarNoCampo(page, 'Bosque', 'Bosque Norte');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => [...document.querySelectorAll('input.map-name')].some((i) => i.value === 'Bosque Norte'),
    { timeout: 8000 },
  );
  await esperar(400);
  const depoisDoEnter = await nomesCartoes(page);
  registrar(
    depoisDoEnter.includes('Bosque Norte') && !depoisDoEnter.includes('Bosque'),
    'Enter renomeia o mapa',
    depoisDoEnter.join(' | '),
  );
  const rotulos = await camposCartao(page);
  registrar(
    rotulos.some((c) => c.rotulo === 'Renomear Bosque Norte'),
    'o nome acessível do campo acompanha o novo nome',
    rotulos.map((c) => c.rotulo).join(' | '),
  );
  registrar(
    (await page.$$('input.map-name')).length === 2,
    'renomear não cria nem apaga cartão',
    String((await page.$$('input.map-name')).length),
  );

  // 2) Esc cancela a edição
  await digitarNoCampo(page, 'Bosque Norte', 'tentativa');
  await page.keyboard.press('Escape');
  await esperar(300);
  const aposEscape = await page.$eval('input[aria-label="Renomear Bosque Norte"]', (el) => el.value);
  registrar(aposEscape === 'Bosque Norte', 'Esc descarta a edição', aposEscape);

  // 3) nome vazio mantém o nome anterior
  const campoSelado = await campoDoMapa(page, 'Bosque Norte');
  await campoSelado.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Enter');
  await esperar(700);
  const aposVazio = await page.$eval('input[aria-label="Renomear Bosque Norte"]', (el) => el.value).catch(
    () => 'campo sumiu',
  );
  registrar(aposVazio === 'Bosque Norte', 'nome vazio volta ao valor anterior', aposVazio);

  await page.screenshot({ path: path.join(capturas, 'meus-mapas-renomeado.jpg'), type: 'jpeg', quality: 80 });
  registrar(true, 'captura da biblioteca com o mapa renomeado');

  // 4) o nome persiste depois de recarregar
  await clicarTexto(page, 'Voltar ao mapa');
  await esperar(600);
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('button[aria-label="Novo mapa"]', { visible: true });
  await abrirMeusMapas(page);
  const aposRecarregar = await nomesCartoes(page);
  registrar(
    aposRecarregar.includes('Bosque Norte'),
    'o nome renomeado sobrevive ao recarregar',
    aposRecarregar.join(' | '),
  );

  // 5) abrir o mapa renomeado mostra o nome no cabeçalho
  await page.click('button[aria-label="Abrir Bosque Norte"]').catch(async () => {
    throw new Error('botão Abrir do mapa renomeado não encontrado');
  });
  await page.waitForFunction(
    () => document.querySelector('input[aria-label="Nome do mapa"]')?.value === 'Bosque Norte',
    { timeout: 10000 },
  );
  const titulo = await page.$eval('input[aria-label="Nome do mapa"]', (el) => el.value);
  registrar(titulo === 'Bosque Norte', 'cabeçalho mostra o nome renomeado', titulo);
  await page.screenshot({ path: path.join(capturas, 'cabecalho-renomeado.jpg'), type: 'jpeg', quality: 80 });
  registrar(true, 'captura do cabeçalho com o novo título');

  // 6) renomear o mapa aberto atualiza o cabeçalho na hora
  await abrirMeusMapas(page);
  await digitarNoCampo(page, 'Bosque Norte', 'Bosque do Norte');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => [...document.querySelectorAll('input.map-name')].some((i) => i.value === 'Bosque do Norte'),
    { timeout: 8000 },
  );
  await clicarTexto(page, 'Voltar ao mapa');
  await esperar(500);
  const tituloAtualizado = await page.$eval('input[aria-label="Nome do mapa"]', (el) => el.value);
  registrar(
    tituloAtualizado === 'Bosque do Norte',
    'renomear o mapa aberto troca o título do topo',
    tituloAtualizado,
  );
  await page.screenshot({ path: path.join(capturas, 'cabecalho-atualizado.jpg'), type: 'jpeg', quality: 80 });

  // 7) renomear conversa com a busca
  await abrirMeusMapas(page);
  await page.type('input[aria-label="Buscar mapas"]', 'ruina');
  await esperar(350);
  const filtrados = await nomesCartoes(page);
  registrar(
    filtrados.length === 1 && filtrados[0] === 'Ruína do portão',
    'a busca continua funcionando depois de renomear',
    filtrados.join(' | '),
  );
  const contadorFiltrado = await page.$eval('.map-count', (el) => el.textContent.replace(/\s+/g, ' ').trim());
  registrar(contadorFiltrado === '1 de 2 mapas', 'contador da busca', contadorFiltrado);

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
      fs.writeFileSync(path.join(capturas, 'falha-url.txt'), atual.url());
      console.log('URL NA FALHA:', atual.url());
    }
  } catch (falha) {
    console.log('não foi possível capturar a falha:', String(falha));
  }
} finally {
  await browser.close();
  servidor.close();
}

const falhas = resultados.filter((r) => !r.ok);
const aprovados = resultados.length - falhas.length;
const relatorio = [
  'Renomear mapa direto no cartão — verificação de navegador',
  `Data: ${new Date().toISOString()}`,
  '',
  ...resultados.map((r, i) => `${r.ok ? 'PASS' : 'FAIL'} ${i + 1}. ${r.titulo}${r.detalhe ? ` — ${r.detalhe}` : ''}`),
  '',
  `Total: ${resultados.length} checagens, ${aprovados} aprovadas, ${falhas.length} falhas.`,
].join('\n');
fs.mkdirSync(capturas, { recursive: true });
fs.writeFileSync(path.join(capturas, 'relatorio.txt'), relatorio);
console.log(relatorio);
process.exit(falhas.length ? 1 : 0);
