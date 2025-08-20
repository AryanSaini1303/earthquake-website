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

const EarthquakeDisplay = () => {
  const data = UseLiveData();

  // console.log(data);
  // Flatten the array of arrays
  const flatData = data.flat().map((item) => ({
    ...item,
    ts: new Date(item.ts).toISOString().split('T')[1].split('.')[0],
    z: item.z - 240000, // tweak these if lines collide
    x: item.x + 19000, // tweak these if lines collide
  }));

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>📈 Live Earthquake Sensor Data</h1>
      {flatData.length === 0 ? (
        <p className={styles.waitingText}>Waiting for data...</p>
      ) : (
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={flatData}>
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
      <h1 style={{textAlign:'right'}}>{(new Date).toLocaleTimeString()}</h1>
    </div>
  );
};

export default EarthquakeDisplay;