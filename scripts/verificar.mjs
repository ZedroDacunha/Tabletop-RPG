import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';

const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const site = process.env.SITE_URL || 'http://127.0.0.1:8000/Tabletop-RPG/';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shots = [];
const logs = [];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1400,900'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

const status = await page.goto(site, { waitUntil: 'networkidle2', timeout: 60000 }).then((r) => (r ? String(r.status()) : 'sem resposta')).catch((e) => `erro: ${e.message}`);
await wait(3500);

async function clickText(selector, text) {
  return page.evaluate((sel, target) => {
    const element = [...document.querySelectorAll(sel)].find((item) => item.textContent?.includes(target));
    if (element instanceof HTMLElement) { element.click(); return true; }
    return false;
  }, selector, text);
}

const presetsTab = await clickText('.library-tabs button', 'Cenários');
await wait(1200);
await page.screenshot({ path: 'out/1-aba-cenarios.jpg', type: 'jpeg', quality: 45, clip: { x: 0, y: 60, width: 280, height: 720 } });
shots.push('1-aba-cenarios');

const campInsert = await clickText('.preset-card', 'Acampamento');
await wait(4500);
await page.screenshot({ path: 'out/2-acampamento.jpg', type: 'jpeg', quality: 40, clip: { x: 280, y: 70, width: 860, height: 620 } });
shots.push('2-acampamento');

const lagoonInsert = await clickText('.preset-card', 'Lagoa');
await wait(4500);
await page.screenshot({ path: 'out/3-lagoa.jpg', type: 'jpeg', quality: 40, clip: { x: 280, y: 70, width: 860, height: 620 } });
shots.push('3-lagoa');

const ruinInsert = await clickText('.preset-card', 'Ruína');
await wait(4500);
await page.screenshot({ path: 'out/4-ruina.jpg', type: 'jpeg', quality: 40, clip: { x: 280, y: 70, width: 860, height: 620 } });
shots.push('4-ruina');

const sceneTab = await clickText('.library-tabs button', 'Cena');
await wait(1200);
const counts = await page.evaluate(() => {
  const badge = document.querySelector('.library-tabs button:nth-child(2) span');
  const rows = document.querySelectorAll('.scene-row').length;
  const notice = document.querySelector('.notice, [role="status"]')?.textContent ?? '';
  return { badge: badge?.textContent ?? '', rows, notice };
});
await page.screenshot({ path: 'out/5-cena.jpg', type: 'jpeg', quality: 45, clip: { x: 0, y: 60, width: 280, height: 720 } });
shots.push('5-cena');

await browser.close();

writeFileSync('out/relatorio-site.txt', [
  `site: ${site} status: ${status}`,
  `aba cenários: ${presetsTab} | acampamento: ${campInsert} | lagoa: ${lagoonInsert} | ruína: ${ruinInsert} | aba cena: ${sceneTab}`,
  `objetos no mapa: ${counts.badge} | linhas na lista: ${counts.rows}`,
  `aviso: ${counts.notice}`,
  'capturas: ' + shots.join(', '),
  'logs:',
  ...logs.slice(0, 30),
].join('\n'));
console.log('capturas:', shots.join(', '));
