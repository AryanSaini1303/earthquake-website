'use client';

import { use } from 'react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import SeismoChart from '@/components/SeismoChart';
import useDeviceSeries from '@/lib/useDeviceSeries';
import useAlertSound from '@/lib/useAlertSound';
import { ALERT_THRESHOLD, hasRecentBreach } from '@/lib/detection';
import { getDevice, SITE } from '@/lib/devices';

export default function DevicePage({ params }) {
  const { id } = use(params);
  const meta = getDevice(id);
  // Readings come from whichever source the device is configured with
  // (see `feed` in lib/devices.js); the labels treat every device as live.
  const { data, baseline } = useDeviceSeries(meta);
  const [isAlert, setIsAlert] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const alertTimeRef = useRef(null);
  const playAlertSound = useAlertSound();

  useEffect(() => {
    if (!data.length) return;
    if (hasRecentBreach(data, baseline) && !alertDismissed) {
      setIsAlert(true);
      playAlertSound();
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
                {id} — Reading exceeds baseline threshold by ±{ALERT_THRESHOLD.toLocaleString('en-IN')} units
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
                  {data.length !== 0 && <span className={`${styles.heartDot} ${data.length !== 0 ? styles.heartOn : styles.heartOff}`} />}
                  {data.length !== 0 ? 'Active' : '—'}
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon} style={{ background: 'rgba(21,87,255,0.08)' }}>
                  <i className="ti ti-shield-check" style={{ color: '#1557FF' }} aria-hidden="true" />
                </div>
                <div className={styles.infoCardLabel}>Health</div>
                <div className={`${styles.infoCardVal} ${styles.valGreen}`}>
                  {data.length !== 0 ? meta.health : '—'}
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon} style={{ background: 'rgba(186,117,23,0.08)' }}>
                  <i className="ti ti-antenna" style={{ color: '#BA7517' }} aria-hidden="true" />
                </div>
                <div className={styles.infoCardLabel}>Data Rate</div>
                <div className={styles.infoCardVal}>
                  {data.length !== 0 ? '500ms' : '—'}
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon} style={{ background: 'rgba(21,87,255,0.08)' }}>
                  <i className="ti ti-target" style={{ color: '#1557FF' }} aria-hidden="true" />
                </div>
                <div className={styles.infoCardLabel}>Accuracy</div>
                <div className={`${styles.infoCardVal} ${styles.valBlue}`}>
                  {data.length !== 0 ? `${SITE.nominalAccuracy}%` : '—'}
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
                  desc: 'The graph shows vibration intensity from the last ~60 seconds — the device\'s 3-axis accelerometer readings (X, Y, Z) combined into a single magnitude value via √(x² + y² + z²).',
                },
                {
                  icon: 'ti-minus',
                  title: 'The baseline',
                  desc: 'The dashed line is the adaptive baseline — the average "quiet" reading calculated from this device\'s first 500 live readings after coming online. A stable site stays close to this line.',
                },
                {
                  icon: 'ti-alert-triangle',
                  title: 'When alerts trigger',
                  desc: `If a reading rises or drops more than ${ALERT_THRESHOLD.toLocaleString('en-IN')} units from baseline, an anomaly is flagged. This may indicate seismic activity, and operators are alerted immediately.`,
                },
                {
                  icon: 'ti-clock',
                  title: 'Update frequency',
                  desc: 'Live readings arrive roughly every 500 milliseconds, giving a near real-time view of ground motion at the deployment site.',
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
                  {`Real-time ground motion · ${meta.location}`}
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
              <SeismoChart data={data} baseline={baseline} isAlert={isAlert} />
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