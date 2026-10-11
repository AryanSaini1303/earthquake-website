// Threshold rules shared by the single-device dashboard and the triangulation page.
// Pure functions only (no React), so they are easy to reason about and to test.
//
// A "reading" is a point shaped like { t, ts, value }:
//   t     epoch milliseconds when the reading was taken
//   ts    the same moment formatted for the chart axis
//   value vibration intensity (combined 3-axis magnitude)

// A reading is a breach when it sits further than this from the device's baseline,
// in either direction.
export const ALERT_THRESHOLD = 5000;

// Single-device rule: how many of the latest readings are checked for a breach.
export const RECENT_READINGS = 10;

// Triangulation rule: the three devices must each have a breach within this
// window of one another. Time-based rather than "last N readings" because
// devices report at different rates.
export const COINCIDENCE_WINDOW_MS = 5000;

// A triangulation always uses exactly this many devices.
export const TRIANGULATION_SIZE = 3;

export const isBreach = (value, baseline) =>
  value > baseline + ALERT_THRESHOLD || value < baseline - ALERT_THRESHOLD;

// Single device: does any of the most recent readings breach the threshold?
export const hasRecentBreach = (data, baseline) =>
  Boolean(baseline) &&
  data.slice(-RECENT_READINGS).some((p) => isBreach(p.value, baseline));

// Did this device breach the threshold within the last `windowMs` before `now`?
export const hasBreachWithin = (data, baseline, now, windowMs = COINCIDENCE_WINDOW_MS) =>
  Boolean(baseline) &&
  data.some((p) => now - p.t <= windowMs && isBreach(p.value, baseline));

// Triangulation: true only when ALL devices have breached within the window.
// `feeds` is an array of { data, baseline }, one per device.
export const isTriangulated = (feeds, now) =>
  feeds.length === TRIANGULATION_SIZE &&
  feeds.every((f) => hasBreachWithin(f.data, f.baseline, now));
