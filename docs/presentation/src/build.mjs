// Builds the single-file deck: inlines the Nexios deck stylesheet, the wordmark and the screenshots.
// Usage: node src/build.mjs <path to the nexios-design skill folder> [extra output for a body-only copy]
import { readFileSync, writeFileSync } from 'node:fs';
const here = new URL('.', import.meta.url).pathname, skill = process.argv[2];
const b64 = (p, mime) => `data:${mime};base64,${readFileSync(p).toString('base64')}`;
const SHAPES = { I: [[0,0],[1,0],[2,0],[3,0]], O: [[0,0],[1,0],[0,1],[1,1]], T: [[0,0],[1,0],[2,0],[1,1]], S: [[1,0],[2,0],[0,1],[1,1]], Z: [[0,0],[1,0],[1,1],[2,1]], J: [[0,0],[0,1],[1,1],[2,1]], L: [[2,0],[0,1],[1,1],[2,1]] };
const tetro = Object.entries(SHAPES).map(([name, cells]) => {
  const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1, u = 18;
  return `<svg width="${w * u}" height="${h * u}" viewBox="0 0 ${w * u} ${h * u}" role="img" aria-label="${name} block">` +
    cells.map(([x, y]) => `<rect x="${x * u + 1}" y="${y * u + 1}" width="${u - 2}" height="${u - 2}" rx="2" fill="#1E293B"/>`).join('') + '</svg>';
}).join('');
let html = readFileSync(here + 'deck.src.html', 'utf8')
  .replace('/*ONBOARDING_CSS*/', () => readFileSync(skill + '/assets/onboarding.css', 'utf8'))
  .replace('<!--TETRO-->', () => tetro)
  .replaceAll('asset:wordmark', () => b64(skill + '/assets/nexios-wordmark-white.webp', 'image/webp'))
  .replace(/src="img\/([a-z]+\.jpg)"/g, (m, f) => `src="${b64(here + 'img/' + f, 'image/jpeg')}"`);
if (process.argv[3]) writeFileSync(process.argv[3], html);
writeFileSync(here + '../upside-defense-deck.html', '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n</head>\n<body>\n' + html + '</body>\n</html>\n');
console.log('built', (html.length / 1024).toFixed(0) + ' KB', 'slides:', (html.match(/class="ob-slide /g) || []).length, 'unresolved:', (html.match(/asset:|src="img\//g) || []).length);
