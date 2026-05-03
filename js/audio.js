// ==================== 8-bit & BGM 音效系统 ====================
const AudioSys = {
  ctx: null,
  bgmGain: null,
  bgmOscillators: [],
  isPlayingBgm: false,
  bgmScheduleTimer: null,
  nextNoteTime: 0,
  currentNote: 0,
  melody: [
    [440, 0.25], [523, 0.25], [659, 0.5],
    [587, 0.25], [659, 0.25], [880, 0.5],
    [784, 0.25], [659, 0.25], [523, 0.5],
    [587, 0.25], [523, 0.25], [440, 0.5],
    // Part 2
    [440, 0.25], [523, 0.25], [659, 0.5],
    [880, 0.25], [784, 0.25], [1046, 0.5],
    [880, 0.5], [659, 0.5], [587, 0.25], [659, 0.75]
  ],
  bass: [
    [220, 0.5], [220, 0.5], [261, 0.5], [261, 0.5],
    [196, 0.5], [196, 0.5], [220, 0.5], [220, 0.5],
    [220, 0.5], [220, 0.5], [261, 0.5], [261, 0.5],
    [196, 0.5], [196, 0.5], [220, 0.5], [220, 0.5]
  ],
  tempo: 120, // BPM

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.05; // Base BGM volume
      this.bgmGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playBGM() {
    this.init();
    if (this.isPlayingBgm) return;
    this.isPlayingBgm = true;
    this.currentNote = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduleBGM();
  },

  stopBGM() {
    this.isPlayingBgm = false;
    if (this.bgmScheduleTimer) {
      clearTimeout(this.bgmScheduleTimer);
      this.bgmScheduleTimer = null;
    }
  },

  scheduleBGM() {
    if (!this.isPlayingBgm) return;
    const secondsPerBeat = 60.0 / this.tempo;
    const lookahead = 0.1; // Schedule ahead time in seconds

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this.playNote();
    }
    this.bgmScheduleTimer = setTimeout(() => this.scheduleBGM(), 25);
  },

  playNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    const beatDuration = secondsPerBeat;
    
    const melodyNote = this.melody[this.currentNote % this.melody.length];
    const bassNote = this.bass[Math.floor(this.currentNote / 2) % this.bass.length];

    // Melody
    if (melodyNote[0] > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = melodyNote[0];
      
      gain.gain.setValueAtTime(0.1, this.nextNoteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + melodyNote[1] * beatDuration * 0.9);
      
      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(this.nextNoteTime);
      osc.stop(this.nextNoteTime + melodyNote[1] * beatDuration);
    }

    // Bass
    if (this.currentNote % 2 === 0 && bassNote[0] > 0) {
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.value = bassNote[0];
      
      gain2.gain.setValueAtTime(0.15, this.nextNoteTime);
      gain2.gain.linearRampToValueAtTime(0.01, this.nextNoteTime + bassNote[1] * beatDuration * 0.9);
      
      osc2.connect(gain2);
      gain2.connect(this.bgmGain);
      osc2.start(this.nextNoteTime);
      osc2.stop(this.nextNoteTime + bassNote[1] * beatDuration);
    }

    this.nextNoteTime += melodyNote[1] * beatDuration;
    this.currentNote++;
  },

  playTone(freq, type, duration, vol = 0.08) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch(e) {}
  },

  playNoise(duration, vol = 0.05) {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      noise.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch(e) {}
  },

  sfx(name) {
    this.init();
    switch(name) {
      case 'select': this.playTone(880, 'square', 0.05, 0.05); break;
      case 'move': this.playTone(440, 'triangle', 0.08, 0.04); break;
      case 'attack': this.playTone(220, 'sawtooth', 0.12, 0.06); break;
      case 'slash': this.playTone(330, 'square', 0.08, 0.04); break;
      case 'magic':
        this.playTone(523, 'sine', 0.15, 0.06);
        setTimeout(() => this.playTone(784, 'sine', 0.2, 0.06), 80);
        break;
      case 'hit': this.playNoise(0.1, 0.08); break;
      case 'heal':
        this.playTone(659, 'sine', 0.15, 0.05);
        setTimeout(() => this.playTone(880, 'sine', 0.2, 0.05), 100);
        break;
      case 'win':
        [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.playTone(f,'square',0.2,0.05),i*120));
        break;
      case 'lose':
        [400,350,300,200].forEach((f,i)=>setTimeout(()=>this.playTone(f,'sawtooth',0.3,0.05),i*200));
        break;
      case 'levelup':
        [523,659,784,880,1047].forEach((f,i)=>setTimeout(()=>this.playTone(f,'square',0.1,0.05),i*80));
        break;
    }
  }
};
