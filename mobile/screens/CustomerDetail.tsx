import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { BACKEND_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { colors, shadow } from '../theme';

type Item = { id: number; name: string; qty: string; price: string };

export default function CustomerDetail({ route, navigation }: any) {
  const { user } = useAuth();
  const { customer, visitId } = route.params;
  const [tab, setTab] = useState<'order' | 'return'>('order');
  const [items, setItems] = useState<Item[]>([{ id: 1, name: '', qty: '1', price: '0' }]);
  const [returnReason, setReturnReason] = useState('');
  const [returnPhoto, setReturnPhoto] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [returnDone, setReturnDone] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);

  const total = items.reduce((s, i) => s + Number(i.qty) * Number(i.price), 0);
  const updateItem = (id: number, field: keyof Item, val: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  const addItem = () => setItems(prev => [...prev, { id: Date.now(), name: '', qty: '1', price: '0' }]);
  const removeItem = (id: number) => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);

  const submitOrder = async () => {
    if (items.some(i => !i.name.trim())) { Alert.alert('Missing Info', 'Enter product name for all items.'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_BASE_URL}/api/order/create`, {
        customerId: customer.id, userId: user!.id,
        items: items.map(i => ({ name: i.name, qty: Number(i.qty), price: Number(i.price) })),
        amount: total,
      });
      if (res.data.success) { setOrderId(res.data.order.id); setOrderDone(true); }
    } catch { Alert.alert('Error', 'Order submission failed.'); }
    finally { setLoading(false); }
  };

  const submitReturn = async () => {
    if (!orderId) { Alert.alert('No Order', 'Create an order first.'); return; }
    if (!returnReason.trim()) { Alert.alert('Required', 'Enter reason for return.'); return; }
    setLoading(true);
    try {
      await axios.post(`${BACKEND_BASE_URL}/api/return/create`, { orderId, reason: returnReason, photoUrl: null });
      setReturnDone(true);
    } catch { Alert.alert('Error', 'Return submission failed.'); }
    finally { setLoading(false); }
  };

  const checkOut = async () => {
    setLoading(true);
    try {
      await axios.post(`${BACKEND_BASE_URL}/api/visit/check-out`, { visitId });
      setCheckedOut(true);
      setTimeout(() => navigation.navigate('VisitList'), 2000);
    } catch { Alert.alert('Error', 'Check-out failed.'); }
    finally { setLoading(false); }
  };

  if (checkedOut) return (
    <View style={[styles.screen, styles.center]}>
      <View style={styles.successRing}>
        <Text style={styles.successIcon}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Visit Complete</Text>
      <Text style={styles.successSub}>Returning to route...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.custName}>{customer.name}</Text>
          <Text style={styles.custArea}>{customer.area}</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['order', 'return'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'order' ? `📦 Order${orderDone ? ' ✓' : ''}` : `↩️ Return${returnDone ? ' ✓' : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.body}>
        {/* ORDER */}
        {tab === 'order' && (
          orderDone ? (
            <View style={styles.doneCard}>
              <Text style={styles.doneEmoji}>📦</Text>
              <Text style={styles.doneTitle}>Order #{orderId} Submitted</Text>
              <Text style={styles.doneAmount}>Rs {total.toLocaleString()}</Text>
              <Text style={styles.doneNote}>Synced to dashboard</Text>
            </View>
          ) : (
            <>
              {items.map((item, idx) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHead}>
                    <Text style={styles.itemNum}>ITEM {idx + 1}</Text>
                    {items.length > 1 && <TouchableOpacity onPress={() => removeItem(item.id)}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>}
                  </View>
                  <TextInput style={styles.input} placeholder="Product name" placeholderTextColor={colors.textMuted} value={item.name} onChangeText={t => updateItem(item.id, 'name', t)} />
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Qty</Text>
                      <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={item.qty} onChangeText={t => updateItem(item.id, 'qty', t)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Price (Rs)</Text>
                      <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={item.price} onChangeText={t => updateItem(item.id, 'price', t)} />
                    </View>
                  </View>
                  <Text style={styles.subtotal}>Rs {(Number(item.qty) * Number(item.price)).toLocaleString()}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                <Text style={styles.addBtnText}>+ Add Item</Text>
              </TouchableOpacity>
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>Rs {total.toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={submitOrder} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>SUBMIT ORDER</Text>}
              </TouchableOpacity>
            </>
          )
        )}

        {/* RETURN */}
        {tab === 'return' && (
          returnDone ? (
            <View style={[styles.doneCard, { borderColor: colors.warning }]}>
              <Text style={styles.doneEmoji}>↩️</Text>
              <Text style={styles.doneTitle}>Return Submitted</Text>
              <Text style={styles.doneNote}>Pending approval from manager</Text>
            </View>
          ) : (
            <>
              <Text style={styles.fieldLabel}>REASON FOR RETURN</Text>
              <TextInput
                style={styles.textArea} placeholder="Describe the issue with this order..."
                placeholderTextColor={colors.textMuted} value={returnReason}
                onChangeText={setReturnReason} multiline numberOfLines={4}
              />
              <TouchableOpacity style={styles.photoBtn} onPress={async () => {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') return;
                const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
                if (!r.canceled) setReturnPhoto(r.assets[0].uri);
              }}>
                {returnPhoto
                  ? <Image source={{ uri: returnPhoto }} style={styles.photoPreview} />
                  : <View style={styles.photoInner}><Text style={{ fontSize: 28 }}>📷</Text><Text style={styles.photoHint}>Add Photo Evidence</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.warning }]} onPress={submitReturn} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>SUBMIT RETURN</Text>}
              </TouchableOpacity>
            </>
          )
        )}

        {/* Checkout */}
        <View style={styles.divider} />
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.success }]} onPress={checkOut} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>✓  CHECK OUT & FINISH</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: colors.bgCard, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primary },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  custName: { fontSize: 18, fontWeight: '800', color: colors.text },
  custArea: { fontSize: 13, color: colors.textSub },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.dangerGlow, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.danger },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger },
  liveText: { fontSize: 11, color: colors.danger, fontWeight: '800', letterSpacing: 1 },
  tabRow: { flexDirection: 'row', margin: 16, backgroundColor: colors.bgCard, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.bgCard2, borderWidth: 1, borderColor: colors.border },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSub },
  tabTextActive: { color: colors.text },
  body: { paddingHorizontal: 16 },
  itemCard: { backgroundColor: colors.bgCard, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemNum: { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 1 },
  removeText: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  inputLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  input: { backgroundColor: colors.bgCard2, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  subtotal: { fontSize: 13, color: colors.primary, fontWeight: '600', textAlign: 'right' },
  addBtn: { borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  totalCard: { backgroundColor: colors.primaryGlow, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.primary },
  totalLabel: { fontSize: 12, color: colors.primary, fontWeight: '700', letterSpacing: 1 },
  totalValue: { fontSize: 26, fontWeight: '800', color: colors.primary },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', ...shadow, marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  doneCard: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: colors.success, marginBottom: 16 },
  doneEmoji: { fontSize: 40, marginBottom: 10 },
  doneTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  doneAmount: { fontSize: 24, fontWeight: '800', color: colors.success, marginBottom: 4 },
  doneNote: { fontSize: 13, color: colors.textSub },
  fieldLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  textArea: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14, minHeight: 110, textAlignVertical: 'top', marginBottom: 14 },
  photoBtn: { height: 130, borderRadius: 12, backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  photoInner: { alignItems: 'center', gap: 6 },
  photoHint: { color: colors.textSub, fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  successRing: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successIcon: { fontSize: 48, color: '#fff', fontWeight: '700' },
  successTitle: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 8 },
  successSub: { fontSize: 14, color: colors.textSub },
});
