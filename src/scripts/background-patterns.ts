export type Point = [number, number];
export const patternKinds = ["hilbert", "zigzag", "maze", "segment"] as const;
export type PatternKind = (typeof patternKinds)[number];
type MazeEdge = [number, number];
interface MazeStep {
  edges: MazeEdge[];
  current: number;
}
interface MazeTrace {
  w: number;
  h: number;
  steps: MazeStep[];
  edges: MazeEdge[];
}
export interface SegmentNode {
  id: number;
  lo: number;
  hi: number;
  depth: number;
  sum: number;
  left: number;
  right: number;
}
interface SegmentStep {
  active: number;
  selected: number[];
  sum: number;
}
interface SegmentQuery {
  lo: number;
  hi: number;
  steps: SegmentStep[];
  selected: number[];
  sum: number;
}
interface SegmentTrace {
  values: number[];
  nodes: SegmentNode[];
  queries: SegmentQuery[];
}

export const zigzag: Point[] = [];
for (let sum = 0; sum <= 14; sum++) {
  const d: Point[] = [];
  for (let y = 0; y < 8; y++) {
    const x = sum - y;
    if (x >= 0 && x < 8) d.push([x, y]);
  }
  if (sum % 2 === 0) d.reverse();
  zigzag.push(...d);
}
export function hilbert(order: number): Point[] {
  const n = 2 ** order,
    points: Point[] = [];
  for (let d = 0; d < n * n; d++) {
    let x = 0,
      y = 0,
      t = d;
    for (let s = 1; s < n; s *= 2) {
      const rx = 1 & (t >> 1),
        ry = 1 & (t ^ rx);
      if (!ry) {
        if (rx) {
          x = s - 1 - x;
          y = s - 1 - y;
        }
        [x, y] = [y, x];
      }
      x += s * rx;
      y += s * ry;
      t = Math.floor(t / 4);
    }
    points.push([x, y]);
  }
  return points;
}
export const hilbertPoints = hilbert(5);
function seeded(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function mazeTrace(w = 15, h = 11): MazeTrace {
  const rand = seeded(4711),
    seen = new Set([0]),
    stack = [0],
    edges: MazeEdge[] = [],
    steps: MazeStep[] = [{ edges: [], current: 0 }];
  while (stack.length) {
    const at = stack.at(-1)!,
      x = at % w,
      y = Math.floor(at / w),
      next = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].filter(
        ([a, b]) => a >= 0 && a < w && b >= 0 && b < h && !seen.has(b * w + a),
      );
    if (next.length) {
      const [a, b] = next[Math.floor(rand() * next.length)],
        n = b * w + a;
      edges.push([at, n]);
      seen.add(n);
      stack.push(n);
    } else stack.pop();
    steps.push({ edges: edges.slice(), current: stack.at(-1) ?? at });
  }
  return { w, h, steps, edges };
}

export function segmentTreeTrace(): SegmentTrace {
  const values = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3],
    nodes: SegmentNode[] = [];
  function build(lo: number, hi: number, depth = 0): number {
    const id = nodes.length,
      node = { id, lo, hi, depth, sum: 0, left: -1, right: -1 };
    nodes.push(node);
    if (hi - lo === 1) node.sum = values[lo];
    else {
      const mid = (lo + hi) >> 1;
      node.left = build(lo, mid, depth + 1);
      node.right = build(mid, hi, depth + 1);
      node.sum = nodes[node.left].sum + nodes[node.right].sum;
    }
    return id;
  }
  build(0, values.length);
  const queries = [
    [2, 11],
    [5, 14],
    [1, 7],
    [0, 16],
  ].map(([lo, hi]) => {
    const selected: number[] = [],
      steps: SegmentStep[] = [{ active: -1, selected: [], sum: 0 }];
    let sum = 0;
    function visit(id: number): void {
      const n = nodes[id];
      steps.push({ active: id, selected: selected.slice(), sum });
      if (n.hi <= lo || n.lo >= hi) return;
      if (lo <= n.lo && n.hi <= hi) {
        selected.push(id);
        sum += n.sum;
        steps.push({ active: id, selected: selected.slice(), sum });
        return;
      }
      visit(n.left);
      visit(n.right);
    }
    visit(0);
    steps.push({ active: -1, selected: selected.slice(), sum });
    return { lo, hi, steps, selected: selected.slice(), sum };
  });
  return { values, nodes, queries };
}
