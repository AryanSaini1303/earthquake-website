'use client';

import UseLiveData from '/components/UseLiveData';
import styles from './page.module.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useState, useRef } from 'react';
import { Howl, Howler } from 'howler';

const EarthquakeDisplay = () => {
  const data = UseLiveData(); // live hook
  const [initialValues, setInitialValues] = useState([]);
  const [averageValues, setAverageValues] = useState({});
  const soundRef = useRef(null);

  // Flatten the array of arrays
  const flatData = data.flat().map((item) => ({
    ...item,
    ts: new Date(item.ts).toISOString().split('T')[1].split('.')[0],
    z: item.z - 240000,
    x: item.x + 19000,
  }));

  useEffect(() => {
  soundRef.current = new Howl({ src: ['/sounds/beep-warning-2.mp3'] });
  const unlockAudio = () => {
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().then(() => {
        console.log("🔓 AudioContext unlocked");
      });
    }
    document.removeEventListener("click", unlockAudio);
    document.removeEventListener("touchstart", unlockAudio);
    document.removeEventListener("keydown", unlockAudio);
  };
  document.addEventListener("click", unlockAudio);
  document.addEventListener("touchstart", unlockAudio);
  document.addEventListener("keydown", unlockAudio);
  return () => {
    document.removeEventListener("click", unlockAudio);
    document.removeEventListener("touchstart", unlockAudio);
    document.removeEventListener("keydown", unlockAudio);
  };
}, []);

  useEffect(() => {
    if (Object.keys(averageValues).length === 0) {
      if (flatData.length > 0 && initialValues.length < 500) {
        setInitialValues((prev) => [...prev, ...flatData]);
      }
      if (initialValues.length > 500) {
        const averageValues = initialValues.reduce(
          (acc, curr) => {
            acc.x += curr.x;
            acc.y += curr.y;
            acc.z += curr.z;
            return acc;
          },
          { x: 0, y: 0, z: 0 },
        );
        averageValues.x /= 500;
        averageValues.y /= 500;
        averageValues.z /= 500;
        console.log(averageValues);
        setAverageValues(averageValues);
        // setInitialValues((prev) => [...prev.slice(-499), averageValues]);
      }
    }
  }, [flatData]);
  // console.log(initialValues.length);

  useEffect(() => {
    if (Object.keys(averageValues).length > 0) {
      // console.table(averageValues);
      // console.table(flatData)
      flatData.map((item) => {
        if (
          (item.x > averageValues.x + 2500 ||
            item.x < averageValues.x - 2500) &&
          (item.y > averageValues.y + 2500 ||
            item.y < averageValues.y - 2500) &&
          (item.z > averageValues.z + 2500 || item.z < averageValues.z - 2500)
        ) {
          console.log('Anomaly detected:', item);
          soundRef.current.play();
        }
        // return item;
      });
    }
  }, [averageValues, flatData]);

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>📈 Live Earthquake Sensor Data</h1>
      {flatData.length === 0 ? (
        <p className={styles.waitingText}>Waiting for data...</p>
      ) : (
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={flatData.slice(-10)}>
              <XAxis dataKey="ts" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="x"
                stroke="#ef4444"
                dot={false}
                strokeWidth={'5px'}
              />
              <Line
                type="monotone"
                dataKey="y"
                stroke="#3b82f6"
                dot={false}
                strokeWidth={'5px'}
              />
              <Line
                type="monotone"
                dataKey="z"
                stroke="#10b981"
                dot={false}
                strokeWidth={'5px'}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <h1 style={{ textAlign: 'right' }} suppressHydrationWarning>{new Date().toLocaleTimeString()}</h1>
    </div>
  );
};

export default EarthquakeDisplay;
