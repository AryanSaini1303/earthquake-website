'use client';

import { useEffect, useState } from 'react';
import { database } from '/lib/firebaseConfig';
import { ref, onChildAdded, onValue } from 'firebase/database';

const useLiveData = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const date = new Date();
    const taarik = new Date().toLocaleDateString('en-CA', {
      timeZone: 'UTC',
    });
    const samay = date.getUTCHours();
    console.log(`EQ/${taarik}/${samay === 0 ? `${samay}${samay}` : samay}`);
    const dataRef = ref(
      database,
      `EQ/${taarik}/${samay === 0 ? `${samay}${samay}` : samay}`,
    );
    // Load existing data once
    onValue(dataRef, (snapshot) => {
      const allData = snapshot.val();
      if (allData) {
        const values = Object.values(allData);
        setData(values.slice(-1));
      }
    });

    // Listen for new entries
    onChildAdded(dataRef, (snapshot) => {
      const newData = snapshot.val();
      setData((prev) => [...prev.slice(-99), newData]);
    });
  }, []);

  // useEffect(() => {
  //   console.log(data);
  // }, [data]);

  return data;
};

export default useLiveData;
