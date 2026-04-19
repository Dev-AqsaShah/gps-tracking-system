import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import { haversineDistance } from '../geofence';
import { BACKEND_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { colors, shadow } from '../theme';

type Customer = { id: number; name: string; area: string; lat: number; lng: number };

export default function VisitList({ navigation }: any) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    await getLocation();
    await fetchCustomers();
    setLoading(false);
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation(pos.coords);
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BACKEND_BASE_URL}/api/customer/list`);
      setCustomers(res.data.customers ?? []);
    } catch { Alert.alert('Error', 'Could not load customers.'); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getLocation();
    await fetchCustomers();
    setRefreshing(false);
  }, []);

  const getDist = (c: Customer) =>
    location ? Math.round(haversineDistance(location.latitude, location.longitude, c.lat, c.lng)) : null;

  const sorted = [...customers].sort((a, b) => (getDist(a) ?? 99999) - (getDist(b) ?? 99999));

  const checkIn = async (customer: Customer) => {
    const dist = getDist(customer);
    if (dist === null) { Alert.alert('No Location', 'Enable location services first.'); return; }
    if (dist > 200) { Alert.alert('Out of Range', `You are ${dist}m from ${customer.name}.\nGet within 200m to check in.`); return; }
    setCheckingIn(customer.id);
    try {
      const res = await axios.post(`${BACKEND_BASE_URL}/api/visit/check-in`, {
        userId: user!.id, customerId: customer.id, lat: location!.latitude, lng: location!.longitude,
      });
      if (res.data.success) navigation.navigate('CustomerDetail', { customer, visitId: res.data.visit.id });
    } catch { Alert.alert('Error', 'Check-in failed.'); }
    finally { setCheckingIn(null); }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Fetching route...</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>TODAY'S ROUTE</Text>
          <Text style={styles.heading}>{customers.length} Customers</Text>
        </View>
        {location && (
          <View style={styles.gpsLive}>
            <View style={styles.gpsDot} />
            <Text style={styles.gpsText}>GPS Active</Text>
          </View>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No customers assigned</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const dist = getDist(item);
          const isNear = dist !== null && dist <= 200;
          return (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.indexBadge, isNear && styles.indexBadgeNear]}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerArea}>{item.area}</Text>
                <View style={styles.cardMeta}>
                  <View style={[styles.distBadge, isNear ? styles.distNear : styles.distFar]}>
                    <View style={[styles.distDot, { backgroundColor: isNear ? colors.success : colors.warning }]} />
                    <Text style={[styles.distText, { color: isNear ? colors.success : colors.warning }]}>
                      {dist !== null ? (isNear ? 'In range' : `${dist}m`) : 'Locating...'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, isNear ? styles.actionBtnActive : styles.actionBtnIdle]}
                onPress={() => checkIn(item)}
                disabled={checkingIn === item.id}
              >
                {checkingIn === item.id
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.actionText}>{isNear ? 'Check\nIn' : 'Far'}</Text>}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loadingText: { color: colors.textSub, marginTop: 12, fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 14, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLabel: { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  gpsLive: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.successGlow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.success },
  gpsDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  gpsText: { fontSize: 12, color: colors.success, fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, ...shadow },
  cardLeft: { alignItems: 'center' },
  indexBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgCard2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  indexBadgeNear: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  indexText: { fontSize: 15, fontWeight: '800', color: colors.textSub },
  cardBody: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  customerArea: { fontSize: 13, color: colors.textSub, marginBottom: 6 },
  cardMeta: { flexDirection: 'row' },
  distBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  distNear: { backgroundColor: colors.successGlow },
  distFar: { backgroundColor: colors.warningGlow },
  distDot: { width: 6, height: 6, borderRadius: 3 },
  distText: { fontSize: 12, fontWeight: '700' },
  actionBtn: { width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionBtnActive: { backgroundColor: colors.primary },
  actionBtnIdle: { backgroundColor: colors.bgCard2, borderWidth: 1, borderColor: colors.border },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: colors.textSub },
});
