// ==================== 战棋战斗引擎 ====================
class BattleEngine {
  constructor(map, players, enemies) {
    this.map = map;
    this.players = players;
    this.enemies = enemies;
    this.allUnits = [...players, ...enemies];
    this.turn = 'player'; // player | enemy
    this.selectedUnit = null;
    this.state = 'idle'; // idle | move | action | anim | dialogue | end
    this.moveRange = [];
    this.attackRange = [];
    this.turnCount = 1;
    this.winner = null;
    this.aiDelay = 0;
    this.pendingAction = null;
  }

  // ========== 工具方法 ==========
  getUnitAt(x, y) {
    return this.allUnits.find(u => u.x === x && u.y === y && u.hp > 0);
  }

  isValidPos(x, y) {
    if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) return false;
    const tile = parseInt(this.map.tiles[y][x]);
    return tileInfo[tile].move < 99;
  }

  isBlocked(x, y, movingUnit) {
    if (!this.isValidPos(x, y)) return true;
    const u = this.getUnitAt(x, y);
    return u && u !== movingUnit && u.hp > 0;
  }

  getPopupPoint(renderer, x, y) {
    const el = document.getElementById('game-container');
    const rect = el.getBoundingClientRect();
    const center = renderer.tileCenter(x, y);
    return {
      x: center.x * (rect.width / renderer.canvas.width),
      y: (center.y - 28) * (rect.height / renderer.canvas.height),
    };
  }

  // BFS计算移动范围
  calcMoveRange(unit) {
    const range = [];
    const visited = new Set();
    const queue = [{ x: unit.x, y: unit.y, cost: 0 }];
    visited.add(`${unit.x},${unit.y}`);
    while (queue.length) {
      const cur = queue.shift();
      if (cur.cost > 0) range.push({ x: cur.x, y: cur.y, cost: cur.cost });
      if (cur.cost >= unit.move) continue;
      for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (visited.has(`${nx},${ny}`)) continue;
        if (!this.isValidPos(nx, ny)) continue;
        const tile = parseInt(this.map.tiles[ny][nx]);
        const moveCost = tileInfo[tile].move;
        if (cur.cost + moveCost > unit.move) continue;
        if (this.isBlocked(nx, ny, unit)) continue;
        visited.add(`${nx},${ny}`);
        queue.push({ x: nx, y: ny, cost: cur.cost + moveCost });
      }
    }
    return range;
  }

  // 计算攻击/技能范围
  calcAttackRange(unit, range) {
    const res = [];
    const unitTile = tileInfo[parseInt(this.map.tiles[unit.y][unit.x])];
    let actualRange = range;
    
    // High ground gives +1 range for ranged attacks (range > 1)
    if (range > 1 && (unitTile.height || 0) >= 2) {
      actualRange += 1;
    }

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const d = Math.abs(x - unit.x) + Math.abs(y - unit.y);
        if (d > 0 && d <= actualRange) res.push({ x, y });
      }
    }
    return res;
  }

  // ========== 战斗计算 ==========
  calcDamage(attacker, defender, skill) {
    const tmpl = SKILLS[skill];
    let dmg = 0;
    let isHit = true;
    let isCrit = Math.random() < 0.08;
    const defTile = tileInfo[parseInt(this.map.tiles[defender.y][defender.x])];
    const attTile = tileInfo[parseInt(this.map.tiles[attacker.y][attacker.x])];
    const avoid = defTile.avoid || 0;
    const hitRate = Math.min(100, 90 + (attacker.spd - defender.spd) * 2 - avoid);
    isHit = Math.random() * 100 < hitRate;
    if (!isHit) return { dmg: 0, isHit: false, isCrit: false };

    if (tmpl.type === 'phys') {
      dmg = Math.max(1, attacker.atk - defender.def + tmpl.power);
    } else if (tmpl.type === 'magic') {
      dmg = Math.max(1, attacker.mag - defender.def * 0.5 + tmpl.power);
    } else if (tmpl.type === 'heal') {
      return { dmg: -tmpl.power, isHit: true, isCrit: false };
    }

    // Directional facing modifier
    if (tmpl.type !== 'heal' && tmpl.range === 1) {
      let dx = attacker.x - defender.x;
      let dy = attacker.y - defender.y;
      let attackDir = '';
      if (Math.abs(dx) > Math.abs(dy)) attackDir = dx > 0 ? 'left' : 'right';
      else attackDir = dy > 0 ? 'up' : 'down';

      if (attackDir === defender.dir) {
        // Backstab
        dmg *= 1.5;
        isCrit = Math.random() < 0.3; // Higher crit chance from back
      } else if (
        (attackDir === 'left' && (defender.dir === 'up' || defender.dir === 'down')) ||
        (attackDir === 'right' && (defender.dir === 'up' || defender.dir === 'down')) ||
        (attackDir === 'up' && (defender.dir === 'left' || defender.dir === 'right')) ||
        (attackDir === 'down' && (defender.dir === 'left' || defender.dir === 'right'))
      ) {
        // Flank
        dmg *= 1.25;
      }
    }

    // Elevation modifier
    if (tmpl.type !== 'heal') {
      const heightDiff = (attTile.height || 0) - (defTile.height || 0);
      if (heightDiff > 0) {
        dmg *= 1.1; // +10% from high ground
      } else if (heightDiff < 0) {
        dmg *= 0.9; // -10% from low ground
      }
    }

    // 元素相克
    if (tmpl.element && ELEMENT_ADV[tmpl.element]) {
      const adv = ELEMENT_ADV[tmpl.element];
      // 简化：检查技能属性是否克制目标
      // 实际游戏中应该检查目标的属性，这里简化为根据技能加成
    }

    // 随机波动
    dmg = Math.floor(dmg * (0.9 + Math.random() * 0.2));
    if (isCrit) dmg = Math.floor(dmg * 1.5);
    return { dmg, isHit, isCrit };
  }

  // 执行攻击/技能
  executeAction(attacker, targetX, targetY, skillKey, renderer) {
    const skill = SKILLS[skillKey];
    const targets = [];
    
    // Attacker turns to face target
    const dx = targetX - attacker.x;
    const dy = targetY - attacker.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      attacker.dir = dx > 0 ? 'right' : 'left';
    } else if (Math.abs(dy) > Math.abs(dx)) {
      attacker.dir = dy > 0 ? 'down' : 'up';
    }

    // 范围判定
    if (skill.area > 1) {
      for (const u of this.allUnits) {
        if (u.hp <= 0) continue;
        const d = Math.abs(u.x - targetX) + Math.abs(u.y - targetY);
        if (d <= skill.area - 1) {
          const isEnemy = attacker.team !== u.team;
          if (skill.type === 'heal' && !isEnemy) targets.push(u);
          else if (skill.type !== 'heal' && isEnemy) targets.push(u);
        }
      }
    } else {
      const u = this.getUnitAt(targetX, targetY);
      if (u && u.hp > 0) {
        if (skill.type === 'heal' && attacker.team === u.team) targets.push(u);
        else if (skill.type !== 'heal' && attacker.team !== u.team) targets.push(u);
      }
    }

    if (skill.type !== 'heal') {
      attacker.mp = Math.max(0, attacker.mp - skill.mp);
    }

    for (const target of targets) {
      const result = this.calcDamage(attacker, target, skillKey);
      if (result.isHit) {
        const prevHp = target.hp;
        target.hp = Math.max(0, Math.min(target.maxHp, target.hp - result.dmg));
        const popup = this.getPopupPoint(renderer, target.x, target.y);
        const screenX = popup.x;
        const screenY = popup.y;
        if (result.dmg > 0) {
          renderer.addEffect('damage', target.x, target.y, { value: result.dmg, life: 42 });
          showDamage(screenX, screenY, result.isCrit ? `暴击 ${result.dmg}` : `${result.dmg}`);
          renderer.addEffect('slash', target.x, target.y, { life: 28 });
          AudioSys.sfx('hit');
          
          // Defender turns to face attacker if they survive
          if (target.hp > 0) {
             const tdx = attacker.x - target.x;
             const tdy = attacker.y - target.y;
             if (Math.abs(tdx) > Math.abs(tdy)) {
               target.dir = tdx > 0 ? 'right' : 'left';
             } else if (Math.abs(tdy) > Math.abs(tdx)) {
               target.dir = tdy > 0 ? 'down' : 'up';
             }
          }

          // 经验值与金钱
          if (target.hp <= 0 && prevHp > 0 && attacker.team === 'player') {
            attacker.exp = (attacker.exp || 0) + (target.exp || 15);
            // 队伍金钱增加
            if (window.game && window.game.partyGold !== undefined) {
               window.game.partyGold += target.gold || 0;
            }
            // 升级检查
            const needed = attacker.level * 30;
            if (attacker.exp >= needed) {
              attacker.exp -= needed;
              attacker.level++;
              attacker.base.hp += 5; attacker.base.mp += 3;
              attacker.base.atk += 2; attacker.base.def += 1;
              attacker.base.mag += 2; attacker.base.spd += 1;
              showDamage(screenX, screenY - 20, `Level Up!`, true);
              AudioSys.sfx('levelup');
            }
          }
        } else if (result.dmg < 0) {
          renderer.addEffect('damage', target.x, target.y, { value: Math.abs(result.dmg), heal: true, life: 42 });
          showDamage(screenX, screenY, `+${Math.abs(result.dmg)}`, true);
          AudioSys.sfx('heal');
        }
      } else {
        const popup = this.getPopupPoint(renderer, target.x, target.y);
        showDamage(popup.x, popup.y, 'MISS');
      }
    }

    // 特效
    if (skill.type === 'magic') {
      renderer.addEffect('magic', targetX, targetY, { element: skill.element, life: skill.area > 1 ? 56 : 44 });
    }

    // 智能反击 (Counter-attack)
    for (const target of targets) {
      if (target.hp > 0 && skill.type !== 'heal') {
        const dist = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
        // Find best valid counter skill (prioritize phys, then magic if in range)
        let counterSkill = null;
        for (const skKey of target.skills) {
           const sk = SKILLS[skKey];
           const actualRange = sk.range > 1 && (tileInfo[parseInt(this.map.tiles[target.y][target.x])].height || 0) >= 2 ? sk.range + 1 : sk.range;
           if (sk.type !== 'heal' && actualRange >= dist && target.mp >= sk.mp) {
              if (!counterSkill || sk.power > SKILLS[counterSkill].power) {
                 counterSkill = skKey;
              }
           }
        }

        if (counterSkill) {
          const cSkill = SKILLS[counterSkill];
          target.mp = Math.max(0, target.mp - cSkill.mp);
          const counter = this.calcDamage(target, attacker, counterSkill);
          if (counter.isHit) {
            attacker.hp = Math.max(0, attacker.hp - counter.dmg);
            renderer.addEffect('damage', attacker.x, attacker.y, { value: counter.dmg, life: 42 });
            const popup = this.getPopupPoint(renderer, attacker.x, attacker.y);
            showDamage(popup.x, popup.y, counter.isCrit ? `反击暴击 ${counter.dmg}` : `反击 ${counter.dmg}`);
            
            if (cSkill.type === 'magic') {
              renderer.addEffect('magic', attacker.x, attacker.y, { element: cSkill.element, life: cSkill.area > 1 ? 56 : 44 });
              AudioSys.sfx('magic');
            } else {
              renderer.addEffect('slash', attacker.x, attacker.y, { life: 28 });
              AudioSys.sfx('hit');
            }
          } else {
            const popup = this.getPopupPoint(renderer, attacker.x, attacker.y);
            showDamage(popup.x, popup.y, '反击 MISS');
          }
        }
      }
    }

    this.checkWinLose();
  }

  // ========== 回合管理 ==========
  startTurn(team) {
    this.turn = team;
    this.turnCount++;
    for (const u of this.allUnits) {
      if (u.team === team) u.acted = false;
    }
    document.getElementById('turn-indicator').textContent = team === 'player' ? '我方回合' : '敌方回合';
    document.getElementById('turn-indicator').style.color = team === 'player' ? '#8f8' : '#f88';
  }

  endTurn() {
    if (this.turn === 'player') {
      this.startTurn('enemy');
    } else {
      this.startTurn('player');
    }
  }

  allActed(team) {
    return this.allUnits.filter(u => u.team === team && u.hp > 0).every(u => u.acted);
  }

  checkWinLose() {
    const playersAlive = this.players.filter(p => p.hp > 0);
    const enemiesAlive = this.enemies.filter(e => e.hp > 0);
    if (enemiesAlive.length === 0) {
      this.winner = 'player';
      this.state = 'end';
      return 'win';
    }
    if (playersAlive.length === 0) {
      this.winner = 'enemy';
      this.state = 'end';
      return 'lose';
    }
    return null;
  }

  // ========== AI ==========
  runAI(renderer, onComplete) {
    const aiUnits = this.enemies.filter(e => e.hp > 0 && !e.acted);
    if (aiUnits.length === 0) {
      this.endTurn();
      onComplete();
      return;
    }
    let idx = 0;
    const step = () => {
      if (idx >= aiUnits.length || this.winner) {
        this.endTurn();
        onComplete();
        return;
      }
      const unit = aiUnits[idx++];
      if (unit.hp <= 0 || unit.acted) { step(); return; }
      this.aiAction(unit, renderer, () => {
        setTimeout(step, 400);
      });
    };
    step();
  }

  aiAction(unit, renderer, cb) {
    // 寻找最近的敌人
    const targets = this.players.filter(p => p.hp > 0);
    if (targets.length === 0) { unit.acted = true; cb(); return; }

    let bestTarget = null;
    let bestDist = 999;
    for (const t of targets) {
      const d = Math.abs(unit.x - t.x) + Math.abs(unit.y - t.y);
      if (d < bestDist) { bestDist = d; bestTarget = t; }
    }

    // 选择技能：优先法术，其次普攻
    let skill = 'attack';
    if (unit.skills.includes('duohun') && unit.mp >= SKILLS.duohun.mp) skill = 'duohun';
    else if (unit.skills.includes('lihuo') && unit.mp >= SKILLS.lihuo.mp) skill = 'lihuo';
    else if (unit.skills.includes('mojin') && unit.mp >= SKILLS.mojin.mp && bestDist <= 2) skill = 'mojin';

    const sk = SKILLS[skill];
    const canAttack = bestDist <= sk.range;

    if (canAttack) {
      unit.anim = sk.type === 'magic' ? 'cast' : 'attack';
      this.executeAction(unit, bestTarget.x, bestTarget.y, skill, renderer);
      bestTarget.anim = 'hurt';
      setTimeout(() => { if (bestTarget.hp > 0) bestTarget.anim = 'idle'; }, 400);
      unit.acted = true;
      setTimeout(() => { unit.anim = 'idle'; }, 600);
      cb();
      return;
    }

    // 移动到可攻击范围
    const moves = this.calcMoveRange(unit);
    let bestMove = null;
    let bestScore = -999;
    for (const m of moves) {
      const d = Math.abs(m.x - bestTarget.x) + Math.abs(m.y - bestTarget.y);
      if (d > sk.range) continue;
      let score = -d * 10;
      const tile = parseInt(this.map.tiles[m.y][m.x]);
      score += (tileInfo[tile].def || 0) * 5;
      score += 50;
      if (score > bestScore) { bestScore = score; bestMove = m; }
    }

    if (bestMove) {
      unit.anim = 'walk';
      // Update facing direction
      const dx = bestMove.x - unit.x;
      const dy = bestMove.y - unit.y;
      if (Math.abs(dx) > Math.abs(dy)) unit.dir = dx > 0 ? 'right' : 'left';
      unit.x = bestMove.x;
      unit.y = bestMove.y;
      setTimeout(() => {
        unit.anim = sk.type === 'magic' ? 'cast' : 'attack';
        this.executeAction(unit, bestTarget.x, bestTarget.y, skill, renderer);
        bestTarget.anim = 'hurt';
        setTimeout(() => { if (bestTarget.hp > 0) bestTarget.anim = 'idle'; }, 400);
        unit.acted = true;
        setTimeout(() => { unit.anim = 'idle'; }, 600);
        cb();
      }, 300);
      return;
    }

    // 无法攻击，就靠近
    if (moves.length > 0) {
      let closest = moves[0];
      let cd = 999;
      for (const m of moves) {
        const d = Math.abs(m.x - bestTarget.x) + Math.abs(m.y - bestTarget.y);
        if (d < cd) { cd = d; closest = m; }
      }
      unit.x = closest.x;
      unit.y = closest.y;
    }
    unit.acted = true;
    cb();
  }
}
