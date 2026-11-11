import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';

const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const site = process.env.SITE_URL || 'http://127.0.0.1:8000/Tabletop-RPG/';
const gallery = process.env.GALLERY_URL || '';
const prefix = process.env.SHOT_PREFIX || '';
const only = process.env.SHOT_ONLY || 'tudo';
const shots = [];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1400,900'],
});

async function shot(page, name, clip) {
  await page.screenshot({ path: `out/${prefix}${name}.jpg`, type: 'jpeg', quality: 40, clip });
  shots.push(`${prefix}${name}`);
}

const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));

async function open(url) {
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    return response ? String(response.status()) : 'sem resposta';
  } catch (error) {
    logs.push(`[goto] ${url} ${error.message}`);
    return 'erro';
  }
}

let status = 'nao executado';
let extras = '';

if (only !== 'galeria') {
  status = await open(site);
  await new Promise((r) => setTimeout(r, 3500));
  await page.evaluate(() => {
    const button = document.querySelector('.empty-world button');
    if (button instanceof HTMLElement) button.click();
  });
  await new Promise((r) => setTimeout(r, 6000));
  await shot(page, '1-entardecer', { x: 273, y: 60, width: 745, height: 620 });

  const picked = await page.evaluate(() => {
    const button = [...document.querySelectorAll('.light-options button')].find((b) => b.textContent?.includes('Noite'));
    if (button instanceof HTMLElement) { button.click(); return true; }
    return false;
  });
  await new Promise((r) => setTimeout(r, 3200));
  await shot(page, '2-noite', { x: 273, y: 60, width: 745, height: 620 });

  const day = await page.evaluate(() => {
    const button = [...document.querySelectorAll('.light-options button')].find((b) => b.textContent?.includes('Dia'));
    if (button instanceof HTMLElement) { button.click(); return true; }
    return false;
  });
  await new Promise((r) => setTimeout(r, 3200));
  await shot(page, '3-dia', { x: 0, y: 0, width: 1400, height: 760 });

  const dawn = await page.evaluate(() => {
    const button = [...document.querySelectorAll('.light-options button')].find((b) => b.textContent?.includes('Amanhecer'));
    if (button instanceof HTMLElement) { button.click(); return true; }
    return false;
  });
  await new Promise((r) => setTimeout(r, 3200));
  await shot(page, '4-amanhecer', { x: 273, y: 60, width: 745, height: 620 });
  extras = `noite:${picked} dia:${day} amanhecer:${dawn}`;
}

if (gallery) {
  const galleryStatus = await open(gallery);
  extras += ` galeria:${galleryStatus}`;
  await new Promise((r) => setTimeout(r, 5000));
  await shot(page, '5-galeria', { x: 0, y: 0, width: 1200, height: 780 });
}

const canvas = await page.evaluate(() => document.querySelectorAll('canvas').length);
const rootLength = await page.evaluate(() => document.getElementById('root')?.innerHTML.length ?? -1);
await browser.close();

writeFileSync(`out/relatorio-${prefix || 'site'}.txt`, [
  `site: ${site} status: ${status}`,
  `root: ${rootLength} canvas: ${canvas}`,
  extras,
  'capturas: ' + shots.join(', '),
  'logs:',
  ...logs.slice(0, 30),
].join('\n'));
console.log('capturas:', shots.join(', '));
