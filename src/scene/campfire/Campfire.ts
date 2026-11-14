import * as T from 'three';
import {resolveConfig, type CampfireOptions, type CampfireConfig} from './config';
import {acquireResources, releaseResources} from './resources';
export {CAMPFIRE_DEFAULTS} from './config';
export type {CampfireOptions, CampfireConfig} from './config';

const STOP_THRESHOLD = .001;
const FLICKER = {slow: 2.31, medium: 5.17, fast: 9.73, weightSlow: .52, weightMedium: .31, weightFast: .17};
/** Fogueira independente de React. Adicione diretamente com scene.add(fogueira). */
export class Campfire extends T.Group {
  readonly config: Readonly<CampfireConfig>;
  readonly light: T.PointLight;
  private readonly resourceKey: string;
  private readonly effects: T.Mesh[] = [];
  private readonly colors: T.Color[];
  private elapsed: number;
  private power: number;
  private targetPower: number;
  private pulse = 1;
  private dead = false;
  get disposed() { return this.dead; }
  get intensity() { return this.power; }
  get flicker() { return this.pulse; }

  constructor(options: CampfireOptions = {}) {
    super();
    this.name = 'Fogueira';
    this.config = resolveConfig(options);
    const c = this.config, {key, resources: r} = acquireResources(c);
    this.resourceKey = key;
    this.elapsed = ((c.seed * .61803398875) % 1 + 1) % 1 * 100;
    this.power = this.targetPower = c.intensity;
    this.scale.setScalar(c.size);
    this.colors = [c.coreColor,c.middleColor,c.tipColor,c.emberColor,c.smokeColor,c.lightWarmColor,c.lightHotColor].map(color => new T.Color(color));
    const solid = new T.Mesh(r.solidGeometry, r.solidMaterial);
    solid.name = 'Lenha e pedras'; solid.castShadow = solid.receiveShadow = true;
    this.add(solid);
    const ember = new T.Mesh(r.emberGeometry, r.emberMaterial);
    ember.name = 'Brasas';
    ember.onBeforeRender = () => {
      const u = r.emberMaterial.uniforms;
      u.uColor.value.copy(this.colors[3]); u.uPower.value = this.power;
      u.uFlicker.value = this.pulse; u.uEmission.value = c.emberEmission;
      r.emberMaterial.uniformsNeedUpdate = true;
    };
    this.add(ember);
    const glow = new T.Mesh(r.glowGeometry, r.glowMaterial);
    glow.name = 'Calor no chão'; glow.rotation.x = -Math.PI / 2;
    glow.position.y = .018; glow.scale.setScalar(c.glowRadius);
    glow.raycast = () => {};
    glow.onBeforeRender = () => {
      const u = r.glowMaterial.uniforms;
      u.uColor.value.copy(this.colors[1]); u.uPower.value = this.power;
      u.uFlicker.value = this.pulse; u.uOpacity.value = c.glowOpacity;
      r.glowMaterial.uniformsNeedUpdate = true;
    };
    this.add(glow); this.effects.push(glow);
    const addParticles = (kind: number, geometry: T.InstancedBufferGeometry, material: T.ShaderMaterial) => {
      const mesh = new T.Mesh(geometry, material);
      mesh.name = ['Chamas','Faíscas','Fumaça'][kind];
      // O deslocamento ocorre na GPU; a caixa original do quad não representa o efeito.
      mesh.frustumCulled = false; mesh.raycast = () => {};
      mesh.onBeforeRender = () => {
        const u = material.uniforms, smoke = kind === 2, spark = kind === 1;
        u.uTime.value = this.elapsed * c.speed; u.uPower.value = this.power; u.uFlicker.value = this.pulse;
        u.uSpeed.value = smoke ? .45 : spark ? .8 : 1;
        u.uLifetime.value = c.lifetime;
        u.uHeight.value = smoke ? c.smokeHeight : spark ? c.sparkHeight : c.flameHeight;
        u.uWidth.value = smoke ? c.smokeSize : spark ? c.sparkSize : c.flameWidth;
        u.uSpread.value = c.spread; u.uSway.value = c.sway;
        u.uWind.value.set(c.windX, c.windZ);
        u.uOpacity.value = smoke ? c.smokeOpacity : spark ? .85 : c.flameOpacity;
        u.uCore.value.copy(this.colors[smoke ? 4 : 0]);
        u.uMiddle.value.copy(this.colors[smoke ? 4 : 1]);
        u.uTip.value.copy(this.colors[smoke ? 4 : 2]);
        // Materiais compartilhados recebem os valores da instância antes de cada desenho.
        material.uniformsNeedUpdate = true;
      };
      this.add(mesh); this.effects.push(mesh);
    };
    addParticles(0, r.flameGeometry, r.flameMaterial);
    if (c.sparkCount) addParticles(1, r.sparkGeometry, r.sparkMaterial);
    if (c.smoke && c.smokeCount) addParticles(2, r.smokeGeometry, r.smokeMaterial);
    this.light = new T.PointLight(c.lightWarmColor, 0, c.lightDistance, c.lightDecay);
    this.light.position.y = c.lightHeight;
    this.light.castShadow = c.shadows;
    this.light.shadow.mapSize.setScalar(c.shadowMapSize);
    this.light.shadow.camera.near = .1;
    this.light.shadow.bias = -.001;
    this.add(this.light);
    this.update(0);
  }

  update(deltaTime: number) {
    if (this.dead) return;
    if (!Number.isFinite(deltaTime) || deltaTime < 0) throw new RangeError('deltaTime deve ser finito e não negativo');
    const c = this.config, dt = Math.min(deltaTime, c.maxDeltaTime);
    this.elapsed += dt;
    this.power += (this.targetPower - this.power) * (1 - Math.exp(-c.intensityResponse * dt));
    if (Math.abs(this.targetPower - this.power) < .0001) this.power = this.targetPower;
    const t = this.elapsed * c.speed * c.flickerSpeed;
    const wave = FLICKER.weightSlow * Math.sin(t * FLICKER.slow)
      + FLICKER.weightMedium * Math.sin(t * FLICKER.medium + 1.7)
      + FLICKER.weightFast * Math.sin(t * FLICKER.fast + 4.2);
    this.pulse = 1 + c.flickerAmplitude * wave;
    this.updateWorldMatrix(true, false);
    const scale = this.matrixWorld.getMaxScaleOnAxis();
    this.light.intensity = c.lightIntensity * this.power * this.pulse * scale * scale;
    this.light.distance = c.lightDistance * scale * (1 + c.radiusAmplitude * wave);
    this.light.color.copy(this.colors[5]).lerp(this.colors[6], (wave + 1) / 2);
    for (const effect of this.effects) effect.visible = this.power > STOP_THRESHOLD;
  }

  setPosition(x: number, y: number, z: number) {
    if (![x,y,z].every(Number.isFinite)) throw new RangeError('A posição deve ser finita');
    this.position.set(x, y, z); return this;
  }
  setIntensity(value: number) {
    if (!Number.isFinite(value)) throw new RangeError('A intensidade deve ser finita');
    this.targetPower = T.MathUtils.clamp(value, 0, this.config.maxIntensity); return this;
  }
  dispose() {
    if (this.dead) return;
    this.dead = true;
    this.removeFromParent(); this.light.removeFromParent(); this.light.dispose();
    this.clear(); this.effects.length = 0;
    releaseResources(this.resourceKey);
  }
}
