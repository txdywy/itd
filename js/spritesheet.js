// ==================== PNG Sprite Sheet 加载系统 ====================
// 支持从 assets/sprites/ 加载 PNG 精灵图，找不到时用 Canvas 生成 placeholder

class SpriteSheetManager {
  constructor() {
    this.sheets = {};      // name -> { image, meta }
    this.ready = false;
    this.onReady = null;
  }

  // 定义精灵图元数据 (帧尺寸、动画布局)
  static META = {
    // 动画行定义: [名称, 起始帧, 帧数]
    ANIMS: [
      { name: 'idle',   row: 0, frames: 4 },
      { name: 'walk',   row: 1, frames: 4 },
      { name: 'attack', row: 2, frames: 4 },
      { name: 'cast',   row: 3, frames: 2 },
      { name: 'hurt',   row: 4, frames: 2 },
      { name: 'death',  row: 5, frames: 4 },
    ],

    // 角色精灵配置
    CHARS: {
      xiahouyi:        { fw: 64, fh: 128, palette: { hair: '#c0a030', hairH: '#e8d060', skin: '#f0d0b0', cloth: '#d04040', clothD: '#a02020', trim: '#e8d060' }},
      bingli:          { fw: 64, fh: 128, palette: { hair: '#90c8c8', hairH: '#c8e8e8', skin: '#f0d0b0', cloth: '#6090b8', clothD: '#406888', trim: '#f0ece0' }},
      fenglingsheng:   { fw: 64, fh: 128, palette: { hair: '#b08050', hairH: '#d0a060', skin: '#f0d0b0', cloth: '#80b060', clothD: '#508038', trim: '#d8b090' }},
      murongxuanji:    { fw: 64, fh: 128, palette: { hair: '#a080b0', hairH: '#c0a0d0', skin: '#f0d0b0', cloth: '#705080', clothD: '#402850', trim: '#e8d060' }},
      gulunde:         { fw: 64, fh: 128, palette: { hair: '#e8d060', hairH: '#f0e880', skin: '#d0a878', cloth: '#504840', clothD: '#2a2420', trim: '#e8d060' }},
      xixia:           { fw: 64, fh: 128, palette: { hair: '#8a8278', hairH: '#b3aca0', skin: '#d0a878', cloth: '#d04040', clothD: '#a02020', trim: '#c0a030' }},
      yaomo:           { fw: 64, fh: 128, palette: { hair: '#705080', hairH: '#a080b0', skin: '#a07050', cloth: '#402850', clothD: '#181412', trim: '#705080' }},
      huangfushen:     { fw: 64, fh: 128, palette: { hair: '#c0a030', hairH: '#e8d060', skin: '#a07050', cloth: '#504840', clothD: '#2a2420', trim: '#c0a030' }},
      luohou:          { fw: 64, fh: 128, palette: { hair: '#a02020', hairH: '#d04040', skin: '#a07050', cloth: '#601010', clothD: '#181412', trim: '#e07040' }},
    }
  };

  // 加载所有精灵图 (async)
  async loadAll(onProgress) {
    const names = Object.keys(SpriteSheetManager.META.CHARS);
    let loaded = 0;

    for (const name of names) {
      const meta = SpriteSheetManager.META.CHARS[name];
      try {
        // 尝试从 assets/sprites/ 加载 PNG
        const img = await this.loadImage(`assets/sprites/${name}.png`);
        this.sheets[name] = { image: img, meta, fromPNG: true };
      } catch (e) {
        // PNG 不存在，用 Canvas 生成 placeholder
        this.sheets[name] = { image: this.generatePlaceholder(name, meta), meta, fromPNG: false };
      }
      loaded++;
      if (onProgress) onProgress(loaded, names.length);
    }

    this.ready = true;
    if (this.onReady) this.onReady();
  }

  // 异步加载图片
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${url}`));
      img.src = url;
    });
  }

  // 获取指定动画的源矩形
  getFrameRect(name, animName, frameIndex) {
    const sheet = this.sheets[name];
    if (!sheet) return null;

    const anim = SpriteSheetManager.META.ANIMS.find(a => a.name === animName);
    if (!anim) return null;

    const { fw, fh } = sheet.meta;
    const frame = frameIndex % anim.frames;

    return {
      x: frame * fw,
      y: anim.row * fh,
      w: fw,
      h: fh
    };
  }

  // 绘制精灵帧到指定 Canvas context
  drawFrame(ctx, name, animName, frameIndex, dx, dy, scale = 1) {
    const sheet = this.sheets[name];
    if (!sheet) return false;

    const rect = this.getFrameRect(name, animName, frameIndex);
    if (!rect) return false;

    const dw = rect.w * scale;
    const dh = rect.h * scale;

    ctx.drawImage(
      sheet.image,
      rect.x, rect.y, rect.w, rect.h,
      dx, dy, dw, dh
    );
    return true;
  }

  // 获取精灵的显示尺寸 (缩放后)
  getScaledSize(name, scale = 1) {
    const sheet = this.sheets[name];
    if (!sheet) return null;
    return { w: sheet.meta.fw * scale, h: sheet.meta.fh * scale };
  }

  // 检查是否从 PNG 加载
  isFromPNG(name) {
    return this.sheets[name]?.fromPNG || false;
  }

  // ==================== Placeholder 生成 ====================
  // 用 Canvas 绘制高质量 placeholder 精灵图 (Octopath 风格)

  generatePlaceholder(name, meta) {
    const { fw, fh, palette } = meta;
    const anims = SpriteSheetManager.META.ANIMS;
    const sheetW = fw * 6;  // max frames per row
    const sheetH = fh * anims.length;

    const canvas = document.createElement('canvas');
    canvas.width = sheetW;
    canvas.height = sheetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (const anim of anims) {
      for (let f = 0; f < anim.frames; f++) {
        const ox = f * fw;
        const oy = anim.row * fh;
        this.drawCharacterFrame(ctx, ox, oy, fw, fh, palette, anim.name, f);
      }
    }

    return canvas;
  }

  drawCharacterFrame(ctx, ox, oy, fw, fh, pal, animName, frame) {
    const cx = ox + Math.floor(fw / 2);
    const scale = fw / 64; // base scale factor

    // Clear frame area
    ctx.clearRect(ox, oy, fw, fh);

    // Shadow on ground
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, oy + fh - 4, 18 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body offset for animation
    let bodyOx = 0, bodyOy = 0;
    if (animName === 'idle') {
      bodyOy = Math.sin(frame * Math.PI / 2) * 2;
    } else if (animName === 'walk') {
      bodyOy = Math.abs(Math.sin(frame * Math.PI / 2)) * -3;
      bodyOx = (frame % 2 === 0 ? -1 : 1) * scale;
    } else if (animName === 'attack') {
      bodyOx = (frame < 2 ? frame * 4 : (4 - frame) * 4) * scale;
    } else if (animName === 'hurt') {
      bodyOx = -3 * scale;
    } else if (animName === 'death') {
      bodyOy = frame * 8 * scale;
    }

    const bx = cx + bodyOx;
    const by = oy + bodyOy;

    // === Draw character (Octopath-style proportions) ===

    // -- Legs --
    const legY = by + 70 * scale;
    const legW = 8 * scale;
    const legH = 28 * scale;
    const legGap = 8 * scale;

    // Walk animation leg offset
    let legOff = 0;
    if (animName === 'walk') {
      legOff = Math.sin(frame * Math.PI / 2) * 6 * scale;
    }

    // Left leg
    ctx.fillStyle = pal.clothD;
    ctx.fillRect(bx - legGap - legOff, legY, legW, legH);
    ctx.fillStyle = pal.cloth;
    ctx.fillRect(bx - legGap - legOff + scale, legY, legW - 2 * scale, legH);

    // Right leg
    ctx.fillStyle = pal.clothD;
    ctx.fillRect(bx + legGap + legOff - legW, legY, legW, legH);
    ctx.fillStyle = pal.cloth;
    ctx.fillRect(bx + legGap + legOff - legW + scale, legY, legW - 2 * scale, legH);

    // Boots
    ctx.fillStyle = '#504840';
    ctx.fillRect(bx - legGap - legOff - scale, legY + legH - 6 * scale, legW + 2 * scale, 6 * scale);
    ctx.fillRect(bx + legGap + legOff - legW - scale, legY + legH - 6 * scale, legW + 2 * scale, 6 * scale);

    // -- Body/Torso --
    const torsoY = by + 36 * scale;
    const torsoW = 30 * scale;
    const torsoH = 36 * scale;

    // Cape/back layer
    ctx.fillStyle = pal.clothD;
    ctx.fillRect(bx - torsoW/2 - 2*scale, torsoY + 4*scale, torsoW + 4*scale, torsoH - 2*scale);

    // Main torso
    ctx.fillStyle = pal.cloth;
    ctx.fillRect(bx - torsoW/2, torsoY, torsoW, torsoH);

    // Torso shading (left = dark, right = highlight)
    ctx.fillStyle = pal.clothD;
    ctx.fillRect(bx - torsoW/2, torsoY, 6*scale, torsoH);
    ctx.fillStyle = pal.trim;
    ctx.fillRect(bx + torsoW/2 - 6*scale, torsoY, 3*scale, torsoH);

    // Belt
    ctx.fillStyle = pal.trim;
    ctx.fillRect(bx - torsoW/2, torsoY + 28*scale, torsoW, 4*scale);
    ctx.fillStyle = '#806818';
    ctx.fillRect(bx - 3*scale, torsoY + 28*scale, 6*scale, 4*scale);

    // Collar/neckline detail
    ctx.fillStyle = pal.trim;
    ctx.fillRect(bx - 8*scale, torsoY, 16*scale, 3*scale);

    // -- Arms --
    const armY = by + 38 * scale;
    const armW = 8 * scale;
    const armH = 30 * scale;

    let armAngle = 0;
    if (animName === 'attack') {
      armAngle = frame < 2 ? -frame * 0.3 : -(4 - frame) * 0.3;
    } else if (animName === 'cast') {
      armAngle = -0.4;
    }

    // Left arm
    ctx.fillStyle = pal.clothD;
    ctx.fillRect(bx - torsoW/2 - armW - 2*scale, armY, armW, armH);
    ctx.fillStyle = pal.cloth;
    ctx.fillRect(bx - torsoW/2 - armW - scale, armY + scale, armW - 2*scale, armH - 2*scale);
    // Hand
    ctx.fillStyle = pal.skin;
    ctx.fillRect(bx - torsoW/2 - armW - scale, armY + armH - 5*scale, armW, 5*scale);

    // Right arm (holds weapon in attack)
    const rArmX = bx + torsoW/2 + 2*scale;
    ctx.fillStyle = pal.clothD;
    ctx.fillRect(rArmX, armY, armW, armH);
    ctx.fillStyle = pal.cloth;
    ctx.fillRect(rArmX + scale, armY + scale, armW - 2*scale, armH - 2*scale);
    ctx.fillStyle = pal.skin;
    ctx.fillRect(rArmX + scale, armY + armH - 5*scale, armW, 5*scale);

    // Weapon (sword) during attack
    if (animName === 'attack' || animName === 'idle') {
      const swordX = rArmX + armW;
      const swordY = armY - (animName === 'attack' ? 20*scale : 10*scale);
      ctx.fillStyle = '#c8c0b0';
      ctx.fillRect(swordX, swordY, 3*scale, 35*scale);
      ctx.fillStyle = '#f0ece0';
      ctx.fillRect(swordX + scale, swordY, scale, 35*scale);
      // Guard
      ctx.fillStyle = pal.trim;
      ctx.fillRect(swordX - 3*scale, swordY + 30*scale, 9*scale, 3*scale);
    }

    // -- Head --
    const headY = by + 8 * scale;
    const headW = 24 * scale;
    const headH = 28 * scale;

    // Hair back
    ctx.fillStyle = pal.hair;
    ctx.fillRect(bx - headW/2 - 2*scale, headY - 4*scale, headW + 4*scale, headH + 8*scale);

    // Face
    ctx.fillStyle = pal.skin;
    ctx.fillRect(bx - headW/2 + 2*scale, headY + 2*scale, headW - 4*scale, headH - 4*scale);

    // Skin shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(bx - headW/2 + 2*scale, headY + 2*scale, 4*scale, headH - 4*scale);

    // Hair front
    ctx.fillStyle = pal.hair;
    ctx.fillRect(bx - headW/2 - 2*scale, headY - 4*scale, headW + 4*scale, 10*scale);
    ctx.fillStyle = pal.hairH;
    ctx.fillRect(bx - headW/2, headY - 2*scale, 8*scale, 4*scale);

    // Eyes
    const eyeY = headY + 12 * scale;
    ctx.fillStyle = '#181412';
    ctx.fillRect(bx - 8*scale, eyeY, 5*scale, 4*scale);
    ctx.fillRect(bx + 4*scale, eyeY, 5*scale, 4*scale);
    // Eye highlight
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx - 7*scale, eyeY + scale, 2*scale, 2*scale);
    ctx.fillRect(bx + 5*scale, eyeY + scale, 2*scale, 2*scale);

    // Mouth
    if (animName === 'hurt' || animName === 'death') {
      ctx.fillStyle = '#181412';
      ctx.fillRect(bx - 3*scale, headY + 20*scale, 6*scale, 2*scale);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(bx - 2*scale, headY + 20*scale, 4*scale, scale);
    }

    // Hair sides (flowing)
    ctx.fillStyle = pal.hair;
    ctx.fillRect(bx - headW/2 - 4*scale, headY + 4*scale, 6*scale, 20*scale);
    ctx.fillRect(bx + headW/2 - 2*scale, headY + 4*scale, 6*scale, 20*scale);
    ctx.fillStyle = pal.hairH;
    ctx.fillRect(bx - headW/2 - 3*scale, headY + 6*scale, 2*scale, 12*scale);

    // Attack flash effect
    if (animName === 'attack' && frame === 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(bx + torsoW/2 + 20*scale, armY, 15*scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cast glow effect
    if (animName === 'cast') {
      const glowAlpha = 0.2 + Math.sin(frame * Math.PI) * 0.3;
      ctx.fillStyle = `rgba(200,180,255,${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(bx, armY + 10*scale, 20*scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
