#!/usr/bin/env node
// Crop a 3x3 ImageGen portrait sheet into project dialogue portraits.
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const source = process.argv[2];
if (!source) {
  console.error('Usage: node crop_imagegen_portraits.js <sheet.png>');
  process.exit(1);
}

const names = [
  'xiahouyi', 'bingli', 'fenglingsheng',
  'murongxuanji', 'gulunde', 'huangfushen',
  'luohou', 'xixia', 'yaomo',
];

const outDir = path.join(__dirname, 'assets', 'portraits');
fs.mkdirSync(outDir, { recursive: true });

loadImage(source).then((img) => {
  const cellW = Math.floor(img.width / 3);
  const cellH = Math.floor(img.height / 3);
  const outW = 512;
  const outH = 640;

  names.forEach((name, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const sx = col * cellW;
    const sy = row * cellH;

    const canvas = createCanvas(outW, outH);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Tall portrait crop from square source: keep face and bust, avoid UI text area.
    const leftCrop = name === 'xiahouyi' ? 0.13 : 0.035;
    const rightCrop = name === 'xiahouyi' ? 0.03 : 0.035;
    const cropInsetX = Math.floor(cellW * leftCrop);
    const cropInsetRight = Math.floor(cellW * rightCrop);
    const cropInsetY = Math.floor(cellH * 0.005);
    const cropW = cellW - cropInsetX - cropInsetRight;
    const cropH = Math.floor(cellH * 0.98);
    ctx.drawImage(img, sx + cropInsetX, sy + cropInsetY, cropW, cropH, 0, 0, outW, outH);

    const vignette = ctx.createRadialGradient(outW / 2, outH * 0.34, 80, outW / 2, outH / 2, 430);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, outW, outH);

    ctx.strokeStyle = 'rgba(235,210,147,0.7)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, outW - 20, outH - 20);

    fs.writeFileSync(path.join(outDir, `${name}.png`), canvas.toBuffer('image/png'));
  });

  console.log(`Cropped ${names.length} portraits into ${outDir}`);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
