// mobile/screens/AttendanceScreen.tsx
import React, { useState } from 'react'
import { View, Text, Button, Alert, Image } from 'react-native'
import Geolocation from 'react-native-geolocation-service'
import axios from 'axios'
import * as ImagePicker from 'expo-image-picker'

export default function AttendanceScreen() {
  const [location, setLocation] = useState<{lat:number,lng:number}|null>(null)
  const [photoUri, setPhotoUri] = useState<string|null>(null)
  const userId = 1 // replace with auth user id

  const getLocationAndMark = async () => {
    try {
      const hasPermission = true // handle permissions properly in real app
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          submitAttendance(latitude, longitude)
        },
        error => {
          Alert.alert('Location error', error.message)
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      )
    } catch (e) {
      console.error(e)
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!result.canceled) setPhotoUri(result.assets[0].uri)
  }

  const submitAttendance = async (lat:number, lng:number) => {
    try {
      // if you want to upload photo, upload to storage first and get URL. For PoC we send null.
      const res = await axios.post('http://10.0.2.2:3000/api/attendance/mark', {
        userId,
        lat,
        lng,
        photoUrl: photoUri ?? null
      })
      if (res.data.success) Alert.alert('Attendance marked')
    } catch (err:any) {
      console.error(err)
      Alert.alert('Error', err?.message || 'Network error')
    }
  }

  return (
    <View style={{ padding:20 }}>
      <Text style={{ fontSize:18, marginBottom:10 }}>Mark Attendance</Text>
      {photoUri ? <Image source={{ uri: photoUri }} style={{ width:120, height:120 }} /> : null}
      <Button title="Take Photo (optional)" onPress={pickImage} />
      <View style={{ height:10 }} />
      <Button title="Mark Attendance (GPS)" onPress={getLocationAndMark} />
      {location && <Text>Last lat: {location.lat.toFixed(6)} lng: {location.lng.toFixed(6)}</Text>}
    </View>
  )
}
