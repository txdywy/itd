// ==================== HD-2D renderer ====================
const TILE = 56;
const MAP_W = 20;
const MAP_H = 15;
const VIEW_W = MAP_W * TILE;
const VIEW_H = MAP_H * TILE;

const HD_TILE = {
  0: { base: '#506a38', light: '#78994c', dark: '#27381d', side: '#334924', name: 'plain' },
  1: { base: '#6f6a61', light: '#a49b8d', dark: '#3d3a35', side: '#514d46', name: 'wall' },
  3: { base: '#304b24', light: '#5f8c43', dark: '#142514', side: '#21361b', name: 'forest' },
  4: { base: '#7a663f', light: '#b49a62', dark: '#3f321e', side: '#5b482d', name: 'mountain' },
  5: { base: '#746850', light: '#b4a47a', dark: '#3c3325', side: '#574932', name: 'road' },
  9: { base: '#45305b', light: '#8b5ab2', dark: '#180d28', side: '#2c1b43', name: 'void' },
};

const UNIT_RENDER_PROFILE = {
  bingli: { sx: 1.18, sy: 0.96, lift: -1 },
  xixia: { sx: 1.42, sy: 0.9, lift: 1 },
  huangfushen: { sx: 1.08, sy: 0.94, lift: 0 },
  luohou: { sx: 1.12, sy: 0.92, lift: 0 },
  yaomo: { sx: 1.12, sy: 0.96, lift: 0 },
  murongxuanji: { sx: 1.08, sy: 0.97, lift: 0 },
};

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.canvas.width = VIEW_W;
    this.canvas.height = VIEW_H;

    this.offscreen = document.createElement('canvas');
    this.offscreen.width = VIEW_W;
    this.offscreen.height = VIEW_H;
    this.octx = this.offscreen.getContext('2d');
    this.octx.imageSmoothingEnabled = false;

    this.animFrame = 0;
    this.effects = [];
    this.envParticles = [];
    this.ambientColor = 'rgba(12, 11, 22, 0.34)';
    this.camera = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.sheetManager = new SpriteSheetManager();
    this.loadSprites();
    this.loadPortraits();
    this.initEnv();
  }

  async init(onProgress) {
    await this.sheetManager.loadAll(onProgress);
  }

  initEnv() {
    this.envParticles = [];
    for (let i = 0; i < 120; i++) {
      this.envParticles.push({
        x: Math.random() * VIEW_W,
        y: Math.random() * VIEW_H,
        speedX: (Math.random() - 0.5) * 0.55,
        speedY: -0.12 - Math.random() * 0.35,
        size: 1 + Math.random() * 2.5,
        depth: 0.2 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  screenToTile(mx, my) {
    const x = Math.floor(mx / TILE);
    const y = Math.floor(my / TILE);
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return null;
    return { x, y };
  }

  tileRect(x, y) {
    return { x: x * TILE, y: y * TILE, w: TILE, h: TILE };
  }

  tileCenter(x, y) {
    return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
  }

  loadSprites() {
    this.spriteCache = {};
    for (const [name, data] of Object.entries(SPRITES)) {
      if (Array.isArray(data) && data.length > 0) {
        if (typeof data[0] === 'string') this.spriteCache[name] = [this.makeSprite(data)];
        else if (Array.isArray(data[0])) this.spriteCache[name] = data.map(frameLines => this.makeSprite(frameLines));
      }
    }
  }

  loadPortraits() {
    this.portraitCache = {};
    for (const [name, lines] of Object.entries(PORTRAITS)) {
      this.portraitCache[name] = this.makeSprite(lines);
    }
  }

  makeSprite(lines) {
    const c = document.createElement('canvas');
    const height = lines.length;
    const width = height > 0 ? lines[0].length : 16;
    c.width = width;
    c.height = height;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    for (let r = 0; r < height; r++) {
      const row = lines[r] || '';
      for (let col = 0; col < width; col++) {
        const color = PALETTE[row[col] || '.'];
        if (color) {
          x.fillStyle = color;
          x.fillRect(col, r, 1, 1);
        }
      }
    }
    return c;
  }

  getSpriteFrame(name) {
    const frames = this.spriteCache[name];
    if (!frames || frames.length === 0) return null;
    return frames[Math.floor(this.animFrame / 30) % frames.length];
  }

  clear() {
    const sky = this.octx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, '#111525');
    sky.addColorStop(0.45, '#111820');
    sky.addColorStop(1, '#07070b');
    this.octx.fillStyle = sky;
    this.octx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.drawBackdrop();
  }

  drawBackdrop() {
    const t = this.animFrame;
    this.octx.save();
    this.octx.globalAlpha = 0.55;
    for (let i = 0; i < 4; i++) {
      const y = 72 + i * 54;
      const drift = Math.sin(t * 0.006 + i) * 16;
      const grad = this.octx.createLinearGradient(0, y - 30, 0, y + 70);
      grad.addColorStop(0, 'rgba(150,138,106,0)');
      grad.addColorStop(0.35, `rgba(${72 + i * 14},${82 + i * 10},${72 + i * 4},${0.16 - i * 0.025})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      this.octx.fillStyle = grad;
      this.octx.beginPath();
      this.octx.moveTo(-80, y + 80);
      for (let x = -80; x <= VIEW_W + 80; x += 90) {
        this.octx.lineTo(x, y + Math.sin((x + drift) * 0.018 + i) * 28);
      }
      this.octx.lineTo(VIEW_W + 80, y + 120);
      this.octx.closePath();
      this.octx.fill();
    }
    this.octx.restore();
  }

  drawMap(map, highlightTiles = [], attackTiles = [], hoverTile = null) {
    const t = this.animFrame;
    this.drawMapFloorShadow();

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        this.drawTile(x, y, parseInt(map.tiles[y][x]), t);
      }
    }

    for (const tile of highlightTiles) this.drawRangeTile(tile, 'move');
    for (const tile of attackTiles) this.drawRangeTile(tile, 'attack');
    if (hoverTile) this.drawHoverTile(hoverTile);
  }

  drawMapFloorShadow() {
    const grad = this.octx.createRadialGradient(VIEW_W / 2, VIEW_H * 0.55, 40, VIEW_W / 2, VIEW_H * 0.55, 540);
    grad.addColorStop(0, 'rgba(0,0,0,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0.52)');
    this.octx.fillStyle = grad;
    this.octx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawTile(x, y, tile, t) {
    const style = HD_TILE[tile] || HD_TILE[0];
    const { x: px, y: py } = this.tileRect(x, y);
    const height = tile === 4 ? 14 : tile === 1 ? 10 : tile === 3 ? 8 : tile === 9 ? 6 : 5;

    this.octx.fillStyle = 'rgba(0,0,0,0.22)';
    this.octx.fillRect(px + 5, py + 9, TILE - 3, TILE - 2);

    const side = this.octx.createLinearGradient(px, py + TILE - height, px, py + TILE + 2);
    side.addColorStop(0, style.side);
    side.addColorStop(1, style.dark);
    this.octx.fillStyle = side;
    this.octx.fillRect(px + 2, py + TILE - height, TILE - 4, height);

    const top = this.octx.createLinearGradient(px, py, px + TILE, py + TILE);
    top.addColorStop(0, style.light);
    top.addColorStop(0.45, style.base);
    top.addColorStop(1, style.dark);
    this.octx.fillStyle = top;
    this.octx.fillRect(px + 2, py + 2, TILE - 4, TILE - height);

    this.octx.strokeStyle = 'rgba(255,238,188,0.08)';
    this.octx.strokeRect(px + 2.5, py + 2.5, TILE - 5, TILE - height - 1);
    this.octx.strokeStyle = 'rgba(0,0,0,0.24)';
    this.octx.strokeRect(px + 1.5, py + 1.5, TILE - 3, TILE - 3);

    if (tile === 0) this.drawGrass(px, py, x, y);
    else if (tile === 5) this.drawRoad(px, py, x, y);
    else if (tile === 3) this.drawForest(px, py, x, y, t);
    else if (tile === 4) this.drawMountain(px, py, x, y);
    else if (tile === 1) this.drawWall(px, py, x, y);
    else if (tile === 9) this.drawVoid(px, py, x, y, t);
  }

  drawGrass(px, py, x, y) {
    for (let i = 0; i < 7; i++) {
      const gx = px + 7 + ((x * 13 + y * 7 + i * 11) % 34);
      const gy = py + 8 + ((x * 5 + y * 17 + i * 9) % 27);
      this.octx.strokeStyle = i % 2 ? 'rgba(188,216,112,0.34)' : 'rgba(39,64,27,0.45)';
      this.octx.beginPath();
      this.octx.moveTo(gx, gy + 5);
      this.octx.lineTo(gx + (i % 3) - 1, gy);
      this.octx.stroke();
    }
  }

  drawRoad(px, py, x, y) {
    this.octx.strokeStyle = 'rgba(45,38,27,0.34)';
    for (let i = 0; i < 4; i++) {
      const sx = px + 7 + ((x * 19 + i * 13) % 30);
      const sy = py + 10 + ((y * 11 + i * 10) % 26);
      this.octx.beginPath();
      this.octx.moveTo(sx - 8, sy);
      this.octx.lineTo(sx + 8, sy + ((i % 2) ? 2 : -1));
      this.octx.stroke();
    }
    this.octx.fillStyle = 'rgba(226,210,160,0.12)';
    this.octx.fillRect(px + 6, py + 5, 34, 2);
  }

  drawForest(px, py, x, y, t) {
    const sway = Math.sin(t * 0.025 + x * 0.7 + y) * 1.8;
    this.octx.fillStyle = '#342718';
    this.octx.fillRect(px + 22, py + 22, 6, 18);
    this.octx.fillStyle = 'rgba(0,0,0,0.18)';
    this.octx.beginPath();
    this.octx.ellipse(px + 25, py + 39, 17, 5, 0, 0, Math.PI * 2);
    this.octx.fill();
    for (let i = 0; i < 3; i++) {
      this.octx.fillStyle = ['#163816', '#245b23', '#3d7d34'][i];
      this.octx.beginPath();
      this.octx.moveTo(px + 24 + sway, py + 4 + i * 7);
      this.octx.lineTo(px + 8, py + 30 + i * 4);
      this.octx.lineTo(px + 40, py + 30 + i * 4);
      this.octx.closePath();
      this.octx.fill();
    }
    this.octx.fillStyle = 'rgba(190,235,135,0.22)';
    this.octx.fillRect(px + 18 + sway, py + 12, 8, 2);
  }

  drawMountain(px, py) {
    const rock = this.octx.createLinearGradient(px + 6, py + 4, px + 40, py + 42);
    rock.addColorStop(0, '#c6b176');
    rock.addColorStop(0.45, '#7d6337');
    rock.addColorStop(1, '#392817');
    this.octx.fillStyle = rock;
    this.octx.beginPath();
    this.octx.moveTo(px + 24, py + 2);
    this.octx.lineTo(px + 44, py + 39);
    this.octx.lineTo(px + 4, py + 39);
    this.octx.closePath();
    this.octx.fill();
    this.octx.fillStyle = 'rgba(255,255,245,0.75)';
    this.octx.beginPath();
    this.octx.moveTo(px + 24, py + 2);
    this.octx.lineTo(px + 31, py + 16);
    this.octx.lineTo(px + 23, py + 12);
    this.octx.lineTo(px + 18, py + 17);
    this.octx.closePath();
    this.octx.fill();
  }

  drawWall(px, py) {
    this.octx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const ox = px + 5 + col * 14 + (row % 2) * 7;
        const oy = py + 6 + row * 9;
        this.octx.strokeStyle = 'rgba(20,18,16,0.38)';
        this.octx.strokeRect(ox, oy, 13, 7);
      }
    }
  }

  drawVoid(px, py, x, y, t) {
    const pulse = 0.22 + Math.sin(t * 0.035 + x + y) * 0.08;
    this.octx.fillStyle = `rgba(193,91,255,${pulse})`;
    this.octx.beginPath();
    this.octx.ellipse(px + 24, py + 24, 18, 12, Math.sin(t * 0.01) * 0.4, 0, Math.PI * 2);
    this.octx.fill();
    this.octx.strokeStyle = `rgba(222,172,255,${pulse + 0.1})`;
    this.octx.strokeRect(px + 10, py + 10, 28, 24);
  }

  drawRangeTile(tile, type) {
    const { x, y } = this.tileRect(tile.x, tile.y);
    const move = type === 'move';
    const color = move ? [72, 190, 255] : [255, 82, 70];
    const alpha = 0.18 + Math.sin(this.animFrame * 0.08 + tile.x + tile.y) * 0.04;
    this.octx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
    this.octx.fillRect(x + 4, y + 4, TILE - 8, TILE - 12);
    this.octx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},0.72)`;
    this.octx.lineWidth = 2;
    this.octx.strokeRect(x + 7, y + 7, TILE - 14, TILE - 18);
    this.octx.lineWidth = 1;
  }

  drawHoverTile(tile) {
    const { x, y } = this.tileRect(tile.x, tile.y);
    const pulse = 2 + Math.sin(this.animFrame * 0.16) * 2;
    this.octx.strokeStyle = 'rgba(255,248,214,0.95)';
    this.octx.lineWidth = 2;
    this.octx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 12);
    this.octx.fillStyle = 'rgba(255,248,214,0.95)';
    const c = 13 + pulse;
    this.octx.fillRect(x + 4, y + 4, c, 2);
    this.octx.fillRect(x + 4, y + 4, 2, c);
    this.octx.fillRect(x + TILE - c - 4, y + 4, c, 2);
    this.octx.fillRect(x + TILE - 6, y + 4, 2, c);
    this.octx.fillRect(x + 4, y + TILE - 14, c, 2);
    this.octx.fillRect(x + 4, y + TILE - c - 12, 2, c);
    this.octx.fillRect(x + TILE - c - 4, y + TILE - 14, c, 2);
    this.octx.fillRect(x + TILE - 6, y + TILE - c - 12, 2, c);
    this.octx.lineWidth = 1;
  }

  drawUnit(unit, isSelected = false, isActed = false) {
    const center = this.tileCenter(unit.x, unit.y);
    const baseX = center.x;
    const baseY = center.y + 14;
    const breathe = Math.sin(this.animFrame * 0.06 + unit.x) * 1.8;

    this.octx.save();
    this.octx.fillStyle = isSelected ? 'rgba(255,224,96,0.42)' : 'rgba(0,0,0,0.46)';
    this.octx.beginPath();
    this.octx.ellipse(baseX, baseY, isSelected ? 26 : 21, isSelected ? 8 : 6, 0, 0, Math.PI * 2);
    this.octx.fill();

    if (isActed) this.octx.globalAlpha = 0.48;

    let animName = unit.anim || 'idle';
    if (unit.hp <= 0) animName = 'death';
    else if (isActed) animName = 'idle';

    const animSpeed = animName === 'walk' ? 7 : animName === 'attack' ? 5 : 11;
    const maxFrames = { idle: 4, walk: 4, attack: 4, cast: 2, hurt: 2, death: 4 };
    const frameIdx = Math.floor(this.animFrame / animSpeed) % (maxFrames[animName] || 4);
    const sheet = this.sheetManager.sheets[unit.sprite];

    if (sheet) {
      const rect = this.sheetManager.getFrameRect(unit.sprite, animName, frameIdx);
      if (rect) {
        const scale = unit.boss ? 0.62 : 0.52;
        const profile = UNIT_RENDER_PROFILE[unit.sprite] || { sx: 1, sy: 1, lift: 0 };
        const dw = rect.w * scale * profile.sx;
        const dh = rect.h * scale * profile.sy;
        const drawX = baseX - dw / 2;
        const drawY = baseY - dh + breathe + profile.lift;
        if (unit.dir === 'left') {
          this.octx.translate(baseX, 0);
          this.octx.scale(-1, 1);
          this.octx.translate(-baseX, 0);
        }
        this.octx.drawImage(sheet.image, rect.x, rect.y, rect.w, rect.h, drawX, drawY, dw, dh);
      }
    } else {
      const sprite = this.getSpriteFrame(unit.sprite);
      if (sprite) {
        const scale = 2.2;
        const dw = sprite.width * scale;
        const dh = sprite.height * scale;
        this.octx.drawImage(sprite, baseX - dw / 2, baseY - dh + breathe, dw, dh);
      }
    }

    this.octx.restore();
    this.octx.globalAlpha = 1;

    this.drawUnitChrome(unit, baseX, baseY, isSelected);
  }

  drawUnitChrome(unit, baseX, baseY, isSelected) {
    const hpRatio = unit.maxHp > 0 ? Math.max(0, unit.hp / unit.maxHp) : 0;
    const barW = 38;
    const y = baseY - 64;
    this.octx.fillStyle = 'rgba(0,0,0,0.72)';
    this.octx.fillRect(baseX - barW / 2, y, barW, 5);
    const hpGrad = this.octx.createLinearGradient(baseX - barW / 2, y, baseX + barW / 2, y);
    hpGrad.addColorStop(0, hpRatio > 0.5 ? '#50a96d' : hpRatio > 0.25 ? '#d7a94b' : '#c84842');
    hpGrad.addColorStop(1, hpRatio > 0.5 ? '#9ae986' : hpRatio > 0.25 ? '#ffe17c' : '#ff756a');
    this.octx.fillStyle = hpGrad;
    this.octx.fillRect(baseX - barW / 2, y, barW * hpRatio, 5);

    if (isSelected) {
      const bounce = Math.sin(this.animFrame * 0.13) * 5;
      this.octx.fillStyle = '#ffe06a';
      this.octx.beginPath();
      this.octx.moveTo(baseX, y - 18 + bounce);
      this.octx.lineTo(baseX - 8, y - 31 + bounce);
      this.octx.lineTo(baseX + 8, y - 31 + bounce);
      this.octx.closePath();
      this.octx.fill();
    }

    if (unit.boss) {
      this.octx.fillStyle = '#ff5858';
      this.octx.font = 'bold 16px Georgia, serif';
      this.octx.fillText('BOSS', baseX + 16, y - 4);
    }
  }

  drawEnvParticles() {
    for (const p of this.envParticles) {
      const px = (p.x + this.camera.x * p.depth * 0.18) % VIEW_W;
      const py = (p.y + this.camera.y * p.depth * 0.18) % VIEW_H;
      const x = px < 0 ? px + VIEW_W : px;
      const y = py < 0 ? py + VIEW_H : py;
      const alpha = (Math.sin(this.animFrame * 0.035 + p.phase) * 0.28 + 0.44) * p.depth;
      this.octx.fillStyle = `rgba(232,213,151,${alpha})`;
      this.octx.fillRect(Math.floor(x), Math.floor(y), p.size, p.size);
    }
  }

  drawLighting(units) {
    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = VIEW_W;
    lightCanvas.height = VIEW_H;
    const lctx = lightCanvas.getContext('2d');
    lctx.fillStyle = this.ambientColor;
    lctx.fillRect(0, 0, VIEW_W, VIEW_H);
    lctx.globalCompositeOperation = 'destination-out';

    for (const u of units) {
      if (u.hp <= 0) continue;
      const c = this.tileCenter(u.x, u.y);
      const radius = u.boss ? 126 : 92;
      const grad = lctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, radius);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)');
      grad.addColorStop(0.42, 'rgba(255,255,255,0.45)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
      lctx.fill();
    }

    for (const e of this.effects) {
      const c = this.tileCenter(e.x, e.y);
      const radius = e.type === 'magic' ? 150 : 96;
      const grad = lctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, radius);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
      lctx.fill();
    }

    this.octx.drawImage(lightCanvas, 0, 0);
  }

  drawPostProcess() {
    const grad = this.octx.createRadialGradient(VIEW_W / 2, VIEW_H * 0.47, 130, VIEW_W / 2, VIEW_H / 2, 680);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.72, 'rgba(0,0,0,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0.72)');
    this.octx.fillStyle = grad;
    this.octx.fillRect(0, 0, VIEW_W, VIEW_H);

    this.octx.fillStyle = 'rgba(255,244,210,0.03)';
    for (let y = 0; y < VIEW_H; y += 4) this.octx.fillRect(0, y, VIEW_W, 1);
  }

  drawEffects() {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life--;
      if (e.life <= 0) {
        this.effects.splice(i, 1);
        continue;
      }
      const c = this.tileCenter(e.x, e.y);
      const px = c.x;
      const py = c.y;
      const maxLife = e.maxLife || 20;
      const progress = 1 - e.life / maxLife;

      if (e.type === 'slash') {
        const flash = Math.max(0, 1 - progress);
        const waveR = 16 + progress * 42;
        this.octx.strokeStyle = `rgba(255,235,180,${0.45 * flash})`;
        this.octx.lineWidth = 2;
        this.octx.beginPath();
        this.octx.ellipse(px, py - 12, waveR, waveR * 0.42, -0.25, 0, Math.PI * 2);
        this.octx.stroke();

        this.octx.strokeStyle = `rgba(255,255,255,${flash})`;
        this.octx.lineWidth = 7 - progress * 3;
        this.octx.beginPath();
        this.octx.arc(px - 16 + progress * 32, py - 18, 39, Math.PI * 1.13 + progress * 0.85, Math.PI * 1.88 + progress * 1.7);
        this.octx.stroke();
        this.octx.strokeStyle = `rgba(128,198,255,${flash * 0.65})`;
        this.octx.lineWidth = 2;
        this.octx.beginPath();
        this.octx.arc(px - 14 + progress * 26, py - 17, 27, Math.PI * 1.18 + progress, Math.PI * 1.9 + progress * 1.55);
        this.octx.stroke();

        for (const p of e.particles || []) {
          const age = progress;
          const sx = px + p.x + p.vx * age * 42;
          const sy = py - 12 + p.y + p.vy * age * 32 + age * age * 12;
          const alpha = Math.max(0, (1 - age) * p.a);
          this.octx.fillStyle = `rgba(255,218,126,${alpha})`;
          this.octx.fillRect(sx, sy, p.s, p.s);
        }
      } else if (e.type === 'magic') {
        const colors = { fire: '#ff6238', ice: '#76d6ff', thunder: '#fff06a', dark: '#b16cff', wind: '#76ffab', holy: '#fff0ba' };
        const color = colors[e.element] || '#fff';
        const bloom = Math.sin(progress * Math.PI);
        const ringAlpha = Math.max(0, 1 - progress);
        this.octx.strokeStyle = color;
        this.octx.globalAlpha = 0.75 * ringAlpha;
        this.octx.lineWidth = 3;
        this.octx.beginPath();
        this.octx.ellipse(px, py, 18 + progress * 76, 9 + progress * 34, progress * 1.8, 0, Math.PI * 2);
        this.octx.stroke();
        this.octx.globalAlpha = 1;

        for (let p = 0; p < 26; p++) {
          const angle = Math.PI * 2 * (p / 26) + progress * 5.4;
          const radius = 10 + progress * 78 + Math.sin(progress * Math.PI * 3 + p) * 6;
          const sx = px + Math.cos(angle) * radius;
          const sy = py + Math.sin(angle) * radius * 0.72;
          const size = Math.max(2, 10 * (1 - Math.pow(progress, 1.35)));
          this.octx.fillStyle = p % 4 === 0 ? '#fff' : color;
          this.octx.fillRect(sx - size / 2, sy - size / 2, size, size);
        }

        for (const p of e.particles || []) {
          const spin = p.angle + progress * p.spin;
          const radius = p.r0 + progress * p.r1;
          const sx = px + Math.cos(spin) * radius;
          const sy = py + Math.sin(spin) * radius * 0.62 - progress * p.rise;
          const alpha = Math.max(0, (1 - progress) * p.a);
          this.octx.fillStyle = p.white ? `rgba(255,255,255,${alpha})` : this.hexToRgba(color, alpha);
          this.octx.fillRect(sx, sy, p.s, p.s);
        }

        this.octx.fillStyle = `rgba(255,255,255,${0.34 + bloom * 0.52})`;
        this.octx.beginPath();
        this.octx.arc(px, py, 14 + 36 * bloom, 0, Math.PI * 2);
        this.octx.fill();
      } else if (e.type === 'damage') {
        this.octx.font = 'bold italic 28px Georgia, serif';
        this.octx.fillStyle = e.heal ? '#74ff99' : '#ff6767';
        this.octx.strokeStyle = 'rgba(0,0,0,0.82)';
        this.octx.lineWidth = 4;
        const value = String(e.value);
        const tx = px - this.octx.measureText(value).width / 2;
        const ty = py - 42 - (maxLife - e.life) * 2.2;
        this.octx.strokeText(value, tx, ty);
        this.octx.fillText(value, tx, ty);
      }
    }
  }

  addEffect(type, x, y, opts = {}) {
    const life = opts.life || (type === 'magic' ? 42 : type === 'slash' ? 26 : 34);
    const effect = { type, x, y, life, maxLife: life, ...opts };
    if (type === 'slash') {
      effect.particles = Array.from({ length: 18 }, (_, i) => ({
        x: -22 + (i * 7) % 44,
        y: -24 + (i * 11) % 30,
        vx: -0.55 + ((i * 17) % 100) / 100 * 1.1,
        vy: -0.7 + ((i * 23) % 100) / 100 * 1.2,
        s: 1.4 + (i % 3),
        a: 0.35 + (i % 5) * 0.11,
      }));
    } else if (type === 'magic') {
      effect.particles = Array.from({ length: 34 }, (_, i) => ({
        angle: (Math.PI * 2 * i) / 34,
        spin: 1.6 + (i % 7) * 0.28,
        r0: 5 + (i % 5) * 3,
        r1: 52 + (i % 9) * 5,
        rise: 8 + (i % 6) * 5,
        s: 1.5 + (i % 4),
        a: 0.28 + (i % 6) * 0.1,
        white: i % 5 === 0,
      }));
    }
    this.effects.push(effect);
  }

  hexToRgba(hex, alpha) {
    const raw = hex.replace('#', '');
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  render() {
    this.ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.ctx.save();
    this.ctx.translate(VIEW_W / 2, VIEW_H / 2);
    this.ctx.scale(1.018, 1.018);
    this.ctx.translate(-VIEW_W / 2 + this.camera.x, -VIEW_H / 2 + this.camera.y);
    this.ctx.drawImage(this.offscreen, 0, 0, VIEW_W, VIEW_H);
    this.ctx.restore();
  }

  tick() {
    this.animFrame++;
    this.camera.x += (this.camera.targetX - this.camera.x) * 0.06;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.06;
    for (const p of this.envParticles) {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0) p.x += VIEW_W;
      if (p.x > VIEW_W) p.x -= VIEW_W;
      if (p.y < 0) p.y += VIEW_H;
      if (p.y > VIEW_H) p.y -= VIEW_H;
    }
  }
}

function showDamage(x, y, value, isHeal = false) {
  const el = document.createElement('div');
  el.className = isHeal ? 'damage-popup heal-popup' : 'damage-popup';
  el.textContent = value;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.getElementById('game-container').appendChild(el);
  setTimeout(() => el.remove(), 1800);
}
