import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--enable-webgl'],
  defaultViewport: {width: 1300, height: 940},
});
const page = await browser.newPage();
page.on('console', (m) => console.log('CONSOLE:', m.type(), m.text()));
page.on('pageerror', (e) => console.log('ERRO:', String(e)));
await page.goto('http://127.0.0.1:5199/tenda.html', {waitUntil: 'networkidle2'});
await page.waitForFunction('window.__pronto === true', {timeout: 60000});
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({path: 'capturas/tenda-3d.jpg', type: 'jpeg', quality: 88});
console.log('captura pronta');
await browser.close();
