// Square grid for the maze. Cell values: 0 open, -1 fixed obstacle, >0 block id.
export function createGrid(cols, rows) {
  return { cols, rows, cells: new Int32Array(cols * rows) };
}

const inGrid = (g, c, r) => c >= 0 && r >= 0 && c < g.cols && r < g.rows;
const idx = (g, c, r) => r * g.cols + c;
export const isOpen = (g, c, r) => inGrid(g, c, r) && g.cells[idx(g, c, r)] === 0;
const DIRS = [[1, 0], [0, -1], [0, 1], [-1, 0]];

export function setObstacles(g, cells) { cells.forEach(([c, r]) => { if (inGrid(g, c, r)) g.cells[idx(g, c, r)] = -1; }); }
export function placeBlock(g, cells, id) { cells.forEach(([c, r]) => { g.cells[idx(g, c, r)] = id; }); }

// Open up every square of the block with this id (a sold block). Returns how many squares were freed.
export function removeBlock(g, id) {
  if (!(id > 0)) return 0;
  let n = 0;
  for (let i = 0; i < g.cells.length; i++) if (g.cells[i] === id) { g.cells[i] = 0; n++; }
  return n;
}

// Steps to the goal from every open cell (-1 = no route). BFS over open cells.
export function distanceField(g, [gc, gr]) {
  const d = new Int32Array(g.cols * g.rows).fill(-1);
  if (!isOpen(g, gc, gr)) return d;
  const q = [[gc, gr]]; d[idx(g, gc, gr)] = 0;
  for (let h = 0; h < q.length; h++) {
    const [c, r] = q[h], nd = d[idx(g, c, r)] + 1;
    for (const [dc, dr] of DIRS) {
      const nc = c + dc, nr = r + dr;
      if (isOpen(g, nc, nr) && d[idx(g, nc, nr)] === -1) { d[idx(g, nc, nr)] = nd; q.push([nc, nr]); }
    }
  }
  return d;
}

// Can these cells become a block? Never off-grid, on something, on a monster,
// or in a way that cuts the spawn (or any monster) off from the goal.
export function canPlace(g, cells, { spawn, goal, occupied = [] }) {
  if (cells.some(([c, r]) => !inGrid(g, c, r))) return { ok: false, reason: 'off-grid' };
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  if (cells.some(([c, r]) => !isOpen(g, c, r) || same([c, r], spawn) || same([c, r], goal))) return { ok: false, reason: 'occupied' };
  if (cells.some(cell => occupied.some(o => same(o, cell)))) return { ok: false, reason: 'enemy' };
  const before = cells.map(([c, r]) => g.cells[idx(g, c, r)]);
  placeBlock(g, cells, 1);
  const d = distanceField(g, goal);
  cells.forEach(([c, r], i) => { g.cells[idx(g, c, r)] = before[i]; });
  const reachable = ([c, r]) => d[idx(g, c, r)] >= 0;
  if (!reachable(spawn) || occupied.some(o => !reachable(o))) return { ok: false, reason: 'blocks-path' };
  return { ok: true };
}

// Block squares with at least one open neighbour; the rest are walls.
export function edgeCells(g, cells) {
  return cells.filter(([c, r]) => DIRS.some(([dc, dr]) => isOpen(g, c + dc, r + dr)));
}

// Next cell one step closer to the goal (null at the goal or with no route).
export function nextCell(g, d, [c, r]) {
  const here = inGrid(g, c, r) ? d[idx(g, c, r)] : -1;
  if (here <= 0) return null;
  for (const [dc, dr] of DIRS) {
    const nc = c + dc, nr = r + dr;
    if (inGrid(g, nc, nr) && d[idx(g, nc, nr)] === here - 1) return [nc, nr];
  }
  return null;
}

export function routeFrom(g, d, start) {
  const route = [start];
  for (let cur = nextCell(g, d, start); cur; cur = nextCell(g, d, cur)) route.push(cur);
  return route;
}

// The route monsters would take from `start` if these cells became a block
// (null if they can't be placed there or would leave no route). The grid is left unchanged.
export function routeWith(g, cells, start, goal) {
  if (cells.some(([c, r]) => !isOpen(g, c, r))) return null;
  placeBlock(g, cells, 1);
  const d = distanceField(g, goal);
  const route = distAt(g, d, start) >= 0 ? routeFrom(g, d, start) : null;
  placeBlock(g, cells, 0);
  return route;
}

export const distAt = (g, d, [c, r]) => (inGrid(g, c, r) ? d[idx(g, c, r)] : -1);
