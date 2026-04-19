import * as TaskManager from 'expo-task-manager';
import axios from 'axios';
import { checkGeoFence } from '../geofence';
import { BACKEND_BASE_URL } from '../config';

export const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';

// mutable list filled by App.tsx before tracking starts
export const officeList: any[] = [];

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) { console.error('Location task error:', error); return; }
  if (!data) return;

  const { locations } = data as any;
  for (const loc of locations) {
    const { latitude, longitude, accuracy, speed } = loc.coords;

    // geofence check against all offices
    for (const office of officeList) {
      await checkGeoFence(latitude, longitude, office, 1).catch(() => {});
    }

    // send GPS to backend
    await axios.post(`${BACKEND_BASE_URL}/api/gps/track`, {
      userId: 1, lat: latitude, lng: longitude,
      accuracy, speed, timestamp: loc.timestamp,
    }).catch(e => console.warn('GPS upload failed:', e.message));
  }
});
