import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { BACKEND_BASE_URL } from '../config';

export default function ReturnScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [reason, setReason] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Camera permission chahiye'); return; }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  const submit = async () => {
    if (!reason.trim()) { Alert.alert('Reason likhna zaroori hai'); return; }
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat, lng;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      const res = await axios.post(`${BACKEND_BASE_URL}/api/return/create`, {
        orderId, reason, photoUrl: photo ?? null, lat, lng,
      });
      if (res.data.success) {
        Alert.alert('Return Ho Gaya!', 'Return request submit ho gayi.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Return submit nahi hua');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Return Request</Text>
      <Text style={styles.sub}>Order #{orderId} ke liye</Text>

      <Text style={styles.label}>Wapsi ki wajah *</Text>
      <TextInput
        style={styles.textArea} placeholder="Kya problem hai?" value={reason}
        onChangeText={setReason} multiline numberOfLines={4}
      />

      <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
        {photo
          ? <Image source={{ uri: photo }} style={styles.photo} />
          : <Text style={styles.photoBtnText}>📷 Photo lo (Optional)</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Return Submit Karo</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f5f6fa' },
  title: { fontSize: 24, fontWeight: '700', color: '#e53935', marginBottom: 4 },
  sub: { fontSize: 13, color: '#888', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6 },
  textArea: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12,
    backgroundColor: '#fff', minHeight: 100, textAlignVertical: 'top', marginBottom: 16,
  },
  photoBtn: {
    height: 140, borderRadius: 10, backgroundColor: '#fff', borderWidth: 2,
    borderColor: '#ddd', borderStyle: 'dashed', alignItems: 'center',
    justifyContent: 'center', marginBottom: 20, overflow: 'hidden',
  },
  photo: { width: '100%', height: 140 },
  photoBtnText: { color: '#888', fontSize: 15 },
  submitBtn: {
    backgroundColor: '#e53935', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
