'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import styles from './page.module.css';

const DEVICES = [
  {
    id: 'EEWS-001',
    lat: 29.8644,
    lng: 77.8964,
    location: 'IIT Roorkee, Uttarakhand',
    dept: 'Seismology Department',
    coords: '29.8644°N, 77.8964°E',
    status: 'live',
    statusLabel: 'Live',
    detail: 'Transmitting · All systems nominal',
    health: 'Nominal',
    dataRate: '500ms',
  },
  {
    id: 'EEWS-002',
    lat: 28.6139,
    lng: 77.2090,
    location: 'New Delhi, NCR',
    dept: 'Zone IV Seismic Region',
    coords: '28.6139°N, 77.2090°E',
    status: 'live',
    statusLabel: 'Live',
    detail: 'Transmitting · All systems nominal',
    health: 'Nominal',
    dataRate: '500ms',
  },
  {
    id: 'EEWS-003',
    lat: 30.3165,
    lng: 78.0322,
    location: 'Dehradun, Uttarakhand',
    dept: 'Himalayan Foothills Zone',
    coords: '30.3165°N, 78.0322°E',
    status: 'live',
    statusLabel: 'Live',
    detail: 'Transmitting · All systems nominal',
    health: 'Nominal',
    dataRate: '500ms',
  },
  {
    id: 'EEWS-004',
    lat: 31.1048,
    lng: 77.1734,
    location: 'Shimla, Himachal Pradesh',
    dept: 'High-Risk Seismic Zone V',
    coords: '31.1048°N, 77.1734°E',
    status: 'live',
    statusLabel: 'Live',
    detail: 'Transmitting · All systems nominal',
    health: 'Nominal',
    dataRate: '500ms',
  },
];

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

export default function MapPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <div className={styles.logoMark}>
            <div className={styles.logoBars}>
              {[6, 11, 16, 9, 13].map((h, i) => (
                <span key={i} style={{ height: h }} />
              ))}
            </div>
          </div>
          <div>
            <div className={styles.logoName}>Inventis<span>Labs</span></div>
            <div className={styles.logoSub}>IIT ROORKEE INCUBATED</div>
          </div>
        </Link>

        <div className={styles.navCenter}>
          <span className={styles.navTitle}>EEWS Device Network</span>
          <span className={styles.navSub}>Earthquake Early Warning System — India</span>
        </div>

        <div className={styles.navRight}>
          <div className={styles.navStatus}>
            <i className={`ti ti-shield`} aria-hidden="true" style={{ fontSize: '18px' }}/>
            EEWS LIVE
          </div>
          <Link href="/" className={styles.navBack}>
            <i className="ti ti-arrow-left" aria-hidden="true"/>
            Home
          </Link>
        </div>
      </nav>
      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarLabel}>Device Network</div>
            <div className={styles.sidebarCount}>
              <span className={styles.countLive}>4 Live</span>
            </div>
          </div>

          <div className={styles.deviceList}>
            {DEVICES.map((d) => (
              <Link
                key={d.id}
                href={`/device/${d.id}`}
                className={`${styles.deviceItem} ${d.status === 'live' ? styles.deviceItemLive : ''}`}
              >
                <div className={styles.deviceItemHeader}>
                  <div className={styles.deviceItemLeft}>
                    <div className={`${styles.deviceDot} ${d.status === 'live' ? styles.deviceDotLive : styles.deviceDotSim}`} />
                    <span className={styles.deviceItemId}>{d.id}</span>
                  </div>
                  <span className={`${styles.deviceItemBadge} ${d.status === 'live' ? styles.badgeLive : styles.badgeSim}`}>
                    {d.statusLabel}
                  </span>
                </div>
                <div className={styles.deviceItemLocation}>
                  <i className="ti ti-map-pin" aria-hidden="true" />
                  {d.location}
                </div>
                <div className={styles.deviceItemDetail}>{d.detail}</div>
                <div className={styles.deviceItemArrow}>
                  View Dashboard <i className="ti ti-arrow-right" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
          <div className={styles.legend}>
            <div className={styles.legendTitle}>Map Legend</div>
            <div className={styles.legendItem}>
              <span className={styles.legendDotLive} />
              <span>Live device — transmitting</span>
            </div>
          </div>
        </aside>
        <div className={styles.mapWrap}>
          <MapComponent devices={DEVICES} />
        </div>

      </div>
    </div>
  );
}