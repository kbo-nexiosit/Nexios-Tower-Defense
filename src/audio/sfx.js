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

// The Nexios victory bell: a bright hand bell struck twice — "ting ting".
export function bell(at = 0) {
  if (!ready()) return;
  const strike = t => {
    const f = 1568;   // G6
    [[1, 0.24, 1.5], [2.0, 0.07, 0.9], [2.76, 0.10, 0.7], [4.07, 0.05, 0.45], [5.4, 0.03, 0.3]]
      .forEach(([m, vol, dur]) => tone(f * m, { vol, dur, at: t, attack: 0.002 }));
    noise({ dur: 0.02, vol: 0.12, at: t, filter: 'highpass', from: 7000, to: 6000 });
  };
  strike(at);
  strike(at + 0.17);
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

// --- Upside Down drone: only while the board is flipped, fades to silence on the way back.
let upDrone = null;
export function upsideDrone(on) {
  if (!ctx) return;
  if (on && !upDrone) {
    const g = ctx.createGain(); g.gain.value = 0.0001;
    const a = ctx.createOscillator(), b = ctx.createOscillator(), lp = ctx.createBiquadFilter();
    a.type = 'sawtooth'; a.frequency.value = 55; b.type = 'sawtooth'; b.frequency.value = 58.3;
    lp.type = 'lowpass'; lp.frequency.value = 380;
    a.connect(lp); b.connect(lp); lp.connect(g).connect(master); a.start(); b.start();
    upDrone = { g, a, b };
  }
  if (!upDrone) return;
  upDrone.g.gain.cancelScheduledValues(ctx.currentTime);
  upDrone.g.gain.setTargetAtTime(on ? 0.13 : 0.0001, ctx.currentTime, on ? 0.4 : 0.25);
  if (!on) {
    const d = upDrone; upDrone = null;
    setTimeout(() => { try { d.a.stop(); d.b.stop(); } catch {} }, 2500);   // fully gone after the fade
  }
}

// --- Normal-world music: an original 80s synth loop (drum machine, bass, arpeggio, pads).
let music = null;
const BPM = 108, STEP = 60 / BPM / 4;                       // 16th notes
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
// Original 8-bar progression: Am – F – C – G (two bars each).
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const ARP = [0, 1, 2, 3, 2, 1, 0, 2];                        // index into chord tones (+octave)

function mVoice(freq, t, dur, { type = 'sawtooth', vol = 0.05, cutoff = 2400, attack = 0.005 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff, t); f.frequency.exponentialRampToValueAtTime(Math.max(200, cutoff * 0.25), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f).connect(g).connect(music.bus); o.start(t); o.stop(t + dur + 0.05);
}
function mNoise(t, dur, vol, type, freq) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(music.bus); s.start(t); s.stop(t + dur + 0.02);
}
function kick(t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(music.bus); o.start(t); o.stop(t + 0.32);
}
function playStep(step, t) {
  const bar = Math.floor(step / 16), s16 = step % 16;
  const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
  if (s16 === 0 || s16 === 8 || (s16 === 10 && bar % 2)) kick(t);
  if (s16 === 4 || s16 === 12) { mNoise(t, 0.18, 0.22, 'bandpass', 1800); mVoice(190, t, 0.1, { type: 'triangle', vol: 0.08, cutoff: 1200 }); }
  if (s16 % 2 === 0) mNoise(t, 0.04, 0.06, 'highpass', 8000);
  if (s16 % 2 === 0) mVoice(midi(chord[0] - 24 + (s16 % 4 === 2 ? 12 : 0)), t, STEP * 1.8, { vol: 0.09, cutoff: 900 });   // bass
  const n = ARP[s16 % ARP.length];
  mVoice(midi((n === 3 ? chord[0] + 12 : chord[n]) + 12), t, STEP * 0.9, { type: 'square', vol: 0.025, cutoff: 3200 });  // arpeggio
  if (s16 === 0 && bar % 2 === 0) chord.forEach(c => mVoice(midi(c), t, STEP * 30, { type: 'triangle', vol: 0.025, cutoff: 1800, attack: 0.6 }));  // pad
}

export function musicStart() {
  if (!ctx || music) return;
  const bus = ctx.createGain(), lp = ctx.createBiquadFilter(), out = ctx.createGain();
  lp.type = 'lowpass'; lp.frequency.value = 12000;
  out.gain.value = 0.0001; out.gain.setTargetAtTime(0.9, ctx.currentTime, 0.8);
  bus.connect(lp).connect(out).connect(master);
  music = { bus, lp, out, next: ctx.currentTime + 0.1, step: 0 };
  music.timer = setInterval(() => {
    if (!music || ctx.state !== 'running') return;
    if (music.next < ctx.currentTime) music.next = ctx.currentTime + 0.05;   // after a stall, don't play catch-up
    while (music.next < ctx.currentTime + 0.25) { playStep(music.step, music.next); music.next += STEP; music.step = (music.step + 1) % 128; }
  }, 50);
}

// In the Upside Down the music goes muffled and distant.
export function musicDuck(on) {
  if (!music) return;
  const t = ctx.currentTime;
  music.lp.frequency.setTargetAtTime(on ? 450 : 12000, t, 0.3);
  music.out.gain.setTargetAtTime(on ? 0.35 : 0.9, t, 0.3);
}

export function musicStop() {
  if (!music) return;
  const m = music; music = null;
  clearInterval(m.timer);
  m.out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
  setTimeout(() => { try { m.out.disconnect(); } catch {} }, 2000);
}

export const audioState = () => (ctx ? ctx.state : 'none');   // for testing
export const audioDebug = () => ({ ctx: ctx ? ctx.state : 'none', music: !!music, musicOut: music ? +music.out.gain.value.toFixed(3) : 0, musicCutoff: music ? Math.round(music.lp.frequency.value) : 0, drone: !!upDrone, droneGain: upDrone ? +upDrone.g.gain.value.toFixed(3) : 0 });   // for testing
