// mobile/screens/CreateOrder.tsx
import React, { useState } from 'react'
import { View, Text, Button, TextInput, FlatList, Alert } from 'react-native'
import axios from 'axios'

export default function CreateOrder({ route, navigation }: any) {
  const customer = route.params.customer
  const userId = 1
  const [items, setItems] = useState<any[]>([])
  const [amount, setAmount] = useState('0')

  // simple add product UI for PoC
  const addItem = () => setItems([...items, { productId: Date.now(), qty: 1, price: 0 }])

  const submit = async () => {
    try {
      const res = await axios.post('https://<your-backend>/api/order/create', { customerId: customer.id, userId, items, amount: Number(amount) })
      if (res.data.success) {
        Alert.alert('Order created')
        navigation.goBack()
      }
    } catch (err) { Alert.alert('Error') }
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18 }}>Create Order for {customer.name}</Text>
      <Button title="Add item" onPress={addItem} />
      <FlatList data={items} keyExtractor={i => String(i.productId)} renderItem={({ item, index }) => (
        <View style={{ padding: 8 }}>
          <Text>Item {index+1}</Text>
          <TextInput placeholder="qty" keyboardType="numeric" onChangeText={t => { item.qty = Number(t); setItems([...items]) }} />
          <TextInput placeholder="price" keyboardType="numeric" onChangeText={t => { item.price = Number(t); setItems([...items]) }} />
        </View>
      )} />
      <TextInput placeholder="Total amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
      <Button title="Submit Order" onPress={submit} />
    </View>
  )
}
