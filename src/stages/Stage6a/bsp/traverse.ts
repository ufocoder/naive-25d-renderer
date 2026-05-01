import { getPointSide } from "./geometry";
import type { BSPLeaf, BSPNode } from "./typings";

export function traverseBSPTree(
  node: BSPNode,
  camera: Camera,
  callback: (leaf: BSPLeaf) => void
): void {
  if (node.kind === 'leaf') {
    callback(node);
    return;
  }

  const side = getPointSide(node.splitter, { x: camera.x, y: camera.y });

  if (side <= 0) {
    traverseBSPTree(node.back, camera, callback);
    traverseBSPTree(node.front, camera, callback);
  } else {
    traverseBSPTree(node.front, camera, callback);
    traverseBSPTree(node.back, camera, callback);
  }
}

export function collectLeavesInOrder(node: BSPNode, camera: Camera): BSPLeaf[] {
  const result: BSPLeaf[] = [];
  traverseBSPTree(node, camera, (leaf) => result.push(leaf));
  return result;
}
