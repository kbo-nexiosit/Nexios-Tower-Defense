// All sounds are synthesised with the Web Audio API: no audio files.
// Browsers block audio until a user gesture, so unlock() runs on the title click.

let ctx = null, master = null, muted = false, noiseBuf = null, lastShot = 0, drone = null;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.02);
}
const ready = () => ctx && !muted && ctx.state === 'running';

function tone(freq, { type = 'sine', dur = 0.3, vol = 0.3, at = 0, to = null, attack = 0.005 } = {}) {
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise({ dur = 0.3, vol = 0.3, at = 0, filter = 'lowpass', from = 2000, to = 200, q = 1 } = {}) {
  const t = ctx.currentTime + at;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = filter; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t); s.stop(t + dur + 0.05);
}

// The Nexios victory bell: inharmonic partials of a church-style bell.
export function bell(at = 0) {
  if (!ready()) return;
  const f = 520;
  [[0.5, 0.25, 3.2], [1, 0.35, 2.6], [2.0, 0.12, 1.6], [2.76, 0.14, 1.4], [5.4, 0.06, 0.8]]
    .forEach(([m, vol, dur]) => tone(f * m, { vol, dur, at }));
  noise({ dur: 0.05, vol: 0.2, at, filter: 'highpass', from: 4000, to: 3000 });
}

export function shot() {
  if (!ready()) return;
  const now = ctx.currentTime;
  if (now - lastShot < 0.05) return;   // many kids firing at once would clip
  lastShot = now;
  tone(900, { type: 'square', dur: 0.06, vol: 0.05, to: 300 });
}

export function zap() { if (ready()) tone(1400, { type: 'sawtooth', dur: 0.35, vol: 0.08, to: 120 }); }
export function pulse() { if (ready()) tone(220, { type: 'triangle', dur: 0.25, vol: 0.06, to: 440 }); }
export function splat() { if (ready()) noise({ dur: 0.25, vol: 0.25, from: 1200, to: 150 }); }

export function flip() {
  if (!ready()) return;
  tone(300, { type: 'sawtooth', dur: 1.3, vol: 0.18, to: 35 });
  noise({ dur: 1.4, vol: 0.2, filter: 'bandpass', from: 3000, to: 100, q: 4 });
}

export function thunder() { if (ready()) noise({ dur: 0.9, vol: 0.35, from: 900, to: 60 }); }

export function sword() {
  if (!ready()) return;
  noise({ dur: 0.6, vol: 0.45, filter: 'bandpass', from: 600, to: 6000, q: 2 });
  tone(1760, { dur: 1.2, vol: 0.12, at: 0.1 });
  tone(2637, { dur: 0.9, vol: 0.08, at: 0.1 });
}

export function boss() {
  if (!ready()) return;
  tone(55, { type: 'sawtooth', dur: 2.5, vol: 0.25, attack: 0.3 });
  tone(58, { type: 'sawtooth', dur: 2.5, vol: 0.2, attack: 0.3 });
  tone(110, { type: 'square', dur: 2.0, vol: 0.05, attack: 0.5, at: 0.3 });
}

// Low ambient synth drone; louder while the Upside Down is active.
export function ambient(on, intensity = 0.04) {
  if (!ctx) return;
  if (on && !drone) {
    const g = ctx.createGain(); g.gain.value = 0.0001;
    const a = ctx.createOscillator(), b = ctx.createOscillator(), lp = ctx.createBiquadFilter();
    a.type = 'sawtooth'; a.frequency.value = 73.4; b.type = 'sawtooth'; b.frequency.value = 110.2;
    lp.type = 'lowpass'; lp.frequency.value = 500;
    a.connect(lp); b.connect(lp); lp.connect(g).connect(master); a.start(); b.start();
    drone = { g, a, b };
  }
  if (drone) drone.g.gain.setTargetAtTime(on ? intensity : 0.0001, ctx.currentTime, 0.5);
}
export const audioState = () => (ctx ? ctx.state : 'none');   // for testing
