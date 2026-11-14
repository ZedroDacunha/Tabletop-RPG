import * as T from 'three';
import {Campfire, CAMPFIRE_DEFAULTS} from './Campfire';

/** Coloque este grupo diretamente na cena, sem transformar sua posição/escala. */
export class CampfireLightPool extends T.Group {
  private readonly fires = new Set<Campfire>();
  private readonly selected: (Campfire | null)[];
  private readonly distances: Float64Array;
  private readonly slots: {light: T.PointLight; fire: Campfire | null; gain: number}[];
  private readonly cameraPosition = new T.Vector3();
  private readonly positionScratch = new T.Vector3();
  private readonly frustum = new T.Frustum();
  private readonly projection = new T.Matrix4();
  private readonly sphere = new T.Sphere();
  private dead = false;

  constructor(readonly capacity = Number(CAMPFIRE_DEFAULTS.maxActiveLights)) {
    super();
    if (!Number.isInteger(capacity) || capacity < 0 || capacity > 8) throw new RangeError('Use de 0 a 8 luzes');
    this.selected = Array(capacity).fill(null);
    this.distances = new Float64Array(capacity);
    this.slots = Array.from({length: capacity}, () => {
      const light = new T.PointLight('#ff9a40', 0, 5, 2);
      light.castShadow = false;
      // Manter a contagem fixa evita recompilar shaders quando muda a seleção.
      this.add(light); return {light, fire: null, gain: 0};
    });
  }
  register(fire: Campfire) {
    if (this.dead || fire.disposed) return;
    this.fires.add(fire); fire.light.removeFromParent();
  }
  unregister(fire: Campfire) {
    if (!this.fires.delete(fire)) return;
    for (const slot of this.slots) if (slot.fire === fire) {
      slot.fire = null; slot.gain = 0; slot.light.intensity = 0;
    }
    if (!fire.disposed) fire.add(fire.light);
  }
  update(camera: T.Camera, deltaTime: number) {
    if (this.dead) return;
    const dt = Math.min(Math.max(Number.isFinite(deltaTime) ? deltaTime : 0, 0), CAMPFIRE_DEFAULTS.maxDeltaTime);
    camera.updateWorldMatrix(true, false);
    camera.getWorldPosition(this.cameraPosition);
    this.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projection);
    this.selected.fill(null); this.distances.fill(Infinity);
    for (const fire of this.fires) {
      if (fire.disposed || fire.intensity < .001 || !this.isVisible(fire)) continue;
      fire.updateWorldMatrix(true, false);
      // A luz original fica fora da árvore; sua posição continua local à fogueira.
      this.positionScratch.copy(fire.light.position).applyMatrix4(fire.matrixWorld);
      this.sphere.center.copy(this.positionScratch); this.sphere.radius = fire.light.distance;
      if (!this.frustum.intersectsSphere(this.sphere)) continue;
      const distance = this.cameraPosition.distanceToSquared(this.positionScratch);
      for (let i = 0; i < this.capacity; i++) if (distance < this.distances[i]) {
        for (let j = this.capacity - 1; j > i; j--) {
          this.distances[j] = this.distances[j - 1]; this.selected[j] = this.selected[j - 1];
        }
        this.distances[i] = distance; this.selected[i] = fire; break;
      }
    }
    for (const slot of this.slots) {
      const keep = slot.fire !== null && this.selected.includes(slot.fire);
      const response = slot.fire?.config.lightFadeSpeed ?? CAMPFIRE_DEFAULTS.lightFadeSpeed;
      slot.gain += ((keep ? 1 : 0) - slot.gain) * (1 - Math.exp(-response * dt));
      if (!keep && slot.gain < .005) {
        slot.fire = null; slot.gain = 0;
        for (const candidate of this.selected) {
          if (!candidate) continue;
          let used = false;
          for (const other of this.slots) if (other.fire === candidate) { used = true; break; }
          if (!used) { slot.fire = candidate; break; }
        }
      }
      const fire = slot.fire;
      if (!fire || fire.disposed) { slot.light.intensity = 0; continue; }
      slot.light.position.copy(fire.light.position).applyMatrix4(fire.matrixWorld);
      slot.light.color.copy(fire.light.color);
      slot.light.distance = fire.light.distance;
      slot.light.decay = fire.light.decay;
      slot.light.intensity = fire.light.intensity * slot.gain;
    }
  }
  private isVisible(object: T.Object3D) {
    let current: T.Object3D | null = object;
    while (current) { if (!current.visible) return false; current = current.parent; }
    return true;
  }
  dispose() {
    if (this.dead) return;
    this.dead = true;
    for (const fire of this.fires) if (!fire.disposed) fire.add(fire.light);
    this.fires.clear();
    for (const slot of this.slots) slot.light.dispose();
    this.clear(); this.removeFromParent();
  }
}
