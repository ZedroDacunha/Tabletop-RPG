// Verificação de navegador: cabeçalho único da biblioteca com contadores e busca fixa.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const capturas = path.join(root, 'capturas');
const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}/Tabletop-RPG/`;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

const servidor = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/Tabletop-RPG/, '');
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

const abas = (page) =>
  page.$$eval('.library-tabs [role="tab"]', (bs) =>
    bs.map((b) => ({ nome: b.textContent.replace(/\s+/g, ' ').trim(), selecionada: b.getAttribute('aria-selected') })),
  );

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--enable-webgl', '--window-size=1440,920'],
  defaultViewport: { width: 1440, height: 900 },
});

try {
  fs.mkdirSync(capturas, { recursive: true });
  await new Promise((r) => servidor.listen(PORT, '127.0.0.1', r));
  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', (e) => { erros.push(String(e)); console.log('ERRO:', e); });
  page.on('console', (m) => { if (m.type() === 'error') { erros.push(m.text()); console.log('CONSOLE:', m.text()); } });

  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('tabletop-rpg'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.empty-world button', { visible: true, timeout: 25000 });
  await esperar(700);
  await page.evaluate(() => [...document.querySelectorAll('.empty-world button')].find((b) => b.textContent.includes('exemplo'))?.click());
  await esperar(4500);
  registrar(true, 'editor carregado com o cenário de exemplo');

  // 1) cabeçalho único
  const cabeca = await page.evaluate(() => {
    const head = document.querySelector('.library-head');
    const tabs = document.querySelector('.library-tabs');
    const busca = document.querySelector('.search-field');
    return {
      existe: Boolean(head),
      tabsDentro: Boolean(tabs && head.contains(tabs)),
      buscaDentro: Boolean(busca && head.contains(busca)),
      intro: document.querySelectorAll('.library-intro').length,
      altura: head ? Math.round(head.getBoundingClientRect().height) : -1,
    };
  });
  registrar(cabeca.existe && cabeca.tabsDentro && cabeca.buscaDentro, 'abas e busca vivem num cabeçalho único', JSON.stringify(cabeca));
  registrar(cabeca.intro === 0, 'a chamada de marketing saiu da biblioteca', String(cabeca.intro));

  // 2) contadores nas três abas
  const lista = await abas(page);
  const numeros = lista.map((a) => Number((a.nome.match(/(\d+)$/) ?? [])[1]));
  const contagem = await page.evaluate(() => ({
    objetos: Number((document.querySelector('.statusbar')?.textContent ?? '').match(/(\d+) objetos/)?.[1] ?? -1),
    cenas: Number((document.querySelector('.library-scroll .collection-label span:last-child')?.textContent ?? '').replace(/\D/g, '')),
    pecas: Number(document.querySelector('.asset-filters option')?.textContent?.replace(/.*·\s*/, '') ?? -1),
  }));
  registrar(
    lista.length === 3 && lista[0].nome.startsWith('Biblioteca') && numeros[0] === contagem.pecas,
    'aba Biblioteca mostra a contagem de peças',
    `${lista[0]?.nome} / select ${contagem.pecas}`,
  );
  registrar(lista[1].nome.startsWith('Cena') && numeros[1] === contagem.objetos, 'aba Cena mostra a contagem de objetos', `${lista[1]?.nome} / rodapé ${contagem.objetos}`);
  registrar(lista[2].nome.startsWith('Cenários') && numeros[2] > 0, 'aba Cenários mostra a contagem de cenas', String(lista[2]?.nome));
  registrar(lista[0].selecionada === 'true', 'a aba ativa anuncia aria-selected=true', JSON.stringify(lista.map((a) => a.selecionada)));

  // 3) busca fixa: rolar a lista não move cabeçalho
  const antes = await page.evaluate(() => {
    const r = (s) => { const el = document.querySelector(s); const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; };
    return { tabs: r('.library-tabs'), busca: r('.search-field'), filtros: r('.asset-filters') };
  });
  await page.evaluate(() => { const s = document.querySelector('.library-scroll'); s.scrollTop = s.scrollHeight; });
  await esperar(500);
  const depois = await page.evaluate(() => {
    const s = document.querySelector('.library-scroll');
    const r = (sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; };
    return { rolou: s.scrollTop > 40, tabs: r('.library-tabs'), busca: r('.search-field'), filtros: r('.asset-filters') };
  });
  registrar(
    depois.rolou &&
      JSON.stringify(antes.tabs) === JSON.stringify(depois.tabs) &&
      JSON.stringify(antes.busca) === JSON.stringify(depois.busca) &&
      JSON.stringify(antes.filtros) === JSON.stringify(depois.filtros),
    'rolar o acervo não move abas, busca nem filtros',
    `scrollTop ${depois.rolou ? '>' : '='} 40`,
  );
  await page.evaluate(() => { const s = document.querySelector('.library-scroll'); s.scrollTop = 0; });
  await page.screenshot({ path: path.join(capturas, 'biblioteca-acervo.jpg'), type: 'jpeg', quality: 84 });
  registrar(true, 'captura da aba Biblioteca');

  // 4) aba Cenários: mesma busca, outro conteúdo
  await page.evaluate(() => [...document.querySelectorAll('.library-tabs [role="tab"]')].find((b) => b.textContent.includes('Cenários'))?.click());
  await esperar(700);
  const cenarios = await page.evaluate(() => ({
    cards: document.querySelectorAll('.preset-card').length,
    placeholder: document.querySelector('.search-field input')?.getAttribute('placeholder'),
    filtros: document.querySelectorAll('.asset-filters').length,
    selecionada: document.querySelector('.library-tabs [aria-selected="true"]')?.textContent?.trim(),
  }));
  registrar(
    cenarios.cards > 0 && cenarios.placeholder === 'Buscar cenários…' && cenarios.filtros === 0 && cenarios.selecionada?.startsWith('Cenários'),
    'aba Cenários troca conteúdo, busca e esconde os filtros de peças',
    JSON.stringify(cenarios),
  );
  await page.screenshot({ path: path.join(capturas, 'biblioteca-cenarios.jpg'), type: 'jpeg', quality: 84 });
  registrar(true, 'captura da aba Cenários');

  // 5) busca filtra dentro da aba sem perder o cabeçalho
  await page.click('.search-field input');
  await page.keyboard.type('acamp');
  await esperar(600);
  const filtrado = await page.evaluate(() => ({
    cards: document.querySelectorAll('.preset-card').length,
    total: document.querySelector('.collection-label span:last-child')?.textContent?.trim(),
    limpar: Boolean(document.querySelector('[aria-label="Limpar busca"]')),
  }));
  registrar(filtrado.cards > 0 && filtrado.cards < cenarios.cards && /cenas?$/.test(filtrado.total ?? ''), 'buscar filtra as cenas e atualiza o contador da lista', JSON.stringify(filtrado));
  await page.click('[aria-label="Limpar busca"]');
  await esperar(400);
  registrar((await page.$$('.preset-card')).length === cenarios.cards, 'limpar a busca devolve a lista completa');

  // 6) aba Cena: lista e contador independentes da busca
  await page.evaluate(() => [...document.querySelectorAll('.library-tabs [role="tab"]')].find((b) => b.textContent.includes('Cena'))?.click());
  await esperar(700);
  const cenaAntes = await page.$$eval('.scene-row', (r) => r.length);
  await page.click('.search-field input');
  await page.keyboard.type('Árvore 1');
  await esperar(600);
  const cenaDepois = await page.evaluate(() => ({
    linhas: document.querySelectorAll('.scene-row').length,
    contador: document.querySelector('.library-tabs [aria-selected="true"] .tab-count')?.textContent,
  }));
  registrar(cenaAntes > 1 && cenaDepois.linhas > 0 && cenaDepois.linhas < cenaAntes, 'buscar na cena filtra a lista', `${cenaAntes} -> ${cenaDepois.linhas}`);
  registrar(cenaDepois.contador === String(contagem.objetos), 'o contador da aba continua mostrando o total do mapa', cenaDepois.contador);
  await page.click('[aria-label="Limpar busca"]');
  await esperar(400);
  await page.screenshot({ path: path.join(capturas, 'biblioteca-cena.jpg'), type: 'jpeg', quality: 84 });
  registrar(true, 'captura da aba Cena');

  // 7) ações do rodapé da biblioteca seguem presentes
  const rodape = await page.evaluate(() => ({
    trechos: Boolean(document.querySelector('[aria-label="Meus trechos"]')),
    importar: Boolean(document.querySelector('[aria-label="Importar"]')),
  }));
  registrar(rodape.trechos && rodape.importar, 'Trechos e Importar continuam no rodapé da biblioteca', JSON.stringify(rodape));

  // 8) 600 px
  await page.setViewport({ width: 600, height: 860 });
  await esperar(800);
  const estreito = await page.evaluate(() => {
    const lib = document.querySelector('.library');
    const head = document.querySelector('.library-head');
    const busca = document.querySelector('.search-field');
    return {
      cabecaCabe: head ? head.getBoundingClientRect().right <= lib.getBoundingClientRect().right + 1 : false,
      buscaVisivel: busca ? busca.getBoundingClientRect().width > 120 : false,
      contadores: [...document.querySelectorAll('.library-tabs .tab-count')].filter((b) => getComputedStyle(b).display !== 'none').length,
      estouro: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  registrar(estreito.cabecaCabe && estreito.buscaVisivel && estreito.contadores === 0, 'em 600 px o cabeçalho cabe e os contadores saem de cena', JSON.stringify(estreito));
  await page.screenshot({ path: path.join(capturas, 'biblioteca-600.jpg'), type: 'jpeg', quality: 84 });
  registrar(true, 'captura em 600 px');

  const semErro = erros.filter((e) => !/Download the React DevTools|WebGL|SwiftShader|GroupMarkerNotSet/i.test(e));
  registrar(semErro.length === 0, 'nenhum erro de página no console', semErro.slice(0, 3).join(' // '));
} catch (erro) {
  registrar(false, 'execução interrompida', String(erro));
  try {
    const paginas = await browser.pages();
    const atual = paginas[paginas.length - 1];
    if (atual) await atual.screenshot({ path: path.join(capturas, 'falha.jpg'), type: 'jpeg', quality: 80 });
  } catch {}
} finally {
  await browser.close();
  servidor.close();
}

const falhas = resultados.filter((r) => !r.ok);
const relatorio = [
  'Biblioteca com cabeçalho único — verificação de navegador',
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
