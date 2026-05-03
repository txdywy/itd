// ==================== 像素渲染引擎 ====================
const TILE = 32;
const MAP_W = 20;
const MAP_H = 15;

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = 320;
    this.offscreen.height = 240;
    this.octx = this.offscreen.getContext('2d');
    this.octx.imageSmoothingEnabled = false;
    this.animFrame = 0;
    this.effects = [];
    this.envParticles = [];
    this.ambientColor = 'rgba(10, 10, 20, 0.4)';
    this.camera = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.loadSprites();
    this.loadPortraits();
    this.initEnv();
  }

  initEnv() {
    this.envParticles = [];
    for(let i=0; i<50; i++) {
      this.envParticles.push({
        x: Math.random() * 320,
        y: Math.random() * 240,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4 - 0.15,
        size: Math.random() * 2 + 0.5,
        depth: Math.random() * 0.6 + 0.4,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  drawEnvParticles() {
    for(const p of this.envParticles) {
      const px = (p.x + this.camera.x * p.depth * 0.5) % 320;
      const py = (p.y + this.camera.y * p.depth * 0.5) % 240;
      const drawX = px < 0 ? px + 320 : px;
      const drawY = py < 0 ? py + 240 : py;
      const alpha = (Math.sin(this.animFrame * 0.04 + p.phase) * 0.4 + 0.5) * p.depth;
      const brightness = 180 + Math.floor(p.depth * 75);
      this.octx.fillStyle = `rgba(${brightness},${Math.floor(brightness*0.9)},${Math.floor(brightness*0.7)},${alpha})`;
      this.octx.fillRect(Math.floor(drawX), Math.floor(drawY), p.size, p.size);
    }
  }

  drawLighting(units) {
    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = 320; lightCanvas.height = 240;
    const lctx = lightCanvas.getContext('2d');

    lctx.fillStyle = this.ambientColor;
    lctx.fillRect(0, 0, 320, 240);

    lctx.globalCompositeOperation = 'destination-out';

    for(const u of units) {
      if (u.hp <= 0) continue;
      const px = u.x * 16 + 8;
      const py = u.y * 16 + 8;
      const lightR = u.boss ? 55 : 40;
      const grad = lctx.createRadialGradient(px, py, 0, px, py, lightR);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(px, py, lightR, 0, Math.PI * 2);
      lctx.fill();
    }

    for(const e of this.effects) {
      const px = e.x * 16 + 8;
      const py = e.y * 16 + 8;
      let radius = 60;
      let color = [255, 255, 255];
      if (e.type === 'magic') {
        radius = 80;
        const elemColors = {
          fire: [255,120,40], ice: [100,200,255], thunder: [255,255,80],
          dark: [180,80,255], wind: [100,255,150], holy: [255,240,180]
        };
        color = elemColors[e.element] || [255,255,255];
      }
      const grad = lctx.createRadialGradient(px, py, 0, px, py, radius);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(px, py, radius, 0, Math.PI * 2);
      lctx.fill();
    }

    this.octx.drawImage(lightCanvas, 0, 0);
  }

  drawPostProcess() {
    // Vignette
    const grad = this.octx.createRadialGradient(160, 120, 80, 160, 120, 200);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0.65)');
    this.octx.fillStyle = grad;
    this.octx.fillRect(0, 0, 320, 240);

    // Scanlines (subtle)
    this.octx.fillStyle = 'rgba(0,0,0,0.06)';
    for(let y = 0; y < 240; y += 2) {
      this.octx.fillRect(0, y, 320, 1);
    }
  }

  loadSprites() {
    this.spriteCache = {};
    for (const [name, data] of Object.entries(SPRITES)) {
      if (Array.isArray(data) && data.length > 0) {
        // Check if multi-frame: data[0] is array of strings (a frame)
        // vs legacy: data[0] is a string (a row)
        if (typeof data[0] === 'string') {
          // Legacy single-frame format: array of row strings
          this.spriteCache[name] = [this.makeSprite(data)];
        } else if (Array.isArray(data[0])) {
          // Multi-frame format: array of frame arrays, each frame is array of row strings
          this.spriteCache[name] = data.map(frameLines => this.makeSprite(frameLines));
        }
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
    c.width = width; c.height = height;
    const x = c.getContext('2d');
    for (let r = 0; r < height; r++) {
      const row = lines[r] || '';
      for (let col = 0; col < width; col++) {
        const ch = row[col] || '.';
        const color = PALETTE[ch];
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
    const frameIndex = Math.floor(this.animFrame / 30) % frames.length;
    return frames[frameIndex];
  }

  clear() {
    this.octx.fillStyle = '#000';
    this.octx.fillRect(0, 0, 320, 240);
  }

  drawMap(map, highlightTiles = [], attackTiles = [], hoverTile = null) {
    const t = this.animFrame;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = parseInt(map.tiles[y][x]);
        const px = x * 16;
        const py = y * 16;

        let color = tileColors[tile] || '#333';
        this.octx.fillStyle = color;
        this.octx.fillRect(px, py, 16, 16);

        // Enhanced tile rendering
        if (tile === 0) { // Plains - grass texture
          this.octx.fillStyle = 'rgba(0,0,0,0.08)';
          this.octx.fillRect(px, py + 14, 16, 2);
          this.octx.fillStyle = 'rgba(255,255,255,0.06)';
          this.octx.fillRect(px, py, 16, 1);
          // Grass tufts
          if ((x+y)%3===0) {
            this.octx.fillStyle = 'rgba(100,130,60,0.3)';
            this.octx.fillRect(px+3, py+5, 1, 3);
            this.octx.fillRect(px+4, py+4, 1, 3);
            this.octx.fillRect(px+10, py+9, 1, 3);
          }
          if ((x+y)%4===1) {
            this.octx.fillStyle = 'rgba(80,110,50,0.25)';
            this.octx.fillRect(px+7, py+3, 1, 2);
            this.octx.fillRect(px+12, py+10, 1, 2);
          }
        } else if (tile === 5) { // Road - stone texture
          this.octx.fillStyle = 'rgba(0,0,0,0.1)';
          this.octx.fillRect(px, py + 14, 16, 2);
          this.octx.fillStyle = 'rgba(255,255,255,0.04)';
          this.octx.fillRect(px, py, 16, 1);
          // Cobblestone pattern
          this.octx.fillStyle = 'rgba(0,0,0,0.08)';
          this.octx.fillRect(px+4, py+3, 8, 1);
          this.octx.fillRect(px+2, py+7, 5, 1);
          this.octx.fillRect(px+9, py+7, 5, 1);
          this.octx.fillRect(px+3, py+11, 6, 1);
          this.octx.fillRect(px+10, py+11, 4, 1);
        } else if (tile === 3) { // Forest - detailed trees
          // Ground
          this.octx.fillStyle = '#2a4018';
          this.octx.fillRect(px, py, 16, 16);
          // Shadow
          this.octx.fillStyle = 'rgba(0,0,0,0.15)';
          this.octx.fillRect(px+4, py+12, 10, 4);
          // Trunk
          this.octx.fillStyle = '#4a3520';
          this.octx.fillRect(px+7, py+8, 2, 6);
          // Canopy layers
          this.octx.fillStyle = '#1e5010';
          this.octx.fillRect(px+3, py+2, 10, 4);
          this.octx.fillStyle = '#2a6a1a';
          this.octx.fillRect(px+4, py+1, 8, 4);
          this.octx.fillStyle = '#388a22';
          this.octx.fillRect(px+5, py+0, 6, 3);
          // Highlight
          this.octx.fillStyle = '#4a9a30';
          this.octx.fillRect(px+5, py+1, 3, 1);
          // Additional tree detail
          this.octx.fillStyle = '#1a4008';
          this.octx.fillRect(px+3, py+5, 2, 2);
          this.octx.fillRect(px+10, py+4, 2, 2);
        } else if (tile === 4) { // Mountain - detailed peak
          // Base
          this.octx.fillStyle = '#604818';
          this.octx.fillRect(px, py+6, 16, 10);
          // Dark face
          this.octx.fillStyle = '#503810';
          this.octx.beginPath();
          this.octx.moveTo(px+8, py+1);
          this.octx.lineTo(px+15, py+14);
          this.octx.lineTo(px+8, py+14);
          this.octx.fill();
          // Light face
          this.octx.fillStyle = '#886820';
          this.octx.beginPath();
          this.octx.moveTo(px+8, py+1);
          this.octx.lineTo(px+8, py+14);
          this.octx.lineTo(px+1, py+14);
          this.octx.fill();
          // Rock texture
          this.octx.fillStyle = 'rgba(0,0,0,0.15)';
          this.octx.fillRect(px+5, py+6, 3, 2);
          this.octx.fillRect(px+10, py+8, 2, 2);
          // Snow cap
          this.octx.fillStyle = 'rgba(255,255,255,0.7)';
          this.octx.fillRect(px+7, py+1, 2, 2);
          this.octx.fillStyle = 'rgba(255,255,255,0.4)';
          this.octx.fillRect(px+6, py+2, 4, 1);
        } else if (tile === 1) { // Wall - stone blocks
          this.octx.fillStyle = '#706860';
          this.octx.fillRect(px, py, 16, 16);
          // Block pattern
          this.octx.fillStyle = '#605850';
          this.octx.fillRect(px, py+7, 16, 2);
          this.octx.strokeStyle = '#504840';
          this.octx.lineWidth = 0.5;
          this.octx.strokeRect(px+0.5, py+0.5, 7, 6);
          this.octx.strokeRect(px+8, py+0.5, 7, 6);
          this.octx.strokeRect(px+0.5, py+9, 11, 6);
          this.octx.strokeRect(px+12, py+9, 3, 6);
          // Highlight
          this.octx.fillStyle = 'rgba(255,255,255,0.08)';
          this.octx.fillRect(px, py, 16, 1);
          this.octx.fillRect(px, py+9, 16, 1);
          this.octx.lineWidth = 1;
        } else if (tile === 9) { // Dark Realm - animated
          const pulse = Math.sin(t * 0.04 + x + y) * 0.15;
          this.octx.fillStyle = `rgba(80,30,80,${0.35 + pulse})`;
          this.octx.fillRect(px, py, 16, 16);
          // Mist effect
          const mistPhase = Math.sin(t * 0.02 + x * 0.5 + y * 0.3);
          this.octx.fillStyle = `rgba(180,80,220,${0.08 + mistPhase * 0.05})`;
          this.octx.fillRect(px + 2, py + 2, 12, 12);
          // Glowing center
          this.octx.fillStyle = `rgba(200,100,255,${0.1 + pulse * 0.5})`;
          this.octx.fillRect(px+6, py+6, 4, 4);
          // Animated wisps
          const wispX = px + 4 + Math.sin(t * 0.06 + y) * 4;
          const wispY = py + 8 + Math.cos(t * 0.04 + x) * 3;
          this.octx.fillStyle = 'rgba(220,140,255,0.15)';
          this.octx.fillRect(wispX, wispY, 2, 2);
        }

        // Grid lines (very subtle)
        this.octx.fillStyle = 'rgba(0,0,0,0.12)';
        this.octx.fillRect(px + 15, py, 1, 16);
        this.octx.fillRect(px, py + 15, 16, 1);
      }
    }

    // Movement range highlights
    for (const t of highlightTiles) {
      const px = t.x * 16;
      const py = t.y * 16;
      this.octx.fillStyle = 'rgba(80,180,255,0.3)';
      this.octx.fillRect(px, py, 16, 16);
      this.octx.strokeStyle = 'rgba(80,180,255,0.7)';
      this.octx.strokeRect(px+1, py+1, 14, 14);
    }

    // Attack range highlights
    for (const t of attackTiles) {
      const px = t.x * 16;
      const py = t.y * 16;
      this.octx.fillStyle = 'rgba(255,60,60,0.3)';
      this.octx.fillRect(px, py, 16, 16);
      this.octx.strokeStyle = 'rgba(255,60,60,0.7)';
      this.octx.strokeRect(px+1, py+1, 14, 14);
    }

    // Hover cursor
    if (hoverTile) {
      const px = hoverTile.x * 16;
      const py = hoverTile.y * 16;
      this.octx.strokeStyle = 'rgba(255,255,255,0.9)';
      this.octx.lineWidth = 1;
      this.octx.strokeRect(px, py, 16, 16);
      const bounce = Math.floor(Math.sin(this.animFrame * 0.15) * 2);
      this.octx.fillStyle = '#fff';
      this.octx.fillRect(px, py, 3+bounce, 1); this.octx.fillRect(px, py, 1, 3+bounce);
      this.octx.fillRect(px+16-3-bounce, py, 3+bounce, 1); this.octx.fillRect(px+15, py, 1, 3+bounce);
      this.octx.fillRect(px, py+15, 3+bounce, 1); this.octx.fillRect(px, py+16-3-bounce, 1, 3+bounce);
      this.octx.fillRect(px+16-3-bounce, py+15, 3+bounce, 1); this.octx.fillRect(px+15, py+16-3-bounce, 1, 3+bounce);
    }
  }

  drawUnit(unit, isSelected = false, isActed = false) {
    const px = unit.x * 16;
    const py = unit.y * 16;

    // Unit shadow (ellipse)
    this.octx.fillStyle = 'rgba(0,0,0,0.4)';
    this.octx.beginPath();
    this.octx.ellipse(px + 8, py + 14, 7, 2.5, 0, 0, Math.PI * 2);
    this.octx.fill();

    const sprite = this.getSpriteFrame(unit.sprite);
    if (sprite) {
      // Idle breathing animation
      let offset_y = -4;
      if (!isActed && unit.hp > 0) {
        const breathe = Math.sin(this.animFrame * 0.08 + px * 0.1);
        offset_y += Math.round(breathe) * 1;
      }

      const shiftX = (16 - sprite.width) / 2;
      const shiftY = 16 - sprite.height;

      if (isActed) {
        this.octx.globalAlpha = 0.45;
      }

      this.octx.save();
      let drawPx = px + shiftX;
      if (unit.dir === 'left') {
        this.octx.translate(drawPx + sprite.width / 2, 0);
        this.octx.scale(-1, 1);
        this.octx.translate(-(drawPx + sprite.width / 2), 0);
      }
      this.octx.drawImage(sprite, drawPx, py + shiftY + offset_y);
      this.octx.restore();

      this.octx.globalAlpha = 1.0;
    }

    // HP Bar
    const barW = 14;
    const barH = 2;
    const hpRatio = unit.hp / unit.maxHp;
    this.octx.fillStyle = '#000';
    this.octx.fillRect(px + 1, py - 6, barW, barH + 1);
    if (hpRatio > 0.5) {
      this.octx.fillStyle = '#4a4';
    } else if (hpRatio > 0.25) {
      this.octx.fillStyle = '#ea4';
    } else {
      this.octx.fillStyle = '#e44';
    }
    this.octx.fillRect(px + 1, py - 5, Math.max(0, barW * hpRatio), barH);

    // Selection indicator
    if (isSelected) {
      const bounce = Math.sin(this.animFrame * 0.12) * 2;
      this.octx.fillStyle = '#ff0';
      this.octx.beginPath();
      this.octx.moveTo(px + 8, py - 10 + bounce);
      this.octx.lineTo(px + 5, py - 14 + bounce);
      this.octx.lineTo(px + 11, py - 14 + bounce);
      this.octx.fill();
      // Glow
      this.octx.fillStyle = 'rgba(255,255,0,0.15)';
      this.octx.beginPath();
      this.octx.arc(px + 8, py + 4, 10, 0, Math.PI * 2);
      this.octx.fill();
    }

    // BOSS Icon
    if (unit.boss) {
      this.octx.fillStyle = '#f44';
      this.octx.font = '8px monospace';
      this.octx.fillText('★', px + 10, py - 6);
    }
  }

  drawEffects() {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life--;
      if (e.life <= 0) {
        this.effects.splice(i, 1);
        continue;
      }
      const px = e.x * 16 + 8;
      const py = e.y * 16 + 8;
      const maxLife = e.maxLife || 20;
      const progress = 1 - (e.life / maxLife);

      if (e.type === 'slash') {
        this.octx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
        this.octx.lineWidth = 2 + (1 - progress) * 2;
        this.octx.beginPath();
        const startAngle = Math.PI * 1.25 + progress;
        const endAngle = Math.PI * 1.75 + progress * 2;
        this.octx.arc(px - 4 + progress * 8, py, 14, startAngle, endAngle);
        this.octx.stroke();
        // Slash trail
        this.octx.strokeStyle = `rgba(200, 220, 255, ${(1 - progress) * 0.5})`;
        this.octx.lineWidth = 1;
        this.octx.beginPath();
        this.octx.arc(px - 4 + progress * 8, py, 10, startAngle - 0.3, endAngle - 0.3);
        this.octx.stroke();
        this.octx.lineWidth = 1;
      } else if (e.type === 'magic') {
        const colors = {
          fire: '#f42', ice: '#4cf', thunder: '#ff2',
          dark: '#84c', wind: '#4f8', holy: '#ffd'
        };
        const color = colors[e.element] || '#fff';
        this.octx.fillStyle = color;

        // Exploding particles
        for(let p = 0; p < 8; p++) {
          const angle = (Math.PI * 2 / 8) * p + progress * 3;
          const radius = progress * 22;
          const sx = px + Math.cos(angle) * radius;
          const sy = py + Math.sin(angle) * radius;
          const size = Math.max(1, 5 * (1 - Math.pow(progress, 1.5)));
          this.octx.fillRect(sx - size/2, sy - size/2, size, size);
        }
        // Inner ring
        for(let p = 0; p < 6; p++) {
          const angle = (Math.PI * 2 / 6) * p - progress * 2;
          const radius = progress * 12;
          const sx = px + Math.cos(angle) * radius;
          const sy = py + Math.sin(angle) * radius;
          const size = Math.max(1, 3 * (1 - progress));
          this.octx.fillStyle = `rgba(255,255,255,${(1 - progress) * 0.7})`;
          this.octx.fillRect(sx - size/2, sy - size/2, size, size);
        }
        // Central flash
        this.octx.fillStyle = `rgba(255,255,255,${0.9 - progress})`;
        const flashR = 16 * Math.sin(progress * Math.PI);
        this.octx.beginPath();
        this.octx.arc(px, py, flashR, 0, Math.PI * 2);
        this.octx.fill();
        // Glow
        this.octx.fillStyle = color.replace('#', 'rgba(').replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i,
          (m, r, g, b) => `${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},${0.2 * (1-progress)})`);
        this.octx.beginPath();
        this.octx.arc(px, py, 25 * Math.sin(progress * Math.PI), 0, Math.PI * 2);
        this.octx.fill();
      } else if (e.type === 'damage') {
        this.octx.fillStyle = e.heal ? '#4f4' : '#f44';
        this.octx.font = '10px monospace';
        this.octx.fillText(e.value, px - 6, py - 10 - (maxLife - e.life));
      }
    }
  }

  addEffect(type, x, y, opts = {}) {
    this.effects.push({ type, x, y, life: opts.life || 20, maxLife: opts.life || 20, ...opts });
  }

  render(camX = 0, camY = 0) {
    this.ctx.clearRect(0, 0, 640, 480);
    this.ctx.save();

    const zoom = 1.05;
    this.ctx.translate(320, 240);
    this.ctx.scale(zoom, zoom);
    this.ctx.translate(-320 + camX, -240 + camY);

    this.ctx.drawImage(this.offscreen, 0, 0, 640, 480);
    this.ctx.restore();
  }

  tick() {
    this.animFrame++;

    this.camera.x += (this.camera.targetX - this.camera.x) * 0.05;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.05;

    for(const p of this.envParticles) {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0) p.x += 320;
      if (p.x > 320) p.x -= 320;
      if (p.y < 0) p.y += 240;
      if (p.y > 240) p.y -= 240;
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
  setTimeout(() => el.remove(), 1000);
}
