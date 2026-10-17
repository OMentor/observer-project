import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const iconsDir = join(publicDir, 'icons');

const BG = '#1a1a1e';
const STROKE = 2.4;
// Держим в синхроне с `src/components/ui/logo-strands.ts` (там TS, здесь мjs).
const STRANDS = [
  'M12 6 V10.4 M12 13.6 V26',
  'M20 6 V18.4 M20 21.6 V26',
  'M6 12 H18.4 M21.6 12 H26',
  'M6 20 H10.4 M13.6 20 H26',
];

function strands(indent) {
  return STRANDS.map((d) => `${indent}<path d="${d}"/>`).join('\n');
}

function gradient(size) {
  return `    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size}" y2="${size}">
      <stop offset="0%" stop-color="#5B5FEF"/>
      <stop offset="100%" stop-color="#F0A030"/>
    </linearGradient>`;
}

function iconSvg(size, scale) {
  const offset = size / 2 - 16 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
${gradient(size)}
  </defs>
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="url(#g)" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">
${strands('    ')}
  </g>
</svg>`;
}

function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <defs>
${gradient(32)}
  </defs>
  <g fill="none" stroke="url(#g)" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">
${strands('    ')}
  </g>
</svg>`;
}

// Знак лежит в боксе 32×32 (центрирован на 16), поэтому scale = size/32
// даёт заполнение ~62%. Maskable уменьшается до безопасной зоны (~50%).
const targets = [
  { file: 'icon-192.png', size: 192, fraction: 1 },
  { file: 'icon-512.png', size: 512, fraction: 1 },
  { file: 'maskable-512.png', size: 512, fraction: 0.8 },
  { file: 'apple-touch-icon.png', size: 180, fraction: 0.85 },
];

await mkdir(iconsDir, { recursive: true });
const fullScale = 512 / 32;
await writeFile(
  join(publicDir, 'icon.svg'),
  `${iconSvg(512, fullScale)}\n`,
  'utf8',
);
await writeFile(join(publicDir, 'favicon.svg'), `${faviconSvg()}\n`, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const target of targets) {
  const scale = (target.size / 32) * target.fraction;
  const markup = iconSvg(target.size, scale);
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
