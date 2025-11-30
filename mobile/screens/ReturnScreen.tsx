// mobile/screens/ReturnScreen.tsx
import React, { useState } from 'react'
import { View, Text, TextInput, Button, Alert } from 'react-native'
import axios from 'axios'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'

export default function ReturnScreen({ route }: any) {
  const { orderId } = route.params
  const [reason, setReason] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)

  const pickPhoto = async () => {
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!r.canceled) setPhoto(r.assets[0].uri)
  }

  const submit = async () => {
    const loc = await Location.getCurrentPositionAsync({})
    // For PoC, we send photo as null (upload logic needed for storage)
    const res = await axios.post('https://<your-backend>/api/return/create', {
      orderId, reason, photoUrl: photo ?? null, lat: loc.coords.latitude, lng: loc.coords.longitude
    })
    if (res.data.success) Alert.alert('Return requested')
  }

  return (
    <View style={{ padding: 16 }}>
      <Text>Return for Order #{orderId}</Text>
      <TextInput placeholder="Reason" value={reason} onChangeText={setReason} />
      <Button title="Take Photo (optional)" onPress={pickPhoto} />
      <Button title="Submit Return" onPress={submit} />
    </View>
  )
}
