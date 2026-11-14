let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function getCtx(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

function tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.25, delay = 0) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function playButton(i: number, dur = 0.3) {
  tone(SCALE[i % SCALE.length], dur);
}

export function playError() {
  tone(160, 0.5, 'sawtooth', 0.2);
  tone(110, 0.6, 'sawtooth', 0.2, 0.12);
}

export function playRoundDone() {
  tone(523.25, 0.15, 'sine', 0.2);
  tone(659.25, 0.15, 'sine', 0.2, 0.12);
  tone(783.99, 0.25, 'sine', 0.22, 0.24);
}
