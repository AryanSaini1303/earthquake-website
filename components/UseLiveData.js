'use client';

import { useEffect, useRef, useState } from 'react';
import { database } from '/lib/firebaseConfig';
import { ref, onChildAdded, off } from 'firebase/database';

const MINUTES = 0.25 * 60 * 1000;

const useLiveData = () => {
  const [data, setData] = useState([]);
  const dataRefRef = useRef(null);

  useEffect(() => {
    const date = new Date();

    const taarik = new Date().toLocaleDateString('en-CA', {
      timeZone: 'UTC',
    });

    const samay = date.getUTCHours();
    const formattedHour = samay === 0 ? '00' : samay < 10 ? `0${samay}` : samay;

    const dataRef = ref(database, `${taarik}/${formattedHour}`);
    dataRefRef.current = dataRef;

    onChildAdded(dataRef, (snapshot) => {
      const newData = snapshot.val();
      if (!newData) return;
      const now = Date.now();
      setData((prev) => {
        const newItems = Array.isArray(newData) ? newData : [newData];
        const merged = [...prev, ...newItems];
        const filtered = merged.filter((item) => {
          const ts = new Date(item.ts).getTime();
          return now - ts <= MINUTES;
        });
        return filtered;
      });
    });

    return () => {
      if (dataRefRef.current) {
        off(dataRefRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        if (!prev.length) return [];
        const now = Date.now();
        const filtered = prev.filter((item) => {
          const ts = new Date(item.ts).getTime();
          return now - ts <= MINUTES;
        });
        return filtered;
      });
    }, 500); // runs every 0.5 sec
    return () => clearInterval(interval);
  }, []);

  // console.log(data)
  return data || [];
};

export default useLiveData;
