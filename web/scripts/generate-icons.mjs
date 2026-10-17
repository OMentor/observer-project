import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const iconsDir = join(publicDir, 'icons');

const BG = '#1a1a1e';
const MARK =
  'M8 8 Q16 16 24 8 M8 24 Q16 16 24 24 M16 4 Q16 16 16 28';

function iconSvg(size, scale) {
  const offset = size / 2 - 16 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5B5FEF"/>
      <stop offset="100%" stop-color="#F0A030"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="${MARK}" stroke="url(#g)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;
}

const targets = [
  { file: 'icon-192.png', size: 192, scale: 12 },
  { file: 'icon-512.png', size: 512, scale: 12 },
  { file: 'maskable-512.png', size: 512, scale: 9 },
  { file: 'apple-touch-icon.png', size: 180, scale: 12 },
];

await mkdir(iconsDir, { recursive: true });
await writeFile(
  join(publicDir, 'icon.svg'),
  `${iconSvg(512, 12)}\n`,
  'utf8',
);

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const target of targets) {
  const markup = iconSvg(target.size, target.scale);
  await page.setViewportSize({ width: target.size, height: target.size });
  await page.setContent(
    `<!doctype html><html><body style="margin:0">${markup}</body></html>`,
  );
  await page.screenshot({
    path: join(iconsDir, target.file),
    clip: { x: 0, y: 0, width: target.size, height: target.size },
  });
  console.log(`generated icons/${target.file}`);
}

await browser.close();
