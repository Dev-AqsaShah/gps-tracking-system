// in a separate file: tasks/locationTask.ts
import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import axios from 'axios'

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK'

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error)
    return
  }
  if (data) {
    const { locations } = data as any
    const loc = locations[0]
    // send to backend
    try {
      await axios.post('https://<your-backend>/api/gps/track', {
        userId: 1,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        timestamp: loc.timestamp
      })
    } catch (e) { console.warn(e) }
  }
})

// start background updates
await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
  accuracy: Location.Accuracy.Highest,
  timeInterval: 60000, // ms (60s)
  distanceInterval: 10,
  foregroundService: { notificationTitle: 'Tracking', notificationBody: 'Your route is being recorded' }
})
// stop:
await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
