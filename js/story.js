// ==================== 剧情对话系统 ====================
class StorySystem {
  constructor() {
    this.queue = [];
    this.index = 0;
    this.onComplete = null;
    this.isActive = false;
    this.box = document.getElementById('dialogue-box');
    this.textEl = this.box.querySelector('.dialogue-text');
    this.nameEl = this.box.querySelector('.dialogue-name');
    this.portraitEl = this.box.querySelector('.portrait');
    this.typing = false;
    this.typingTimer = null;
  }

  start(storyKey, onComplete) {
    const story = STORIES[storyKey];
    if (!story || story.length === 0) {
      if (onComplete) onComplete();
      return;
    }
    this.queue = [...story];
    this.index = 0;
    this.onComplete = onComplete;
    this.isActive = true;
    this.box.classList.remove('hidden');
    this.showLine();
  }

  showLine() {
    if (this.index >= this.queue.length) {
      this.end();
      return;
    }
    const line = this.queue[this.index];
    const speakerData = this.getSpeakerInfo(line.speaker);
    this.nameEl.textContent = speakerData.name;
    this.portraitEl.innerHTML = '';
    if (speakerData.sprite) {
      const img = document.createElement('canvas');
      img.width = 96; img.height = 96;
      const ctx = img.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const renderer = window.gameRenderer;
      let imgData = null;
      if (renderer) {
        // Try portrait cache first (dedicated portraits)
        if (renderer.portraitCache && renderer.portraitCache[speakerData.sprite]) {
           imgData = renderer.portraitCache[speakerData.sprite];
        }
        // Fallback to first sprite frame
        if (!imgData && renderer.spriteCache && renderer.spriteCache[speakerData.sprite]) {
           const frames = renderer.spriteCache[speakerData.sprite];
           if (Array.isArray(frames)) imgData = frames[0];
           else imgData = frames;
        }
      }
      if (imgData) {
        ctx.drawImage(imgData, 0, 0, imgData.width, imgData.height, 0, 0, 96, 96);
      } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 96, 96);
      }
      this.portraitEl.appendChild(img);
    }
    this.typeText(line.text);
  }

  typeText(text) {
    this.typing = true;
    this.textEl.textContent = '';
    let i = 0;
    if (this.typingTimer) clearInterval(this.typingTimer);
    this.typingTimer = setInterval(() => {
      this.textEl.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(this.typingTimer);
        this.typing = false;
      }
    }, 30);
  }

  advance() {
    if (this.typing) {
      clearInterval(this.typingTimer);
      this.textEl.textContent = this.queue[this.index].text;
      this.typing = false;
      return;
    }
    this.index++;
    this.showLine();
  }

  end() {
    this.isActive = false;
    this.box.classList.add('hidden');
    if (this.onComplete) this.onComplete();
  }

  getSpeakerInfo(key) {
    if (key === 'narrator') return { name: '旁白', sprite: null };
    if (key === 'xiahouyi') return { name: '夏侯仪', sprite: 'xiahouyi' };
    if (key === 'bingli') return { name: '冰璃', sprite: 'bingli' };
    if (key === 'fenglingsheng') return { name: '封铃笙', sprite: 'fenglingsheng' };
    if (key === 'murongxuanji') return { name: '慕容璇玑', sprite: 'murongxuanji' };
    if (key === 'gulunde') return { name: '古伦德', sprite: 'gulunde' };
    if (key === 'huangfushen') return { name: '皇甫申', sprite: 'huangfushen' };
    if (key === 'luohou') return { name: '罗睺', sprite: 'luohou' };
    return { name: key, sprite: null };
  }
}
