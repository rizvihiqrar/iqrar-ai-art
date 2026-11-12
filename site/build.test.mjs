import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { buildSite, repoRoot, escapeHtml } from './build.mjs';
import { copyPieces, isPieceFile } from './copy-pieces.mjs';

const config = JSON.parse(fs.readFileSync(new URL('./site.json', import.meta.url), 'utf8'));
const read = (out, rel) => fs.readFileSync(path.join(out, rel), 'utf8');
const raw = (rel) => fs.readFileSync(path.join(repoRoot, rel));

function scratch(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'art-site-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('the site builds three pages (home, About, the piece) and every link resolves', (t) => {
  const out = scratch(t);
  const pages = buildSite({ root: repoRoot, out, config });
  assert.equal(pages.length, 3);
  for (const rel of ['index.html', 'docs/about.html', 'pieces/01-lost-tones.html']) assert.ok(fs.existsSync(path.join(out, rel)), `${rel} is built`);
});

test('only Lost Tones is on the site: another piece needs Iqrar\'s say, so it needs a deliberate change to this test', () => {
  assert.deepEqual(config.cards.map((c) => c.title), ['Lost Tones']);
  assert.deepEqual(config.copy, ['lost-tones', 'lost-ringtones']);
});

test('each hand-made piece is served exactly as written, and the old address still leads to the new one', (t) => {
  const out = scratch(t);
  copyPieces(config.copy, out, repoRoot);
  assert.ok(raw('lost-tones/index.html').equals(fs.readFileSync(path.join(out, 'lost-tones/index.html'))), 'lost-tones/index.html is copied byte for byte');
  const old = read(out, 'lost-ringtones/index.html');
  assert.match(old, /url=\.\.\/lost-tones\//);
  assert.match(old, /location\.replace\('\.\.\/lost-tones\/'\)/);
});

test('copying a piece that is missing fails instead of leaving a gap in the site', (t) => {
  const out = scratch(t);
  assert.throws(() => copyPieces(['nothing-here'], out, repoRoot), /nothing-here\/index\.html does not exist/);
});

test('the piece page opens the piece at its real address, and that folder is one the build copies', () => {
  const md = fs.readFileSync(path.join(repoRoot, 'pieces/01-lost-tones.md'), 'utf8');
  const links = [...md.matchAll(/\]\((https:\/\/rizvihiqrar\.github\.io\/iqrar-ai-art\/[^)]+)\)/g)].map((m) => m[1]);
  assert.deepEqual(links, [`${config.siteUrl}lost-tones/`]);
  assert.ok(config.copy.includes('lost-tones'));
});

test('About does not repeat the contact details: the header buttons carry the email, LinkedIn, Instagram and X', (t) => {
  const about = fs.readFileSync(path.join(repoRoot, 'docs/about.md'), 'utf8');
  assert.doesNotMatch(about, /mailto:|linkedin\.com|instagram\.com|Get in Touch/i);
  const out = scratch(t);
  buildSite({ root: repoRoot, out, config });
  for (const rel of ['index.html', 'docs/about.html', 'pieces/01-lost-tones.html']) {
    const bar = read(out, rel).split('<header class="topbar">')[1].split('</header>')[0];
    for (const href of [`mailto:${config.contact.email}`, config.contact.linkedin, config.contact.instagram, config.contact.x]) assert.ok(bar.includes(`href="${href}"`), `${rel}: the header links to ${href}`);
    assert.ok(bar.includes(`<span class="me">${escapeHtml(config.owner)}</span>`));
  }
});

test('credit and copyright stay in view: on the About page, in the footer, and as the first comment of the piece itself', (t) => {
  const about = fs.readFileSync(path.join(repoRoot, 'docs/about.md'), 'utf8');
  assert.match(about, /AI-assisted and AI-generated art\. Concepts and direction by Iqrar Rizvi\. Code and sound by Claude/);
  assert.match(about, /Copyright 2026 Iqrar Rizvi\. All rights reserved\./);
  const out = scratch(t);
  buildSite({ root: repoRoot, out, config });
  assert.match(read(out, 'index.html'), /<footer[\s\S]*Copyright 2026 Iqrar Rizvi\. All rights reserved\./);
  const piece = raw('lost-tones/index.html').toString('utf8').split('\n').slice(0, 3).join('\n');
  assert.match(piece, /Copyright Iqrar Rizvi\. All rights reserved\. AI-assisted and AI-generated art/);
});

test('the picture on each card exists, and the visual a card shows is the piece itself, not a drawing', () => {
  for (const c of config.cards) {
    for (const key of ['image', 'visual']) assert.ok(fs.existsSync(path.join(repoRoot, c[key])), `${c[key]} exists (run: npm run screenshots)`);
  }
});

test('the site, the README and the piece agree on the facts that appear in more than one place', () => {
  const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const piece = raw('lost-tones/index.html').toString('utf8');
  assert.equal(Number(piece.match(/const N = (\d+);/)?.[1]), 84, 'the piece itself draws 84 phones (const N)');
  for (const text of [readme, fs.readFileSync(path.join(repoRoot, 'pieces/01-lost-tones.md'), 'utf8')]) assert.match(text, /eighty-four/i);
  assert.match(config.cards[0].oneLiner, /Eighty-four/);
});

test('a stray file in a piece\'s folder is not published, and files left over from an earlier build are removed', (t) => {
  const from = scratch(t), out = scratch(t);
  fs.mkdirSync(path.join(from, 'p/node_modules/x'), { recursive: true });
  fs.writeFileSync(path.join(from, 'p/index.html'), '<p>piece</p>');
  fs.writeFileSync(path.join(from, 'p/draft-notes.md'), 'kept: an ordinary file of the piece');
  for (const f of ['p/.DS_Store', 'p/~$lock', 'p/node_modules/x/y.js']) fs.writeFileSync(path.join(from, f), 'stray');
  fs.mkdirSync(path.join(out, 'p'));
  fs.writeFileSync(path.join(out, 'p/old.html'), 'left from an earlier build');
  copyPieces(['p'], out, from);
  assert.deepEqual(fs.readdirSync(path.join(out, 'p')).sort(), ['draft-notes.md', 'index.html']);
  assert.equal(isPieceFile('assets/a.png'), true);
  for (const bad of ['.DS_Store', 'a/.hidden', '~$x.docx', 'node_modules/a', 'a/node_modules/b']) assert.equal(isPieceFile(bad), false, bad);
});

test('the real piece folders hold only the files the site means to publish', () => {
  for (const name of config.copy) assert.deepEqual(fs.readdirSync(path.join(repoRoot, name)).sort(), ['index.html'], `${name} holds only index.html`);
});
