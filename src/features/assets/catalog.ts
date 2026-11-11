import type {Kind} from '../projects/project';
export type Category='Todos'|'Natureza'|'Construções'|'Objetos'|'Básicos'|'Importados';
export type CatalogItem={kind:Kind;name:string;category:Category;detail:string;color:string};
export const catalog:CatalogItem[]=[
 {kind:'pine',name:'Pinheiro',category:'Natureza',detail:'Árvore',color:'#63816a'},
 {kind:'oak',name:'Carvalho',category:'Natureza',detail:'Árvore',color:'#8da477'},
 {kind:'rock',name:'Rocha',category:'Natureza',detail:'Terreno',color:'#99a5a0'},
 {kind:'wall',name:'Muralha',category:'Construções',detail:'Ruína',color:'#a2a99e'},
 {kind:'arch',name:'Arco de pedra',category:'Construções',detail:'Ruína',color:'#bab5a2'},
 {kind:'floor',name:'Piso de pedra',category:'Construções',detail:'Terreno',color:'#8d9689'},
 {kind:'tent',name:'Tenda',category:'Objetos',detail:'Acampamento',color:'#d2bb8a'},
 {kind:'campfire',name:'Fogueira',category:'Objetos',detail:'Acampamento',color:'#d89051'},
 {kind:'crate',name:'Caixote',category:'Objetos',detail:'Decoração',color:'#ae8257'},
 {kind:'barrel',name:'Barril',category:'Objetos',detail:'Decoração',color:'#aa895e'},
 {kind:'well',name:'Poço',category:'Construções',detail:'Estrutura',color:'#969f91'},
 {kind:'column',name:'Coluna',category:'Construções',detail:'Ruína',color:'#c3bda6'},
 {kind:'cube',name:'Cubo',category:'Básicos',detail:'Primitiva',color:'#a7bf99'},
 {kind:'sphere',name:'Esfera',category:'Básicos',detail:'Primitiva',color:'#d5b68c'},
 {kind:'cylinder',name:'Cilindro',category:'Básicos',detail:'Primitiva',color:'#9eafa9'},
];
