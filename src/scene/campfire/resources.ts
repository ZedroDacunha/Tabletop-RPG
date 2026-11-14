import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {CampfireConfig} from './config';
import {particleVertex, particleFragment, emberVertex, emberFragment, glowVertex, glowFragment} from './shaders';

const BASE = {ringRadius: .87, stoneSize: .24, logRadius: .12, logLength: 1.4, emberSize: .085, textureSize: 64};
function random(seed: number) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
}
/** Duas máscaras RGBA geradas na CPU, sem DOM, rede ou arquivos externos. */
function mask(flame: boolean) {
  const side = BASE.textureSize, pixels = new Uint8Array(side * side * 4);
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const u = x / (side - 1), v = y / (side - 1);
    const radius = Math.hypot(u * 2 - 1, v * 2 - 1);
    const alpha = flame
      ? Math.exp(-Math.pow((u - .5) / (.28 * (1 - v) + .035), 2) * 2) * Math.pow(Math.sin(v * Math.PI), .7)
      : Math.pow(Math.max(0, 1 - radius), 2);
    const offset = (y * side + x) * 4;
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
    pixels[offset + 3] = Math.round(alpha * 255);
  }
  const texture = new T.DataTexture(pixels, side, side, T.RGBAFormat);
  texture.colorSpace = T.NoColorSpace;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.magFilter = T.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
function particles(count: number) {
  const plane = new T.PlaneGeometry(1, 1);
  const geometry = new T.InstancedBufferGeometry();
  geometry.index = plane.index;
  geometry.attributes = {...plane.attributes};
  const data = new Float32Array(count * 4), rand = random(471);
  for (let i = 0; i < count; i++) data.set([i / Math.max(count, 1), rand(), Math.sqrt(rand()), rand() * Math.PI * 2], i * 4);
  geometry.setAttribute('aParticle', new T.InstancedBufferAttribute(data, 4));
  geometry.instanceCount = count;
  plane.dispose();
  return geometry;
}
function bake(source: T.BufferGeometry, position: T.Vector3, rotation: T.Euler, scale: T.Vector3, tint: T.Color) {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  const matrix = new T.Matrix4().compose(position, new T.Quaternion().setFromEuler(rotation), scale);
  geometry.applyMatrix4(matrix);
  const colors = new Float32Array(geometry.getAttribute('position').count * 3);
  for (let i = 0; i < colors.length; i += 3) colors.set([tint.r, tint.g, tint.b], i);
  geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
  return geometry;
}
function base(config: CampfireConfig) {
  const solids: T.BufferGeometry[] = [], coals: T.BufferGeometry[] = [];
  const stone = new T.DodecahedronGeometry(1, 0), log = new T.CylinderGeometry(BASE.logRadius * .85, BASE.logRadius, BASE.logLength, 7);
  const cap = new T.CylinderGeometry(BASE.logRadius * .81, BASE.logRadius * .81, .012, 7);
  const rand = random(1051), p = new T.Vector3(), r = new T.Euler(), s = new T.Vector3(), tint = new T.Color();
  for (let i = 0; i < config.stoneCount; i++) {
    const angle = i * Math.PI * 2 / config.stoneCount, variation = .85 + rand() * .3;
    p.set(Math.cos(angle) * BASE.ringRadius, .16, Math.sin(angle) * BASE.ringRadius);
    r.set(rand() * .4, rand() * Math.PI, rand() * .4);
    s.set(BASE.stoneSize * variation, .19 * variation, .22 * variation);
    solids.push(bake(stone, p, r, s, tint.set(config.stoneColor).multiplyScalar(.8 + rand() * .35)));
  }
  for (let i = 0; i < config.logCount; i++) {
    const angle = i * Math.PI / config.logCount, height = .19 + i * .038;
    p.set(0, height, 0); r.set(Math.PI / 2, 0, angle); s.set(1, 1, 1);
    solids.push(bake(log, p, r, s, tint.set(config.woodColor).multiplyScalar(.8 + rand() * .4)));
    const direction = new T.Vector3(0, 1, 0).applyEuler(r);
    for (const end of [-1, 1]) {
      p.copy(direction).multiplyScalar(end * BASE.logLength / 2); p.y += height;
      solids.push(bake(cap, p, r, s, tint.set('#a0784e')));
    }
  }
  for (let i = 0; i < config.emberCount; i++) {
    const angle = rand() * Math.PI * 2, radius = Math.sqrt(rand()) * .55;
    p.set(Math.cos(angle) * radius, .09, Math.sin(angle) * radius);
    r.set(rand(), rand(), rand()); s.set(BASE.emberSize * (1 + rand()), .055, BASE.emberSize);
    coals.push(bake(stone, p, r, s, tint.setScalar(.6 + rand() * .4)));
  }
  const solidGeometry = mergeGeometries(solids)!, emberGeometry = mergeGeometries(coals)!;
  for (const geometry of [...solids, ...coals, stone, log, cap]) geometry.dispose();
  return {solidGeometry, emberGeometry};
}
function uniforms(extra: Record<string, T.IUniform>) {
  // Clonar somente os uniforms de fog; clonar os extras duplicaria texturas.
  return {...T.UniformsUtils.clone(T.UniformsLib.fog), ...extra};
}
function makeResources(c: CampfireConfig) {
  const flameTexture = mask(true), radialTexture = mask(false);
  const common = {transparent: true, depthWrite: false, fog: true, toneMapped: false, side: T.DoubleSide};
  const particleMaterial = (kind: number) => new T.ShaderMaterial({
    ...common, blending: kind === 2 ? T.NormalBlending : T.AdditiveBlending,
    vertexShader: particleVertex, fragmentShader: particleFragment,
    uniforms: uniforms({
      uMask: {value: kind === 0 ? flameTexture : radialTexture},
      uTime: {value: 0}, uPower: {value: 1}, uFlicker: {value: 1}, uKind: {value: kind},
      uSpeed: {value: 1}, uLifetime: {value: 1}, uHeight: {value: 1}, uWidth: {value: 1},
      uSpread: {value: 1}, uSway: {value: 1}, uWind: {value: new T.Vector2()}, uOpacity: {value: 1},
      uCore: {value: new T.Color()}, uMiddle: {value: new T.Color()}, uTip: {value: new T.Color()},
    }),
  });
  return {
    ...base(c), flameGeometry: particles(c.flameCount), sparkGeometry: particles(c.sparkCount), smokeGeometry: particles(c.smokeCount),
    glowGeometry: new T.PlaneGeometry(2, 2),
    solidMaterial: new T.MeshStandardMaterial({vertexColors: true, roughness: .95, flatShading: true}),
    flameMaterial: particleMaterial(0), sparkMaterial: particleMaterial(1), smokeMaterial: particleMaterial(2),
    emberMaterial: new T.ShaderMaterial({vertexColors: true, fog: true, vertexShader: emberVertex, fragmentShader: emberFragment,
      uniforms: uniforms({uMask: {value: radialTexture}, uColor: {value: new T.Color()}, uPower: {value: 1}, uFlicker: {value: 1}, uEmission: {value: 1}})}),
    glowMaterial: new T.ShaderMaterial({...common, blending: T.AdditiveBlending, vertexShader: glowVertex, fragmentShader: glowFragment,
      uniforms: uniforms({uMask: {value: radialTexture}, uColor: {value: new T.Color()}, uPower: {value: 1}, uFlicker: {value: 1}, uOpacity: {value: 1}})}),
    flameTexture, radialTexture,
  };
}
export type Resources = ReturnType<typeof makeResources>;
const cache = new Map<string, {references: number; resources: Resources}>();
export function acquireResources(c: CampfireConfig) {
  const key = JSON.stringify([c.stoneCount,c.logCount,c.emberCount,c.flameCount,c.sparkCount,c.smokeCount,c.woodColor,c.stoneColor]);
  let entry = cache.get(key);
  if (!entry) { entry = {references: 0, resources: makeResources(c)}; cache.set(key, entry); }
  entry.references++;
  return {key, resources: entry.resources};
}
export function releaseResources(key: string) {
  const entry = cache.get(key);
  if (!entry || --entry.references > 0) return;
  for (const resource of Object.values(entry.resources)) resource.dispose();
  cache.delete(key);
}
