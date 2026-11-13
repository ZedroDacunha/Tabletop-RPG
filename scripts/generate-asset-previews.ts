/** Offline orthographic thumbnails from the exact 3D meshes. No GPU or external assets. */
import {writeFileSync} from 'node:fs';
import * as T from 'three';
import {TREE_KINDS,isTreeKind} from '../src/features/assets/treeKinds';
import {buildTreeModel} from '../src/scene/treeModels';
import {renderTreePreview} from './render-tree-preview';
import {buildDetailedModel} from '../src/scene/detailedModels';
import {DETAILED_KINDS} from '../src/features/assets/detailedKinds';
import {renderModelPreview} from './preview-raster';

const previews: Record<string, string> = {};
for (const kind of [...new Set<string>([...DETAILED_KINDS, ...TREE_KINDS])]) {
  if (isTreeKind(kind)) {
    previews[kind] = 'data:image/png;base64,' + renderTreePreview(buildTreeModel(kind)).toString('base64');
    continue;
  }
  const modelo = buildDetailedModel(kind);
  previews[kind] = 'data:image/png;base64,' + renderModelPreview(modelo).toString('base64');
  modelo.traverse((obj) => { if (obj instanceof T.Mesh) { obj.geometry.dispose(); const material = obj.material as T.MeshStandardMaterial; material.map?.dispose(); material.bumpMap?.dispose(); material.dispose(); } });
}
writeFileSync(new URL('../src/features/assets/modelPreviews.json', import.meta.url), JSON.stringify(previews));
console.log(`Generated ${Object.keys(previews).length} geometry previews`);
