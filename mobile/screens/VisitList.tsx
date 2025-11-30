// mobile/screens/VisitList.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, Button, FlatList, Alert } from 'react-native'
import axios from 'axios'
import * as Location from 'expo-location'
import { haversineDistance } from '../geofence' // reuse geofence file

const userId = 1

export default function VisitList({ navigation }: any) {
  const [customers, setCustomers] = useState<any[]>([])
  const [location, setLocation] = useState<any>(null)

  useEffect(() => {
    fetchCustomers()
    requestLocation()
  }, [])

  const fetchCustomers = async () => {
    const res = await axios.get('https://<your-backend>/api/customer/list')
    setCustomers(res.data.customers)
  }

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission required'); return }
    const pos = await Location.getCurrentPositionAsync({})
    setLocation(pos.coords)
  }

  const sorted = customers.sort((a, b) => {
    if (!location) return 0
    const da = haversineDistance(location.latitude, location.longitude, a.lat, a.lng)
    const db = haversineDistance(location.latitude, location.longitude, b.lat, b.lng)
    return da - db
  })

  const tryAutoCheckIn = async (customer: any) => {
    if (!location) { Alert.alert('Location not available'); return }
    const d = haversineDistance(location.latitude, location.longitude, customer.lat, customer.lng)
    if (d <= 100) {
      // auto check-in
      const res = await axios.post('https://<your-backend>/api/visit/check-in', { userId, customerId: customer.id, lat: location.latitude, lng: location.longitude })
      if (res.data.success) {
        Alert.alert('Checked in', `Visit id ${res.data.visit.id}`)
        navigation.navigate('CreateOrder', { customer })
      }
    } else {
      Alert.alert('Too far', `You are ${Math.round(d)}m away`);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18 }}>Today Visits</Text>
      <FlatList data={sorted} keyExtractor={i => String(i.id)} renderItem={({ item }) => (
        <View style={{ padding: 12, borderBottomWidth: 1 }}>
          <Text style={{ fontWeight: '600' }}>{item.name}</Text>
          <Text>{item.area}</Text>
          <Button title="Go / Check-in" onPress={() => tryAutoCheckIn(item)} />
        </View>
      )} />
    </View>
  )
}
