import { createMemo, type Accessor } from "solid-js";
import { buildBSPTree } from "@app/stages/Stage6a/bsp/build";

interface UseBspTreeProps<T> {
  settings: Accessor<T>;
}
export function useBspTree<T extends { level: Level }>({
  settings,
}: UseBspTreeProps<T>) {
  const linedefs = createMemo(() => settings().level.linedefs);
  const bspTree = createMemo(() => buildBSPTree(linedefs()));

  return bspTree;
}
