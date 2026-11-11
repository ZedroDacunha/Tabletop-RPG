import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';

const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const site = process.env.SITE_URL || 'http://127.0.0.1:8000/Tabletop-RPG/';
const shots = [];
const logs = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1400,900'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

async function shot(name, clip) {
  await page.screenshot({ path: `out/${name}.jpg`, type: 'jpeg', quality: 42, clip });
  shots.push(name);
}

async function openSceneTab() {
  return page.evaluate(() => {
    const button = [...document.querySelectorAll('.library-tabs button')].find((b) => b.textContent?.includes('Cena'));
    if (button instanceof HTMLElement) { button.click(); return true; }
    return false;
  });
}

async function selectObject(name) {
  return page.evaluate((target) => {
    const row = [...document.querySelectorAll('.scene-select')].find((b) => b.textContent?.includes(target));
    if (row instanceof HTMLElement) { row.click(); return true; }
    return false;
  }, name);
}

async function chooseTool(label) {
  return page.evaluate((target) => {
    const button = document.querySelector(`button[aria-label="${target}"]`);
    if (button instanceof HTMLElement) { button.click(); return true; }
    return false;
  }, label);
}

const status = await page.goto(site, { waitUntil: 'networkidle2', timeout: 60000 }).then((r) => (r ? String(r.status()) : 'sem resposta')).catch((e) => `erro: ${e.message}`);
await wait(3500);
const entered = await page.evaluate(() => {
  const button = document.querySelector('.empty-world button');
  if (button instanceof HTMLElement) { button.click(); return true; }
  return false;
});
await wait(5500);

const sceneTab = await openSceneTab();
await wait(900);

const pickedFire = await selectObject('Fogueira');
await wait(1200);
const translate = await chooseTool('Mover (2)');
await wait(2500);
await shot('1-gizmo-fogueira', { x: 280, y: 70, width: 860, height: 640 });

const pickedTree = await selectObject('Árvore 1');
await wait(2200);
await shot('2-gizmo-arvore', { x: 280, y: 70, width: 860, height: 640 });

const rotate = await chooseTool('Rotacionar (3)');
await wait(2200);
await shot('3-gizmo-rotacao', { x: 280, y: 70, width: 860, height: 640 });

const pickedWell = await selectObject('Poço');
const scale = await chooseTool('Escalar (4)');
await wait(2200);
await shot('4-gizmo-escala', { x: 280, y: 70, width: 860, height: 640 });

await browser.close();

writeFileSync('out/relatorio-site.txt', [
  `site: ${site} status: ${status}`,
  `mapa de exemplo: ${entered} | aba Cena: ${sceneTab}`,
  `selecionar fogueira: ${pickedFire} | mover: ${translate}`,
  `selecionar árvore: ${pickedTree} | rotacionar: ${rotate}`,
  `selecionar poço: ${pickedWell} | escalar: ${scale}`,
  'capturas: ' + shots.join(', '),
  'logs:',
  ...logs.slice(0, 30),
].join('\n'));
console.log('capturas:', shots.join(', '));
