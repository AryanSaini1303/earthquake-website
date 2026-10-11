'use client';

import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ALERT_THRESHOLD } from '@/lib/detection';
import styles from './SeismoChart.module.css';

const AXIS_TICK = { fontSize: 11, fontFamily: 'Space Mono', fill: '#5A6880' };

// Headroom kept beyond the alert lines so they never sit on the chart edge.
const DOMAIN_MARGIN = 1000;

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTime}>{payload[0]?.payload?.ts}</div>
      <div className={styles.tooltipVal}>
        {Math.round(payload[0]?.value).toLocaleString('en-IN')}
        <span> u</span>
      </div>
    </div>
  );
}

// Live seismograph line with baseline and alert-threshold guides. Fills its parent,
// which must give it a height.
export default function SeismoChart({ data, baseline, isAlert = false }) {
  if (data.length === 0) {
    return (
      <div className={styles.waiting}>
        <i className="ti ti-wave-sine" aria-hidden="true" />
        <span>Waiting for data...</span>
      </div>
    );
  }

  // Frame the baseline and alert lines, but grow to include any reading outside
  // them so a real spike is visible instead of running off the chart.
  const yDomain = baseline
    ? ([dataMin, dataMax]) => [
        Math.floor(Math.min(dataMin, baseline - ALERT_THRESHOLD - DOMAIN_MARGIN)),
        Math.ceil(Math.max(dataMax, baseline + ALERT_THRESHOLD + DOMAIN_MARGIN)),
      ]
    : ['auto', 'auto'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="ts"
          tick={AXIS_TICK}
          interval="preserveStartEnd"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={yDomain}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={72}
          tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'}
        />
        <Tooltip content={<CustomTooltip />} />
        {baseline && (
          <ReferenceLine
            y={baseline}
            stroke="rgba(21,87,255,0.25)"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{ value: 'BASELINE', position: 'insideTopRight', fontSize: 9, fontFamily: 'Space Mono', fill: 'rgba(21,87,255,0.4)' }}
          />
        )}
        {baseline && (
          <ReferenceLine
            y={baseline + ALERT_THRESHOLD}
            stroke="rgba(220,38,38,0.2)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        )}
        {baseline && (
          <ReferenceLine
            y={baseline - ALERT_THRESHOLD}
            stroke="rgba(220,38,38,0.2)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={isAlert ? '#DC2626' : '#1557FF'}
          dot={false}
          strokeWidth={2}
          isAnimationActive={false}
          name="Vibration Intensity"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
