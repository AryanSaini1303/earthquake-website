'use client';

import { useEffect, useRef, useState } from 'react';
import UseLiveData from '@/components/UseLiveData';
import { hasFirebaseFeed } from '@/lib/devices';

// Number of distinct live readings averaged to form the baseline.
const CALIBRATION_READINGS = 500;

// Generated feed used by devices that don't stream to Firebase yet.
const SIM_TICK_MS = 1000;
const SIM_MAX_POINTS = 120;

const formatTime = (ms) =>
  new Date(ms).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

// Combine the raw 3-axis accelerometer reading into a single intensity magnitude.
const toMagnitude = (item) => {
  const x = item.x + 19000;
  const y = item.y;
  const z = item.z - 240000;
  return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
};

// Real readings from Firebase, with an adaptive baseline.
// Returns { data: [{ t, ts, value }], baseline } where baseline is null until calibrated.
export function useLiveProcessed(enabled = true) {
  const raw = UseLiveData(enabled);
  const [baseline, setBaseline] = useState(null);
  // `raw` is only a short rolling window, so the same reading shows up in many
  // consecutive renders. Track what has been counted by timestamp so each
  // reading contributes to the baseline exactly once.
  const calibRef = useRef({ seen: new Set(), values: [] });

  const data = (raw || []).flat().map((item) => {
    const t = new Date(item.ts).getTime();
    return { t, ts: formatTime(t), value: toMagnitude(item) };
  });

  useEffect(() => {
    if (!enabled || baseline !== null) return;
    const calib = calibRef.current;
    for (const item of (raw || []).flat()) {
      if (calib.seen.has(item.ts)) continue;
      calib.seen.add(item.ts);
      calib.values.push(toMagnitude(item));
    }
    if (calib.values.length >= CALIBRATION_READINGS) {
      const sample = calib.values.slice(0, CALIBRATION_READINGS);
      setBaseline(sample.reduce((a, v) => a + v, 0) / sample.length);
    }
  }, [raw, baseline, enabled]);

  return { data, baseline };
}

// Generated readings: a quiet signal with a fixed baseline, available immediately.
export function useSimData(enabled = true) {
  const [data, setData] = useState([]);
  const tRef = useRef(0);
  const baselineRef = useRef(247500 + Math.random() * 1000);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      tRef.current += 0.15;
      const t = tRef.current;
      const base = baselineRef.current;
      const noise =
        Math.sin(t * 0.31) * 280 +
        Math.sin(t * 0.13) * 520 +
        Math.sin(t * 0.07) * 180 +
        (Math.random() - 0.5) * 200;
      const now = Date.now();
      setData((prev) =>
        [...prev, { t: now, ts: formatTime(now), value: base + noise }].slice(-SIM_MAX_POINTS)
      );
    }, SIM_TICK_MS);
    return () => clearInterval(interval);
  }, [enabled]);

  return { data, baseline: baselineRef.current };
}

// The readings for one device, from whichever source the device is configured with
// (see `feed` in lib/devices.js). Only the matching source is switched on.
export default function useDeviceSeries(device) {
  const usesFirebase = hasFirebaseFeed(device);
  const live = useLiveProcessed(usesFirebase);
  const sim = useSimData(!usesFirebase);
  return usesFirebase ? live : sim;
}
