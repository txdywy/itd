// ==================== 主游戏控制器 ====================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    window.gameRenderer = this.renderer;
    this.story = new StorySystem();
    this.battle = null;
    this.state = 'title';
    this.levelIndex = 0;
    this.party = [];
    this.partyGold = 200;
    this.inventory = [];
    this.hoverTile = null;
    this.selectedSkill = null;

    this.uiInfo = document.getElementById('unit-info');
    this.uiAction = document.getElementById('action-menu');
    this.uiMagic = document.getElementById('magic-menu');
    this.uiVictory = document.getElementById('victory-screen');
    this.uiDefeat = document.getElementById('defeat-screen');
    this.endTurnBtn = document.getElementById('end-turn-btn');
    this.chapterTitle = document.getElementById('chapter-title');

    this.bindEvents();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  bindEvents() {
    // 标题画面
    document.getElementById('start-btn').onclick = () => {
      AudioSys.sfx('select');
      AudioSys.playBGM();
      document.getElementById('title-screen').classList.add('hidden');
      this.startGame();
    };
    // 继续游戏按钮（动态添加）
    const saved = localStorage.getItem('tdj_save');
    if (saved) {
      const continueBtn = document.createElement('button');
      continueBtn.textContent = '继续游戏';
      continueBtn.id = 'continue-btn';
      continueBtn.onclick = () => {
        AudioSys.sfx('select');
        AudioSys.playBGM();
        document.getElementById('title-screen').classList.add('hidden');
        this.loadGame();
      };
      document.querySelector('#title-screen .menu').insertBefore(continueBtn, document.getElementById('howto-btn'));
    }
    document.getElementById('howto-btn').onclick = () => {
      AudioSys.sfx('select');
      document.getElementById('title-screen').classList.add('hidden');
      document.getElementById('howto-screen').classList.remove('hidden');
    };
    document.getElementById('howto-back').onclick = () => {
      AudioSys.sfx('select');
      document.getElementById('howto-screen').classList.add('hidden');
      document.getElementById('title-screen').classList.remove('hidden');
    };

    // 战斗胜利/失败
    document.getElementById('next-level-btn').onclick = () => {
      AudioSys.sfx('select');
      this.uiVictory.classList.add('hidden');
      this.levelIndex++;
      if (this.levelIndex >= MAPS.length) {
        // 游戏通关，回到标题
        this.levelIndex = 0;
        this.party = [];
        document.getElementById('title-screen').classList.remove('hidden');
        this.state = 'title';
      } else {
        this.startLevel(this.levelIndex);
      }
    };
    document.getElementById('retry-btn').onclick = () => {
      AudioSys.sfx('select');
      this.uiDefeat.classList.add('hidden');
      this.startLevel(this.levelIndex);
    };

    // 画布点击
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.onCanvasMove(e));

    // 结束回合
    document.getElementById('end-turn-btn').onclick = () => {
      AudioSys.sfx('select');
      if (this.battle && this.battle.turn === 'player') {
        this.deselectUnit();
        this.battle.startTurn('enemy');
        this.state = 'battle_enemy';
        this.runEnemyTurn();
      }
    };

    // 行动菜单
    this.uiAction.querySelectorAll('button').forEach(btn => {
      btn.onclick = (e) => this.onAction(e.target.dataset.action);
    });

    // 对话点击
    document.getElementById('dialogue-box').addEventListener('click', () => {
      if (this.story.isActive) this.story.advance();
    });
    document.getElementById('next-chapter-btn').onclick = () => {
      AudioSys.sfx('select');
      document.getElementById('intermission-screen').classList.add('hidden');
      this.startLevel(this.levelIndex);
    };
    
    // Bind equip char select
    document.getElementById('equip-char-select').onchange = (e) => {
      this.renderEquipInfo(e.target.value);
    };
  }

  showIntermissionScreen() {
    this.state = 'intermission';
    this.battle = null; // Clear battle state
    document.getElementById('intermission-screen').classList.remove('hidden');
    this.renderShop();
    this.renderEquipSelect();
  }

  renderShop() {
    document.getElementById('party-gold').textContent = this.partyGold;
    const shopList = document.getElementById('shop-list');
    shopList.innerHTML = '';
    for (const [id, item] of Object.entries(ITEMS)) {
      const li = document.createElement('li');
      li.style.marginBottom = '8px';
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      
      const info = document.createElement('div');
      let statText = item.type === 'weapon' ? `ATK+${item.atk}` : `DEF+${item.def}${item.mag ? ` MAG+${item.mag}` : ''}`;
      info.innerHTML = `<span style="color: #fff;">${item.name}</span> <span style="color: #aaa; font-size: 12px;">(${statText})</span>`;
      
      const buyBtn = document.createElement('button');
      buyBtn.textContent = `${item.price}G`;
      buyBtn.style.padding = '4px 8px';
      buyBtn.style.background = '#333';
      buyBtn.style.color = '#ffd700';
      buyBtn.style.border = '1px solid #666';
      buyBtn.style.cursor = 'pointer';
      
      buyBtn.onclick = () => {
        if (this.partyGold >= item.price) {
          this.partyGold -= item.price;
          this.inventory.push(id);
          AudioSys.sfx('select');
          this.renderShop();
          this.renderEquipInfo(document.getElementById('equip-char-select').value);
        } else {
          AudioSys.sfx('lose'); // error sound
        }
      };
      
      li.appendChild(info);
      li.appendChild(buyBtn);
      shopList.appendChild(li);
    }
  }

  renderEquipSelect() {
    const sel = document.getElementById('equip-char-select');
    sel.innerHTML = '';
    for (const p of this.party) {
      const opt = document.createElement('option');
      opt.value = p.key;
      opt.textContent = p.name;
      sel.appendChild(opt);
    }
    if (this.party.length > 0) {
      this.renderEquipInfo(this.party[0].key);
    }
  }

  renderEquipInfo(charKey) {
    const char = this.party.find(p => p.key === charKey);
    if (!char) return;
    
    const infoDiv = document.getElementById('equip-info');
    infoDiv.innerHTML = '';
    
    const renderSlot = (slotName, type) => {
      const equipId = char.equip[type];
      const equipName = equipId ? ITEMS[equipId].name : '无';
      
      const div = document.createElement('div');
      div.style.marginBottom = '10px';
      div.innerHTML = `<div style="color: #aaa; font-size: 12px;">${slotName}</div>
                       <div style="display: flex; justify-content: space-between; align-items: center;">
                         <span style="color: #fff;">${equipName}</span>
                       </div>`;
                       
      // Dropdown to equip from inventory
      const equipSel = document.createElement('select');
      equipSel.style.background = '#222';
      equipSel.style.color = '#fff';
      equipSel.style.border = '1px solid #555';
      
      const optNone = document.createElement('option');
      optNone.value = '';
      optNone.textContent = '卸下';
      equipSel.appendChild(optNone);
      
      const availableItems = Array.from(new Set(this.inventory)).filter(id => ITEMS[id].type === type);
      for (const id of availableItems) {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = ITEMS[id].name;
        if (equipId === id) opt.selected = true;
        equipSel.appendChild(opt);
      }
      
      equipSel.onchange = (e) => {
        const newId = e.target.value;
        // return current equip to inventory
        if (char.equip[type]) {
          this.inventory.push(char.equip[type]);
        }
        // equip new item
        if (newId) {
          char.equip[type] = newId;
          // remove one from inventory
          const idx = this.inventory.indexOf(newId);
          if (idx > -1) this.inventory.splice(idx, 1);
        } else {
          char.equip[type] = null;
        }
        AudioSys.sfx('select');
        this.renderEquipInfo(charKey);
        this.saveGame();
      };
      
      div.querySelector('div:last-child').appendChild(equipSel);
      infoDiv.appendChild(div);
    };
    
    renderSlot('武器', 'weapon');
    renderSlot('防具', 'armor');
    
    // Show stats
    const statsDiv = document.createElement('div');
    statsDiv.style.marginTop = '15px';
    statsDiv.style.paddingTop = '10px';
    statsDiv.style.borderTop = '1px solid rgba(255,255,255,0.2)';
    
    let wAtk = 0, aDef = 0, aMag = 0;
    if (char.equip.weapon) wAtk = ITEMS[char.equip.weapon].atk || 0;
    if (char.equip.armor) {
       aDef = ITEMS[char.equip.armor].def || 0;
       aMag = ITEMS[char.equip.armor].mag || 0;
    }
    
    statsDiv.innerHTML = `
      <div style="display:flex; justify-content: space-between;"><span>ATK</span> <span>${char.base.atk} <span style="color:#6f6;">+${wAtk}</span></span></div>
      <div style="display:flex; justify-content: space-between;"><span>DEF</span> <span>${char.base.def} <span style="color:#6f6;">+${aDef}</span></span></div>
      <div style="display:flex; justify-content: space-between;"><span>MAG</span> <span>${char.base.mag} <span style="color:#6f6;">+${aMag}</span></span></div>
    `;
    infoDiv.appendChild(statsDiv);
  }

  startGame() {
    // 初始化队伍（startLevel会动态添加角色）
    this.party = [];
    this.startLevel(0);
  }

  startLevel(idx) {
    this.levelIndex = idx;
    const mapData = clone(MAPS[idx]);
    this.chapterTitle.textContent = `第${['一','二','三','四','五','六'][idx]}章：${mapData.name}`;

    // 根据关卡确定可用角色
    const unlockMap = [
      ['xiahouyi', 'fenglingsheng'],
      ['xiahouyi', 'fenglingsheng', 'bingli'],
      ['xiahouyi', 'fenglingsheng', 'bingli', 'murongxuanji'],
      ['xiahouyi', 'fenglingsheng', 'bingli', 'murongxuanji', 'gulunde'],
      ['xiahouyi', 'fenglingsheng', 'bingli', 'murongxuanji', 'gulunde'],
      ['xiahouyi', 'fenglingsheng', 'bingli', 'murongxuanji', 'gulunde']
    ];
    const availableKeys = unlockMap[idx] || unlockMap[unlockMap.length - 1];

    // 确保队伍中有需要的角色
    for (const key of availableKeys) {
      if (!this.party.find(p => p.key === key)) {
        const c = clone(PLAYER_CHARS[key]);
        c.key = key;
        c.team = 'player';
        c.acted = false;
        c.id = 'p_' + key;
        this.party.push(c);
      }
    }

    // 放置角色（从party中读取永久数据创建战斗单位）
    const players = [];
    const startCount = Math.min(mapData.playerStart.length, this.party.length);
    for (let i = 0; i < startCount; i++) {
      const partyChar = this.party[i];
      const tmpl = CLASS_TEMPLATES[partyChar.class];
      const lv = partyChar.level;
      // 根据等级计算当前属性
      const stats = {};
      for (const k of ['hp','mp','atk','def','mag','spd']) {
        stats[k] = partyChar.base[k] + Math.floor((tmpl.growth[k] || 0) * (lv - 1) * 0.8);
      }
      
      // Calculate equipment bonuses
      let eqAtk = 0, eqDef = 0, eqMag = 0;
      if (partyChar.equip && partyChar.equip.weapon && ITEMS[partyChar.equip.weapon]) {
         eqAtk += ITEMS[partyChar.equip.weapon].atk || 0;
      }
      if (partyChar.equip && partyChar.equip.armor && ITEMS[partyChar.equip.armor]) {
         eqDef += ITEMS[partyChar.equip.armor].def || 0;
         eqMag += ITEMS[partyChar.equip.armor].mag || 0;
      }

      const p = {
        id: partyChar.id,
        key: partyChar.key,
        name: partyChar.name,
        sprite: partyChar.sprite,
        class: partyChar.class,
        level: lv,
        exp: partyChar.exp,
        base: clone(partyChar.base),
        equip: clone(partyChar.equip),
        skills: [...partyChar.skills],
        x: mapData.playerStart[i].x,
        y: mapData.playerStart[i].y,
        hp: stats.hp, maxHp: stats.hp,
        mp: stats.mp, maxMp: stats.mp,
        atk: stats.atk + eqAtk, 
        def: stats.def + eqDef,
        mag: stats.mag + eqMag, 
        spd: stats.spd,
        move: tmpl.move,
        team: 'player',
        acted: false,
        dir: 'right' // Default facing right
      };
      players.push(p);
    }

    // 创建敌人
    const enemies = [];
    for (const e of mapData.enemies) {
      enemies.push(createEnemy(e.type, e.x, e.y));
    }

    this.battle = new BattleEngine(mapData, players, enemies);
    this.state = 'dialogue';
    this.uiInfo.classList.add('hidden');
    this.uiAction.classList.add('hidden');
    this.uiMagic.classList.add('hidden');
    this.endTurnBtn.classList.add('hidden');

    // 开场剧情
    let storyKey = mapData.storyStart;
    if (idx === 0) storyKey = 'intro';
    if (storyKey) {
      this.story.start(storyKey, () => {
        this.state = 'battle_idle';
        this.battle.startTurn('player');
      });
    } else {
      this.state = 'battle_idle';
      this.battle.startTurn('player');
    }
  }

  onCanvasMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // Convert scaled coordinates back to tile coordinates (640x480 screen -> 320x240 map logic)
    // The zoom is 1.05 and centered, let's keep tile hover approx for now, or just map linearly.
    // The previous math was based on 640x480 mapped directly to 20x15 tiles (32px per tile).
    // Let's adjust mouse tracking for camera pan:
    if (this.renderer) {
      this.renderer.camera.targetX = (mx - 320) * 0.03;
      this.renderer.camera.targetY = (my - 240) * 0.03;
    }

    const x = Math.floor(mx / 32);
    const y = Math.floor(my / 32);
    
    const tooltip = document.getElementById('tile-tooltip');
    if (x >= 0 && y >= 0 && x < 20 && y < 15) {
      this.hoverTile = { x, y };
      // 显示地形tooltip
      if (this.battle && this.state !== 'title' && this.state !== 'dialogue' && !this.battle.winner) {
        const tile = parseInt(this.battle.map.tiles[y][x]);
        const info = tileInfo[tile];
        if (info) {
          tooltip.textContent = `${info.name} 防+${info.def} 回+${info.avoid}%`;
          tooltip.style.left = (mx + 12) + 'px';
          tooltip.style.top = (my - 30) + 'px';
          tooltip.classList.remove('hidden');
        }
      } else {
        tooltip.classList.add('hidden');
      }
    } else {
      this.hoverTile = null;
      tooltip.classList.add('hidden');
    }
  }

  onCanvasClick(e) {
    if (!this.battle || this.state.startsWith('dialogue')) return;
    if (this.battle.winner) return;
    if (this.battle.turn !== 'player') return;
    if (this.state === 'battle_anim') return;

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const tx = Math.floor(mx / 32);
    const ty = Math.floor(my / 32);

    if (this.state === 'battle_idle') {
      const unit = this.battle.getUnitAt(tx, ty);
      if (unit && unit.team === 'player' && !unit.acted && unit.hp > 0) {
        this.selectUnit(unit);
      }
      return;
    }

    if (this.state === 'battle_selected') {
      // 点击移动位置
      const canMove = this.battle.moveRange.find(r => r.x === tx && r.y === ty);
      if (canMove) {
        this.moveUnit(this.battle.selectedUnit, tx, ty);
        return;
      }
      // 取消选择（点击空地或其他角色）
      const unit = this.battle.getUnitAt(tx, ty);
      if (unit && unit.team === 'player' && !unit.acted && unit.hp > 0) {
        this.selectUnit(unit);
      } else if (!canMove) {
        this.deselectUnit();
      }
      return;
    }

    if (this.state === 'battle_targeting') {
      const inRange = this.battle.attackRange.find(r => r.x === tx && r.y === ty);
      if (inRange) {
        this.executeSkill(tx, ty);
      } else {
        // 取消
        this.state = 'battle_moved';
        this.selectedSkill = null;
        this.battle.attackRange = [];
        this.showActionMenu();
      }
      return;
    }
  }

  selectUnit(unit) {
    AudioSys.sfx('select');
    this.battle.selectedUnit = unit;
    this.battle.moveRange = this.battle.calcMoveRange(unit);
    this.battle.attackRange = [];
    this.state = 'battle_selected';
    this.updateUnitInfo(unit);
    this.uiInfo.classList.remove('hidden');
    this.uiAction.classList.add('hidden');
    this.uiMagic.classList.add('hidden');
    this.endTurnBtn.classList.remove('hidden');
  }

  deselectUnit() {
    this.battle.selectedUnit = null;
    this.battle.moveRange = [];
    this.battle.attackRange = [];
    this.state = 'battle_idle';
    this.uiInfo.classList.add('hidden');
    this.uiAction.classList.add('hidden');
    this.uiMagic.classList.add('hidden');
    this.endTurnBtn.classList.remove('hidden');
  }

  moveUnit(unit, x, y) {
    AudioSys.sfx('move');
    // Update direction based on primary movement axis
    const dx = x - unit.x;
    const dy = y - unit.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      unit.dir = dx > 0 ? 'right' : 'left';
    } else if (Math.abs(dy) > Math.abs(dx)) {
      unit.dir = dy > 0 ? 'down' : 'up';
    }
    unit.x = x;
    unit.y = y;
    this.battle.moveRange = [];
    this.state = 'battle_moved';
    this.showActionMenu();
  }

  showActionMenu() {
    this.uiAction.classList.remove('hidden');
    this.uiMagic.classList.add('hidden');
    this.endTurnBtn.classList.add('hidden');
    // 更新单位信息位置
    this.updateUnitInfo(this.battle.selectedUnit);
  }

  onAction(action) {
    const unit = this.battle.selectedUnit;
    if (!unit) return;

    if (action === 'attack') {
      this.selectedSkill = 'attack';
      this.uiAction.classList.add('hidden');
      this.state = 'battle_targeting';
      this.battle.attackRange = this.battle.calcAttackRange(unit, 1);
    } else if (action === 'magic') {
      this.showMagicMenu(unit);
    } else if (action === 'item') {
      // 简化：道具功能省略
      const toast = document.getElementById('toast-msg');
      toast.textContent = '道具系统暂未开放';
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 2000);
    } else if (action === 'wait') {
      unit.acted = true;
      this.deselectUnit();
      this.checkEndPlayerTurn();
    }
  }

  showMagicMenu(unit) {
    AudioSys.sfx('select');
    this.uiAction.classList.add('hidden');
    this.uiMagic.classList.remove('hidden');
    this.endTurnBtn.classList.add('hidden');
    const list = this.uiMagic.querySelector('.magic-list');
    list.innerHTML = '';
    for (const skKey of unit.skills) {
      const sk = SKILLS[skKey];
      const item = document.createElement('div');
      item.className = 'magic-item';
      if (unit.mp < sk.mp) item.classList.add('disabled');
      item.innerHTML = `<span>${sk.name}</span><span class="mp-cost">${sk.mp}MP</span>`;
      item.onclick = () => {
        if (unit.mp < sk.mp) return;
        this.selectedSkill = skKey;
        this.uiMagic.classList.add('hidden');
        this.state = 'battle_targeting';
        this.battle.attackRange = this.battle.calcAttackRange(unit, sk.range);
      };
      list.appendChild(item);
    }
    this.uiMagic.querySelector('.back-btn').onclick = () => {
      this.uiMagic.classList.add('hidden');
      this.showActionMenu();
    };
  }

  executeSkill(tx, ty) {
    const unit = this.battle.selectedUnit;
    const skillKey = this.selectedSkill || 'attack';
    const skill = SKILLS[skillKey];
    this.state = 'battle_anim';
    this.battle.attackRange = [];

    // 音效
    if (skill.type === 'magic') AudioSys.sfx('magic');
    else AudioSys.sfx('attack');

    // 执行攻击
    this.battle.executeAction(unit, tx, ty, skillKey, this.renderer);

    // 标记已行动
    unit.acted = true;
    this.updateUnitInfo(unit);

    setTimeout(() => {
      this.deselectUnit();
      this.checkEndPlayerTurn();
    }, 800);
  }

  checkEndPlayerTurn() {
    const result = this.battle.checkWinLose();
    if (result === 'win') {
      this.onVictory();
      return;
    }
    if (result === 'lose') {
      this.onDefeat();
      return;
    }
    if (this.battle.allActed('player')) {
      this.battle.startTurn('enemy');
      this.state = 'battle_enemy';
      this.runEnemyTurn();
    } else {
      this.state = 'battle_idle';
    }
  }

  runEnemyTurn() {
    this.endTurnBtn.classList.add('hidden');
    this.battle.runAI(this.renderer, () => {
      const result = this.battle.checkWinLose();
      if (result === 'win') {
        this.onVictory();
      } else if (result === 'lose') {
        this.onDefeat();
      } else {
        this.state = 'battle_idle';
        this.endTurnBtn.classList.remove('hidden');
      }
    });
  }

  onVictory() {
    AudioSys.sfx('win');
    // 同步战斗数据回party（等级、经验、基础属性）
    if (this.battle) {
      for (const bu of this.battle.players) {
        const pu = this.party.find(p => p.key === bu.key);
        if (pu) {
          pu.level = bu.level;
          pu.exp = bu.exp;
          pu.base = clone(bu.base);
          pu.equip = clone(bu.equip);
        }
      }
    }
    this.state = 'dialogue';
    const mapData = MAPS[this.levelIndex];
    if (mapData.storyEnd) {
      this.story.start(mapData.storyEnd, () => {
        this.levelIndex++;
        this.saveGame();
        if (this.levelIndex >= MAPS.length) {
          this.showVictoryScreen();
        } else {
          this.showIntermissionScreen();
        }
      });
    } else {
      this.levelIndex++;
      this.saveGame();
      if (this.levelIndex >= MAPS.length) {
        this.showVictoryScreen();
      } else {
        this.showIntermissionScreen();
      }
    }
  }

  showVictoryScreen() {
    this.state = 'victory';
    this.endTurnBtn.classList.add('hidden');
    this.saveGame();
    this.uiVictory.classList.remove('hidden');
    const desc = this.uiVictory.querySelector('.victory-desc');
    if (this.levelIndex >= MAPS.length - 1) {
      desc.textContent = '恭喜通关！天地劫的故事暂告一段落。';
      document.getElementById('next-level-btn').textContent = '回到标题';
    } else {
      desc.textContent = `第${this.levelIndex + 1}章完成！准备进入下一章。`;
      document.getElementById('next-level-btn').textContent = '下一关';
    }
  }

  onDefeat() {
    AudioSys.sfx('lose');
    this.state = 'defeat';
    this.uiDefeat.classList.remove('hidden');
    this.endTurnBtn.classList.add('hidden');
  }

  saveGame() {
    const saveData = {
      levelIndex: this.levelIndex,
      partyGold: this.partyGold,
      inventory: this.inventory,
      party: this.party.map(p => ({
        key: p.key,
        level: p.level,
        exp: p.exp,
        base: p.base,
        equip: p.equip
      }))
    };
    localStorage.setItem('tdj_save', JSON.stringify(saveData));
  }

  loadGame() {
    const saved = localStorage.getItem('tdj_save');
    if (!saved) return;
    const data = JSON.parse(saved);
    this.levelIndex = data.levelIndex;
    this.partyGold = data.partyGold || 0;
    this.inventory = data.inventory || [];
    this.party = [];
    for (const pd of data.party) {
      const tmpl = PLAYER_CHARS[pd.key];
      if (!tmpl) continue;
      const c = clone(tmpl);
      c.key = pd.key;
      c.level = pd.level;
      c.exp = pd.exp;
      c.base = pd.base;
      c.equip = pd.equip || { weapon: null, armor: null };
      c.team = 'player';
      c.acted = false;
      c.id = 'p_' + pd.key;
      this.party.push(c);
    }
    this.startLevel(this.levelIndex);
  }

  updateUnitInfo(unit) {
    if (!unit) return;
    this.uiInfo.querySelector('.info-name').textContent = unit.name;
    this.uiInfo.querySelector('.hp').textContent = Math.max(0, unit.hp);
    this.uiInfo.querySelector('.max-hp').textContent = unit.maxHp;
    this.uiInfo.querySelector('.mp').textContent = unit.mp;
    this.uiInfo.querySelector('.max-mp').textContent = unit.maxMp;
    const ratio = unit.maxHp > 0 ? Math.max(0, unit.hp / unit.maxHp) : 0;
    this.uiInfo.querySelector('.hp-fill').style.width = (ratio * 100) + '%';
    this.uiInfo.querySelector('.hp-fill').style.background = ratio > 0.5 ? '#4a4' : ratio > 0.25 ? '#aa4' : '#a44';
  }

  loop() {
    this.renderer.tick();
    this.renderer.clear();

    if (this.battle && this.state !== 'title') {
      const b = this.battle;
      let hl = [], ar = [];
      if (this.state === 'battle_selected') hl = b.moveRange;
      if (this.state === 'battle_targeting') ar = b.attackRange;
      this.renderer.drawMap(b.map, hl, ar, this.hoverTile);
      this.renderer.drawEnvParticles();
      this.renderer.drawEffects();

      // 绘制单位（按Y轴排序）
      const sorted = [...b.allUnits].filter(u => u.hp > 0).sort((a, b) => a.y - b.y);
      for (const u of sorted) {
        const isSelected = b.selectedUnit === u;
        const isActed = u.acted && u.team === 'player';
        this.renderer.drawUnit(u, isSelected, isActed);
      }
      
      // 添加HD-2D光影和后期处理
      this.renderer.drawLighting(b.allUnits);
      this.renderer.drawPostProcess();
      
    } else if (this.state === 'title') {
      // 标题画面背景动画 - 飘动的像素粒子
      const ctx = this.renderer.octx;
      const t = this.renderer.animFrame;
      for (let i = 0; i < 30; i++) {
        const px = ((i * 37 + t * (0.5 + (i % 3) * 0.3)) % 320);
        const py = ((i * 53 + Math.sin(t * 0.02 + i) * 20) % 240);
        const brightness = 100 + (i % 5) * 30;
        ctx.fillStyle = `rgb(${brightness * 0.6},${brightness * 0.4},${brightness * 0.2})`;
        ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
      }
      // 绘制几个角色剪影
      const sprites = ['xiahouyi', 'bingli', 'fenglingsheng'];
      sprites.forEach((name, i) => {
        const sp = this.renderer.spriteCache[name];
        if (sp) {
          const x = 80 + i * 80;
          const y = 120 + Math.sin(t * 0.03 + i * 2) * 5;
          ctx.globalAlpha = 0.4;
          ctx.drawImage(sp, x, y);
          ctx.globalAlpha = 1;
        }
      });
      this.renderer.drawPostProcess(); // Apply vignette to title too
    }

    this.renderer.render(this.renderer.camera.x, this.renderer.camera.y);
    requestAnimationFrame(this.loop);
  }
}

// 启动
window.onload = () => {
  window.game = new Game();
};
