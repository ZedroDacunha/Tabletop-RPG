import {createContext, useContext, useEffect, useId, useRef, type ReactNode} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import * as T from 'three';
import {Campfire, CAMPFIRE_DEFAULTS} from './Campfire';
import {CampfireLightPool} from './CampfireLightPool';

type Registry = {pool: CampfireLightPool | null; fires: Set<Campfire>};
const Context = createContext<Registry | null>(null);
export function CampfireLighting({children, enabled = true}: {children: ReactNode; enabled?: boolean}) {
  const registry = useRef<Registry>({pool: null, fires: new Set()});
  const {scene, invalidate} = useThree();
  useEffect(() => {
    if (!enabled) return;
    const pool = new CampfireLightPool(); registry.current.pool = pool; scene.add(pool);
    for (const fire of registry.current.fires) pool.register(fire);
    invalidate();
    return () => { pool.dispose(); registry.current.pool = null; };
  }, [enabled, scene, invalidate]);
  useFrame(({camera}, delta) => registry.current.pool?.update(camera, delta), -.5);
  return <Context.Provider value={registry.current}>{children}</Context.Provider>;
}
export function CampfireModel() {
  const holder = useRef<T.Group>(null), fire = useRef<Campfire | null>(null);
  const registry = useContext(Context), id = useId(), invalidate = useThree(state => state.invalidate);
  useEffect(() => {
    let seed = 17;
    for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
    const instance = new Campfire({seed}); fire.current = instance; holder.current?.add(instance);
    registry?.fires.add(instance); registry?.pool?.register(instance);
    const resume = () => { if (!document.hidden) invalidate(); };
    document.addEventListener('visibilitychange', resume); invalidate();
    // Instâncias novas por efeito também suportam a remontagem do React StrictMode.
    return () => {
      document.removeEventListener('visibilitychange', resume);
      registry?.pool?.unregister(instance); registry?.fires.delete(instance);
      instance.dispose(); fire.current = null;
    };
  }, [id, registry, invalidate]);
  useFrame((_, delta) => {
    const instance = fire.current;
    if (!instance || document.hidden) return;
    let object: T.Object3D | null = instance;
    while (object) { if (!object.visible) return; object = object.parent; }
    instance.update(Math.min(delta, CAMPFIRE_DEFAULTS.maxDeltaTime));
    // O editor usa renderização sob demanda; animar apenas enquanto houver fogo visível.
    invalidate();
  }, -1);
  return <group ref={holder} dispose={null}/>;
}
