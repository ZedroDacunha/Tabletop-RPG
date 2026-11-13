import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const capturas = 'capturas';
fs.mkdirSync(capturas, {recursive: true});
const log = [];
const registrar = (linha) => { log.push(linha); console.log(linha); };

let browser;
try {
  browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--enable-webgl'],
    defaultViewport: {width: 1300, height: 940},
  });
  registrar('navegador aberto');
  const page = await browser.newPage();
  page.on('console', (m) => registrar(`CONSOLE ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => registrar(`PAGEERROR: ${String(e)}`));
  page.on('requestfailed', (r) => registrar(`REQFAIL: ${r.url()} ${r.failure()?.errorText ?? ''}`));
  const resposta = await page.goto('http://127.0.0.1:5199/tenda.html', {waitUntil: 'networkidle2'});
  registrar(`status ${resposta?.status()}`);
  await page.waitForFunction('window.__pronto === true', {timeout: 45000});
  registrar('modelo renderizado');
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({path: path.join(capturas, 'tenda-3d.jpg'), type: 'jpeg', quality: 88});
  registrar('captura salva');
} catch (erro) {
  registrar('FALHA: ' + String(erro));
  try {
    const paginas = await browser?.pages();
    const atual = paginas?.[paginas.length - 1];
    if (atual) {
      await atual.screenshot({path: path.join(capturas, 'falha.jpg'), type: 'jpeg', quality: 80});
      registrar('html: ' + (await atual.content()).slice(0, 1200));
    }
  } catch (e) { registrar('sem captura da falha: ' + String(e)); }
  process.exitCode = 1;
} finally {
  await browser?.close();
  fs.writeFileSync(path.join(capturas, 'relatorio.txt'), log.join('\n'));
}
