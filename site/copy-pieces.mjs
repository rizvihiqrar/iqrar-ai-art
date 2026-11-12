// The pieces are hand-made pages (lost-tones/index.html) that the site must serve exactly as written, at their own addresses.
// The engine builds the Markdown pages into _site; this copies each folder named in site.json "copy" next to them.
//   npm run build            (runs build.mjs, then this)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** A stray file in a piece's folder (a draft, a hidden file, installed modules) is not part of the piece. */
export const isPieceFile = (inside) => !/(^|[\\/])(\.|~|node_modules([\\/]|$))/.test(inside);

/** Copies each folder in `names` from the repository into `out` (replacing what was there); a missing folder is an error, not a silent gap. */
export function copyPieces(names, out = path.join(root, '_site'), from = root) {
  for (const name of names) {
    const source = path.join(from, name);
    if (!fs.existsSync(path.join(source, 'index.html'))) throw new Error(`copy-pieces: ${name}/index.html does not exist`);
    fs.rmSync(path.join(out, name), { recursive: true, force: true });
    fs.cpSync(source, path.join(out, name), { recursive: true, filter: (f) => isPieceFile(path.relative(source, f)) });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = JSON.parse(fs.readFileSync(new URL('./site.json', import.meta.url), 'utf8'));
  copyPieces(config.copy ?? []);
  console.log(`Pieces copied: ${(config.copy ?? []).join(', ')}`);
}
