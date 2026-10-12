// Carries "spike this device" requests from the spike page to every open graph.
//
//   Supabase configured     requests are rows in the `spikes` table, delivered to all
//                           browsers and machines through Supabase Realtime.
//   Supabase not configured falls back to a BroadcastChannel, which only reaches other
//                           tabs of the same browser (handy for local development).
//
// Nothing here touches the Firebase sensor data.

import { supabase } from '@/lib/supabaseClient';

const TABLE = 'spikes';
const CHANNEL_NAME = 'eews-spike';

// How requests are currently being delivered: 'supabase' | 'browser' | 'none'.
export const spikeMode = () => {
  if (supabase) return 'supabase';
  return typeof BroadcastChannel === 'undefined' ? 'none' : 'browser';
};

// Ask a device to spike now. Resolves to { ok: true } or { ok: false, error }.
export async function sendSpike(deviceId) {
  if (supabase) {
    const { error } = await supabase.from(TABLE).insert({ device_id: deviceId });
    return error ? { ok: false, error: error.message } : { ok: true };
  }
  if (typeof BroadcastChannel === 'undefined') {
    return { ok: false, error: 'No way to deliver spikes is available in this browser.' };
  }
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type: 'spike', deviceId, sentAt: Date.now() });
  channel.close();
  return { ok: true };
}

let subscriptionCount = 0;

// Listen for spikes aimed at one device. Returns an unsubscribe function.
export function subscribeSpikes(deviceId, onSpike) {
  if (supabase) {
    // A unique channel name per listener, so several graphs on one page don't clash.
    subscriptionCount += 1;
    const channel = supabase
      .channel(`spikes:${deviceId}:${subscriptionCount}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLE, filter: `device_id=eq.${deviceId}` },
        () => onSpike()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event) => {
    const msg = event.data;
    if (msg?.type === 'spike' && msg.deviceId === deviceId) onSpike();
  };
  return () => channel.close();
}
