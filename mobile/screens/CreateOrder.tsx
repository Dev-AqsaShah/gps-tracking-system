import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  Alert, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { BACKEND_BASE_URL } from '../config';

const userId = 1;

export default function CreateOrder({ route, navigation }: any) {
  const { customer, visitId } = route.params;
  const [items, setItems] = useState<{ id: number; name: string; qty: string; price: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now(), name: '', qty: '1', price: '0' }]);
  };

  const updateItem = (id: number, field: string, value: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.qty) * Number(i.price)), 0);

  const submit = async () => {
    if (items.length === 0) { Alert.alert('Koi item nahi', 'Kam se kam ek item add karo'); return; }
    setLoading(true);
    try {
      const payload = items.map(i => ({ name: i.name, qty: Number(i.qty), price: Number(i.price) }));
      const res = await axios.post(`${BACKEND_BASE_URL}/api/order/create`, {
        customerId: customer.id, userId, items: payload, amount: totalAmount,
      });
      if (res.data.success) {
        Alert.alert('Order Hua!', `Order ID: ${res.data.order.id}`, [
          { text: 'OK', onPress: () => navigation.navigate('VisitList') },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Order submit nahi hua');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Order: {customer.name}</Text>
      <Text style={styles.sub}>{customer.area}</Text>

      {items.map((item, idx) => (
        <View key={item.id} style={styles.itemCard}>
          <Text style={styles.itemLabel}>Item {idx + 1}</Text>
          <TextInput
            style={styles.input} placeholder="Product ka naam" value={item.name}
            onChangeText={t => updateItem(item.id, 'name', t)}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]} placeholder="Qty" value={item.qty}
              keyboardType="numeric" onChangeText={t => updateItem(item.id, 'qty', t)}
            />
            <TextInput
              style={[styles.input, styles.half]} placeholder="Price (Rs)" value={item.price}
              keyboardType="numeric" onChangeText={t => updateItem(item.id, 'price', t)}
            />
          </View>
          <TouchableOpacity onPress={() => removeItem(item.id)}>
            <Text style={styles.remove}>Hatao ✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addItem}>
        <Text style={styles.addBtnText}>+ Item Add Karo</Text>
      </TouchableOpacity>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalAmount}>Rs {totalAmount.toFixed(0)}</Text>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Order Submit Karo</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  title: { fontSize: 22, fontWeight: '700', color: '#1e90ff', padding: 16, paddingBottom: 2 },
  sub: { fontSize: 13, color: '#888', paddingHorizontal: 16, marginBottom: 16 },
  itemCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 12, padding: 14, elevation: 2,
  },
  itemLabel: { fontWeight: '600', color: '#444', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8, backgroundColor: '#fafafa',
  },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  remove: { color: '#e53935', fontSize: 12, textAlign: 'right' },
  addBtn: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 10,
    borderWidth: 2, borderColor: '#1e90ff', borderStyle: 'dashed',
    paddingVertical: 12, alignItems: 'center',
  },
  addBtnText: { color: '#1e90ff', fontWeight: '600' },
  totalBox: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12,
    padding: 16, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16, elevation: 2,
  },
  totalLabel: { fontSize: 16, color: '#444' },
  totalAmount: { fontSize: 22, fontWeight: '700', color: '#1e90ff' },
  submitBtn: {
    marginHorizontal: 16, backgroundColor: '#1e90ff', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
