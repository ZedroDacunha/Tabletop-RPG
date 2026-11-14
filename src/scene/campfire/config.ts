/** Configuração única; medidas locais em unidades do mapa e tempos em segundos. */
export const CAMPFIRE_DEFAULTS = Object.freeze({
  size: 1, intensity: 1, seed: 1,
  stoneCount: 10, logCount: 5, emberCount: 14,
  flameCount: 28, sparkCount: 8, smokeCount: 6, smoke: true,
  speed: .8, lifetime: 1.4, flameHeight: 1.55, flameWidth: .48,
  spread: .32, sway: .14, flameOpacity: .38,
  sparkSize: .035, sparkHeight: 2.5,
  smokeOpacity: .055, smokeSize: .65, smokeHeight: 2.9,
  windX: .1, windZ: .04,
  coreColor: '#fff1b0', middleColor: '#ff8b20', tipColor: '#8d2108',
  emberColor: '#ff5b0a', smokeColor: '#77746e', woodColor: '#4d3022', stoneColor: '#797e72',
  lightIntensity: 9, lightDistance: 5, lightHeight: .85, lightDecay: 2,
  lightWarmColor: '#ff7824', lightHotColor: '#ffbd60',
  flickerAmplitude: .22, flickerSpeed: 1, radiusAmplitude: .08,
  emberEmission: 2.1, glowOpacity: .19, glowRadius: 1.6,
  shadows: false, shadowMapSize: 256,
  maxIntensity: 3, intensityResponse: 4, maxDeltaTime: .1,
  maxActiveLights: 3, lightFadeSpeed: 6,
});
export type CampfireConfig = {-readonly [K in keyof typeof CAMPFIRE_DEFAULTS]:
  typeof CAMPFIRE_DEFAULTS[K] extends number ? number :
  typeof CAMPFIRE_DEFAULTS[K] extends boolean ? boolean : string};
// O orçamento pertence ao gerenciador, não a uma fogueira individual.
export type CampfireOptions = Partial<Omit<CampfireConfig, 'maxActiveLights'>>;
export function resolveConfig(options: CampfireOptions): Readonly<CampfireConfig> {
  const config: CampfireConfig = {...CAMPFIRE_DEFAULTS, ...options};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError(`${key} deve ser finito`);
    if (typeof value === 'number' && !['windX','windZ','seed'].includes(key) && value < 0) throw new RangeError(`${key} não pode ser negativo`);
  }
  for (const key of ['size','lifetime','maxIntensity','intensityResponse','maxDeltaTime','lightFadeSpeed'] as const) {
    if (config[key] <= 0) throw new RangeError(`${key} deve ser positivo`);
  }
  for (const key of ['stoneCount','logCount','emberCount','flameCount','sparkCount','smokeCount'] as const) {
    if (!Number.isInteger(config[key]) || config[key] > 128) throw new RangeError(`${key}: use inteiro de 0 a 128`);
  }
  if (config.stoneCount < 3 || config.logCount < 2 || config.emberCount < 1 || config.flameCount < 1) throw new RangeError('Base e chama precisam de geometria');
  for (const key of ['flameOpacity','smokeOpacity','glowOpacity','flickerAmplitude','radiusAmplitude'] as const) {
    if (config[key] > 1) throw new RangeError(`${key}: use valor entre 0 e 1`);
  }
  if (![128,256,512,1024].includes(config.shadowMapSize)) throw new RangeError('shadowMapSize: 128, 256, 512 ou 1024');
  config.intensity = Math.min(config.intensity, config.maxIntensity);
  return Object.freeze(config);
}
