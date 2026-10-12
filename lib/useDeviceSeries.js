'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import UseLiveData from '@/components/UseLiveData';
import { hasFirebaseFeed } from '@/lib/devices';
import { baselineForSeed, createSimSignal, createSpike, hashString } from '@/lib/simSignal';
import { subscribeSpikes } from '@/lib/spikeBus';

// Number of distinct live readings averaged to form the baseline.
const CALIBRATION_READINGS = 500;

// Generated feed used by devices that don't stream to Firebase yet.
const SIM_SAMPLE_RATE_HZ = 50;
const SIM_TICK_MS = 500;
const SIM_WINDOW_MS = 15000;

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

// Generated readings for devices without a Firebase feed. The signal comes from
// lib/simSignal.js and is shaped like the real sensor's trace (dense jitter, small
// bursts, steady baseline). It is sampled at SIM_SAMPLE_RATE_HZ, and the chart always
// shows the most recent SIM_WINDOW_MS, like the live feed does.
export function useSimData(enabled = true, deviceId = 'sim') {
  const seed = useMemo(() => hashString(String(deviceId)), [deviceId]);
  // Known up front and stable per device, so it renders the same on server and client.
  const baseline = useMemo(() => baselineForSeed(seed), [seed]);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    const signal = createSimSignal({ seed, baseline });
    const stepMs = 1000 / SIM_SAMPLE_RATE_HZ;
    const startMs = Date.now() - SIM_WINDOW_MS;
    let next = 0; // index of the next sample on the fixed time grid
    let buffer = [];
    // Spikes requested from the spike page: { start (epoch ms), spike }. Each has its own
    // shape, drawn from the seed that came with the request.
    let spikes = [];
    const stopListening = subscribeSpikes(deviceId, ({ seed }) =>
      spikes.push({ start: Date.now(), spike: createSpike(seed) })
    );

    // Generate every grid sample up to now and publish the visible window. The buffer
    // lives here, not in a state updater, because updaters may be run twice.
    const advance = () => {
      const now = Date.now();
      while (startMs + next * stepMs <= now) {
        const t = Math.round(startMs + next * stepMs);
        // Always advance the base signal, then add any spike that has started by `t`.
        let value = signal.sample((next * stepMs) / 1000);
        for (const { start, spike } of spikes) value += spike.offset((t - start) / 1000);
        buffer.push({ t, ts: formatTime(t), value });
        next += 1;
      }
      spikes = spikes.filter(({ start, spike }) => now - start <= spike.durationSec * 1000);
      const cutoff = now - SIM_WINDOW_MS;
      let drop = 0;
      while (drop < buffer.length && buffer[drop].t < cutoff) drop += 1;
      buffer = drop ? buffer.slice(drop) : buffer;
      setData(buffer.slice());
    };

    // Fill the window straight away (in an effect, so server and client markup match).
    advance();
    const interval = setInterval(advance, SIM_TICK_MS);
    return () => {
      clearInterval(interval);
      stopListening();
    };
  }, [enabled, seed, baseline, deviceId]);

  return { data, baseline };
}

// The readings for one device, from whichever source the device is configured with
// (see `feed` in lib/devices.js). Only the matching source is switched on.
export default function useDeviceSeries(device) {
  const usesFirebase = hasFirebaseFeed(device);
  const live = useLiveProcessed(usesFirebase);
  const sim = useSimData(!usesFirebase, device?.id);
  return usesFirebase ? live : sim;
}
