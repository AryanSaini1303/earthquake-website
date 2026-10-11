// Single source of truth for every EQ-Alert device and for site-wide display constants.
// The home page, map page, map popups and device dashboard all read from here,
// so a device is edited in exactly one place.

export const SITE = {
  name: 'InventisLabs',
  incubator: 'IIIT Lucknow',
  // Marketing / display figures (shown in the UI, not computed from data).
  leadTimeSec: 15,
  nominalAccuracy: 99.8,
};

// Per-status presentation. `live` devices stream real readings from Firebase;
// `sim` devices render a simulated feed on their dashboard.
const STATUS = {
  live: {
    statusLabel: 'Live',
    detail: 'Transmitting · All systems nominal',
    health: 'Nominal',
    dataRate: '500ms',
  },
  sim: {
    statusLabel: 'Simulated',
    detail: 'Simulated feed · Demo data',
    health: 'Simulated',
    dataRate: 'N/A',
  },
};

const formatCoords = (lat, lng) =>
  `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ` +
  `${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;

// `zone` is the IS 1893 seismic zone. Lucknow and Surat (Zone III) were checked
// against the IS 1893 city table; Bahraich and Jagdeeshpur are not listed there
// and keep their previously configured values. Verify against the zone map if it matters.
const RAW_DEVICES = [
  {
    id: 'EQ-Alert_Demo',
    location: 'Lucknow, India',
    dept: 'Office',
    lat: 26.9442,
    lng: 80.9402,
    zone: 'Seismic Zone III',
    elevation: '123m ASL',
    installed: 'August 2026',
    status: 'live',
  },
  {
    id: 'EQ-Alert_001',
    location: 'Bahraich, Uttar Pradesh',
    dept: 'Seismic Zone IV Region',
    lat: 27.5743,
    lng: 81.5817,
    zone: 'Seismic Zone IV',
    elevation: '126m ASL',
    installed: 'March 2026',
    status: 'sim',
  },
  {
    id: 'EQ-Alert_002',
    location: 'Dindoli, Surat, Gujarat',
    dept: 'Seismic Zone III Region',
    lat: 21.15,
    lng: 72.862,
    zone: 'Seismic Zone III',
    elevation: '13m ASL',
    installed: 'March 2026',
    status: 'sim',
  },
  {
    id: 'EQ-Alert_003',
    location: 'Jagdeeshpur, Uttar Pradesh',
    dept: 'Seismic Zone III Region',
    lat: 26.4555,
    lng: 81.6153,
    zone: 'Seismic Zone III',
    elevation: '70m ASL',
    installed: 'January 2026',
    status: 'sim',
  },
];

export const DEVICES = RAW_DEVICES.map((d) => ({
  ...d,
  ...STATUS[d.status],
  coords: formatCoords(d.lat, d.lng),
}));

export const getDevice = (id) => DEVICES.find((d) => d.id === id);

export const isLiveDevice = (d) => d?.status === 'live';

export const LIVE_DEVICES = DEVICES.filter(isLiveDevice);
export const SIM_DEVICES = DEVICES.filter((d) => !isLiveDevice(d));
