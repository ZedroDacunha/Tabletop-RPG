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
const tabs=()=>[...document.querySelectorAll('.library-tabs button')];
const byLabel=label=>[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===label);

try{
 await click(tabs()[2]);
 await click(document.querySelector('.preset-card'));
 await click([...document.querySelectorAll('.preset-card')][1]);
 ok('dois cenários inseridos',/26\s+objetos?/.test(text('footer')),text('footer').match(/\d+\s+objetos?/)?.[0]??'');
 await click(tabs()[1]);

 const layerRows=[...document.querySelectorAll('.layer-row')];
 const summary=layerRows.map(r=>({name:r.querySelector('.layer-name')?.childNodes[0]?.textContent?.trim(),total:Number(r.querySelector('.layer-name small')?.textContent)}));
 ok('camadas listadas com contagem',layerRows.length>=2&&summary.every(l=>l.total>0),summary.map(l=>`${l.name} ${l.total}`).join(' · '));
 ok('a soma das camadas bate com o mapa',summary.reduce((a,l)=>a+l.total,0)===26,`${summary.reduce((a,l)=>a+l.total,0)} peças`);
 ok('camada de modelos importados fica oculta quando vazia',!layerRows.some(r=>/Importados/.test(r.textContent??'')));

 const naturezaTotal=summary.find(l=>(l.name??'').startsWith('Natureza'))?.total??0;
 ok('botão de ocultar camada existe',Boolean(byLabel('Ocultar camada Natureza')));
 await click(byLabel('Ocultar camada Natureza'));
 ok('ocultar esconde só as peças da camada',document.querySelectorAll('.scene-row.hidden-object').length===naturezaTotal&&naturezaTotal<26,`${document.querySelectorAll('.scene-row.hidden-object').length} de ${naturezaTotal} (mapa com 26)`);
 ok('mapa mantém todas as peças',/26\s+objetos?/.test(text('footer')),text('footer').match(/\d+\s+objetos?/)?.[0]??'');
 ok('aviso confirma a camada oculta',/Camada Natureza oculta/.test(text('.toast')),text('.toast').slice(0,40));

 await click(byLabel('Travar camada Natureza'));
 ok('travar atinge a camada inteira',/Camada Natureza travada/.test(text('.toast')),text('.toast').slice(0,34));

 const natureRow=[...document.querySelectorAll('.scene-row')].find(r=>/^(Pinheiro|Carvalho|Bétula|Rocha)/.test(r.textContent??''));
 await click(natureRow.querySelector('.scene-select'));
 await key('ArrowRight');
 ok('peça travada pela camada recusa movimento',/Destrave/.test(text('.toast')),text('.toast').slice(0,44));

 await click(byLabel('Destravar camada Natureza'));
 ok('destravar libera a camada',/Camada Natureza destravada/.test(text('.toast')),text('.toast').slice(0,34));
 await click(byLabel('Mostrar camada Natureza'));
 ok('mostrar traz a camada de volta',document.querySelectorAll('.scene-row.hidden-object').length===0);
}catch(e){
 results.push(`FALHOU — exceção: ${e instanceof Error?e.stack?.split('\n').slice(0,3).join(' | '):String(e)}`);failures++;
}
console.log('\n=== RELATÓRIO LOCAL DAS CAMADAS ===');
for(const line of results)console.log(line);
console.log(`\n${failures?`${failures} FALHA(S)`:'TUDO OK'}`);
process.exit(failures?1:0);
