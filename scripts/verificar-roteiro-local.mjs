import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost/',pretendToBeVisual:true});
const {window}=dom;
Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement,HTMLInputElement:window.HTMLInputElement,HTMLSelectElement:window.HTMLSelectElement,Element:window.Element,Node:window.Node,MouseEvent:window.MouseEvent,KeyboardEvent:window.KeyboardEvent,getComputedStyle:window.getComputedStyle,requestAnimationFrame:cb=>setTimeout(()=>cb(Date.now()),0),cancelAnimationFrame:id=>clearTimeout(id),IS_REACT_ACT_ENVIRONMENT:true});
Object.defineProperty(globalThis,'navigator',{value:window.navigator,configurable:true});

const results=[];let failures=0;
const ok=(name,pass,detail='')=>{results.push(`${pass?'ok':'FALHOU'} — ${name}${detail?` (${detail})`:''}`);if(!pass)failures++};
const React=await import('react');
const {createRoot}=await import('react-dom/client');
const App=(await import('../src/App.tsx')).default;
const root=createRoot(document.getElementById('root'));
await React.act(async()=>{root.render(React.createElement(App))});
const click=async el=>{await React.act(async()=>{el.dispatchEvent(new window.MouseEvent('click',{bubbles:true}))})};
const key=async k=>{await React.act(async()=>{document.body.dispatchEvent(new window.KeyboardEvent('keydown',{key:k,bubbles:true}))})};
const text=sel=>document.querySelector(sel)?.textContent?.trim()??'';
const byLabel=label=>[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===label);

try{
 await click([...document.querySelectorAll('.library-tabs button')][2]);
 await click(document.querySelector('.preset-card'));
 await click([...document.querySelectorAll('.library-tabs button')][1]);
 ok('cenário inserido',/13\s+objetos?/.test(text('footer')),text('footer').match(/\d+\s+objetos?/)?.[0]??'');

 await click(byLabel('Salvar vista atual'));
 ok('salvar vista cria a primeira entrada',document.querySelectorAll('.view-row').length===1,`${document.querySelectorAll('.view-row').length} vista`);
 ok('vista recebe nome automático',document.querySelector('input[aria-label="Nome da vista 1"]')?.value==='Vista 1',document.querySelector('input[aria-label="Nome da vista 1"]')?.value??'—');

 // muda a câmera e salva outra vista
 await click([...document.querySelectorAll('.view-controls button')][0]);
 await React.act(async()=>{await new Promise(r=>setTimeout(r,50))});
 await click(byLabel('Salvar vista atual'));
 ok('segunda vista é criada',document.querySelectorAll('.view-row').length===2,`${document.querySelectorAll('.view-row').length} vistas`);

 // renomeia
 const input=document.querySelector('input[aria-label="Nome da vista 2"]');
 await React.act(async()=>{
  const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  setter.call(input,'Vista do portão');
  input.dispatchEvent(new window.Event('input',{bubbles:true}));
 });
 await React.act(async()=>{input.dispatchEvent(new window.FocusEvent('focusout',{bubbles:true}))});
 ok('renomear vista funciona',document.querySelector('input[aria-label="Nome da vista 2"]')?.value==='Vista do portão',document.querySelector('input[aria-label="Nome da vista 2"]')?.value??'—');

 // modo apresentação e navegação
 await click(byLabel('Modo apresentação (P)'));
 ok('apresentação abre',Boolean(document.querySelector('.showcase')));
 ok('roteiro aparece na apresentação',Boolean(document.querySelector('.showcase-views')));
 ok('começa na primeira vista',/Vista 1/.test(text('.showcase-views'))&&/1 \/ 2/.test(text('.showcase-views')),text('.showcase-views'));
 await key('ArrowRight');
 ok('seta direita avança no roteiro',/Vista do portão/.test(text('.showcase-views'))&&/2 \/ 2/.test(text('.showcase-views')),text('.showcase-views'));
 await key('ArrowRight');
 ok('o roteiro volta para o começo',/1 \/ 2/.test(text('.showcase-views')),text('.showcase-views'));
 await key('ArrowLeft');
 ok('seta esquerda volta uma vista',/2 \/ 2/.test(text('.showcase-views')),text('.showcase-views'));
 await key('Escape');
 ok('Esc volta ao editor',!document.querySelector('.showcase')&&Boolean(document.querySelector('.topbar')));

 // remover vista
 await click(byLabel('Remover Vista do portão'));
 ok('remover tira a vista do roteiro',document.querySelectorAll('.view-row').length===1,`${document.querySelectorAll('.view-row').length} vista`);
 ok('mapa segue com o roteiro salvo',JSON.stringify(document.querySelectorAll('.view-row').length)==='1');
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.stack?.split('\n').slice(0,3).join(' | '):String(e)}`);failures++;
}
console.log('\n=== RELATÓRIO LOCAL DO ROTEIRO ===');
for(const line of results)console.log(line);
console.log(`\n${failures?`${failures} FALHA(S)`:'TUDO OK'}`);
process.exit(failures?1:0);
