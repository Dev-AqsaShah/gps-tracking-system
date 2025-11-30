// mobile/geofence.ts
import axios from 'axios';
import * as Location from 'expo-location';

/**
 * Replace with your backend base URL.
 * - For Android emulator: use http://10.0.2.2:3000
 * - For iOS simulator: http://localhost:3000
 * - For real device on same Wi-Fi: http://192.168.x.y:3000
 */
const BACKEND = '<YOUR_BACKEND_URL>'; // <-- REPLACE THIS

// Haversine formula returns distance in meters
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000; // Earth radius (meters)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// keep track of which office we're currently "inside"
let insideOfficeId: number | null = null;

/**
 * Starts background location updates (uses same task name as App.tsx)
 * If you already start locations from App.tsx you can ignore these helpers.
 */
export async function startBackgroundLocation() {
  try {
    await Location.startLocationUpdatesAsync('BACKGROUND_LOCATION_TASK', {
      accuracy: Location.Accuracy.Highest,
      distanceInterval: 10,
      deferredUpdatesInterval: 60000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'GPS Tracking Active',
        notificationBody: 'We are tracking your location in background',
      },
    });
    console.log('Background location started (from geofence helper).');
  } catch (e) {
    console.warn('startBackgroundLocation failed', e);
  }
}

export async function stopBackgroundLocation() {
  try {
    await Location.stopLocationUpdatesAsync('BACKGROUND_LOCATION_TASK');
    console.log('Background location stopped (from geofence helper).');
  } catch (e) {
    console.warn('stopBackgroundLocation failed', e);
  }
}

/**
 * Check single office geofence and post enter/exit events to backend.
 * - currentLat/currentLng: current device coordinates
 * - office: { id, name, lat, lng, radius }
 * - userId: logged-in user id
 */
export async function checkGeoFence(
  currentLat: number,
  currentLng: number,
  office: { id: number; name?: string; lat: number; lng: number; radius: number },
  userId: number
) {
  try {
    const dist = haversineDistance(currentLat, currentLng, office.lat, office.lng);

    // ENTER
    if (dist <= office.radius && insideOfficeId !== office.id) {
      insideOfficeId = office.id;
      console.log(`Entered office: ${office.name ?? office.id} (dist=${Math.round(dist)}m)`);

      // stop background tracking because user is inside office
      await stopBackgroundLocation();

      // notify backend
      await axios.post(`${BACKEND}/api/geofence/event`, {
        userId,
        event: 'enter_office',
        officeId: office.id,
        lat: currentLat,
        lng: currentLng,
      });
    }

    // EXIT
    else if (dist > office.radius && insideOfficeId === office.id) {
      console.log(`Exited office: ${office.name ?? office.id} (dist=${Math.round(dist)}m)`);
      insideOfficeId = null;

      // start background tracking because user left office
      await startBackgroundLocation();

      // notify backend
      await axios.post(`${BACKEND}/api/geofence/event`, {
        userId,
        event: 'exit_office',
        officeId: office.id,
        lat: currentLat,
        lng: currentLng,
      });
    }
  } catch (err) {
    console.warn('checkGeoFence error', err);
  }
}
