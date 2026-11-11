import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';

const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const site = process.env.SITE_URL || 'http://127.0.0.1:8000/Tabletop-RPG/';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const lines = [];
const failures = [];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1400,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`));

async function clickText(selector, text) {
  return page.evaluate((sel, target) => {
    const element = [...document.querySelectorAll(sel)].find((item) => item.textContent?.includes(target));
    if (element instanceof HTMLElement) { element.click(); return true; }
    return false;
  }, selector, text);
}

const readField = (label) => page.evaluate((aria) => {
  const input = document.querySelector(`input[aria-label="${aria}"]`);
  return input instanceof HTMLInputElement ? Number(input.value) : NaN;
}, label);

function expect(name, actual, expected) {
  const ok = Math.abs(actual - expected) < 1e-6;
  lines.push(`${ok ? 'ok' : 'FALHA'} ${name}: ${actual} (esperado ${expected})`);
  if (!ok) failures.push(name);
}

const status = await page.goto(site, { waitUntil: 'networkidle2', timeout: 60000 }).then((r) => (r ? r.status() : 0)).catch(() => 0);
lines.push(`status: ${status}`);
await wait(3500);
await page.evaluate(() => document.querySelector('.empty-world button')?.click());
await wait(5000);
await clickText('.library-tabs button', 'Cena');
await wait(800);
const picked = await clickText('.scene-select', 'Fogueira');
lines.push(`objeto selecionado: ${picked}`);
await wait(1200);

const start = { x: await readField('Posição X'), y: await readField('Posição Y'), z: await readField('Posição Z'), ry: await readField('Rotação Y') };
lines.push(`inicial: ${JSON.stringify(start)}`);

await page.keyboard.press('ArrowRight');
await wait(400);
const afterRight = await readField('Posição X');
expect('seta direita move +1 m em X', afterRight, start.x + 1);

await page.keyboard.press('ArrowUp');
await wait(400);
const afterUp = await readField('Posição Z');
expect('seta cima move -1 m em Z', afterUp, start.z - 1);

await page.keyboard.down('Shift');
await page.keyboard.press('ArrowRight');
await page.keyboard.up('Shift');
await wait(400);
const afterRotate = await readField('Rotação Y');
expect('shift + seta gira 15°', afterRotate, start.ry + 15);

await page.keyboard.press('PageUp');
await wait(400);
const afterPageUp = await readField('Posição Y');
expect('page up sobe 1 m', afterPageUp, start.y + 1);

await page.keyboard.down('Alt');
await page.keyboard.press('ArrowRight');
await page.keyboard.up('Alt');
await wait(400);
const afterAlt = await readField('Posição X');
expect('alt + seta usa passo fino (0,25 m)', afterAlt, start.x + 1.25);

await page.keyboard.down('Control');
await page.keyboard.press('KeyZ');
await page.keyboard.up('Control');
await wait(600);
const cleared = await page.evaluate(() => !document.querySelector('.selected-summary'));
lines.push(`ctrl+z limpou a seleção: ${cleared}`);

await browser.close();
writeFileSync('out/relatorio-site.txt', [`site: ${site}`, ...lines, `falhas: ${failures.length}`, ...failures].join('\n'));
console.log(lines.join('\n'));
if (failures.length) process.exit(1);
