'use client';
import { useEffect, useState, useRef } from 'react';

type GpsLog = { id: number; userId: number; lat: number; lng: number; speed: number | null; timestamp: string; userName: string; userUsername: string };
type LastPosition = { userId: number; lat: number; lng: number; timestamp: string; userName: string; userUsername: string };
type Customer = { id: number; name: string; area: string; lat: number; lng: number };
type Office = { id: number; name: string; lat: number; lng: number; radius: number };
type Visit = { id: number; timeIn: string; timeOut: string | null; customer: { name: string; lat: number; lng: number } };
type User = { id: number; name: string; username: string; companyName: string | null };

const SALESMAN_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function MapPage() {
  const mapRef = useRef<any>(null);
  const [data, setData] = useState<{ gpsLogs: GpsLog[]; lastPositions: LastPosition[]; customers: Customer[]; offices: Office[]; visits: Visit[]; users: User[] } | null>(null);
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
        const centerLat = data.gpsLogs[0]?.lat ?? data.offices[0]?.lat ?? 31.5204;
        const centerLng = data.gpsLogs[0]?.lng ?? data.offices[0]?.lng ?? 74.3587;

        const map = L.map(mapRef.current).setView([centerLat, centerLng], 13);
        (mapRef.current as any)._mapInstance = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Group GPS logs by userId and draw each salesman's route in their color
        const userColorMap: Record<number, string> = {};
        const userIds = [...new Set(data.gpsLogs.map(g => g.userId))];
        userIds.forEach((uid, i) => {
          userColorMap[uid] = SALESMAN_COLORS[i % SALESMAN_COLORS.length];
        });

        // Draw polyline per user
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

          // Small GPS dots for this user's trail
          logs.forEach((log, i) => {
            const isLast = i === logs.length - 1;
            const circle = L.circleMarker([log.lat, log.lng], {
              radius: isLast ? 0 : 4,
              fillColor: color,
              color: '#fff',
              weight: 1,
              opacity: 1,
              fillOpacity: 0.7,
            }).addTo(map);
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            if (!isLast) circle.bindPopup(`<div style="font-family:sans-serif"><b>${log.userName}</b><br/><small>${time}</small></div>`);
          });
        }

        // Last position per salesman — large named marker
        data.lastPositions.forEach((pos, i) => {
          const color = userColorMap[pos.userId] ?? SALESMAN_COLORS[i % SALESMAN_COLORS.length];
          const initials = pos.userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
          const salesmanIcon = L.divIcon({
            html: `<div style="background:${color};color:white;border-radius:50% 50% 50% 0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);transform:rotate(-45deg)">
              <span style="transform:rotate(45deg)">${initials}</span>
            </div>
            <div style="background:${color};color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;white-space:nowrap;text-align:center;margin-top:4px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${pos.userName}</div>`,
            className: '',
            iconSize: [80, 56],
            iconAnchor: [40, 56],
          });
          L.marker([pos.lat, pos.lng], { icon: salesmanIcon }).addTo(map)
            .bindPopup(`
              <div style="font-family:sans-serif;min-width:180px">
                <div style="font-size:15px;font-weight:700;color:${color};margin-bottom:4px">${pos.userName}</div>
                <div style="font-size:12px;color:#64748B">@${pos.userUsername}</div>
                <div style="font-size:12px;margin-top:6px;color:#374151">
                  📍 ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}
                </div>
                <div style="font-size:12px;color:#64748B">
                  Last seen: ${new Date(pos.timestamp).toLocaleTimeString()}
                </div>
              </div>
            `);
        });

        // Customer markers
        const customerIcon = L.divIcon({
          html: `<div style="background:#16A34A;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🏪</div>`,
          className: '', iconSize: [32, 32], iconAnchor: [16, 16],
        });
        data.customers.forEach(c => {
          L.marker([c.lat, c.lng], { icon: customerIcon }).addTo(map)
            .bindPopup(`<div style="font-family:sans-serif"><b>${c.name}</b><br/><small>${c.area ?? ''}</small></div>`);
          L.circle([c.lat, c.lng], { radius: 200, color: '#16A34A', fillColor: '#16A34A', fillOpacity: 0.06, weight: 1, dashArray: '4' }).addTo(map);
        });

        // Office markers
        data.offices.forEach(o => {
          const officeIcon = L.divIcon({
            html: `<div style="background:#7C3AED;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🏢</div>`,
            className: '', iconSize: [36, 36], iconAnchor: [18, 18],
          });
          L.marker([o.lat, o.lng], { icon: officeIcon }).addTo(map)
            .bindPopup(`<div style="font-family:sans-serif"><b>${o.name}</b><br/><small>Geofence radius: ${o.radius}m</small></div>`);
          L.circle([o.lat, o.lng], { radius: o.radius, color: '#7C3AED', fillColor: '#7C3AED', fillOpacity: 0.1, weight: 2 }).addTo(map);
        });

        const allCoords: [number, number][] = [
          ...data.gpsLogs.map(g => [g.lat, g.lng] as [number, number]),
          ...data.customers.map(c => [c.lat, c.lng] as [number, number]),
          ...data.offices.map(o => [o.lat, o.lng] as [number, number]),
        ];
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
          <Stat icon="🏪" label="Customers" value={data.customers.length} color="#10B981" />
          <Stat icon="🏢" label="Offices" value={data.offices.length} color="#8B5CF6" />
          {/* Salesman color legend */}
          {data.lastPositions.map((pos, i) => (
            <div key={pos.userId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: SALESMAN_COLORS[i % SALESMAN_COLORS.length] }} />
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{pos.userName}</span>
            </div>
          ))}
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
        {!loading && data?.gpsLogs.length === 0 && data?.customers.length === 0 && (
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
        <span style={{ fontSize: 13, color: '#94A3B8' }}>🏪 Customer (200m zone)</span>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>🏢 Office (geofence)</span>
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
