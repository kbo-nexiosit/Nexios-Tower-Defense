// The road from the Rift (left edge) to the NexiosIT office entrance (right).
export const ROAD = [
  { x: 0, y: 150 }, { x: 250, y: 150 }, { x: 250, y: 570 }, { x: 540, y: 570 },
  { x: 540, y: 220 }, { x: 820, y: 220 }, { x: 820, y: 540 }, { x: 1000, y: 540 },
  { x: 1000, y: 400 }, { x: 1080, y: 400 },
];

const segLen = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

export function roadLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += segLen(points[i - 1], points[i]);
  return total;
}

export function pointAt(points, distance) {
  let left = Math.max(0, distance);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], len = segLen(a, b);
    if (left < len) {
      const t = left / len;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, done: false };
    }
    left -= len;
  }
  const end = points[points.length - 1];
  return { x: end.x, y: end.y, done: true };
}
