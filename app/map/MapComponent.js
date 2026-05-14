'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import styles from './MapComponent.module.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

if (typeof document !== 'undefined' && !document.getElementById('eews-marker-styles')) {
  const style = document.createElement('style');
  style.id = 'eews-marker-styles';
  style.textContent = `
    @keyframes ping {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes ping2 {
      0% { transform: scale(1); opacity: 0.4; }
      100% { transform: scale(2.8); opacity: 0; }
    }
    .live-ring-1 {
      animation: ping 2s ease-out infinite;
      transform-origin: center;
    }
    .live-ring-2 {
      animation: ping2 2s ease-out infinite 0.6s;
      transform-origin: center;
    }
  `;
  document.head.appendChild(style);
}

function createIcon(isLive) {
  const color = isLive ? '#16A34A' : '#6B7590';
  const opacity = isLive ? '1' : '0.5';
  const glow = isLive ? 'drop-shadow(0 0 8px rgba(22,163,74,0.5))' : 'none';
  const rings = isLive ? `
    <circle cx="20" cy="20" r="8" fill="${color}" opacity="0.2" class="live-ring-1"/>
    <circle cx="20" cy="20" r="8" fill="${color}" opacity="0.15" class="live-ring-2"/>
  ` : `
    <circle cx="20" cy="20" r="13" fill="none" stroke="${color}" stroke-width="1" opacity="0.15"/>
    <circle cx="20" cy="20" r="18" fill="none" stroke="${color}" stroke-width="1" opacity="0.08"/>
  `;
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      ${rings}
      <circle cx="20" cy="20" r="6.5" fill="${color}" opacity="${opacity}"/>
      <circle cx="20" cy="20" r="3.5" fill="white" opacity="0.95"/>
    </svg>
  `;
  return L.divIcon({
    html: `<div style="filter:${glow}">${svg}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
    className: '',
  });
}

function FitBounds({ devices }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(devices.map(d => [d.lat, d.lng]));
    map.fitBounds(bounds, { padding: [80, 80] });
  }, [map, devices]);
  return null;
}

export default function MapComponent({ devices }) {
  return (
    <MapContainer
      center={[29.5, 77.5]}
      zoom={7}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      <FitBounds devices={devices} />

      {devices.map((d) => (
        <Marker
          key={d.id}
          position={[d.lat, d.lng]}
          icon={createIcon(d.status === 'live')}
        >
          <Popup className={styles.popup} minWidth={240}>
            <div className={styles.popupInner}>
              <div className={styles.popupHeader}>
                <span className={styles.popupId}>{d.id}</span>
                <span className={`${styles.popupBadge} ${d.status === 'live' ? styles.badgeLive : styles.badgeSim}`}>
                  {d.statusLabel}
                </span>
              </div>
              <div className={styles.popupLocation}>{d.location}</div>
              <div className={styles.popupDept}>{d.dept}</div>
              <div className={styles.popupRows}>
                <div className={styles.popupRow}>
                  <span>Coordinates</span>
                  <span>{d.coords}</span>
                </div>
                <div className={styles.popupRow}>
                  <span>Health</span>
                  <span className={d.status === 'live' ? styles.valGreen : styles.valMuted}>{d.health}</span>
                </div>
                <div className={styles.popupRow}>
                  <span>Data Rate</span>
                  <span>{d.dataRate}</span>
                </div>
                <div className={styles.popupRow}>
                  <span>Status</span>
                  <span>{d.detail}</span>
                </div>
              </div>
              <Link href={`/device/${d.id}`} className={styles.popupBtn}>
                View Dashboard
                <i className="ti ti-arrow-right" aria-hidden="true" />
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}