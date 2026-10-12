// A realistic stand-in for one device's vibration-intensity feed, used by devices
// that don't stream to Firebase yet. Pure JavaScript (no React, no Date, no
// Math.random), so it is deterministic for a given seed and easy to test.
//
// A real accelerometer trace is not a smooth line. It is made of:
//   1. sensor jitter     - fast, small, slightly correlated noise that never stops
//   2. bursts of shaking - footsteps, passing vehicles, machinery: short oscillations
//                          that start abruptly and die away, at irregular intervals
//   3. slow wander       - tiny drift from temperature and mounting
// all sitting on a stable baseline. This generator layers those three.
//
// The result is kept comfortably inside the alert threshold, so a simulated device
// never raises an alert by itself.

const TWO_PI = Math.PI * 2;

// 1. Sensor jitter: AR(1) noise. `JITTER_STD` is its overall standard deviation.
const JITTER_STD = 240;
const JITTER_CORRELATION = 0.55;

// 2. Bursts: a decaying sinusoid each, arriving as a random (Poisson) process.
const BURST_RATE_PER_SEC = 0.4;
const BURST_MEDIAN_AMPLITUDE = 1300;
const BURST_AMPLITUDE_SPREAD = 0.75; // log-normal sigma: mostly modest, occasionally large
const BURST_FREQ_HZ = [5, 13];
const BURST_DECAY_SEC = [0.12, 0.45];
const BURST_ATTACK_SEC = 0.02; // avoids an unnaturally instant start

// 3. Slow wander (units, period in seconds).
const DRIFT = [
  { amplitude: 120, periodSec: 47 },
  { amplitude: 80, periodSec: 113 },
];

// Hard ceiling on how far a reading can stray from baseline. Well under the 5,000-unit
// alert threshold, so even overlapping bursts can't trip it. Applied smoothly (tanh).
const MAX_DEVIATION = 3600;

// Real devices sit around a quarter of a million units, each at its own level.
const BASELINE_MIN = 240500;
const BASELINE_SPAN = 5000;

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Small, fast, seedable PRNG returning floats in [0, 1).
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The baseline a given seed settles at (stable per device).
export const baselineForSeed = (seed) => BASELINE_MIN + (seed % BASELINE_SPAN);

// Create a signal. Call `sample(tSec)` with increasing times (seconds); it returns the
// reading at that moment. Samples should be evenly spaced for the jitter to behave.
export function createSimSignal({ seed, baseline = baselineForSeed(seed) }) {
  const rand = mulberry32(seed);
  const gauss = () => {
    const u = Math.max(rand(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * rand());
  };
  const between = ([lo, hi]) => lo + rand() * (hi - lo);

  const jitterInnovation = JITTER_STD * Math.sqrt(1 - JITTER_CORRELATION ** 2);
  const driftPhases = DRIFT.map(() => rand() * TWO_PI);

  let jitter = 0;
  let bursts = [];
  let nextBurstAt = null;

  const scheduleBurstAfter = (t) => t - Math.log(1 - rand()) / BURST_RATE_PER_SEC;

  const sample = (tSec) => {
    // Start any bursts that have arrived by now.
    if (nextBurstAt === null) nextBurstAt = scheduleBurstAfter(tSec);
    while (nextBurstAt <= tSec) {
      bursts.push({
        start: nextBurstAt,
        amplitude: BURST_MEDIAN_AMPLITUDE * Math.exp(BURST_AMPLITUDE_SPREAD * gauss()),
        freq: between(BURST_FREQ_HZ),
        decay: between(BURST_DECAY_SEC),
        phase: rand() * TWO_PI,
      });
      nextBurstAt = scheduleBurstAfter(nextBurstAt);
    }
    // Forget bursts that have died away (about five decay times).
    bursts = bursts.filter((b) => tSec - b.start < 5 * b.decay);

    jitter = JITTER_CORRELATION * jitter + jitterInnovation * gauss();

    let deviation = jitter;
    DRIFT.forEach((d, i) => {
      deviation += d.amplitude * Math.sin((TWO_PI * tSec) / d.periodSec + driftPhases[i]);
    });
    for (const b of bursts) {
      const dt = tSec - b.start;
      if (dt < 0) continue; // only possible if time is replayed from an earlier moment
      deviation +=
        b.amplitude *
        (1 - Math.exp(-dt / BURST_ATTACK_SEC)) *
        Math.exp(-dt / b.decay) *
        Math.sin(TWO_PI * b.freq * dt + b.phase);
    }

    return baseline + MAX_DEVIATION * Math.tanh(deviation / MAX_DEVIATION);
  };

  return { baseline, sample };
}

// ── Injected spikes ──
// A spike is a strong shake that starts at a chosen moment and dies away over a few
// seconds, added on top of the normal signal. No two are alike: each one is drawn from
// its own seed (strength, speed of shaking, which way it first kicks, how long it rings,
// an overtone, and sometimes an aftershock). The same seed always gives the same spike,
// so every screen watching one spike sees one shape.
//
// Whatever the draw, a spike stays above SPIKE_BREACH_LEVEL for about a second, well
// over the 5,000 alert threshold, so it always sets off the alert rules.

const SPIKE_BREACH_LEVEL = 7000;
const SPIKE_BREACH_SEC = 1.0;
const SPIKE_MAX_FREQ_HZ = 20; // the feed is sampled at 50 Hz; stay well clear of aliasing

export function createSpike(seed) {
  const rand = mulberry32(hashString(`spike:${seed}`));
  const between = (lo, hi) => lo + rand() * (hi - lo);

  // The main shake.
  const decay = between(1.1, 2.2);
  const freq = between(3.5, 9);
  const attack = between(0.03, 0.15);
  // Strong enough that its envelope is still above the breach level after a second.
  const amplitude = Math.max(
    between(9000, 17000),
    SPIKE_BREACH_LEVEL * Math.exp(SPIKE_BREACH_SEC / decay)
  );
  // Some events begin with a faint, fast tremor (like a P-wave) and the main shock
  // arrives a moment later; the rest hit immediately.
  const precursor = rand() < 0.4;
  const mainDelay = precursor ? between(0.5, 1.1) : 0;
  const parts = [
    {
      delay: mainDelay, amplitude, freq, decay, attack,
      phase: (rand() < 0.5 ? 0 : Math.PI) + between(-0.4, 0.4), // kicks up or down first
    },
    {
      // A faster, weaker overtone riding on the main shake.
      delay: mainDelay,
      amplitude: amplitude * between(0.15, 0.4),
      freq: Math.min(SPIKE_MAX_FREQ_HZ, freq * between(1.5, 2.8)),
      decay: decay * between(0.4, 0.9),
      attack,
      phase: between(0, TWO_PI),
    },
  ];
  if (precursor) {
    // Stays well under the alert threshold: a warning rumble, not yet an alarm.
    parts.push({
      delay: 0,
      amplitude: amplitude * between(0.08, 0.2),
      freq: between(8, 14),
      decay: between(0.3, 0.6),
      attack: 0.1,
      phase: between(0, TWO_PI),
    });
  }
  if (rand() < 0.55) {
    // An aftershock a moment later.
    parts.push({
      delay: mainDelay + between(0.9, 2.6),
      amplitude: amplitude * between(0.2, 0.5),
      freq: between(4, 10),
      decay: between(0.5, 1.1),
      attack: 0.05,
      phase: between(0, TWO_PI),
    });
  }

  const durationSec = Math.max(...parts.map((c) => c.delay + 5 * c.decay));

  // The spike's contribution `dtSec` after it started (0 before it, and after it ends).
  const offset = (dtSec) => {
    if (dtSec < 0 || dtSec > durationSec) return 0;
    let sum = 0;
    for (const c of parts) {
      const local = dtSec - c.delay;
      if (local < 0) continue;
      sum +=
        c.amplitude *
        (1 - Math.exp(-local / c.attack)) *
        Math.exp(-local / c.decay) *
        Math.sin(TWO_PI * c.freq * local + c.phase);
    }
    return sum;
  };

  return { durationSec, offset };
}
