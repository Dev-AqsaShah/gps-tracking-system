'use client';
import { useEffect, useState, useRef } from 'react';

type GpsLog = { id: number; userId: number; lat: number; lng: number; speed: number | null; timestamp: string; userName: string };
type LastPosition = { userId: number; lat: number; lng: number; timestamp: string; userName: string; userEmail: string; distanceKm: string; totalPoints: number };
type User = { id: number; name: string; email: string };

const SALESMAN_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function MapPage() {
  const mapRef = useRef<any>(null);
  const [data, setData] = useState<{ gpsLogs: GpsLog[]; lastPositions: LastPosition[]; users: User[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/mapdata');
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data || typeof window === 'undefined') return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapRef.current && !(mapRef.current as any)._leaflet_id) {
        const centerLat = data.gpsLogs[0]?.lat ?? 31.5204;
        const centerLng = data.gpsLogs[0]?.lng ?? 74.3587;

        const map = L.map(mapRef.current).setView([centerLat, centerLng], 13);
        (mapRef.current as any)._mapInstance = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Build color map per user
        const userColorMap: Record<number, string> = {};
        const userIds = [...new Set(data.gpsLogs.map(g => g.userId))];
        userIds.forEach((uid, i) => { userColorMap[uid] = SALESMAN_COLORS[i % SALESMAN_COLORS.length]; });

        // Group GPS logs by userId and draw routes
        const logsByUser: Record<number, GpsLog[]> = {};
        for (const log of data.gpsLogs) {
          if (!logsByUser[log.userId]) logsByUser[log.userId] = [];
          logsByUser[log.userId].push(log);
        }

        for (const [uidStr, logs] of Object.entries(logsByUser)) {
          const uid = Number(uidStr);
          const color = userColorMap[uid];
          if (logs.length > 1) {
            const coords = logs.map(g => [g.lat, g.lng] as [number, number]);
            L.polyline(coords, { color, weight: 3, opacity: 0.75 }).addTo(map);
          }

          // GPS trail dots
          logs.forEach((log, i) => {
            const isLast = i === logs.length - 1;
            if (!isLast) {
              const circle = L.circleMarker([log.lat, log.lng], {
                radius: 4, fillColor: color, color: '#fff', weight: 1, opacity: 1, fillOpacity: 0.7,
              }).addTo(map);
              const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              circle.bindPopup(`<div style="font-family:sans-serif"><b>${log.userName}</b><br/><small>${time}</small></div>`);
            }
          });
        }

        // Last position markers with name + distance
        data.lastPositions.forEach((pos, i) => {
          const color = userColorMap[pos.userId] ?? SALESMAN_COLORS[i % SALESMAN_COLORS.length];
          const initials = pos.userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
          const distKm = parseFloat(pos.distanceKm);
          const distLabel = distKm < 1 ? `${(distKm * 1000).toFixed(0)}m` : `${distKm.toFixed(2)}km`;

          const salesmanIcon = L.divIcon({
            html: `<div style="text-align:center">
              <div style="background:${color};color:white;border-radius:50% 50% 50% 0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);transform:rotate(-45deg);margin:0 auto">
                <span style="transform:rotate(45deg)">${initials}</span>
              </div>
              <div style="background:${color};color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;white-space:nowrap;text-align:center;margin-top:4px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${pos.userName}</div>
            </div>`,
            className: '',
            iconSize: [80, 60],
            iconAnchor: [40, 60],
          });

          L.marker([pos.lat, pos.lng], { icon: salesmanIcon }).addTo(map)
            .bindPopup(`
              <div style="font-family:sans-serif;min-width:190px">
                <div style="font-size:15px;font-weight:700;color:${color};margin-bottom:4px">${pos.userName}</div>
                <div style="font-size:12px;color:#64748B;margin-bottom:6px">${pos.userEmail}</div>
                <div style="font-size:13px;color:#374151;margin-bottom:2px">📍 ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}</div>
                <div style="font-size:13px;color:#374151;margin-bottom:2px">🛣️ Distance: <b>${distLabel}</b></div>
                <div style="font-size:12px;color:#64748B">GPS points: ${pos.totalPoints}</div>
                <div style="font-size:12px;color:#64748B">Last seen: ${new Date(pos.timestamp).toLocaleTimeString()}</div>
              </div>
            `);
        });

        const allCoords: [number, number][] = data.gpsLogs.map(g => [g.lat, g.lng]);
        if (allCoords.length > 0) {
          map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });
        }
      }
    };

    initMap();
  }, [data]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', background: '#0A0F1E' }}>
      {/* Header */}
      <div style={{ background: '#111827', borderBottom: '1px solid #1E293B', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <a href="/" style={{ color: '#3B82F6', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← Admin Panel</a>
          <h1 style={{ margin: '4px 0 0', color: '#F1F5F9', fontSize: 20, fontWeight: 800 }}>📍 Live GPS Tracking Map</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#64748B', fontSize: 13 }}>Auto-refresh: 15s • Last: {lastUpdate}</span>
          <button onClick={fetchData} style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {data && (
        <div style={{ background: '#0F172A', borderBottom: '1px solid #1E293B', padding: '10px 24px', display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <Stat icon="👥" label="Active Salesmen" value={data.lastPositions.length} color="#3B82F6" />
          <Stat icon="📍" label="GPS Points" value={data.gpsLogs.length} color="#60A5FA" />
          {/* Per-salesman distance + color legend */}
          {data.lastPositions.map((pos, i) => {
            const color = SALESMAN_COLORS[i % SALESMAN_COLORS.length];
            const distKm = parseFloat(pos.distanceKm);
            const distLabel = distKm < 1 ? `${(distKm * 1000).toFixed(0)}m` : `${distKm.toFixed(2)}km`;
            return (
              <div key={pos.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1E293B', borderRadius: 10, padding: '6px 12px', border: `1px solid ${color}33` }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#F1F5F9', fontWeight: 700 }}>{pos.userName}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>🛣️ {distLabel} • {pos.totalPoints} pts</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0F1E', zIndex: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
              <div style={{ color: '#3B82F6', fontWeight: 600 }}>Loading map...</div>
            </div>
          </div>
        )}
        {!loading && data?.gpsLogs.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A0F1E', zIndex: 10, color: '#94A3B8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>No tracking data yet</div>
            <div style={{ fontSize: 14 }}>Salesmen will appear here once they check in via the mobile app</div>
          </div>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Legend */}
      <div style={{ background: '#111827', borderTop: '1px solid #1E293B', padding: '10px 24px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>LEGEND:</span>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>📍 Salesman (named pin)</span>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>— Route trail</span>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>● GPS point (tap for time)</span>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>🛣️ Distance traveled today</span>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: any) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#64748B' }}>{icon} {label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
