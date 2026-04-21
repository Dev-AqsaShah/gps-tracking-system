import * as TaskManager from 'expo-task-manager';
import axios from 'axios';
import { checkGeoFence } from '../geofence';
import { BACKEND_BASE_URL } from '../config';

export const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';

// mutable list filled by App.tsx before tracking starts
export const officeList: any[] = [];
export let currentUserId: number | null = null;
export const setCurrentUserId = (id: number) => { currentUserId = id; };

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) { console.error('Location task error:', error); return; }
  if (!data || !currentUserId) return;

  const { locations } = data as any;
  for (const loc of locations) {
    const { latitude, longitude, accuracy, speed } = loc.coords;

    await axios.post(`${BACKEND_BASE_URL}/api/gps/track`, {
      userId: currentUserId,
      lat: latitude, lng: longitude,
      accuracy, speed,
      timestamp: new Date(loc.timestamp).toISOString(),
    }).catch(e => console.warn('GPS upload failed:', e.message));
  }
});
