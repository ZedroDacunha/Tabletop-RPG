// Verificação de navegador: tela de edição organizada (barra docada, rodapé enxuto, seções recolhíveis).
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
  await page.evaluate(() => [...document.querySelectorAll('.library-tabs button')].find((b) => b.textContent.includes('Cena'))?.click());
  await page.waitForSelector('.scene-row', { timeout: 40000 });
  registrar(true, 'editor carregado com o cenário de exemplo em 1440 px');
  await page.evaluate(() => document.querySelector('.scene-select')?.click());
  await esperar(1200);

  const reguaCedo = await page.evaluate(() => {
    const r = document.querySelector('.viewport-bottom-left');
    const texto = r?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    return { existe: Boolean(r), texto };
  });
  registrar(reguaCedo.existe && /até/.test(reguaCedo.texto), 'régua da peça mais próxima aparece com uma peça selecionada', reguaCedo.texto);

  // 1) a barra docada existe e não flutua sobre a cena
  const barra = await page.evaluate(() => {
    const b = document.querySelector('.canvas-bar');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return {
      topo: Math.round(r.top), base: Math.round(r.bottom), largura: Math.round(r.width),
      posicao: getComputedStyle(b).position,
      ferramentas: b.querySelectorAll('[aria-label^="Selecionar"],[aria-label^="Mover"],[aria-label^="Rotacionar"],[aria-label^="Escalar"]').length,
      camera: b.querySelectorAll('[aria-label^="Centralizar"]').length,
      visualizacao: b.querySelectorAll('[aria-label^="Alternar grade"],[aria-label="Encaixe na grade"],[aria-label^="Régua"]').length,
      saida: b.querySelectorAll('[aria-label^="Exportar imagem"],[aria-label="Ajuda e atalhos"]').length,
    };
  });
  registrar(
    barra && barra.posicao === 'relative' && barra.ferramentas === 4 && barra.camera === 1 && barra.visualizacao === 3 && barra.saida === 2,
    'barra do editor reúne ferramentas, câmera, visualização e saída',
    JSON.stringify(barra),
  );

  const flutuantes = await page.evaluate(() =>
    ['.viewport-top-controls', '.view-controls', '.viewport-bottom-right', '.viewport-title', '.shortcut-hint']
      .map((s) => [s, document.querySelectorAll(s).length])
      .filter(([, n]) => n > 0),
  );
  registrar(flutuantes.length === 0, 'nenhum grupo de controles flutua sobre a cena', JSON.stringify(flutuantes));

  // 2) a cena começa abaixo da barra e não é coberta por botões
  const cena = await page.evaluate(() => {
    const c = document.querySelector('.viewport-wrap > div:not([class])')?.getBoundingClientRect();
    const b = document.querySelector('.canvas-bar').getBoundingClientRect();
    const wrap = document.querySelector('.viewport-wrap').getBoundingClientRect();
    const sobrepostos = [...document.querySelectorAll('.viewport-wrap *')].filter((el) => {
      if (el.closest('.canvas-bar')) return false;
      if (!el.querySelector('button') && el.tagName !== 'BUTTON') return false;
      const r = el.getBoundingClientRect();
      return getComputedStyle(el).position === 'absolute' && r.width > 0 && r.height > 0;
    }).length;
    const el = document.querySelector('.viewport-wrap > div:not([class])');
    const cs = el ? getComputedStyle(el) : null;
    return {
      cenaTopo: Math.round(c?.top ?? -1), barraBase: Math.round(b.bottom),
      cenaClasse: el ? (el.className || '(sem classe)') : 'sem elemento',
      cenaInset: cs ? `${cs.position}/${cs.top}/${cs.inset}` : '-',
      cenaVar: cs ? cs.getPropertyValue('--barra') : '-',
      canvasLargura: Math.round((c?.width ?? 0)), canvasAltura: Math.round((c?.height ?? 0)),
      sobrepostos, wrapAltura: Math.round(wrap.height),
    };
  });
  registrar(cena.cenaTopo >= cena.barraBase - 1, 'a cena começa logo abaixo da barra', `${cena.cenaTopo} >= ${cena.barraBase}`);
  registrar(cena.sobrepostos === 0, 'nenhum botão absoluto fica por cima do mapa', String(cena.sobrepostos));

  // 3) painel de propriedades com seções recolhidas
  const secoes = await page.$$eval('button.section-heading', (bs) => bs.map((b) => ({ texto: b.textContent.replace(/\s+/g, ' ').trim(), aberta: b.getAttribute('aria-expanded') })));
  registrar(
    secoes.length === 4 && secoes.every((s) => s.aberta === 'false'),
    'propriedades mostra quatro seções recolhidas',
    secoes.map((s) => `${s.texto}:${s.aberta}`).join(' | '),
  );
  const naoMostra = await page.$eval('.inspector-scroll', (el) => ({
    camadas: !el.querySelector('.layer-list'),
    ambiente: !el.querySelector('.light-options'),
    roteiro: !el.querySelector('.view-list'),
  }));
  registrar(Object.values(naoMostra).every(Boolean), 'conteúdo das seções só aparece ao abrir', JSON.stringify(naoMostra));

  await page.evaluate(() => [...document.querySelectorAll('.section-heading')].find((b) => b.textContent.includes('CAMADAS'))?.click());
  await esperar(400);
  const camadasAbertas = await page.evaluate(() => ({
    expandida: [...document.querySelectorAll('.section-heading')].find((b) => b.textContent.includes('CAMADAS'))?.getAttribute('aria-expanded'),
    linhas: document.querySelectorAll('.layer-row').length,
  }));
  registrar(camadasAbertas.expandida === 'true' && camadasAbertas.linhas > 0, 'clicar em CAMADAS abre a lista de camadas', JSON.stringify(camadasAbertas));
  await page.evaluate(() => [...document.querySelectorAll('.section-heading')].find((b) => b.textContent.includes('CAMADAS'))?.click());
  await esperar(300);

  // 4) rodapé enxuto
  const rodape = await page.$eval('.statusbar', (el) => el.textContent.replace(/\s+/g, ' ').trim());
  registrar(!/pronto para criar/i.test(rodape), 'rodapé sem frase de efeito', rodape);
  registrar(/objetos/i.test(rodape) && /Grade 1 m/i.test(rodape) && /30 × 30 m/.test(rodape), 'rodapé mantém objetos, grade e tamanho do mapa', rodape);
  const topo = await page.$eval('.topbar', (el) => el.textContent.replace(/\s+/g, ' ').trim());
  registrar(!/SEU MUNDO, SUAS HISTÓRIAS/i.test(topo), 'cabeçalho sem a linha de slogan duplicada', topo.slice(0, 70));

  // 5) controles da barra continuam funcionando
  const gradeAntes = await page.$eval('[aria-label="Alternar grade (G)"]', (b) => b.getAttribute('aria-pressed'));
  await page.click('[aria-label="Alternar grade (G)"]');
  await esperar(400);
  const grade = await page.evaluate(() => ({
    pressed: document.querySelector('[aria-label="Alternar grade (G)"]')?.getAttribute('aria-pressed'),
    desfazer: !document.querySelector('[aria-label="Desfazer (Ctrl+Z)"]')?.disabled,
  }));
  registrar(grade.pressed !== gradeAntes && grade.desfazer, 'alternar a grade pela barra funciona e habilita desfazer', `${gradeAntes} -> ${grade.pressed}`);
  await page.click('[aria-label="Desfazer (Ctrl+Z)"]');
  await esperar(400);
  registrar((await page.$eval('[aria-label="Alternar grade (G)"]', (b) => b.getAttribute('aria-pressed'))) === gradeAntes, 'desfazer restaura a grade', gradeAntes);

  // 6) régua continua no canto inferior esquerdo (volta ao selecionar de novo)
  await page.evaluate(() => document.querySelector('.scene-select')?.click());
  await esperar(500);
  const regua = await page.evaluate(() => {
    const r = document.querySelector('.viewport-bottom-left');
    const wrap = document.querySelector('.viewport-wrap').getBoundingClientRect();
    const b = r?.getBoundingClientRect();
    return { existe: Boolean(r), dentro: b ? b.bottom <= wrap.bottom && b.left >= wrap.left : false };
  });
  registrar(regua.existe && regua.dentro, 'régua da peça mais próxima continua na cena', JSON.stringify(regua));

  await page.screenshot({ path: path.join(capturas, 'tela-depois-1440.jpg'), type: 'jpeg', quality: 84 });
  registrar(true, 'captura em 1440 px');

  // 7) 1180 px
  await page.setViewport({ width: 1180, height: 820 });
  await esperar(900);
  await page.screenshot({ path: path.join(capturas, 'tela-depois-1180.jpg'), type: 'jpeg', quality: 84 });
  const barra1180 = await page.evaluate(() => {
    const b = document.querySelector('.canvas-bar').getBoundingClientRect();
    const w = document.querySelector('.viewport-wrap').getBoundingClientRect();
    return { barraDentro: b.right <= w.right + 1 && b.left >= w.left - 1, estouro: document.documentElement.scrollWidth - window.innerWidth };
  });
  registrar(barra1180.barraDentro && barra1180.estouro <= 0, 'barra inteira dentro da coluna da cena em 1180 px', JSON.stringify(barra1180));
  registrar(true, 'captura em 1180 px');

  // 8) 600 px: barra visível, "Mais ações" clicável e propriedades abaixo da barra
  await page.setViewport({ width: 600, height: 860 });
  await esperar(1000);
  const estreito = await page.evaluate(() => {
    const barra = document.querySelector('.canvas-bar').getBoundingClientRect();
    const wrap = document.querySelector('.viewport-wrap').getBoundingClientRect();
    const mais = document.querySelector('button[aria-label="Mais ações"]');
    const r = mais?.getBoundingClientRect();
    const alvo = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
    const insp = document.querySelector('.inspector')?.getBoundingClientRect();
    return {
      barraInteira: barra.right <= wrap.right + 1,
      maisVisivel: Boolean(mais) && Boolean(alvo?.closest('button[aria-label="Mais ações"]')),
      inspDepoisDaBarra: insp ? insp.top >= barra.bottom - 1 : false,
      estouro: document.documentElement.scrollWidth - window.innerWidth,
      inspTopo: Math.round(insp?.top ?? -1), barraBase: Math.round(barra.bottom),
    };
  });
  registrar(estreito.barraInteira && estreito.maisVisivel, 'em 600 px a barra cabe e "Mais ações" recebe o clique', JSON.stringify(estreito));
  registrar(estreito.inspDepoisDaBarra, 'em 600 px as propriedades começam abaixo da barra', `${estreito.inspTopo} >= ${estreito.barraBase}`);
  registrar(estreito.estouro <= 0, 'sem estouro horizontal em 600 px', String(estreito.estouro));
  // 9) 600 px numa carga nova: a gaveta de propriedades começa fechada e a cena usa a largura toda
  await page.reload({ waitUntil: 'networkidle2' });
  await esperar(4500);
  const cargaEstreita = await page.evaluate(() => {
    const wrap = document.querySelector('.viewport-wrap').getBoundingClientRect();
    const barra = document.querySelector('.canvas-bar').getBoundingClientRect();
    return {
      gaveta: Boolean(document.querySelector('.inspector')),
      canvasLargura: Math.round(wrap.width), barraLargura: Math.round(barra.width),
      sobra: Math.round(wrap.width - barra.width),
    };
  });
  registrar(
    cargaEstreita.gaveta === false && cargaEstreita.barraLargura === cargaEstreita.canvasLargura,
    'em 600 px a carga nova deixa a cena inteira e a gaveta fechada',
    JSON.stringify(cargaEstreita),
  );
  await page.screenshot({ path: path.join(capturas, 'tela-depois-600.jpg'), type: 'jpeg', quality: 84 });
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
  'Tela de edição organizada — verificação de navegador',
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
