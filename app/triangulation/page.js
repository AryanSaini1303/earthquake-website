'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import SeismoChart from '@/components/SeismoChart';
import useDeviceSeries from '@/lib/useDeviceSeries';
import useAlertSound from '@/lib/useAlertSound';
import {
  ALERT_THRESHOLD,
  COINCIDENCE_WINDOW_MS,
  TRIANGULATION_SIZE,
  hasBreachWithin,
  isTriangulated,
} from '@/lib/detection';
import { DEVICES, getDevice } from '@/lib/devices';

// The alert stays up this long after the last moment all three devices were in breach.
const ALERT_HOLD_MS = 8000;

// Drill: a short, clearly labelled disturbance added on top of all three feeds so the
// alert flow can be rehearsed. It only changes what this page displays.
const DRILL_DURATION_MS = 4000;
const DRILL_OFFSET = ALERT_THRESHOLD + 3000;

const thresholdLabel = ALERT_THRESHOLD.toLocaleString('en-IN');
const windowSeconds = COINCIDENCE_WINDOW_MS / 1000;

const STATE_LABEL = {
  calibrating: 'Calibrating',
  nominal: 'Nominal',
  crossed: 'Threshold crossed',
};

function useNow(intervalMs) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

// `?devices=a,b,c` -> ['a', 'b', 'c'], or null when it isn't a valid selection of three.
function parseSelection(param) {
  if (!param) return null;
  const ids = [...new Set(param.split(','))];
  if (ids.length !== TRIANGULATION_SIZE || !ids.every((id) => getDevice(id))) return null;
  return ids;
}

const applyDrill = (data, drill) =>
  data.map((p) =>
    p.t >= drill.start && p.t <= drill.end ? { ...p, value: p.value + DRILL_OFFSET } : p
  );

export default function TriangulationPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
      <TriangulationRoute />
    </Suspense>
  );
}

function TriangulationRoute() {
  const ids = parseSelection(useSearchParams().get('devices'));
  // Keyed so switching to a different set of devices starts from a clean slate.
  return ids ? <TriangulationMonitor key={ids.join(',')} deviceIds={ids} /> : <DevicePicker />;
}

/* ───────────────────────── Step 1: choose three devices ───────────────────────── */

function DevicePicker() {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const full = selected.length === TRIANGULATION_SIZE;

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < TRIANGULATION_SIZE
          ? [...prev, id]
          : prev
    );

  const start = () => router.push(`/triangulation?devices=${selected.join(',')}`);

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/map" className={styles.navBack}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Device Map
        </Link>
        <div className={styles.navCenter}>
          <span className={styles.navTitle}>Triangulation</span>
          <span className={styles.navSub}>Select devices</span>
        </div>
        <div className={styles.navRight}>
          <Link href="/" className={styles.navHome} aria-label="Home">
            <i className="ti ti-home" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <main className={styles.pickMain}>
        <div className={styles.pickIntro}>
          <div className={styles.eyebrow}>Step 1 of 2</div>
          <h1 className={styles.pickTitle}>
            Choose three devices
            <span className={styles.pickTitleAccent}> to triangulate</span>
          </h1>
          <p className={styles.pickDesc}>
            Three devices working together confirm an event that a single sensor could
            mistake for local noise. An alert is raised only when{' '}
            <strong>all three</strong> cross the {thresholdLabel}-unit threshold within{' '}
            {windowSeconds} seconds of each other.
          </p>
        </div>

        <div className={styles.pickGrid} role="group" aria-label="Devices">
          {DEVICES.map((d) => {
            const order = selected.indexOf(d.id);
            const isSelected = order !== -1;
            const locked = full && !isSelected;
            return (
              <button
                key={d.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-disabled={locked}
                disabled={locked}
                className={`${styles.pickCard} ${isSelected ? styles.pickCardOn : ''}`}
                onClick={() => toggle(d.id)}
              >
                <div className={styles.pickCardTop}>
                  <span className={styles.pickId}>{d.id}</span>
                  <span className={`${styles.pickCheck} ${isSelected ? styles.pickCheckOn : ''}`}>
                    {isSelected ? order + 1 : ''}
                  </span>
                </div>
                <div className={styles.pickLocation}>
                  <i className="ti ti-map-pin" aria-hidden="true" />
                  {d.location}
                </div>
                <div className={styles.pickMeta}>
                  <span><i className="ti ti-wave-sine" aria-hidden="true" />{d.zone}</span>
                  <span><i className="ti ti-compass" aria-hidden="true" />{d.coords}</span>
                </div>
                <span className={styles.pickBadge}>
                  <span className={styles.pickBadgeDot} />
                  {d.statusLabel}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.pickFooter}>
          <span className={styles.pickCount}>
            <strong>{selected.length}</strong> of {TRIANGULATION_SIZE} selected
            {full && <em> · deselect one to swap</em>}
          </span>
          <button type="button" className={styles.startBtn} disabled={!full} onClick={start}>
            <i className="ti ti-triangle" aria-hidden="true" />
            Start triangulation
          </button>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────── Step 2: three stacked live graphs + joint alert ─────────────────── */

function TriangulationMonitor({ deviceIds }) {
  const devices = deviceIds.map(getDevice);

  // Exactly three devices, so exactly three hook calls, in a fixed order.
  const series = [
    useDeviceSeries(devices[0]),
    useDeviceSeries(devices[1]),
    useDeviceSeries(devices[2]),
  ];

  const now = useNow(500);
  const [drill, setDrill] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [alertUntil, setAlertUntil] = useState(0);
  const [alertIsDrill, setAlertIsDrill] = useState(false);
  const playAlertSound = useAlertSound();
  const wasTriangulated = useRef(false);

  const feeds = series.map((s) => ({
    baseline: s.baseline,
    data: drill ? applyDrill(s.data, drill) : s.data,
  }));
  const breaching = feeds.map((f) => hasBreachWithin(f.data, f.baseline, now));
  const crossedCount = breaching.filter(Boolean).length;
  const calibrated = feeds.every((f) => Boolean(f.baseline));
  const triangulated = isTriangulated(feeds, now);
  const drillRunning = Boolean(drill) && now <= drill.end;

  // Alert: sound and banner on the moment all three are in breach together, held for a
  // while after the last such moment, and dismissable.
  useEffect(() => {
    if (triangulated) {
      if (!wasTriangulated.current) {
        setDismissed(false);
        setAlertIsDrill(drillRunning);
        playAlertSound();
      }
      setAlertUntil(now + ALERT_HOLD_MS);
    }
    wasTriangulated.current = triangulated;
  }, [triangulated, now, drillRunning, playAlertSound]);

  const alertVisible = !dismissed && now < alertUntil;

  const startDrill = () => {
    const t = Date.now();
    setDrill({ start: t, end: t + DRILL_DURATION_MS });
  };

  let summaryTitle = 'All devices nominal';
  if (alertVisible) summaryTitle = 'Triangulated seismic event';
  else if (!calibrated) summaryTitle = 'Calibrating devices';
  else if (crossedCount > 0) summaryTitle = `${crossedCount} of ${TRIANGULATION_SIZE} above threshold`;

  return (
    <div className={`${styles.page} ${alertVisible ? styles.pageAlert : ''}`}>
      {alertVisible && <div className={styles.alertGlow} aria-hidden="true" />}

      {alertVisible && (
        <div className={styles.alertBanner} role="alert">
          <div className={styles.alertBannerLeft}>
            <span className={styles.alertBannerDot} />
            <span className={styles.alertBannerIcon}>
              <i className="ti ti-alert-triangle" aria-hidden="true" />
            </span>
            <div>
              <div className={styles.alertBannerTitle}>
                {alertIsDrill ? 'Triangulation Drill — Simulated Event' : 'Triangulated Seismic Event'}
              </div>
              <div className={styles.alertBannerSub}>
                {alertIsDrill
                  ? 'Simulated disturbance injected on this page. Not a real seismic event.'
                  : `${deviceIds.join(' · ')} — all three exceeded ±${thresholdLabel} units from baseline`}
              </div>
            </div>
          </div>
          <button className={styles.alertDismiss} onClick={() => setDismissed(true)}>
            Dismiss <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
      )}

      <nav className={styles.nav}>
        <Link href="/triangulation" className={styles.navBack}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Change devices
        </Link>
        <div className={styles.navCenter}>
          <span className={styles.navTitle}>Triangulation</span>
          <span className={styles.navSub}>{deviceIds.join(' · ')}</span>
        </div>
        <div className={styles.navRight}>
          <div className={`${styles.navStatus} ${alertVisible ? styles.navStatusAlert : ''}`}>
            <span className={`${styles.pulse} ${alertVisible ? styles.pulseAlert : ''}`} />
            {alertVisible ? 'EVENT CONFIRMED' : 'LIVE FEED'}
          </div>
          <Link href="/" className={styles.navHome} aria-label="Home">
            <i className="ti ti-home" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <main className={styles.monitorMain}>
        <section className={`${styles.summary} ${alertVisible ? styles.summaryAlert : ''}`}>
          <div className={styles.summaryText}>
            <div className={styles.cardLabel}>Triangulation status</div>
            <div className={styles.summaryTitle}>{summaryTitle}</div>
            <div className={styles.summarySub}>
              An alert is raised only when all {TRIANGULATION_SIZE} devices cross ±{thresholdLabel} units
              from baseline within {windowSeconds} seconds of each other.
            </div>
          </div>

          <div className={styles.summaryDevices}>
            {devices.map((d, i) => {
              const state = !feeds[i].baseline ? 'calibrating' : breaching[i] ? 'crossed' : 'nominal';
              return (
                <div key={d.id} className={styles.summaryDevice}>
                  <span className={`${styles.stateDot} ${styles[`dot_${state}`]}`} />
                  <span className={styles.summaryDeviceId}>{d.id}</span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.drillBtn}
            onClick={startDrill}
            disabled={!calibrated || drillRunning}
            title={
              calibrated
                ? 'Inject a short simulated disturbance to rehearse the alert'
                : 'Available once all three devices have calibrated'
            }
          >
            <i className="ti ti-flask" aria-hidden="true" />
            {drillRunning ? 'Drill running…' : 'Run drill'}
          </button>
        </section>

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendLine} />Vibration intensity
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDash} />Baseline
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDash} ${styles.legendDashRed}`} />Alert threshold (±{thresholdLabel})
          </span>
        </div>

        <div className={styles.panels}>
          {devices.map((d, i) => (
            <DevicePanel
              key={d.id}
              index={i}
              device={d}
              feed={feeds[i]}
              breaching={breaching[i]}
              alertActive={alertVisible}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function DevicePanel({ index, device, feed, breaching, alertActive }) {
  const { data, baseline } = feed;
  const hasData = data.length !== 0;
  const current = hasData ? Math.round(data[data.length - 1].value) : null;
  const delta = baseline && current ? current - Math.round(baseline) : null;
  const state = !baseline ? 'calibrating' : breaching ? 'crossed' : 'nominal';

  const info = [
    { key: 'Coordinates', val: device.coords },
    { key: 'Seismic zone', val: device.zone },
    { key: 'Elevation', val: device.elevation },
    { key: 'Heartbeat', val: hasData ? 'Active' : '—', cls: hasData ? styles.valGreen : '' },
    { key: 'Health', val: hasData ? device.health : '—', cls: hasData ? styles.valGreen : '' },
    { key: 'Data rate', val: hasData ? device.dataRate : '—' },
    {
      key: 'Intensity',
      val: current ? `${current.toLocaleString('en-IN')} u` : '—',
      cls: styles.valBlue,
    },
    {
      key: 'Baseline Δ',
      val: delta !== null ? `${delta >= 0 ? '+' : ''}${delta.toLocaleString('en-IN')} u` : '—',
      cls: breaching ? styles.valRed : '',
    },
  ];

  return (
    <section
      className={`${styles.panel} ${breaching ? styles.panelCrossed : ''} ${alertActive ? styles.panelAlert : ''}`}
    >
      <header className={styles.panelHead}>
        <div className={styles.panelTitle}>
          <span className={styles.panelIndex}>{String(index + 1).padStart(2, '0')}</span>
          <div>
            <div className={styles.panelId}>{device.id}</div>
            <div className={styles.panelLocation}>
              <i className="ti ti-map-pin" aria-hidden="true" />
              {device.location}
            </div>
          </div>
        </div>
        <span className={`${styles.stateChip} ${styles[`chip_${state}`]}`}>
          <span className={`${styles.stateDot} ${styles[`dot_${state}`]}`} />
          {STATE_LABEL[state]}
        </span>
      </header>

      <div className={styles.infoGrid}>
        {info.map((item) => (
          <div key={item.key} className={styles.infoCell}>
            <div className={styles.infoKey}>{item.key}</div>
            <div className={`${styles.infoVal} ${item.cls || ''}`}>{item.val}</div>
          </div>
        ))}
      </div>

      <div className={styles.chartWrap}>
        <SeismoChart data={data} baseline={baseline} isAlert={breaching} />
      </div>
    </section>
  );
}
