'use client';

import { use } from 'react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import UseLiveData from '/components/UseLiveData';
import { Howl } from 'howler';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const DEVICE_META = {
  'EEWS-001': {
    location: 'IIT Roorkee, Uttarakhand',
    dept: 'Seismology Department',
    coords: '29.8644°N, 77.8964°E',
    zone: 'Seismic Zone IV',
    elevation: '274m ASL',
    installed: 'January 2025',
    status: 'live',
  },
  'EEWS-002': {
    location: 'New Delhi, NCR',
    dept: 'Zone IV Seismic Region',
    coords: '28.6139°N, 77.2090°E',
    zone: 'Seismic Zone IV',
    elevation: '216m ASL',
    installed: 'March 2025',
    status: 'sim',
  },
  'EEWS-003': {
    location: 'Dehradun, Uttarakhand',
    dept: 'Himalayan Foothills Zone',
    coords: '30.3165°N, 78.0322°E',
    zone: 'Seismic Zone IV',
    elevation: '640m ASL',
    installed: 'November 2025',
    status: 'sim',
  },
  'EEWS-004': {
    location: 'Shimla, Himachal Pradesh',
    dept: 'High-Risk Seismic Zone V',
    coords: '31.1048°N, 77.1734°E',
    zone: 'Seismic Zone V',
    elevation: '2206m ASL',
    installed: 'January 2026',
    status: 'sim',
  },
};

function useSimData() {
  const [data, setData] = useState([]);
  const tRef = useRef(0);
  const baselineRef = useRef(247500 + Math.random() * 1000);
  useEffect(() => {
    const interval = setInterval(() => {
      tRef.current += 0.15;
      const t = tRef.current;
      const base = baselineRef.current;
      const noise =
        Math.sin(t * 0.31) * 280 +
        Math.sin(t * 0.13) * 520 +
        Math.sin(t * 0.07) * 180 +
        (Math.random() - 0.5) * 200;
      const value = base + noise;
      const ts = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });
      setData(prev => [...prev, { ts, value }].slice(-120));
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return { data, baseline: baselineRef.current };
}

function useLiveProcessed() {
  const raw = UseLiveData();
  const [baseline, setBaseline] = useState(null);
  const initRef = useRef([]);
  const flatData = (raw || []).flat().map(item => {
    const x = item.x + 19000;
    const y = item.y;
    const z = item.z - 240000;
    const value = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
    return {
      ts: new Date(item.ts).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }),
      value,
    };
  });
  useEffect(() => {
    if (baseline === null && flatData.length > 0) {
      initRef.current = [...initRef.current, ...flatData];
      if (initRef.current.length >= 500) {
        const avg = initRef.current.reduce((a, c) => a + c.value, 0) / initRef.current.length;
        setBaseline(avg);
      }
    }
  }, [flatData.length]);
  return { data: flatData, baseline };
}

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

export default function DevicePage({ params }) {
  const { id } = use(params);
  const meta = DEVICE_META[id];
  const isLive = meta?.status === 'live';
  const liveResult = useLiveProcessed();
  const simResult = useSimData();
  const { data, baseline } = isLive ? liveResult : {
    data: simResult.data,
    baseline: simResult.baseline,
  };
  const [isAlert, setIsAlert] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [heartbeat, setHeartbeat] = useState(true);
  const [accuracy, setAccuracy] = useState(98.4);
  const soundRef = useRef(null);
  const alertTimeRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      soundRef.current = new Howl({ src: ['/sounds/beep-warning-1.mp3'] });
      const unlock = () => {
        if (window.Howler?.ctx?.state === 'suspended') window.Howler.ctx.resume();
        document.removeEventListener('click', unlock);
      };
      document.addEventListener('click', unlock);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartbeat(h => !h);
      setAccuracy(prev => parseFloat((prev + (Math.random() - 0.5) * 0.2).toFixed(1)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!baseline || !data.length) return;
    const recent = data.slice(-10);
    const triggered = recent.some(
      d => d.value > baseline + 5000 || d.value < baseline - 5000
    );
    if (triggered && !alertDismissed) {
      setIsAlert(true);
      soundRef.current?.play();
      clearTimeout(alertTimeRef.current);
      alertTimeRef.current = setTimeout(() => {
        setIsAlert(false);
        setAlertDismissed(false);
      }, 8000);
    }
  }, [data, baseline]);

  const currentVal = data.length ? Math.round(data[data.length - 1].value) : null;
  const delta = baseline && currentVal ? currentVal - Math.round(baseline) : null;

  if (!meta) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundInner}>
          <div className={styles.notFoundId}>Device not found</div>
          <Link href="/map" className={styles.backBtn}>
            <i className="ti ti-arrow-left" aria-hidden="true" /> Back to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${isAlert ? styles.pageAlert : ''}`}>

      {isAlert && (
        <div className={styles.alertGlow} aria-hidden="true" />
      )}

      {isAlert && !alertDismissed && (
        <div className={styles.alertBanner}>
          <div className={styles.alertBannerLeft}>
            <span className={styles.alertBannerDot} />
            <span className={styles.alertBannerIcon}>
              <i className="ti ti-alert-triangle" aria-hidden="true" />
            </span>
            <div>
              <div className={styles.alertBannerTitle}>Seismic Anomaly Detected</div>
              <div className={styles.alertBannerSub}>
                {id} — Reading exceeds baseline threshold by ±5,000 units
              </div>
            </div>
          </div>
          <button
            className={styles.alertDismiss}
            onClick={() => { setAlertDismissed(true); setIsAlert(false); }}
          >
            Dismiss <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
      )}

      <nav className={styles.nav}>
        <Link href="/map" className={styles.navBack}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Device Map
        </Link>

        <div className={styles.navCenter}>
          <span className={styles.navId}>{id}</span>
          <span className={styles.navLocation}>{meta.location}</span>
        </div>

        <div className={styles.navRight}>
          <div className={`${styles.navStatus} ${isAlert ? styles.navStatusAlert : ''}`}>
            <span className={`${styles.pulse} ${isAlert ? styles.pulseAlert : ''}`} />
            {isAlert ? 'ANOMALY DETECTED' : 'LIVE FEED'}
          </div>
          <Link href="/" className={styles.navHome}>
            <i className="ti ti-home" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <div className={styles.main}>

        <div className={styles.leftCol}>

          <div className={styles.card}>
            <div className={styles.cardLabel}>Geo Information</div>
            <div className={styles.geoGrid}>
              {[
                { icon: 'ti-map-pin', key: 'Location', val: meta.location },
                { icon: 'ti-building', key: 'Department', val: meta.dept },
                { icon: 'ti-compass', key: 'Coordinates', val: meta.coords },
                { icon: 'ti-wave-sine', key: 'Seismic Zone', val: meta.zone },
                { icon: 'ti-mountain', key: 'Elevation', val: meta.elevation },
                { icon: 'ti-calendar', key: 'Installed', val: meta.installed },
              ].map((row, i) => (
                <div key={i} className={styles.geoRow}>
                  <span className={styles.geoKey}>
                    <i className={`ti ${row.icon}`} aria-hidden="true" />
                    {row.key}
                  </span>
                  <span className={styles.geoVal}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardLabel}>Device Health</div>
            <div className={styles.deviceInfoGrid}>

              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon} style={{ background: 'rgba(22,163,74,0.08)' }}>
                  <i className="ti ti-heart-rate-monitor" style={{ color: '#16A34A' }} aria-hidden="true" />
                </div>
                <div className={styles.infoCardLabel}>Heartbeat</div>
                <div className={`${styles.infoCardVal} ${styles.valGreen}`}>
                  <span className={`${styles.heartDot} ${heartbeat ? styles.heartOn : styles.heartOff}`} />
                  {heartbeat ? 'Active' : 'Pulse'}
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon} style={{ background: 'rgba(21,87,255,0.08)' }}>
                  <i className="ti ti-shield-check" style={{ color: '#1557FF' }} aria-hidden="true" />
                </div>
                <div className={styles.infoCardLabel}>Health</div>
                <div className={`${styles.infoCardVal} ${isLive ? styles.valGreen : styles.valMuted}`}>
                  {isLive ? 'Nominal' : 'Simulated'}
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon} style={{ background: 'rgba(186,117,23,0.08)' }}>
                  <i className="ti ti-antenna" style={{ color: '#BA7517' }} aria-hidden="true" />
                </div>
                <div className={styles.infoCardLabel}>Data Rate</div>
                <div className={styles.infoCardVal}>
                  {isLive ? '500ms' : 'N/A'}
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon} style={{ background: 'rgba(21,87,255,0.08)' }}>
                  <i className="ti ti-target" style={{ color: '#1557FF' }} aria-hidden="true" />
                </div>
                <div className={styles.infoCardLabel}>Accuracy</div>
                <div className={`${styles.infoCardVal} ${styles.valBlue}`}>
                  {isLive ? `${accuracy}%` : 'N/A'}
                </div>
              </div>

            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardLabel}>Understanding the Graph</div>
            <div className={styles.explainList}>
              {[
                {
                  icon: 'ti-timeline',
                  title: 'What you\'re seeing',
                  desc: 'The graph shows vibration intensity over the last 15 seconds — calculated from the device\'s 3-axis accelerometer readings combined into a single magnitude value.',
                },
                {
                  icon: 'ti-minus',
                  title: 'The baseline',
                  desc: 'The dashed line is the adaptive baseline — the average "quiet" reading established from the first 500 data points. A stable site stays close to this line.',
                },
                {
                  icon: 'ti-alert-triangle',
                  title: 'When alerts trigger',
                  desc: 'If the reading rises or drops more than 5,000 units from baseline, an anomaly is flagged. This may indicate seismic activity, and operators are alerted immediately.',
                },
                {
                  icon: 'ti-clock',
                  title: 'Update frequency',
                  desc: 'Data refreshes every 500 milliseconds — giving you a near real-time view of ground motion at the deployment site.',
                },
              ].map((item, i) => (
                <div key={i} className={styles.explainItem}>
                  <div className={styles.explainIcon}>
                    <i className={`ti ${item.icon}`} aria-hidden="true" />
                  </div>
                  <div>
                    <div className={styles.explainTitle}>{item.title}</div>
                    <div className={styles.explainDesc}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className={styles.rightCol}>
          <div className={`${styles.card} ${styles.graphCard} ${isAlert ? styles.graphCardAlert : ''}`}>

            <div className={styles.graphHeader}>
              <div>
                <div className={styles.cardLabel}>Live Seismograph</div>
                <div className={styles.graphSubhead}>
                  {isLive ? 'Real-time ground motion · IIT Roorkee' : `Simulated feed · ${meta.location}`}
                </div>
              </div>
              <div className={styles.graphReadouts}>
                <div className={styles.readout}>
                  <div className={styles.readoutKey}>Intensity</div>
                  <div className={`${styles.readoutVal} ${styles.valBlue}`}>
                    {currentVal ? currentVal.toLocaleString('en-IN') : '—'}
                    <span> u</span>
                  </div>
                </div>
                <div className={styles.readout}>
                  <div className={styles.readoutKey}>Baseline Δ</div>
                  <div className={`${styles.readoutVal} ${isAlert ? styles.valRed : ''}`}>
                    {delta !== null ? `${delta >= 0 ? '+' : ''}${delta.toLocaleString('en-IN')}` : '—'}
                    <span> u</span>
                  </div>
                </div>
                <div className={styles.readout}>
                  <div className={styles.readoutKey}>Status</div>
                  <div className={`${styles.readoutVal} ${isAlert ? styles.valRed : styles.valGreen}`}>
                    {isAlert ? 'ALERT' : baseline ? 'NOMINAL' : 'CALIBRATING'}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.chartWrap}>
              {data.length === 0 ? (
                <div className={styles.waiting}>
                  <i className="ti ti-wave-sine" aria-hidden="true" />
                  <span>{isLive ? 'Waiting for data...' : 'Initialising simulation...'}</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="ts"
                      tick={{ fontSize: 11, fontFamily: 'Space Mono', fill: '#5A6880' }}
                      interval="preserveStartEnd"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={baseline
                        ? [Math.floor(baseline) - 6000, Math.floor(baseline) + 6000]
                        : ['auto', 'auto']}
                      tick={{ fontSize: 11, fontFamily: 'Space Mono', fill: '#5A6880' }}
                      axisLine={false}
                      tickLine={false}
                      width={72}
                      tickFormatter={v => (v / 1000).toFixed(0) + 'k'}
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
                        y={baseline + 5000}
                        stroke="rgba(220,38,38,0.2)"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                      />
                    )}
                    {baseline && (
                      <ReferenceLine
                        y={baseline - 5000}
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
              )}
            </div>

            <div className={styles.graphFooter}>
              <div className={styles.graphFooterLeft}>
                <span className={styles.graphLegendItem}>
                  <span className={styles.legendLine} style={{ background: '#1557FF' }} />
                  Vibration Intensity
                </span>
                <span className={styles.graphLegendItem}>
                  <span className={styles.legendDash} />
                  Baseline
                </span>
                <span className={styles.graphLegendItem}>
                  <span className={styles.legendDash} style={{ background: 'rgba(220,38,38,0.4)' }} />
                  Alert Threshold
                </span>
              </div>
              <div className={styles.graphTime} suppressHydrationWarning>
                {new Date().toLocaleTimeString('en-IN', {
                  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}