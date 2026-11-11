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
const click=async (el,opts={})=>{await React.act(async()=>{el.dispatchEvent(new window.MouseEvent('click',{bubbles:true,...opts}))})};
const key=async k=>{await React.act(async()=>{document.body.dispatchEvent(new window.KeyboardEvent('keydown',{key:k,bubbles:true}))})};
const text=sel=>document.querySelector(sel)?.textContent?.trim()??'';
const num=sel=>Number(document.querySelector(sel)?.value);
const tabs=()=>[...document.querySelectorAll('.library-tabs button')];
const rows=()=>[...document.querySelectorAll('.scene-row')];

try{
 await click(tabs()[2]);
 ok('biblioteca de cenários disponível',Boolean(document.querySelector('.preset-card')));
 await click(document.querySelector('.preset-card'));
 ok('cenário inserido',/13\s+objetos?/.test(text('footer')),text('footer').match(/\d+\s+objetos?/)?.[0]??'');

 await click(tabs()[1]);
 ok('lista da cena com 13 peças',rows().length===13,`${rows().length} linhas`);

 const pieces=[];
 for(const row of rows()){
  await click(row.querySelector('.scene-select'));
  pieces.push({x:num('input[aria-label="Posição X"]'),y:num('input[aria-label="Posição Y"]'),z:num('input[aria-label="Posição Z"]')});
 }
 ok('posições legíveis no painel',pieces.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)),`${pieces.length} peças`);

 await click(rows()[0].querySelector('.scene-select'));
 const readout=document.querySelector('.ruler-readout');
 ok('régua aparece com uma peça selecionada',Boolean(readout));
 if(readout){
  const shown=Number(readout.querySelector('strong').textContent.replace(/\s*m$/,'').replace(',','.'));
  const origin=pieces[0];
  const nearest=Math.min(...pieces.slice(1).map(p=>Math.hypot(p.x-origin.x,p.y-origin.y,p.z-origin.z)));
  ok('distância exibida é a da peça mais próxima',Math.abs(shown-nearest)<0.06,`mostrado ${shown} m · real ${nearest.toFixed(2)} m`);
  ok('régua nomeia a vizinha',/^até \S/.test(readout.querySelector('span').textContent.trim()),readout.querySelector('span').textContent.trim());
 }

 await key('m');
 ok('M esconde a régua',!document.querySelector('.ruler-readout'));
 await key('m');
 ok('M traz a régua de volta',Boolean(document.querySelector('.ruler-readout')));

 const toggle=document.querySelector('[role="switch"][aria-label="Régua e alinhamento"]');
 ok('interruptor do painel começa ligado',toggle?.getAttribute('aria-checked')==='true');
 await click(toggle);
 ok('interruptor desliga a régua',!document.querySelector('.ruler-readout'));
 await click(toggle);
 ok('interruptor religa a régua',Boolean(document.querySelector('.ruler-readout')));

 await click(rows()[1].querySelector('.scene-select'),{shiftKey:true});
 ok('seleção múltipla não mostra régua de uma peça',!document.querySelector('.ruler-readout'));
 ok('painel confirma a dupla selecionada',/2 objetos selecionados/.test(text('[aria-label="Seleção múltipla"]')),text('[aria-label="Seleção múltipla"]').slice(0,32));

 const before=pieces[0].x;
 await click(rows()[0].querySelector('.scene-select'));
 await key('ArrowRight');
 const after=num('input[aria-label="Posição X"]');
 ok('mover com a seta muda a distância medida',after===before+1,`X ${before} → ${after}`);
 ok('leitura continua presente depois de mover',Boolean(document.querySelector('.ruler-readout')));

 const THREE=await import('three');
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,.06,0,4.2,.06,1],3));
 const dashed=new THREE.Line(geometry,new THREE.LineDashedMaterial({color:'#f4ffdd',dashSize:.34,gapSize:.22,transparent:true,opacity:.9}));
 dashed.computeLineDistances();
 const distances=geometry.getAttribute('lineDistance');
 ok('linha tracejada da régua monta com as três primitivas',Boolean(distances)&&Math.abs(distances.getX(1)-Math.hypot(4.2,0,1))<1e-6,`comprimento ${distances?.getX(1).toFixed(2)} m`);
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.stack?.split('\n').slice(0,3).join(' | '):String(e)}`);failures++;
}
console.log('\n=== RELATÓRIO LOCAL DA RÉGUA ===');
for(const line of results)console.log(line);
console.log(`\n${failures?`${failures} FALHA(S)`:'TUDO OK'}`);
process.exit(failures?1:0);
