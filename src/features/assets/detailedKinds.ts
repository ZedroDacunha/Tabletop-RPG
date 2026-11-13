export const DETAILED_KINDS = [
 'willow','fern','flowers','stump','boulder','reeds',
 'cottage','gate','stonewall','woodfloor','palisade','dock','tent',
 'table','chair','bench','bed','bookshelf','counter',
 'bedroll','cookingpot','supplystack','torch','brazier','candles',
 'cage','sarcophagus','spikes','gravestone','marketstall','weaponrack','pots','signpost',
] as const;
export type DetailedKind=typeof DETAILED_KINDS[number];
export const isDetailedKind=(kind:string):kind is DetailedKind=>(DETAILED_KINDS as readonly string[]).includes(kind);
