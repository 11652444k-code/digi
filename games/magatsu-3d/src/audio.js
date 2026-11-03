// Procedural Web Audio. No external files. All methods are no-ops until resume() creates the context.

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.night = 0;
    this.tension = 0;
    this.nextBeatTime = 0;
    this.noiseBuf = null;
  }

  resume() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
      this._build();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  _build() {
    const ctx = this.ctx;
    // noise buffer (2 s, shared)
    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(ctx.destination);

    // Layer A: dusk insects
    this.gainA = ctx.createGain();
    this.gainA.gain.value = 0.05;
    this.gainA.connect(this.master);
    const nA = this._loopNoise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 4000; bp.Q.value = 3;
    const wob = ctx.createGain(); wob.gain.value = 0.6;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 7;
    const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 0.4;
    lfo.connect(lfoAmt); lfoAmt.connect(wob.gain);
    nA.connect(bp); bp.connect(wob); wob.connect(this.gainA);
    lfo.start();

    // Layer B: night drone
    this.gainB = ctx.createGain();
    this.gainB.gain.value = 0;
    this.gainB.connect(this.master);
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 48;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 52.5;
    const og = ctx.createGain(); og.gain.value = 0.35;
    o1.connect(og); o2.connect(og); og.connect(this.gainB);
    o1.start(); o2.start();
    const nB = this._loopNoise();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const bedG = ctx.createGain(); bedG.gain.value = 0.25;
    const slow = ctx.createOscillator(); slow.frequency.value = 0.07;
    const slowAmt = ctx.createGain(); slowAmt.gain.value = 0.2;
    slow.connect(slowAmt); slowAmt.connect(bedG.gain);
    nB.connect(lp); lp.connect(bedG); bedG.connect(this.gainB);
    slow.start();

    this.nextBeatTime = ctx.currentTime + 0.5;
    this.setNight(this.night);
  }

  _loopNoise() {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf; s.loop = true;
    s.start(0, Math.random() * 1.5);
    return s;
  }

  _ok() { return this.ctx && this.ctx.state === 'running'; }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, t, 0.05);
    }
    return this.muted;
  }

  setNight(t) {
    this.night = Math.max(0, Math.min(1, t));
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.gainA.gain.setTargetAtTime(0.05 * (1 - this.night), now, 0.5);
    this.gainB.gain.setTargetAtTime(0.28 * this.night, now, 0.5);
  }

  setTension(level) {
    this.tension = Math.max(0, Math.min(1, level || 0));
  }

  // --- helpers ---
  _noiseShot(type, freq, dur, vol, rate = 1, delay = 0, Q = 0.7) {
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf; src.playbackRate.value = rate;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = Q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.01, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.onended = () => { src.disconnect(); f.disconnect(); g.disconnect(); };
    src.start(t, Math.random() * 1.5, dur + 0.05);
    src.stop(t + dur + 0.05);
    return g;
  }

  _tone(type, freq, dur, vol, delay = 0, attack = 0.005) {
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.onended = () => { o.disconnect(); g.disconnect(); };
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  _bell(freq, delay, vol, dur) {
    this._tone('sine', freq, dur, vol, delay, 0.004);
    this._tone('sine', freq * 2.76, dur * 0.5, vol * 0.35, delay, 0.004);
  }

  _thump(t, vol, freq) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g); g.connect(this.master);
    o.onended = () => { o.disconnect(); g.disconnect(); };
    o.start(t); o.stop(t + 0.2);
  }

  // --- sfx ---
  footstep(sprint) {
    if (!this._ok()) return;
    const dur = 0.06 + Math.random() * 0.03;
    const rate = 0.8 + Math.random() * 0.4;
    this._noiseShot('lowpass', sprint ? 1100 : 600, dur, sprint ? 0.32 : 0.2, rate);
  }

  pickup() {
    if (!this._ok()) return;
    this._noiseShot('highpass', 2500, 0.22, 0.12, 1);
    this._bell(1320, 0.08, 0.08, 0.5);
  }

  sting() {
    if (!this._ok()) return;
    const ratios = [1, 1.414, 1.888, 2.53];
    const types = ['sawtooth', 'square', 'sawtooth', 'square'];
    const base = 140;
    ratios.forEach((r, i) => this._tone(types[i], base * r, 1.2, 0.16, 0, 0.01));
    const g = this._noiseShot('bandpass', 900, 1.0, 0.25, 1, 0, 0.8);
    g.gain.cancelScheduledValues(this.ctx.currentTime);
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
  }

  clearJingle() {
    if (!this._ok()) return;
    [523.25, 659.25, 783.99].forEach((f, i) => this._bell(f, i * 0.35, 0.18, 2.0));
  }

  jizoMove() {
    if (!this._ok()) return;
    this._noiseShot('lowpass', 150, 0.25, 0.18, 0.7);
  }

  repelFlash() {
    if (!this._ok()) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(400, t);
    o.frequency.exponentialRampToValueAtTime(1600, t + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g); g.connect(this.master);
    o.onended = () => { o.disconnect(); g.disconnect(); };
    o.start(t); o.stop(t + 0.5);
    this._noiseShot('highpass', 3000, 0.15, 0.1, 1);
  }

  update(dt) {
    if (!this._ok()) return;
    const lv = this.tension;
    const now = this.ctx.currentTime;
    if (lv < 0.05) { this.nextBeatTime = Math.max(this.nextBeatTime, now); return; }
    const k = Math.max(0, Math.min(1, (lv - 0.2) / 0.8));
    const bpm = 55 + (130 - 55) * k;
    const period = 60 / bpm;
    if (this.nextBeatTime < now - 0.5) this.nextBeatTime = now;
    while (this.nextBeatTime < now + 0.15) {
      const t = this.nextBeatTime;
      const vol = 0.25 + 0.6 * lv;
      this._thump(t, vol, 60);
      this._thump(t + Math.min(0.22, period * 0.3), vol * 0.75, 52);
      this.nextBeatTime += period;
    }
  }
}
