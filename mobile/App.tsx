// App.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import axios from 'axios';
import { checkGeoFence } from './geofence';

// ====== CONFIG: point this to your backend (PC IP or ngrok) ======
const BACKEND_BASE_URL = 'http://localhost:3000';
const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';
const userId = 1; // replace with logged-in user id

let officeList: any[] = [];

// Background Task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    for (let loc of locations) {
      const { latitude: currentLat, longitude: currentLng, accuracy, speed, timestamp } = loc.coords;
      try {
        for (let office of officeList) {
          await checkGeoFence(currentLat, currentLng, office, userId);
        }
      } catch (gErr) {
        console.warn('geofence check error:', (gErr as any).message ?? gErr);
      }

      try {
        await axios.post(`${BACKEND_BASE_URL}/api/gps/track`, {
          userId,
          lat: currentLat,
          lng: currentLng,
          accuracy,
          speed,
          timestamp,
        });
      } catch (err: any) {
        console.warn('GPS upload failed:', err?.message ?? err);
      }
    }
  }
});

export default function App() {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [offices, setOffices] = useState<any[]>([]);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await axios.get(`${BACKEND_BASE_URL}/api/office`);
        const list = res.data?.offices ?? res.data ?? [];
        setOffices(list);
        officeList = list;
      } catch (err: any) {
        console.warn('Failed to fetch offices:', err?.message ?? err);
      }
    };
    fetchOffices();
  }, []);

  useEffect(() => {
    (async () => {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (fgStatus !== 'granted' || bgStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Foreground and background location permissions are required.');
        return;
      }
      setHasLocationPermission(true);
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 10,
          deferredUpdatesInterval: 60000,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'GPS Tracking Active',
            notificationBody: 'We are tracking your location in background',
            notificationColor: '#1e90ff',
          },
        });
      } catch (err: any) {
        console.warn('startLocationUpdatesAsync failed:', err?.message ?? err);
      }
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 GPS Tracking System</Text>
        <Text style={styles.subtitle}>
          {hasLocationPermission ? 'Permissions granted — Tracking active' : '⚠️ Permissions required'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend Info</Text>
        <Text style={styles.cardText}>{BACKEND_BASE_URL}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Offices Loaded</Text>
        <Text style={styles.cardText}>{offices.length}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notes</Text>
        <Text style={styles.cardText}>
          ⚠️ Expo Go on Android does NOT support background location. Use a dev build or emulator for background tracking.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e90ff',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#1e90ff',
  },
  cardText: {
    fontSize: 14,
    color: '#555',
  },
});



// // App.tsx
// import React, { useEffect, useState } from 'react';
// import { StyleSheet, Text, View, Alert } from 'react-native';
// import * as Location from 'expo-location';
// import * as TaskManager from 'expo-task-manager';
// import axios from 'axios';
// import { checkGeoFence } from './geofence';

// // ====== CONFIG: point this to your backend (PC IP or ngrok) ======
// // You gave: 172.16.172.50  (default backend port 3000)
// const BACKEND_BASE_URL = 'http://172.16.172.50:3000';

// const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';
// const userId = 1; // replace with logged-in user id

// // 🔥 Global office list (will be filled after API fetch)
// let officeList: any[] = [];

// // 1️⃣ Background Task
// TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
//   if (error) {
//     console.error('Background task error:', error);
//     return;
//   }

//   if (data) {
//     const { locations } = data as any;

//     for (let loc of locations) {
//       const currentLat = loc.coords.latitude;
//       const currentLng = loc.coords.longitude;

//       // 2️⃣ Check geofence for all offices (local logic + notify backend inside checkGeoFence)
//       try {
//         for (let office of officeList) {
//           // note: checkGeoFence will itself call backend /api/geofence/event
//           await checkGeoFence(currentLat, currentLng, office, userId);
//         }
//       } catch (gErr) {
//         console.warn('geofence check error:', (gErr as any).message ?? gErr);
//       }

//       // 3️⃣ Send GPS data to backend
//       try {
//         await axios.post(`${BACKEND_BASE_URL}/api/gps/track`, {
//           userId,
//           lat: currentLat,
//           lng: currentLng,
//           accuracy: loc.coords.accuracy,
//           speed: loc.coords.speed,
//           timestamp: loc.timestamp,
//         });
//         console.log('GPS uploaded:', currentLat, currentLng);
//       } catch (err: any) {
//         console.warn('GPS upload failed:', err?.message ?? err);
//       }
//     }
//   }
// });

// export default function App() {
//   const [hasLocationPermission, setHasLocationPermission] = useState(false);
//   const [offices, setOffices] = useState<any[]>([]);

//   // 4️⃣ Fetch Offices from Backend
//   useEffect(() => {
//     const fetchOffices = async () => {
//       try {
//         const res = await axios.get(`${BACKEND_BASE_URL}/api/office`);
//         const list = res.data?.offices ?? res.data ?? [];
//         setOffices(list);
//         officeList = list; // 👈 background task ke liye global copy
//         console.log('Offices loaded:', list.length);
//       } catch (err: any) {
//         console.warn('Failed to fetch offices:', err?.message ?? err);
//       }
//     };
//     fetchOffices();
//   }, []);

//   // 5️⃣ Request Location Permissions + Start Tracking
//   useEffect(() => {
//     (async () => {
//       const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
//       const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

//       if (foregroundStatus !== 'granted' || backgroundStatus !== 'granted') {
//         Alert.alert('Permission Denied', 'Foreground and background location permissions are required.');
//         return;
//       }

//       setHasLocationPermission(true);

//       try {
//         await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
//           accuracy: Location.Accuracy.Highest,
//           distanceInterval: 10,
//           deferredUpdatesInterval: 60000,
//           showsBackgroundLocationIndicator: true,
//           foregroundService: {
//             notificationTitle: 'GPS Tracking Active',
//             notificationBody: 'We are tracking your location in background',
//             notificationColor: '#1e90ff',
//           },
//         });
//         console.log('Background location updates started.');
//       } catch (err: any) {
//         console.warn('startLocationUpdatesAsync failed:', err?.message ?? err);
//       }
//     })();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>GPS Tracking App</Text>
//       <Text>{hasLocationPermission ? 'Permissions granted — Tracking active (if supported)' : 'Permissions required'}</Text>
//       <Text style={{ marginTop: 8 }}>Backend: {BACKEND_BASE_URL}</Text>
//       <Text style={{ marginTop: 12 }}>Total Offices Loaded: {offices.length}</Text>
//       <Text style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
//         Note: Expo Go on Android does NOT support background location. Use a dev build / emulator for background tracking.
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 16,
//   },
//   title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
// });
