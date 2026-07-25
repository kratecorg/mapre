import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDeckSource, loadDeckTreeSource } from '@mapre/node';
import { buildSingleFileHtml } from '@mapre/runtime';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const slidesDir = join(scriptDir, 'slides');

// The trunk markdown supplies the title; the source tree carries the trunk plus
// every resolved detail branch so the browser can rebuild the multi-level deck.
const markdown = loadDeckSource(slidesDir);
const sourceTree = loadDeckTreeSource(slidesDir);
const html = buildSingleFileHtml(markdown, { sourceTree });

const outputDir = join(scriptDir, 'dist');
const outputFile = join(outputDir, 'index.html');

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, html, 'utf8');

console.log(`Wrote self-contained presentation -> ${outputFile}`);
