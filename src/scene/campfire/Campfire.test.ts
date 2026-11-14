import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Campfire} from './Campfire';
import {CampfireLightPool} from './CampfireLightPool';

function prepare(mesh: T.Mesh) {
  mesh.onBeforeRender(null as unknown as T.WebGLRenderer, new T.Scene(), new T.PerspectiveCamera(), mesh.geometry, mesh.material as T.Material, new T.Group());
  return (mesh.material as T.ShaderMaterial).uniforms;
}
test('animação independente de FPS e intensidade suavizada', () => {
  const results = [30,60,144].map(fps => {
    const fire = new Campfire({seed: 7}); fire.setIntensity(2);
    for (let i = 0; i < fps * 2; i++) fire.update(1 / fps);
    const result = [fire.intensity, fire.light.intensity, fire.flicker]; fire.dispose(); return result;
  });
  for (const result of results) for (let i = 0; i < result.length; i++) assert.ok(Math.abs(result[i] - results[0][i]) < 1e-9);
});
test('chamas, brasas e luz compartilham oscilação contínua', () => {
  const fire = new Campfire(); let previous = fire.light.intensity;
  for (let i = 0; i < 600; i++) {
    fire.update(1 / 60);
    assert.ok(Math.abs(fire.light.intensity - previous) < .4); previous = fire.light.intensity;
    assert.ok(fire.flicker >= .78 && fire.flicker <= 1.22);
    assert.ok(fire.light.distance >= 4.6 && fire.light.distance <= 5.4);
    const flame = prepare(fire.getObjectByName('Chamas') as T.Mesh);
    const ember = prepare(fire.getObjectByName('Brasas') as T.Mesh);
    assert.equal(flame.uFlicker.value, fire.flicker); assert.equal(ember.uFlicker.value, fire.flicker);
  }
  fire.dispose();
});
test('compartilhamento com uniforms próprios e descarte na última referência', () => {
  const a = new Campfire({seed: 1}), b = new Campfire({seed: 2});
  const ma = a.getObjectByName('Chamas') as T.Mesh, mb = b.getObjectByName('Chamas') as T.Mesh;
  assert.equal(ma.geometry, mb.geometry); assert.equal(ma.material, mb.material);
  const timeA = prepare(ma).uTime.value, timeB = prepare(mb).uTime.value; assert.notEqual(timeA, timeB);
  let geometries = 0, textures = 0;
  ma.geometry.addEventListener('dispose', () => geometries++);
  const texture = (ma.material as T.ShaderMaterial).uniforms.uMask.value as T.Texture;
  texture.addEventListener('dispose', () => textures++);
  a.dispose(); assert.equal(geometries, 0); assert.equal(textures, 0);
  b.update(1 / 60); b.dispose(); b.dispose(); assert.equal(geometries, 1); assert.equal(textures, 1);
});
test('custo de geometria limitado e efeitos opcionais', () => {
  const fire = new Campfire(); let triangles = 0, calls = 0;
  fire.traverse(object => { if (!(object instanceof T.Mesh)) return; calls++;
    const geometry = object.geometry;
    triangles += (geometry.index?.count ?? geometry.attributes.position.count) / 3 * (geometry instanceof T.InstancedBufferGeometry ? geometry.instanceCount : 1);
  });
  assert.equal(calls, 6); assert.ok(triangles < 1800); assert.equal(fire.light.castShadow, false);
  const flame = fire.getObjectByName('Chamas') as T.Mesh<T.InstancedBufferGeometry, T.ShaderMaterial>;
  assert.equal(flame.geometry.instanceCount, 28); assert.equal(flame.material.depthWrite, false);
  assert.equal(flame.material.blending, T.AdditiveBlending);
  const small = new Campfire({smoke: false, sparkCount: 0});
  assert.equal(small.getObjectByName('Fumaça'), undefined); assert.equal(small.getObjectByName('Faíscas'), undefined);
  fire.dispose(); small.dispose();
});
test('validação, pausa longa, escala e extinção', () => {
  assert.throws(() => new Campfire({size: 0})); assert.throws(() => new Campfire({flameCount: -1}));
  const fire = new Campfire({size: 2}), twin = new Campfire({size: 2});
  assert.throws(() => fire.update(NaN)); assert.throws(() => fire.setPosition(Infinity,0,0));
  assert.throws(() => fire.setIntensity(NaN)); fire.update(40); twin.update(.1);
  assert.equal(fire.light.intensity, twin.light.intensity); assert.ok(fire.light.distance > 8);
  fire.setIntensity(0); for (let i = 0; i < 180; i++) fire.update(1 / 60);
  assert.equal(fire.light.intensity, 0); assert.equal(fire.getObjectByName('Chamas')!.visible, false);
  fire.dispose(); twin.dispose();
});
test('orçamento fixo de luzes respeita visibilidade e remove referências', () => {
  const scene = new T.Scene(), pool = new CampfireLightPool(3), camera = new T.PerspectiveCamera(70,1,.1,100);
  camera.position.set(0, 5, 12); camera.lookAt(0,0,0); scene.add(pool);
  const fires = Array.from({length: 8}, (_, i) => new Campfire().setPosition(i - 3,0,0));
  for (const fire of fires) { scene.add(fire); pool.register(fire); assert.equal(fire.light.parent, null); }
  for (let i = 0; i < 180; i++) pool.update(camera,1/60);
  assert.equal(pool.children.length,3);
  assert.deepEqual(pool.children.map(light => light.position.x).sort((a,b)=>a-b),[-1,0,1]);
  for (const fire of fires) fire.visible = false;
  for (let i = 0; i < 180; i++) pool.update(camera,1/60);
  assert.ok(pool.children.every(light => (light as T.PointLight).intensity === 0));
  pool.unregister(fires[0]); assert.equal(fires[0].light.parent, fires[0]);
  pool.dispose(); for (const fire of fires) { assert.equal(fire.light.parent, fire); fire.dispose(); }
  assert.equal(pool.parent,null);
});
