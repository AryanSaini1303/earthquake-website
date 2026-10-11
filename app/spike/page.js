'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DEVICES, hasFirebaseFeed } from '@/lib/devices';
import { sendSpike } from '@/lib/spikeBus';
import { ALERT_THRESHOLD } from '@/lib/detection';
import styles from './page.module.css';

// How long a card shows "Spike sent" before it is ready to confirm the next one.
const SENT_FLASH_MS = 2500;

const formatClock = (ms) =>
  new Date(ms).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

// Demo control: not linked from the rest of the site. Open it in one tab and a
// device's graph (or the triangulation page) in another, then fire spikes from here.
export default function SpikePage() {
  // { [deviceId]: { count, lastAt } }
  const [sent, setSent] = useState({});
  const [flashing, setFlashing] = useState({});
  const [supported, setSupported] = useState(true);
  const timers = useRef({});

  useEffect(() => {
    setSupported(typeof BroadcastChannel !== 'undefined');
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  const fire = (id) => {
    if (!sendSpike(id)) return;
    const at = Date.now();
    setSent((prev) => ({ ...prev, [id]: { count: (prev[id]?.count ?? 0) + 1, lastAt: at } }));
    setFlashing((prev) => ({ ...prev, [id]: true }));
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(
      () => setFlashing((prev) => ({ ...prev, [id]: false })),
      SENT_FLASH_MS
    );
  };

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/map" className={styles.navBack}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Device Map
        </Link>
        <div className={styles.navCenter}>
          <span className={styles.navTitle}>Spike generator</span>
          <span className={styles.navSub}>Demo control</span>
        </div>
        <div className={styles.navRight} />
      </nav>

      <main className={styles.main}>
        <div className={styles.eyebrow}>Demo control</div>
        <h1 className={styles.title}>
          Generate a spike
          <span className={styles.titleAccent}> on any device</span>
        </h1>
        <p className={styles.desc}>
          Keep a device&rsquo;s graph open in another tab of this browser, then press its
          button. The simulated feed gets a sharp shake that crosses the ±
          {ALERT_THRESHOLD.toLocaleString('en-IN')}-unit alert threshold and fades out over a
          few seconds. Spiking three devices together sets off the triangulation alert.
        </p>

        {!supported && (
          <div className={styles.warn} role="alert">
            This browser can&rsquo;t pass messages between tabs, so spikes won&rsquo;t reach
            the graphs.
          </div>
        )}

        <div className={styles.grid}>
          {DEVICES.map((d) => {
            const live = hasFirebaseFeed(d);
            const stats = sent[d.id];
            const isFlashing = Boolean(flashing[d.id]);
            return (
              <section key={d.id} className={`${styles.card} ${live ? styles.cardLocked : ''}`}>
                <div className={styles.cardTop}>
                  <span className={styles.cardId}>{d.id}</span>
                  <span className={styles.badge}>
                    <span className={styles.badgeDot} />
                    {d.statusLabel}
                  </span>
                </div>
                <div className={styles.cardLocation}>
                  <i className="ti ti-map-pin" aria-hidden="true" />
                  {d.location}
                </div>

                <button
                  type="button"
                  className={`${styles.spikeBtn} ${isFlashing ? styles.spikeBtnSent : ''}`}
                  disabled={live || !supported}
                  onClick={() => fire(d.id)}
                >
                  <i className={`ti ${isFlashing ? 'ti-check' : 'ti-bolt'}`} aria-hidden="true" />
                  {isFlashing ? 'Spike sent' : 'Generate spike'}
                </button>

                <div className={styles.cardFoot}>
                  {live ? (
                    <span>Physical sensor: its real readings can&rsquo;t be spiked.</span>
                  ) : stats ? (
                    <span>
                      {stats.count} sent · last at {formatClock(stats.lastAt)}
                    </span>
                  ) : (
                    <span>No spikes sent yet.</span>
                  )}
                  <Link href={`/device/${d.id}`} target="_blank" className={styles.graphLink}>
                    Open graph
                    <i className="ti ti-external-link" aria-hidden="true" />
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
