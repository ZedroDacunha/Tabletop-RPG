// Exemplo completo: apenas Three.js e seus próprios addons, sem React.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Campfire} from '../../src/scene/campfire/Campfire';
import {CampfireLightPool} from '../../src/scene/campfire/CampfireLightPool';

function start() {
  const canvas = document.querySelector<HTMLCanvasElement>('#view')!;
  const message = document.querySelector<HTMLDivElement>('#message')!;
  const metrics = document.querySelector<HTMLOutputElement>('#metrics')!;
  const context = canvas.getContext('webgl2', {antialias: true});
  if (!context) {
    message.textContent = 'WebGL 2 indisponível neste navegador. Abra em um dispositivo com aceleração gráfica para testar o fogo.';
    metrics.textContent = 'Renderização 3D não iniciada.';
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select').forEach(control => control.disabled = true);
    return;
  }
  const renderer = new T.WebGLRenderer({canvas, context, antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const scene = new T.Scene(); scene.background = new T.Color('#101a16');
  const perspective = new T.PerspectiveCamera(45, 1, .1, 150);
  const orthographic = new T.OrthographicCamera(-10, 10, 10, -10, .1, 150);
  let camera: T.PerspectiveCamera | T.OrthographicCamera = perspective;
  camera.position.set(10, 9, 12);
  let controls = new OrbitControls(camera, canvas);
  controls.target.set(0, .5, 0); controls.enableDamping = true;
  scene.add(new T.HemisphereLight('#bbc9dc', '#302218', .65));
  const sun = new T.DirectionalLight('#dde6dd', .6); sun.position.set(5, 10, 4); scene.add(sun);
  const ground = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({color: '#52604a', roughness: .98}));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const pool = new CampfireLightPool(3); scene.add(pool);
  let fires: Campfire[] = [];
  const count = document.querySelector<HTMLSelectElement>('#count')!;
  const intensity = document.querySelector<HTMLInputElement>('#intensity')!;
  const smoke = document.querySelector<HTMLInputElement>('#smoke')!;
  const view = document.querySelector<HTMLSelectElement>('#camera')!;
  function populate() {
    for (const fire of fires) { pool.unregister(fire); fire.dispose(); }
    const total = Number(count.value), columns = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / columns);
    fires = Array.from({length: total}, (_, i) => {
      const fire = new Campfire({seed: i * 17 + 3, smoke: smoke.checked, intensity: Number(intensity.value)});
      fire.setPosition((i % columns - (columns - 1) / 2) * 3.6, 0, (Math.floor(i / columns) - (rows - 1) / 2) * 3.6);
      scene.add(fire); pool.register(fire); return fire;
    });
  }
  function resize() {
    const aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    perspective.aspect = aspect; perspective.updateProjectionMatrix();
    orthographic.left = -10 * aspect; orthographic.right = 10 * aspect; orthographic.updateProjectionMatrix();
  }
  function changeCamera() {
    controls.dispose(); camera = view.value === 'ortho' ? orthographic : perspective;
    if (view.value === 'top') camera.position.set(.001, 18, .001); else camera.position.set(10, 9, 12);
    controls = new OrbitControls(camera, canvas); controls.target.set(0, .5, 0); controls.enableDamping = true;
    resize(); controls.update();
  }
  const changeIntensity = () => { for (const fire of fires) fire.setIntensity(Number(intensity.value)); };
  count.addEventListener('change', populate); smoke.addEventListener('change', populate);
  intensity.addEventListener('input', changeIntensity); view.addEventListener('change', changeCamera);
  window.addEventListener('resize', resize); populate(); resize();
  let previous = performance.now(), sampleTime = previous, frames = 0;
  renderer.setAnimationLoop(now => {
    const deltaTime = Math.min((now - previous) / 1000, .1); previous = now;
    if (document.hidden) { sampleTime = now; frames = 0; return; }
    for (const fire of fires) fire.update(deltaTime);
    controls.update(); pool.update(camera, deltaTime); renderer.render(scene, camera); frames++;
    if (now - sampleTime >= 1000) {
      metrics.textContent = `${Math.round(frames * 1000 / (now - sampleTime))} FPS · ${renderer.info.render.calls} desenhos · ${renderer.info.render.triangles.toLocaleString('pt-BR')} triângulos · até 3 luzes`;
      frames = 0; sampleTime = now;
    }
  });
  window.addEventListener('pagehide', () => {
    renderer.setAnimationLoop(null); controls.dispose(); pool.dispose();
    for (const fire of fires) fire.dispose();
    ground.geometry.dispose(); ground.material.dispose(); renderer.dispose();
    window.removeEventListener('resize', resize);
    count.removeEventListener('change', populate); smoke.removeEventListener('change', populate);
    intensity.removeEventListener('input', changeIntensity); view.removeEventListener('change', changeCamera);
  }, {once: true});
}
start();
