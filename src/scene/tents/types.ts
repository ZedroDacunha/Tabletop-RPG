/** Partes visíveis do modelo, preservadas para os consumidores existentes. */
export type ParteTenda = 'lona' | 'estrutura' | 'cordas' | 'estacas';
export type Acabamento = {cor: string; metal?: number; brilho?: number; fosco?: boolean; duplaFace?: boolean; textura?: 'trama' | 'costura' | 'remendo' | 'madeira-estrutura'};
export type Ponto = [number, number, number];

// Medidas e acabamentos do modelo de acampamento existente, em metros.
export const HALF_W = 1.24, HALF_D = 1.6, RIDGE = 2.18, EAVE = .62, DOOR_W = .52;
export const DOOR_H = 1.5;
export const lonaClara = '#cdba8c', lonaSombra = '#c1ad80', lonaCostura = '#9c895f', lonaRemendo = '#d8c79b';
export const madeira = '#7b5a3b', madeiraEscura = '#65482e', corda = '#a2906f';
