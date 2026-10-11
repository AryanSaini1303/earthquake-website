'use client';

import { useEffect, useState } from 'react';
import { database } from '/lib/firebaseConfig';
import { ref, onChildAdded } from 'firebase/database';

// Only readings from the last 15 seconds are kept.
const WINDOW_MS = 15 * 1000;
// How often stale readings are pruned.
const PRUNE_INTERVAL_MS = 500;
// How often we check whether the UTC hour (and therefore the Firebase path) has changed.
const PATH_CHECK_INTERVAL_MS = 1000;

// Readings are stored under `<UTC date>/<UTC hour>`, e.g. `2026-10-11/16`.
const currentPath = () => {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA', { timeZone: 'UTC' });
  const hour = String(now.getUTCHours()).padStart(2, '0');
  return `${date}/${hour}`;
};

const isFresh = (item, now) => now - new Date(item.ts).getTime() <= WINDOW_MS;

const useLiveData = () => {
  const [data, setData] = useState([]);

  // Subscribe to the current hour's node, and move to the next one when the hour
  // (or the day) rolls over so a long-open dashboard keeps receiving data.
  useEffect(() => {
    let subscribedPath = null;
    let unsubscribe = null;

    const subscribe = () => {
      const path = currentPath();
      if (path === subscribedPath) return;

      unsubscribe?.();
      subscribedPath = path;

      unsubscribe = onChildAdded(ref(database, path), (snapshot) => {
        const newData = snapshot.val();
        if (!newData) return;
        const now = Date.now();
        setData((prev) => {
          const newItems = Array.isArray(newData) ? newData : [newData];
          return [...prev, ...newItems].filter((item) => isFresh(item, now));
        });
      });
    };

    subscribe();
    const timer = setInterval(subscribe, PATH_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Always returns a fresh array: this tick also re-renders the dashboard,
      // which keeps its on-screen clock moving even when no data is arriving.
      setData((prev) => {
        const now = Date.now();
        return prev.filter((item) => isFresh(item, now));
      });
    }, PRUNE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return data;
};

export default useLiveData;
