// The seven Tetris shapes as [col,row] squares, and a fair 7-bag dealer.
export const SHAPES = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

const normalise = cells => {
  const mc = Math.min(...cells.map(c => c[0])), mr = Math.min(...cells.map(c => c[1]));
  return cells.map(([c, r]) => [c - mc, r - mr]);
};

// Rotate a shape 90° clockwise `times` times.
export function rotate(shape, times = 0) {
  let cells = shape.map(c => [...c]);
  for (let i = 0; i < ((times % 4) + 4) % 4; i++) cells = normalise(cells.map(([c, r]) => [-r, c]));
  return normalise(cells);
}

export function cellsAt(shape, rot, col, row) {
  return rotate(shape, rot).map(([c, r]) => [c + col, r + row]);
}

// Every shape once per seven deals, in random order (like modern Tetris).
export function createBag(rng = Math.random) {
  let bag = [];
  const refill = () => {
    bag = Object.keys(SHAPES);
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
  };
  const ensure = () => { if (!bag.length) refill(); };
  return {
    peek() { ensure(); return bag[bag.length - 1]; },
    next() { ensure(); return bag.pop(); },
  };
}
