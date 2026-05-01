import { buildBSPTree } from "../bsp/build";
import { uniquePoints } from "../bsp/geometry";
import { collectLeavesInOrder } from "../bsp/traverse";
import type { BSPLeaf } from "../bsp/typings";

import settings1 from './single.sector.column';
import settings2 from './single.sector.pyramid';
import settings3 from './sectors.column';
import settings4 from './sectors.pyramid';
import settings5 from './sectors.corridor';
const settingsSet: Settings[] = [settings1, settings2, settings3, settings4, settings5];

export let testsPassed = true;

for (const settings of settingsSet) {
  const bspTree = buildBSPTree(settings.level.linedefs);
  const leaves = collectLeavesInOrder(bspTree, settings.camera);

  const extractPoints = (leaf: BSPLeaf) => uniquePoints(
    leaf.segs.map(seg => [seg.start, seg.end]).flat()
  );

  const isCorrect = leaves
    .map(leaf => extractPoints(leaf))
    .every(vertexes => vertexes.length === 4);
  
  if (!isCorrect) {
    testsPassed = false;
    break;
  }
}