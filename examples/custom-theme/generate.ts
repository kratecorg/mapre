import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDeckSource, loadDeckStyles } from '@mapre/node';
import { buildSingleFileHtml } from '@mapre/runtime';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const slidesDir = join(scriptDir, 'slides');

const markdown = loadDeckSource(slidesDir);
const extraStyles = loadDeckStyles(slidesDir);
const html = buildSingleFileHtml(markdown, { extraStyles });

const outputDir = join(scriptDir, 'dist');
const outputFile = join(outputDir, 'index.html');

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, html, 'utf8');

console.log(`Wrote self-contained presentation -> ${outputFile}`);
