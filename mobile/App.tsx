import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import axios from 'axios';
import { checkGeoFence } from './geofence';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';
const userId = 1; // replace after login

// 🔥 Global office list (will be filled after API fetch)
let officeList: any[] = [];

// 1️⃣ Background Task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }

  if (data) {
    const { locations } = data as any;

    for (let loc of locations) {
      const currentLat = loc.coords.latitude;
      const currentLng = loc.coords.longitude;

      // 2️⃣ Check geofence for all offices
      for (let office of officeList) {
        await checkGeoFence(currentLat, currentLng, office, userId);
      }

      // 3️⃣ Send GPS data to backend
      try {
        await axios.post('https://<your-backend>/api/gps/track', {
          userId,
          lat: currentLat,
          lng: currentLng,
          accuracy: loc.coords.accuracy,
          speed: loc.coords.speed,
          timestamp: loc.timestamp,
        });
      } catch (err) {
        console.warn('GPS upload failed', err);
      }
    }
  }
});

export default function App() {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [offices, setOffices] = useState<any[]>([]);

  // 4️⃣ Fetch Offices from Backend
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await axios.get('https://<your-backend>/api/office');
        setOffices(res.data.offices);
        officeList = res.data.offices; // 👈 background task ke liye global copy
      } catch (err) {
        console.warn('Failed to fetch offices', err);
      }
    };
    fetchOffices();
  }, []);

  // 5️⃣ Request Location Permissions + Start Tracking
  useEffect(() => {
    (async () => {
      let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (foregroundStatus !== 'granted' || backgroundStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location permissions are required.');
        return;
      }

      setHasLocationPermission(true);

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
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text>GPS Tracking App</Text>
      <Text>{hasLocationPermission ? 'Tracking Active' : 'Permissions Required'}</Text>
      <Text>Total Offices Loaded: {offices.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

