// Lets the spike page (one browser tab) tell a device's graph (another tab) to spike.
// Uses a BroadcastChannel, so it works between tabs of the same browser on the same
// site, with no server involved. Nothing is written to Firebase.

const CHANNEL_NAME = 'eews-spike';

const open = () =>
  typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);

// Ask a device to spike now.
export function sendSpike(deviceId) {
  const channel = open();
  if (!channel) return false;
  channel.postMessage({ type: 'spike', deviceId, sentAt: Date.now() });
  channel.close();
  return true;
}

// Listen for spikes aimed at one device. Returns an unsubscribe function.
export function subscribeSpikes(deviceId, onSpike) {
  const channel = open();
  if (!channel) return () => {};
  channel.onmessage = (event) => {
    const msg = event.data;
    if (msg?.type === 'spike' && msg.deviceId === deviceId) onSpike();
  };
  return () => channel.close();
}
