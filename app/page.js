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
  const data = UseLiveData() || [];
  const [initialValues, setInitialValues] = useState([]);
  const [averageValue, setAverageValue] = useState(null);
  const soundRef = useRef(null);
  const flatData = data.flat().map((item) => {
    const adjustedX = item.x + 19000;
    const adjustedY = item.y;
    const adjustedZ = item.z - 240000;
    const value = Math.sqrt(adjustedX ** 2 + adjustedY ** 2 + adjustedZ ** 2);
    return {
      ts: new Date(item.ts).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
      value,
    };
  });

  useEffect(() => {
    soundRef.current = new Howl({ src: ['/sounds/beep-warning-1.mp3'] });
    const unlockAudio = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (averageValue === null) {
      if (flatData.length > 0 && initialValues.length < 500) {
        setInitialValues((prev) => [...prev, ...flatData]);
      }
      if (initialValues.length >= 500) {
        const sum = initialValues.reduce((acc, curr) => acc + curr.value, 0);
        const avg = sum / initialValues.length;
        console.log('📊 Baseline established:', avg);
        setAverageValue(avg);
      }
    }
  }, [flatData, initialValues, averageValue]);

  useEffect(() => {
    if (averageValue !== null) {
      flatData.slice(-50).forEach((item) => {
        if (
          item.value > averageValue + 5000 ||
          item.value < averageValue - 5000
        ) {
          // console.log('🚨 Anomaly detected:', item);
          soundRef.current?.play();
        }
      });
    }
  }, [flatData, averageValue]);

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>📈 Live Earthquake Sensor Data</h1>
      {flatData.length==0 ? (
        <p className={styles.waitingText}>Waiting for data...</p>
      ) : (
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={flatData}>
              <XAxis
                dataKey="ts"
                tick={{ fontSize: 10 }}
                // interval={Math.floor(flatData.length / 10)}
                interval='preserveStartEnd'
              />
              <YAxis
                domain={
                  averageValue
                    ? [
                        Math.floor(averageValue) - 5000,
                        Math.floor(averageValue) + 5000,
                      ]
                    : ['auto', 'auto']
                }
                tick={{ fontSize: 10 }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                dot={false}
                strokeWidth={2}
                name="Vibration Intensity"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <h1 style={{ textAlign: 'right' }} suppressHydrationWarning>
        {new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })}
      </h1>
    </div>
  );
};

export default EarthquakeDisplay;
