// mobile/screens/DayClose.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, Button, TextInput, Alert } from 'react-native'
import axios from 'axios'

export default function DayClose() {
  const userId = 1
  const [orders, setOrders] = useState('0')
  const [returnsNum, setReturnsNum] = useState('0')
  const [visits, setVisits] = useState('0')

  const submit = async () => {
    const res = await axios.post('https://<your-backend>/api/day/close', {
      userId, totalOrders: Number(orders), totalReturns: Number(returnsNum), totalVisits: Number(visits)
    })
    if (res.data.success) Alert.alert('Day Closed')
  }

  return (
    <View style={{ padding: 16 }}>
      <Text>Day Closing</Text>
      <TextInput value={orders} onChangeText={setOrders} keyboardType="numeric" />
      <TextInput value={returnsNum} onChangeText={setReturnsNum} keyboardType="numeric" />
      <TextInput value={visits} onChangeText={setVisits} keyboardType="numeric" />
      <Button title="Close Day" onPress={submit} />
    </View>
  )
}
