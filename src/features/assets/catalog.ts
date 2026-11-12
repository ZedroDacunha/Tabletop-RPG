import type {Kind} from '../projects/project';
export const CATEGORIES=['Todos','Natureza','Construções','Mobiliário','Acampamento','Iluminação','Masmorra','Decoração','Básicos','Importados'] as const;
export type Category=typeof CATEGORIES[number];
export type CatalogItem={kind:Kind;name:string;category:Exclude<Category,'Todos'|'Importados'>;detail:string;color:string;tags:string;isNew?:boolean};
export const catalog:CatalogItem[]= [
 {
  "kind": "pine",
  "name": "Pinheiro",
  "category": "Natureza",
  "detail": "Árvores",
  "color": "#63816a",
  "tags": "floresta conífera"
 },
 {
  "kind": "oak",
  "name": "Carvalho",
  "category": "Natureza",
  "detail": "Árvores",
  "color": "#8da477",
  "tags": "floresta"
 },
 {
  "kind": "birch",
  "name": "Bétula",
  "category": "Natureza",
  "detail": "Árvores",
  "color": "#b5c980",
  "tags": "floresta"
 },
 {
  "kind": "deadtree",
  "name": "Árvore seca",
  "category": "Natureza",
  "detail": "Árvores",
  "color": "#7d6a55",
  "tags": "morta seca"
 },
 {
  "kind": "bush",
  "name": "Arbusto",
  "category": "Natureza",
  "detail": "Plantas",
  "color": "#5d7a52",
  "tags": "arbustos"
 },
 {
  "kind": "mushrooms",
  "name": "Cogumelos",
  "category": "Natureza",
  "detail": "Plantas",
  "color": "#b3524a",
  "tags": "fungos"
 },
 {
  "kind": "log",
  "name": "Tronco caído",
  "category": "Natureza",
  "detail": "Rochas e troncos",
  "color": "#8a7053",
  "tags": "madeira"
 },
 {
  "kind": "rock",
  "name": "Rocha",
  "category": "Natureza",
  "detail": "Rochas e troncos",
  "color": "#99a5a0",
  "tags": "pedra"
 },
 {
  "kind": "crystal",
  "name": "Cristais",
  "category": "Natureza",
  "detail": "Cristais",
  "color": "#8fd3ca",
  "tags": "magia caverna"
 },
 {
  "kind": "pond",
  "name": "Lagoa",
  "category": "Natureza",
  "detail": "Água",
  "color": "#4a7d84",
  "tags": "lago rio"
 },
 {
  "kind": "wall",
  "name": "Muralha",
  "category": "Construções",
  "detail": "Paredes e portões",
  "color": "#a2a99e",
  "tags": "pedra ruína"
 },
 {
  "kind": "arch",
  "name": "Arco de pedra",
  "category": "Construções",
  "detail": "Paredes e portões",
  "color": "#bab5a2",
  "tags": "pedra ruína"
 },
 {
  "kind": "tower",
  "name": "Torre em ruínas",
  "category": "Construções",
  "detail": "Edificações",
  "color": "#9aa492",
  "tags": "ruína castelo"
 },
 {
  "kind": "column",
  "name": "Coluna",
  "category": "Construções",
  "detail": "Colunas e monumentos",
  "color": "#c3bda6",
  "tags": "pedra ruína"
 },
 {
  "kind": "stairs",
  "name": "Escadaria",
  "category": "Construções",
  "detail": "Pisos e escadas",
  "color": "#a8ad99",
  "tags": "pedra degraus"
 },
 {
  "kind": "floor",
  "name": "Piso de pedra",
  "category": "Construções",
  "detail": "Pisos e escadas",
  "color": "#8d9689",
  "tags": "pedra terreno"
 },
 {
  "kind": "fence",
  "name": "Cerca",
  "category": "Construções",
  "detail": "Cercas",
  "color": "#a1815c",
  "tags": "madeira"
 },
 {
  "kind": "bridge",
  "name": "Ponte",
  "category": "Construções",
  "detail": "Pontes e cais",
  "color": "#a4815a",
  "tags": "madeira"
 },
 {
  "kind": "well",
  "name": "Poço",
  "category": "Construções",
  "detail": "Colunas e monumentos",
  "color": "#969f91",
  "tags": "água pedra"
 },
 {
  "kind": "shrine",
  "name": "Santuário",
  "category": "Construções",
  "detail": "Colunas e monumentos",
  "color": "#9fb0a1",
  "tags": "magia santuário templo"
 },
 {
  "kind": "tent",
  "name": "Tenda",
  "category": "Acampamento",
  "detail": "Abrigo",
  "color": "#d2bb8a",
  "tags": "barraca tecido"
 },
 {
  "kind": "campfire",
  "name": "Fogueira",
  "category": "Acampamento",
  "detail": "Cozinha",
  "color": "#d89051",
  "tags": "fogo lenha"
 },
 {
  "kind": "lantern",
  "name": "Lanterna",
  "category": "Iluminação",
  "detail": "Lanternas",
  "color": "#ffb46b",
  "tags": "luz poste"
 },
 {
  "kind": "banner",
  "name": "Estandarte",
  "category": "Decoração",
  "detail": "Sinalização",
  "color": "#8c4340",
  "tags": "bandeira tecido"
 },
 {
  "kind": "statue",
  "name": "Estátua",
  "category": "Decoração",
  "detail": "Esculturas",
  "color": "#b8bba6",
  "tags": "pedra monumento"
 },
 {
  "kind": "chest",
  "name": "Baú",
  "category": "Masmorra",
  "detail": "Tesouros",
  "color": "#a8814f",
  "tags": "tesouro baú madeira metal"
 },
 {
  "kind": "cart",
  "name": "Carrinho",
  "category": "Acampamento",
  "detail": "Suprimentos",
  "color": "#94714c",
  "tags": "carroça transporte madeira"
 },
 {
  "kind": "crate",
  "name": "Caixote",
  "category": "Decoração",
  "detail": "Recipientes",
  "color": "#ae8257",
  "tags": "caixa madeira"
 },
 {
  "kind": "barrel",
  "name": "Barril",
  "category": "Decoração",
  "detail": "Recipientes",
  "color": "#aa895e",
  "tags": "madeira cerveja"
 },
 {
  "kind": "cube",
  "name": "Cubo",
  "category": "Básicos",
  "detail": "Primitivas",
  "color": "#a7bf99",
  "tags": "cubo"
 },
 {
  "kind": "sphere",
  "name": "Esfera",
  "category": "Básicos",
  "detail": "Primitivas",
  "color": "#d5b68c",
  "tags": "esfera"
 },
 {
  "kind": "cylinder",
  "name": "Cilindro",
  "category": "Básicos",
  "detail": "Primitivas",
  "color": "#9eafa9",
  "tags": "cilindro"
 },
 {
  "kind": "willow",
  "name": "Salgueiro",
  "category": "Natureza",
  "detail": "Árvores",
  "color": "#87a376",
  "tags": "folhagem pendente raízes floresta",
  "isNew": true
 },
 {
  "kind": "fern",
  "name": "Samambaia",
  "category": "Natureza",
  "detail": "Plantas",
  "color": "#7e9d5a",
  "tags": "folhas floresta vegetação",
  "isNew": true
 },
 {
  "kind": "flowers",
  "name": "Flores silvestres",
  "category": "Natureza",
  "detail": "Plantas",
  "color": "#d6b3d0",
  "tags": "pétalas jardim campo",
  "isNew": true
 },
 {
  "kind": "stump",
  "name": "Toco de árvore",
  "category": "Natureza",
  "detail": "Rochas e troncos",
  "color": "#b18b5d",
  "tags": "madeira anéis raízes",
  "isNew": true
 },
 {
  "kind": "boulder",
  "name": "Rocha musgosa",
  "category": "Natureza",
  "detail": "Rochas e troncos",
  "color": "#96a48c",
  "tags": "pedra musgo floresta",
  "isNew": true
 },
 {
  "kind": "reeds",
  "name": "Juncos",
  "category": "Natureza",
  "detail": "Plantas",
  "color": "#8a9b58",
  "tags": "água lago pântano taboa",
  "isNew": true
 },
 {
  "kind": "cottage",
  "name": "Casa enxaimel",
  "category": "Construções",
  "detail": "Edificações",
  "color": "#c4b99b",
  "tags": "vila casa madeira telhas chaminé",
  "isNew": true
 },
 {
  "kind": "gate",
  "name": "Portão reforçado",
  "category": "Construções",
  "detail": "Paredes e portões",
  "color": "#916c4a",
  "tags": "porta madeira ferro ferragens",
  "isNew": true
 },
 {
  "kind": "stonewall",
  "name": "Parede de cantaria",
  "category": "Construções",
  "detail": "Paredes e portões",
  "color": "#a2ac97",
  "tags": "pedra tijolos musgo muralha",
  "isNew": true
 },
 {
  "kind": "woodfloor",
  "name": "Piso de madeira",
  "category": "Construções",
  "detail": "Pisos e escadas",
  "color": "#b18b5d",
  "tags": "tábuas assoalho",
  "isNew": true
 },
 {
  "kind": "palisade",
  "name": "Paliçada",
  "category": "Construções",
  "detail": "Cercas",
  "color": "#92704b",
  "tags": "fortificação madeira estacas",
  "isNew": true
 },
 {
  "kind": "dock",
  "name": "Cais de madeira",
  "category": "Construções",
  "detail": "Pontes e cais",
  "color": "#a68b63",
  "tags": "porto doca água corda",
  "isNew": true
 },
 {
  "kind": "table",
  "name": "Mesa de taverna",
  "category": "Mobiliário",
  "detail": "Mesas e balcões",
  "color": "#a38459",
  "tags": "madeira refeição jantar",
  "isNew": true
 },
 {
  "kind": "chair",
  "name": "Cadeira de madeira",
  "category": "Mobiliário",
  "detail": "Assentos",
  "color": "#967347",
  "tags": "cadeira taverna",
  "isNew": true
 },
 {
  "kind": "bench",
  "name": "Banco comprido",
  "category": "Mobiliário",
  "detail": "Assentos",
  "color": "#a8885d",
  "tags": "madeira taverna",
  "isNew": true
 },
 {
  "kind": "bed",
  "name": "Cama da estalagem",
  "category": "Mobiliário",
  "detail": "Camas",
  "color": "#8b9d89",
  "tags": "quarto tecido cobertor travesseiro",
  "isNew": true
 },
 {
  "kind": "bookshelf",
  "name": "Estante de livros",
  "category": "Mobiliário",
  "detail": "Estantes",
  "color": "#a28c63",
  "tags": "biblioteca livros magia madeira",
  "isNew": true
 },
 {
  "kind": "counter",
  "name": "Balcão de madeira",
  "category": "Mobiliário",
  "detail": "Mesas e balcões",
  "color": "#a27a4f",
  "tags": "loja taverna recepção",
  "isNew": true
 },
 {
  "kind": "bedroll",
  "name": "Saco de dormir",
  "category": "Acampamento",
  "detail": "Abrigo",
  "color": "#819483",
  "tags": "cama cobertor colchão tecido",
  "isNew": true
 },
 {
  "kind": "cookingpot",
  "name": "Caldeirão no tripé",
  "category": "Acampamento",
  "detail": "Cozinha",
  "color": "#686c61",
  "tags": "panela fogo comida metal",
  "isNew": true
 },
 {
  "kind": "supplystack",
  "name": "Pilha de provisões",
  "category": "Acampamento",
  "detail": "Suprimentos",
  "color": "#a38b63",
  "tags": "caixa saco madeira acampamento",
  "isNew": true
 },
 {
  "kind": "torch",
  "name": "Tocha de chão",
  "category": "Iluminação",
  "detail": "Tochas e braseiros",
  "color": "#e3a45f",
  "tags": "fogo luz madeira",
  "isNew": true
 },
 {
  "kind": "brazier",
  "name": "Braseiro de ferro",
  "category": "Iluminação",
  "detail": "Tochas e braseiros",
  "color": "#c58c50",
  "tags": "fogo luz metal",
  "isNew": true
 },
 {
  "kind": "candles",
  "name": "Candelabro",
  "category": "Iluminação",
  "detail": "Velas",
  "color": "#d1b778",
  "tags": "vela luz latão",
  "isNew": true
 },
 {
  "kind": "cage",
  "name": "Jaula de ferro",
  "category": "Masmorra",
  "detail": "Grades",
  "color": "#7e8b86",
  "tags": "prisão cela metal",
  "isNew": true
 },
 {
  "kind": "sarcophagus",
  "name": "Sarcófago",
  "category": "Masmorra",
  "detail": "Criptas",
  "color": "#b0b9a4",
  "tags": "túmulo morto pedra",
  "isNew": true
 },
 {
  "kind": "spikes",
  "name": "Armadilha de estacas",
  "category": "Masmorra",
  "detail": "Armadilhas",
  "color": "#929f99",
  "tags": "espinhos perigo ferro",
  "isNew": true
 },
 {
  "kind": "gravestone",
  "name": "Lápide antiga",
  "category": "Masmorra",
  "detail": "Criptas",
  "color": "#a2ad99",
  "tags": "cemitério túmulo pedra musgo",
  "isNew": true
 },
 {
  "kind": "marketstall",
  "name": "Banca de mercado",
  "category": "Decoração",
  "detail": "Comércio",
  "color": "#acb298",
  "tags": "loja feira frutas tecido madeira",
  "isNew": true
 },
 {
  "kind": "weaponrack",
  "name": "Suporte de armas",
  "category": "Decoração",
  "detail": "Equipamentos",
  "color": "#a3aca0",
  "tags": "espadas armaria metal madeira",
  "isNew": true
 },
 {
  "kind": "pots",
  "name": "Vasos de cerâmica",
  "category": "Decoração",
  "detail": "Recipientes",
  "color": "#bc916f",
  "tags": "potes jarros barro",
  "isNew": true
 },
 {
  "kind": "signpost",
  "name": "Placa de direção",
  "category": "Decoração",
  "detail": "Sinalização",
  "color": "#b09a70",
  "tags": "caminho madeira sinal",
  "isNew": true
 }
];

export const normalizeSearch=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
export function matchesSearch(text:string,query:string){const haystack=normalizeSearch(text);return normalizeSearch(query).split(/\s+/).filter(Boolean).every(term=>haystack.includes(term))}
export function filterCatalog(category:Category,subtype:string,query:string){return catalog.filter(a=>(category==='Todos'||a.category===category)&&(subtype==='Todos'||a.detail===subtype)&&matchesSearch(`${a.name} ${a.category} ${a.detail} ${a.tags}`,query))}
export function catalogSubtypes(category:Category){if(category==='Importados')return ['Modelos pessoais'];return [...new Set(catalog.filter(a=>category==='Todos'||a.category===category).map(a=>a.detail))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
