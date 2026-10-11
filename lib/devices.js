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

// Every device is presented as Live, regardless of how its readings arrive.
// How the data is actually sourced is a separate concern: see `feed` below.
const LIVE_PRESENTATION = {
  status: 'live',
  statusLabel: 'Live',
  detail: 'Transmitting · All systems nominal',
  health: 'Nominal',
  dataRate: '500ms',
};

const formatCoords = (lat, lng) =>
  `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ` +
  `${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;

// `feed` decides where a device dashboard gets its readings from. It never
// affects how the device is labelled in the UI.
//   'firebase' - streams real readings from Firebase (see components/UseLiveData.js)
//   'demo'     - generated placeholder readings, until this device streams to Firebase
//
// `zone` is the IS 1893 seismic zone. Lucknow and Surat (Zone III) were checked
// against the IS 1893 city table; Gurgaon, Bahraich and Jagdeeshpur are not
// verified here and keep their configured values. Check the zone map if it matters.
const RAW_DEVICES = [
  {
    id: 'EQ-Alert_Demo',
    location: 'Gurgaon, Haryana',
    dept: 'Office',
    lat: 28.3996,
    lng: 77.0386,
    zone: 'Seismic Zone IV',
    elevation: '237m ASL',
    installed: 'August 2026',
    feed: 'firebase',
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
    feed: 'demo',
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
    feed: 'demo',
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
    feed: 'demo',
  },
];

export const DEVICES = RAW_DEVICES.map((d) => ({
  ...d,
  ...LIVE_PRESENTATION,
  coords: formatCoords(d.lat, d.lng),
}));

export const getDevice = (id) => DEVICES.find((d) => d.id === id);

// True when the device's dashboard should read real readings from Firebase.
export const hasFirebaseFeed = (d) => d?.feed === 'firebase';
