function getSegmentKey(seg: Seg): string {
  const x1 = Math.round(seg.start.x * 1000);
  const y1 = Math.round(seg.start.y * 1000);
  const x2 = Math.round(seg.end.x * 1000);
  const y2 = Math.round(seg.end.y * 1000);
  
  if (x1 < x2 || (x1 === x2 && y1 < y2)) {
    return `${x1},${y1}-${x2},${y2}`;
  } else {
    return `${x2},${y2}-${x1},${y1}`;
  }
}


export function removeDuplicateSegments(segs: Seg[]): Seg[] {
  const seen = new Map<string, Seg>();
  const result: Seg[] = [];
  
  for (const seg of segs) {
    const key = getSegmentKey(seg);
    
    if (!seen.has(key)) {
      seen.set(key, seg);
      result.push(seg);
    } else {
      const existing = seen.get(key)!;
      const isPortal = seg.isTwoSide && seg.backSector && seg.backSector !== seg.frontSector;
      const existingIsPortal = existing.isTwoSide && existing.backSector && existing.backSector !== existing.frontSector;

      if (isPortal && !existingIsPortal) {
        const index = result.findIndex(s => getSegmentKey(s) === key);
        if (index !== -1) {
          result[index] = seg;
          seen.set(key, seg);
        }
      }
    }
  }
  
  return result;
}
