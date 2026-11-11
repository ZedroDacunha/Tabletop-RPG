import type {Kind} from '../projects/project';
export type Category='Todos'|'Natureza'|'Construções'|'Objetos'|'Básicos'|'Importados';
export type CatalogItem={kind:Kind;name:string;category:Category;detail:string;color:string};
export const catalog:CatalogItem[]=[
 // Natureza — vegetação e terreno
 {kind:'pine',name:'Pinheiro',category:'Natureza',detail:'Árvore',color:'#63816a'},
 {kind:'oak',name:'Carvalho',category:'Natureza',detail:'Árvore',color:'#8da477'},
 {kind:'birch',name:'Bétula',category:'Natureza',detail:'Árvore',color:'#b5c980'},
 {kind:'deadtree',name:'Árvore seca',category:'Natureza',detail:'Vegetação',color:'#7d6a55'},
 {kind:'bush',name:'Arbusto',category:'Natureza',detail:'Vegetação',color:'#5d7a52'},
 {kind:'mushrooms',name:'Cogumelos',category:'Natureza',detail:'Detalhe',color:'#b3524a'},
 {kind:'log',name:'Tronco caído',category:'Natureza',detail:'Terreno',color:'#8a7053'},
 {kind:'rock',name:'Rocha',category:'Natureza',detail:'Terreno',color:'#99a5a0'},
 {kind:'crystal',name:'Cristais',category:'Natureza',detail:'Detalhe',color:'#8fd3ca'},
 {kind:'pond',name:'Lagoa',category:'Natureza',detail:'Água',color:'#4a7d84'},
 // Construções
 {kind:'wall',name:'Muralha',category:'Construções',detail:'Ruína',color:'#a2a99e'},
 {kind:'arch',name:'Arco de pedra',category:'Construções',detail:'Ruína',color:'#bab5a2'},
 {kind:'tower',name:'Torre em ruínas',category:'Construções',detail:'Ruína',color:'#9aa492'},
 {kind:'column',name:'Coluna',category:'Construções',detail:'Ruína',color:'#c3bda6'},
 {kind:'stairs',name:'Escadaria',category:'Construções',detail:'Estrutura',color:'#a8ad99'},
 {kind:'floor',name:'Piso de pedra',category:'Construções',detail:'Terreno',color:'#8d9689'},
 {kind:'fence',name:'Cerca',category:'Construções',detail:'Estrutura',color:'#a1815c'},
 {kind:'bridge',name:'Ponte',category:'Construções',detail:'Estrutura',color:'#a4815a'},
 {kind:'well',name:'Poço',category:'Construções',detail:'Estrutura',color:'#969f91'},
 {kind:'shrine',name:'Santuário',category:'Construções',detail:'Ruína',color:'#9fb0a1'},
 // Objetos de cena
 {kind:'tent',name:'Tenda',category:'Objetos',detail:'Acampamento',color:'#d2bb8a'},
 {kind:'campfire',name:'Fogueira',category:'Objetos',detail:'Acampamento',color:'#d89051'},
 {kind:'lantern',name:'Lanterna',category:'Objetos',detail:'Iluminação',color:'#ffb46b'},
 {kind:'banner',name:'Estandarte',category:'Objetos',detail:'Decoração',color:'#8c4340'},
 {kind:'statue',name:'Estátua',category:'Objetos',detail:'Decoração',color:'#b8bba6'},
 {kind:'chest',name:'Baú',category:'Objetos',detail:'Tesouro',color:'#a8814f'},
 {kind:'cart',name:'Carrinho',category:'Objetos',detail:'Acampamento',color:'#94714c'},
 {kind:'crate',name:'Caixote',category:'Objetos',detail:'Decoração',color:'#ae8257'},
 {kind:'barrel',name:'Barril',category:'Objetos',detail:'Decoração',color:'#aa895e'},
 // Formas básicas
 {kind:'cube',name:'Cubo',category:'Básicos',detail:'Primitiva',color:'#a7bf99'},
 {kind:'sphere',name:'Esfera',category:'Básicos',detail:'Primitiva',color:'#d5b68c'},
 {kind:'cylinder',name:'Cilindro',category:'Básicos',detail:'Primitiva',color:'#9eafa9'},
];
