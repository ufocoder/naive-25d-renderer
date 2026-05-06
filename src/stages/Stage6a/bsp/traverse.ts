import { getPointSide } from "./geometry";
import type { BSPBranch, BSPLeaf, BSPNode } from "./typings";

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


function isLeaf(node: BSPNode): node is BSPLeaf {
  return node.kind === 'leaf';
}

export function findCameraSector(
  root: BSPNode,
  camera: Camera
): Sector | null {
  let currentNode: BSPNode = root;
  
  while (!isLeaf(currentNode)) {
    const branch = currentNode as BSPBranch;
    const side = getPointSide(branch.splitter, { x: camera.x, y: camera.y });

    if (side >= 0) {
      currentNode = branch.front;
    } else {
      currentNode = branch.back;
    }
  }

  const leaf = currentNode as BSPLeaf;

  if (leaf.segs.length === 0) {
    return null;
  }

  return leaf.segs[0].frontSector!;
}