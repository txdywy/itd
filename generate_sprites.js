#!/usr/bin/env node
// generate_sprites.js - 用 node-canvas 生成八方旅人风格 PNG 精灵图
const { createCanvas } = require('canvas');
const fs = require('fs');

const FW = 64, FH = 128;
const COLS = 6, ROWS = 6;
const SHEET_W = FW * COLS, SHEET_H = FH * ROWS;

// ==================== 角色定义 ====================
const CHARACTERS = {
  xiahouyi: {
    name: '夏侯仪',
    hair: { base: '#a08020', hi: '#d0b040', sh: '#705810', outline: '#503808' },
    skin: { base: '#f0c8a0', hi: '#ffe0c8', sh: '#c89868', outline: '#906040' },
    cloth: { base: '#c03030', hi: '#e05050', sh: '#801818', accent: '#e8c040', outline: '#601010' },
    boot: '#4a3520',
    weapon: '#d0c8b8',
    features: { cape: true, longRobe: true, staff: false, sword: true }
  },
  bingli: {
    name: '冰璃',
    hair: { base: '#c0d8e0', hi: '#e8f4f8', sh: '#88a8b0', outline: '#607880' },
    skin: { base: '#f0d0b8', hi: '#fff0e0', sh: '#c8a080', outline: '#906848' },
    cloth: { base: '#4070a0', hi: '#6090c0', sh: '#284868', accent: '#d0e0f0', outline: '#183050' },
    boot: '#303840',
    weapon: '#c0d8f0',
    features: { cape: false, longRobe: false, staff: false, sword: true }
  },
  fenglingsheng: {
    name: '封铃笙',
    hair: { base: '#906030', hi: '#c08848', sh: '#604020', outline: '#402810' },
    skin: { base: '#f0c8a0', hi: '#ffe0c8', sh: '#c89868', outline: '#906040' },
    cloth: { base: '#508040', hi: '#70a858', sh: '#305828', accent: '#d0c090', outline: '#204018' },
    boot: '#504030',
    weapon: '#a09078',
    features: { cape: true, longRobe: true, staff: true, sword: false }
  },
  murongxuanji: {
    name: '慕容璇玑',
    hair: { base: '#8060a0', hi: '#a880c8', sh: '#583878', outline: '#402060' },
    skin: { base: '#f0d0b8', hi: '#fff0e0', sh: '#c8a080', outline: '#906848' },
    cloth: { base: '#6040a0', hi: '#8060c0', sh: '#402870', accent: '#d0b040', outline: '#301858' },
    boot: '#382850',
    weapon: '#b0a0c0',
    features: { cape: true, longRobe: true, staff: true, sword: false }
  },
  gulunde: {
    name: '古伦德',
    hair: { base: '#c0a030', hi: '#e0c850', sh: '#907818', outline: '#605010' },
    skin: { base: '#d8b890', hi: '#f0d0a8', sh: '#b08860', outline: '#806040' },
    cloth: { base: '#484040', hi: '#605858', sh: '#302828', accent: '#c0a030', outline: '#201818' },
    boot: '#302820',
    weapon: '#a0a0a0',
    features: { cape: false, longRobe: false, staff: false, sword: true, heavy: true }
  },
  xixia: {
    name: '西夏兵',
    hair: { base: '#706858', hi: '#908878', sh: '#504840', outline: '#383028' },
    skin: { base: '#d8b088', hi: '#f0c8a0', sh: '#b08058', outline: '#806040' },
    cloth: { base: '#a03030', hi: '#c05050', sh: '#701818', accent: '#c0a030', outline: '#501010' },
    boot: '#383028',
    weapon: '#909090',
    features: { cape: false, longRobe: false, staff: false, sword: true, helmet: true }
  },
  yaomo: {
    name: '幽魔',
    hair: { base: '#503060', hi: '#704880', sh: '#301840', outline: '#200830' },
    skin: { base: '#a07060', hi: '#c08878', sh: '#784838', outline: '#583020' },
    cloth: { base: '#301848', hi: '#482868', sh: '#180830', accent: '#8060a0', outline: '#100420' },
    boot: '#201030',
    weapon: '#705090',
    features: { cape: true, longRobe: true, staff: true, sword: false, horns: true }
  },
  huangfushen: {
    name: '皇甫申',
    hair: { base: '#c0a030', hi: '#e8c850', sh: '#887018', outline: '#605010' },
    skin: { base: '#c8a078', hi: '#e0b890', sh: '#987050', outline: '#705038' },
    cloth: { base: '#383038', hi: '#504850', sh: '#201820', accent: '#c0a030', outline: '#100810' },
    boot: '#282028',
    weapon: '#808080',
    features: { cape: true, longRobe: true, staff: true, sword: false, dark: true }
  },
  luohou: {
    name: '罗睺',
    hair: { base: '#a02020', hi: '#d04040', sh: '#601010', outline: '#400808' },
    skin: { base: '#a07050', hi: '#c08868', sh: '#784830', outline: '#583018' },
    cloth: { base: '#501020', hi: '#782030', sh: '#300810', accent: '#e06030', outline: '#200808' },
    boot: '#281018',
    weapon: '#a03030',
    features: { cape: true, longRobe: true, staff: false, sword: false, horns: true, boss: true }
  }
};

// ==================== 绘图工具 ====================
function fillRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.fill();
}

function drawEllipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ==================== 角色绘制 (Octopath 风格) ====================
function drawCharacter(ctx, ox, oy, ch, anim, frame, totalFrames) {
  const { hair, skin, cloth, boot, weapon, features } = ch;
  const isHeavy = features.heavy;
  const isBoss = features.boss;
  const bodyScale = isHeavy ? 1.15 : (isBoss ? 1.2 : 1.0);

  // 动画偏移
  let bx = 0, by = 0, armAngle = 0, legOff = 0, headTilt = 0;
  const phase = frame / totalFrames;

  if (anim === 'idle') {
    by = Math.sin(phase * Math.PI * 2) * 2;
    headTilt = Math.sin(phase * Math.PI * 2) * 0.02;
  } else if (anim === 'walk') {
    by = Math.abs(Math.sin(phase * Math.PI * 2)) * -3;
    legOff = Math.sin(phase * Math.PI * 2) * 8;
    bx = Math.sin(phase * Math.PI * 4) * 1.5;
  } else if (anim === 'attack') {
    if (frame === 0) { bx = -3; }
    else if (frame === 1) { bx = 6; armAngle = -0.8; }
    else if (frame === 2) { bx = 10; armAngle = -1.2; }
    else { bx = 3; armAngle = -0.3; }
  } else if (anim === 'cast') {
    by = -2;
    armAngle = -0.6 - Math.sin(phase * Math.PI) * 0.3;
  } else if (anim === 'hurt') {
    bx = -5 + Math.sin(phase * Math.PI * 4) * 2;
    headTilt = -0.1;
  } else if (anim === 'death') {
    by = frame * 12;
    headTilt = frame * 0.15;
  }

  const cx = ox + FW / 2 + bx;
  const groundY = oy + FH - 8;

  ctx.save();

  // ---- Shadow ----
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  drawEllipse(ctx, ox + FW/2, groundY + 2, 20, 5);

  // ---- Legs ----
  const legW = 9 * bodyScale;
  const legH = 32 * bodyScale;
  const legY = groundY - legH;
  const legGap = 7 * bodyScale;

  // Left leg
  ctx.fillStyle = cloth.sh;
  fillRoundRect(ctx, cx - legGap - legW + legOff, legY, legW, legH, 2);
  ctx.fillStyle = cloth.base;
  fillRoundRect(ctx, cx - legGap - legW + legOff + 1.5, legY, legW - 3, legH - 1, 2);
  // Right leg
  ctx.fillStyle = cloth.sh;
  fillRoundRect(ctx, cx + legGap - legOff, legY, legW, legH, 2);
  ctx.fillStyle = cloth.base;
  fillRoundRect(ctx, cx + legGap - legOff + 1.5, legY, legW - 3, legH - 1, 2);

  // Boots
  ctx.fillStyle = boot;
  fillRoundRect(ctx, cx - legGap - legW + legOff - 1, groundY - 8, legW + 3, 10, 2);
  fillRoundRect(ctx, cx + legGap - legOff - 2, groundY - 8, legW + 3, 10, 2);
  // Boot highlight
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(cx - legGap - legW + legOff + 1, groundY - 7, 2, 4);
  ctx.fillRect(cx + legGap - legOff, groundY - 7, 2, 4);

  // ---- Torso ----
  const torsoW = 28 * bodyScale;
  const torsoH = 32 * bodyScale;
  const torsoY = legY - torsoH + 4;
  const torsoX = cx - torsoW / 2;

  // Cape (if applicable)
  if (features.cape) {
    ctx.fillStyle = cloth.sh;
    fillRoundRect(ctx, torsoX - 4, torsoY + 4, torsoW + 8, torsoH + 8, 3);
  }

  // Main torso
  ctx.fillStyle = cloth.sh;
  fillRoundRect(ctx, torsoX - 1, torsoY - 1, torsoW + 2, torsoH + 2, 4);
  ctx.fillStyle = cloth.base;
  fillRoundRect(ctx, torsoX, torsoY, torsoW, torsoH, 4);

  // Torso shading - left shadow
  ctx.fillStyle = cloth.sh;
  ctx.fillRect(torsoX, torsoY + 2, 6, torsoH - 4);
  // Right highlight
  ctx.fillStyle = cloth.hi;
  ctx.fillRect(torsoX + torsoW - 6, torsoY + 4, 3, torsoH - 8);

  // Collar
  ctx.fillStyle = cloth.accent;
  fillRoundRect(ctx, cx - 10, torsoY - 1, 20, 5, 2);

  // Belt
  ctx.fillStyle = cloth.accent;
  ctx.fillRect(torsoX + 2, torsoY + torsoH - 8, torsoW - 4, 4);
  // Belt buckle
  ctx.fillStyle = '#d0b040';
  ctx.fillRect(cx - 3, torsoY + torsoH - 8, 6, 4);

  // Long robe extension
  if (features.longRobe) {
    ctx.fillStyle = cloth.base;
    fillRoundRect(ctx, torsoX - 2, torsoY + torsoH - 4, torsoW + 4, 16, 3);
    ctx.fillStyle = cloth.sh;
    ctx.fillRect(torsoX - 2, torsoY + torsoH - 2, 4, 12);
    // Robe edge highlight
    ctx.fillStyle = cloth.hi;
    ctx.fillRect(torsoX + torsoW - 2, torsoY + torsoH, 2, 8);
  }

  // ---- Arms ----
  const armW = 8 * bodyScale;
  const armH = 28 * bodyScale;
  const armY = torsoY + 4;
  const lArmX = torsoX - armW - 2;
  const rArmX = torsoX + torsoW + 2;

  // Left arm
  ctx.fillStyle = cloth.sh;
  fillRoundRect(ctx, lArmX, armY, armW, armH, 3);
  ctx.fillStyle = cloth.base;
  fillRoundRect(ctx, lArmX + 1, armY + 1, armW - 2, armH - 2, 3);
  // Left hand
  ctx.fillStyle = skin.base;
  drawEllipse(ctx, lArmX + armW/2, armY + armH, 4, 4);
  ctx.fillStyle = skin.hi;
  ctx.fillRect(lArmX + armW/2 - 1, armY + armH - 3, 2, 2);

  // Right arm (with attack animation rotation)
  ctx.save();
  ctx.translate(rArmX + armW/2, armY);
  ctx.rotate(armAngle);
  ctx.fillStyle = cloth.sh;
  fillRoundRect(ctx, -armW/2, 0, armW, armH, 3);
  ctx.fillStyle = cloth.base;
  fillRoundRect(ctx, -armW/2 + 1, 1, armW - 2, armH - 2, 3);
  // Right hand
  ctx.fillStyle = skin.base;
  drawEllipse(ctx, 0, armH, 4, 4);
  ctx.fillStyle = skin.hi;
  ctx.fillRect(-1, armH - 3, 2, 2);

  // Weapon
  if (features.sword) {
    ctx.fillStyle = '#888';
    ctx.fillRect(1, -10, 3, armH + 20);
    ctx.fillStyle = weapon;
    ctx.fillRect(2, -10, 1.5, armH + 20);
    // Guard
    ctx.fillStyle = cloth.accent;
    ctx.fillRect(-3, armH - 4, 9, 3);
    // Tip highlight
    ctx.fillStyle = '#fff';
    ctx.fillRect(2, -10, 1, 3);
  } else if (features.staff) {
    ctx.fillStyle = '#604020';
    ctx.fillRect(1, -20, 3, armH + 30);
    ctx.fillStyle = '#805830';
    ctx.fillRect(2, -20, 1, armH + 30);
    // Staff gem
    ctx.fillStyle = cloth.accent;
    drawEllipse(ctx, 2, -22, 5, 5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(1, -24, 2, 2);
  }
  ctx.restore();

  // ---- Head ----
  const headW = 26;
  const headH = 28;
  const headY = torsoY - headH + 6;
  const headX = cx - headW / 2;

  ctx.save();
  ctx.translate(cx, headY + headH / 2);
  ctx.rotate(headTilt);
  ctx.translate(-cx, -(headY + headH / 2));

  // Hair back
  ctx.fillStyle = hair.sh;
  fillRoundRect(ctx, headX - 4, headY - 6, headW + 8, headH + 12, 6);

  // Face
  ctx.fillStyle = skin.sh;
  fillRoundRect(ctx, headX, headY, headW, headH, 5);
  ctx.fillStyle = skin.base;
  fillRoundRect(ctx, headX + 2, headY + 2, headW - 4, headH - 4, 4);
  // Face highlight
  ctx.fillStyle = skin.hi;
  ctx.fillRect(headX + headW - 8, headY + 4, 4, 10);

  // Hair front
  ctx.fillStyle = hair.base;
  fillRoundRect(ctx, headX - 3, headY - 6, headW + 6, 14, 5);
  // Hair highlight
  ctx.fillStyle = hair.hi;
  ctx.fillRect(headX + 2, headY - 4, 8, 5);
  ctx.fillRect(headX + headW - 12, headY - 3, 6, 3);
  // Hair outline
  ctx.fillStyle = hair.outline;
  ctx.fillRect(headX - 3, headY - 6, headW + 6, 1.5);

  // Eyes
  const eyeY = headY + 14;
  // Eye whites
  ctx.fillStyle = '#f8f4f0';
  fillRoundRect(ctx, cx - 10, eyeY, 8, 6, 1);
  fillRoundRect(ctx, cx + 2, eyeY, 8, 6, 1);
  // Iris
  ctx.fillStyle = cloth.base;
  ctx.fillRect(cx - 8, eyeY + 1, 5, 5);
  ctx.fillRect(cx + 3, eyeY + 1, 5, 5);
  // Pupil
  ctx.fillStyle = '#181412';
  ctx.fillRect(cx - 7, eyeY + 2, 3, 3);
  ctx.fillRect(cx + 4, eyeY + 2, 3, 3);
  // Eye highlight (catchlight)
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - 6, eyeY + 1, 2, 2);
  ctx.fillRect(cx + 5, eyeY + 1, 2, 2);
  // Eyebrow
  ctx.fillStyle = hair.sh;
  ctx.fillRect(cx - 10, eyeY - 3, 8, 2);
  ctx.fillRect(cx + 2, eyeY - 3, 8, 2);

  // Nose
  ctx.fillStyle = skin.sh;
  ctx.fillRect(cx - 1, headY + 20, 2, 3);

  // Mouth
  if (anim === 'hurt' || anim === 'death') {
    ctx.fillStyle = '#802020';
    fillRoundRect(ctx, cx - 3, headY + 24, 6, 3, 1);
  } else {
    ctx.fillStyle = skin.sh;
    ctx.fillRect(cx - 2, headY + 24, 4, 1.5);
  }

  // Hair sides (flowing down)
  ctx.fillStyle = hair.base;
  fillRoundRect(ctx, headX - 6, headY + 2, 7, 22, 3);
  fillRoundRect(ctx, headX + headW - 1, headY + 2, 7, 22, 3);
  ctx.fillStyle = hair.hi;
  ctx.fillRect(headX - 5, headY + 5, 2, 12);
  ctx.fillRect(headX + headW, headY + 5, 2, 12);

  // Horns (for demon/boss)
  if (features.horns) {
    ctx.fillStyle = hair.sh;
    ctx.beginPath();
    ctx.moveTo(headX + 2, headY - 4);
    ctx.lineTo(headX - 4, headY - 18);
    ctx.lineTo(headX + 8, headY - 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(headX + headW - 2, headY - 4);
    ctx.lineTo(headX + headW + 4, headY - 18);
    ctx.lineTo(headX + headW - 8, headY - 4);
    ctx.fill();
    ctx.fillStyle = hair.hi;
    ctx.fillRect(headX, headY - 12, 2, 4);
    ctx.fillRect(headX + headW - 2, headY - 12, 2, 4);
  }

  // Helmet (for soldiers)
  if (features.helmet) {
    ctx.fillStyle = '#606060';
    fillRoundRect(ctx, headX - 4, headY - 10, headW + 8, 18, 4);
    ctx.fillStyle = '#808080';
    fillRoundRect(ctx, headX - 2, headY - 8, headW + 4, 10, 3);
    ctx.fillStyle = '#505050';
    ctx.fillRect(headX - 4, headY + 2, headW + 8, 3);
    // Helmet crest
    ctx.fillStyle = cloth.accent;
    ctx.fillRect(cx - 1, headY - 16, 2, 8);
  }

  ctx.restore(); // head tilt

  // ---- Cast glow effect ----
  if (anim === 'cast') {
    const glowA = 0.15 + Math.sin(phase * Math.PI) * 0.2;
    const glowR = 25 + Math.sin(phase * Math.PI) * 10;
    ctx.fillStyle = `rgba(200,180,255,${glowA})`;
    drawEllipse(ctx, cx, torsoY, glowR, glowR);
    // Particles
    for (let i = 0; i < 4; i++) {
      const a = phase * Math.PI * 2 + i * Math.PI / 2;
      const r = 15 + phase * 12;
      const px = cx + Math.cos(a) * r;
      const py = torsoY + Math.sin(a) * r - 10;
      ctx.fillStyle = `rgba(255,255,200,${0.6 - phase * 0.5})`;
      ctx.fillRect(px - 1, py - 1, 3, 3);
    }
  }

  // ---- Attack flash ----
  if (anim === 'attack' && frame === 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    drawEllipse(ctx, rArmX + 15, armY + 10, 18, 18);
    // Slash arc
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rArmX + 10, armY + 20, 25, -0.8, 0.8);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // ---- Hurt flash ----
  if (anim === 'hurt' && frame === 0) {
    ctx.fillStyle = 'rgba(255,100,100,0.2)';
    ctx.fillRect(ox, oy, FW, FH);
  }

  ctx.restore();
}

// ==================== 生成精灵图 ====================
function generateSheet(charKey) {
  const ch = CHARACTERS[charKey];
  const canvas = createCanvas(SHEET_W, SHEET_H);
  const ctx = canvas.getContext('2d');

  const anims = [
    { name: 'idle',   frames: 4 },
    { name: 'walk',   frames: 4 },
    { name: 'attack', frames: 4 },
    { name: 'cast',   frames: 2 },
    { name: 'hurt',   frames: 2 },
    { name: 'death',  frames: 4 },
  ];

  for (let row = 0; row < anims.length; row++) {
    const anim = anims[row];
    for (let col = 0; col < anim.frames; col++) {
      const ox = col * FW;
      const oy = row * FH;
      drawCharacter(ctx, ox, oy, ch, anim.name, col, anim.frames);
    }
  }

  return canvas;
}

// ==================== 生成并保存 ====================
const outDir = 'assets/sprites';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const key of Object.keys(CHARACTERS)) {
  const canvas = generateSheet(key);
  const buffer = canvas.toBuffer('image/png');
  const path = `${outDir}/${key}.png`;
  fs.writeFileSync(path, buffer);
  console.log(`Generated: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

console.log('\nDone! All sprite sheets generated.');
