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
    this.initEnv();
  }

  initEnv() {
    this.envParticles = [];
    for(let i=0; i<40; i++) {
      this.envParticles.push({
        x: Math.random() * 320,
        y: Math.random() * 240,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5 - 0.2,
        size: Math.random() * 1.5 + 0.5,
        depth: Math.random() * 0.5 + 0.5
      });
    }
  }

  drawEnvParticles() {
    this.octx.fillStyle = 'rgba(255,230,180,0.3)';
    for(const p of this.envParticles) {
      // parallax effect based on camera
      const px = (p.x + this.camera.x * p.depth * 0.5) % 320;
      const py = (p.y + this.camera.y * p.depth * 0.5) % 240;
      const drawX = px < 0 ? px + 320 : px;
      const drawY = py < 0 ? py + 240 : py;
      this.octx.globalAlpha = Math.sin(this.animFrame * 0.05 + p.x) * 0.5 + 0.5;
      this.octx.fillRect(drawX, drawY, p.size, p.size);
    }
    this.octx.globalAlpha = 1.0;
  }

  drawLighting(units) {
    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = 320; lightCanvas.height = 240;
    const lctx = lightCanvas.getContext('2d');
    
    // Fill ambient dark
    lctx.fillStyle = this.ambientColor;
    lctx.fillRect(0, 0, 320, 240);
    
    // Cut out lights
    lctx.globalCompositeOperation = 'destination-out';
    
    // Units cast soft light
    for(const u of units) {
      if (u.hp <= 0) continue;
      const px = u.x * 16 + 8;
      const py = u.y * 16 + 8;
      const grad = lctx.createRadialGradient(px, py, 0, px, py, 40);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(px, py, 40, 0, Math.PI * 2);
      lctx.fill();
    }
    
    // Effects cast bright light
    for(const e of this.effects) {
      const px = e.x * 16 + 8;
      const py = e.y * 16 + 8;
      let radius = 60;
      if (e.type === 'magic') radius = 80;
      const grad = lctx.createRadialGradient(px, py, 0, px, py, radius);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
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
    const grad = this.octx.createRadialGradient(160, 120, 100, 160, 120, 220);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    this.octx.fillStyle = grad;
    this.octx.fillRect(0, 0, 320, 240);
    
    // Scanlines (subtle HD-2D texture)
    this.octx.fillStyle = 'rgba(0,0,0,0.1)';
    for(let y = 0; y < 240; y += 2) {
      this.octx.fillRect(0, y, 320, 1);
    }
  }

  loadSprites() {
    this.spriteCache = {};
    for (const [name, lines] of Object.entries(SPRITES)) {
      this.spriteCache[name] = this.makeSprite(lines);
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

  clear() {
    this.octx.fillStyle = '#000';
    this.octx.fillRect(0, 0, 320, 240);
  }

  drawMap(map, highlightTiles = [], attackTiles = [], hoverTile = null) {
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = parseInt(map.tiles[y][x]);
        const px = x * 16;
        const py = y * 16;
        
        // Base color
        let color = tileColors[tile] || '#333';
        this.octx.fillStyle = color;
        this.octx.fillRect(px, py, 16, 16);

        // Tile shading and textures (pixel art style)
        if (tile === 0 || tile === 5) { // Plains / Road
          this.octx.fillStyle = 'rgba(0,0,0,0.1)';
          this.octx.fillRect(px, py + 15, 16, 1);
          this.octx.fillStyle = 'rgba(255,255,255,0.05)';
          this.octx.fillRect(px, py, 16, 1);
          if ((x+y)%3===0) this.octx.fillRect(px+4, py+4, 2, 2);
          if ((x*y)%5===0) this.octx.fillRect(px+10, py+10, 2, 2);
        } else if (tile === 3) { // Forest
          this.octx.fillStyle = '#2a5a1a';
          this.octx.fillRect(px+2, py+2, 6, 6);
          this.octx.fillRect(px+8, py+6, 6, 6);
          this.octx.fillRect(px+4, py+10, 6, 6);
          this.octx.fillStyle = '#1e4013'; // shadow
          this.octx.fillRect(px+4, py+8, 6, 2);
          this.octx.fillRect(px+10, py+12, 4, 2);
        } else if (tile === 4) { // Mountain
          this.octx.fillStyle = '#6b4f0e';
          this.octx.beginPath();
          this.octx.moveTo(px+8, py+2);
          this.octx.lineTo(px+14, py+14);
          this.octx.lineTo(px+2, py+14);
          this.octx.fill();
          this.octx.fillStyle = '#8b6914';
          this.octx.beginPath();
          this.octx.moveTo(px+8, py+2);
          this.octx.lineTo(px+8, py+14);
          this.octx.lineTo(px+2, py+14);
          this.octx.fill();
          this.octx.fillStyle = 'rgba(255,255,255,0.4)';
          this.octx.fillRect(px+7, py+2, 2, 2);
        } else if (tile === 1) { // Wall
          this.octx.fillStyle = '#666';
          this.octx.fillRect(px, py, 16, 16);
          this.octx.fillStyle = '#555';
          this.octx.fillRect(px, py+8, 16, 8);
          this.octx.strokeStyle = '#444';
          this.octx.strokeRect(px, py, 16, 8);
          this.octx.strokeRect(px, py+8, 16, 8);
        } else if (tile === 9) { // Dark Realm
          this.octx.fillStyle = `rgba(80,30,80, ${0.4 + Math.sin(this.animFrame * 0.05 + x + y) * 0.1})`;
          this.octx.fillRect(px, py, 16, 16);
          this.octx.fillStyle = 'rgba(200,100,255,0.1)';
          this.octx.fillRect(px+6, py+6, 4, 4);
        }

        // Grid lines (subtle)
        this.octx.fillStyle = 'rgba(0,0,0,0.2)';
        this.octx.fillRect(px + 15, py, 1, 16);
        this.octx.fillRect(px, py + 15, 16, 1);
      }
    }

    // Highlight movement range
    for (const t of highlightTiles) {
      const px = t.x * 16;
      const py = t.y * 16;
      this.octx.fillStyle = 'rgba(100,200,255,0.35)';
      this.octx.fillRect(px, py, 16, 16);
      this.octx.strokeStyle = 'rgba(100,200,255,0.8)';
      this.octx.strokeRect(px+1, py+1, 14, 14);
    }

    // Highlight attack range
    for (const t of attackTiles) {
      const px = t.x * 16;
      const py = t.y * 16;
      this.octx.fillStyle = 'rgba(255,80,80,0.35)';
      this.octx.fillRect(px, py, 16, 16);
      this.octx.strokeStyle = 'rgba(255,80,80,0.8)';
      this.octx.strokeRect(px+1, py+1, 14, 14);
    }

    // Hover cursor
    if (hoverTile) {
      const px = hoverTile.x * 16;
      const py = hoverTile.y * 16;
      this.octx.strokeStyle = '#fff';
      this.octx.lineWidth = 1;
      this.octx.strokeRect(px, py, 16, 16);
      // animated inner corners
      const bounce = Math.floor(Math.sin(this.animFrame * 0.2) * 2);
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
    
    // Unit shadow
    this.octx.fillStyle = 'rgba(0,0,0,0.5)';
    this.octx.beginPath();
    this.octx.ellipse(px + 8, py + 14, 6, 2, 0, 0, Math.PI * 2);
    this.octx.fill();

    const sprite = this.spriteCache[unit.sprite];
    if (sprite) {
      let offset_y = -2;
      // Idle bounce animation
      if (!isActed && unit.hp > 0) {
        offset_y += Math.sin(this.animFrame * 0.1 + px) > 0 ? 0 : 1;
      }
      
      const shiftX = (16 - sprite.width) / 2;
      const shiftY = 16 - sprite.height;
      
      if (isActed) {
        this.octx.globalAlpha = 0.5; // Dim acted units
      }
      
      this.octx.save();
      let drawPx = px + shiftX;
      if (unit.dir === 'left') {
        // Flip horizontally
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
    this.octx.fillRect(px + 1, py - 6, barW, barH + 1); // background/border
    this.octx.fillStyle = hpRatio > 0.5 ? '#4a4' : hpRatio > 0.25 ? '#ea4' : '#e44';
    this.octx.fillRect(px + 1, py - 5, Math.max(0, barW * hpRatio), barH);
    
    // Selection indicator
    if (isSelected) {
      const bounce = Math.sin(this.animFrame * 0.15) * 2;
      this.octx.fillStyle = '#ff0';
      this.octx.beginPath();
      this.octx.moveTo(px + 8, py - 10 + bounce);
      this.octx.lineTo(px + 5, py - 14 + bounce);
      this.octx.lineTo(px + 11, py - 14 + bounce);
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
        this.octx.lineWidth = 1;
      } else if (e.type === 'magic') {
        const colors = { fire: '#f42', ice: '#4cf', thunder: '#ff2', dark: '#628', wind: '#4f8', holy: '#ffd' };
        this.octx.fillStyle = colors[e.element] || '#fff';
        
        // Exploding particles
        for(let p = 0; p < 6; p++) {
          const angle = (Math.PI * 2 / 6) * p + progress * 4;
          const radius = progress * 20;
          const sx = px + Math.cos(angle) * radius;
          const sy = py + Math.sin(angle) * radius;
          const size = Math.max(1, 5 * (1 - Math.pow(progress, 2)));
          this.octx.fillRect(sx - size/2, sy - size/2, size, size);
        }
        // Central intense flash
        this.octx.fillStyle = `rgba(255,255,255,${0.8 - progress})`;
        this.octx.beginPath();
        this.octx.arc(px, py, 18 * Math.sin(progress * Math.PI), 0, Math.PI * 2);
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
    // 离屏渲染320x240，放大到640x480 并带有摄像机平移和微距
    this.ctx.clearRect(0, 0, 640, 480);
    this.ctx.save();
    
    // Zoom and Pan effect (HD-2D style depth)
    const zoom = 1.05;
    this.ctx.translate(320, 240); // center
    this.ctx.scale(zoom, zoom);
    // Add smooth mouse-based panning
    this.ctx.translate(-320 + camX, -240 + camY);
    
    this.ctx.drawImage(this.offscreen, 0, 0, 640, 480);
    this.ctx.restore();
  }

  tick() {
    this.animFrame++;
    
    // Update camera smoothing
    this.camera.x += (this.camera.targetX - this.camera.x) * 0.05;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.05;

    // Update env particles
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

// 显示伤害数字的DOM效果
function showDamage(x, y, value, isHeal = false) {
  const el = document.createElement('div');
  el.className = isHeal ? 'damage-popup heal-popup' : 'damage-popup';
  el.textContent = value;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.getElementById('game-container').appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
