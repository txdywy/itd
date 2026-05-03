// ==================== 8-bit 音效系统 ====================
const AudioSys = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
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
