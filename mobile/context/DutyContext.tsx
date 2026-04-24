import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { BACKEND_BASE_URL } from '../config';

type DutyState = 'idle' | 'active';

export type AttendanceRecord = {
  id: number;
  timeIn: string;
  timeOut: string | null;
  lat: number | null;
  lng: number | null;
};

type DutyContextType = {
  state: DutyState;
  checkInTime: string;
  gpsActive: boolean;
  loading: boolean;
  currentLat: number | null;
  currentLng: number | null;
  todayRecords: AttendanceRecord[];
  markAttendance: () => Promise<void>;
  endDuty: () => Promise<void>;
};

const DutyContext = createContext<DutyContextType>({} as DutyContextType);

export function DutyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<DutyState>('idle');
  const [checkInTime, setCheckInTime] = useState('');
  const [gpsActive, setGpsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const trackingInterval = useRef<any>(null);

  useEffect(() => {
    if (user) checkTodayStatus();
    return () => clearInterval(trackingInterval.current);
  }, [user]);

  const checkTodayStatus = async () => {
    try {
      const res = await axios.get(`${BACKEND_BASE_URL}/api/attendance/today?userId=${user!.id}`);
      setTodayRecords(res.data.records ?? []);
      const active = res.data.active;
      if (active) {
        setCheckInTime(fmt(active.timeIn));
        setState('active');
        startGpsTracking();
      } else {
        setState('idle');
      }
    } catch { }
  };

  const startGpsTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    clearInterval(trackingInterval.current);
    setGpsActive(true);
    trackingInterval.current = setInterval(async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        await axios.post(`${BACKEND_BASE_URL}/api/gps/track`, {
          userId: user!.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy,
        });
      } catch { }
    }, 15000);
  };

  const markAttendance = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('permission');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLat(pos.coords.latitude);
      setCurrentLng(pos.coords.longitude);
      await axios.post(`${BACKEND_BASE_URL}/api/attendance/mark`, {
        userId: user!.id,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      const now = new Date().toISOString();
      setCheckInTime(fmt(now));
      setState('active');
      // Refresh records list
      const res = await axios.get(`${BACKEND_BASE_URL}/api/attendance/today?userId=${user!.id}`);
      setTodayRecords(res.data.records ?? []);
      startGpsTracking();
    } finally {
      setLoading(false);
    }
  };

  const endDuty = async () => {
    setLoading(true);
    try {
      await axios.post(`${BACKEND_BASE_URL}/api/attendance/checkout`, { userId: user!.id });
      clearInterval(trackingInterval.current);
      setGpsActive(false);
      setState('idle'); // reset so they can check in again
      setCheckInTime('');
      // Refresh records list
      const res = await axios.get(`${BACKEND_BASE_URL}/api/attendance/today?userId=${user!.id}`);
      setTodayRecords(res.data.records ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DutyContext.Provider value={{ state, checkInTime, gpsActive, loading, currentLat, currentLng, todayRecords, markAttendance, endDuty }}>
      {children}
    </DutyContext.Provider>
  );
}

export const useDuty = () => useContext(DutyContext);

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
