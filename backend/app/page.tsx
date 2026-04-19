'use client';
import { useEffect, useState } from 'react';

const D = {
  bg: '#0A0F1E', card: '#111827', card2: '#1A2035',
  border: '#1E293B', borderLight: '#243050',
  primary: '#3B82F6', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', purple: '#8B5CF6',
  text: '#F1F5F9', sub: '#94A3B8', muted: '#475569',
};

type Tab = 'attendance' | 'visits' | 'orders' | 'returns' | 'gps';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('attendance');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { loadTab(tab); }, [tab]);

  const loadSummary = async () => {
    try {
      const res = await fetch('/api/admin/summary');
      const j = await res.json();
      setSummary(j);
    } catch { }
  };

  const loadTab = async (t: Tab) => {
    setLoading(true); setData(null);
    try {
      const urls: Record<Tab, string> = {
        attendance: '/api/admin/attendance', visits: '/api/admin/visits',
        orders: '/api/admin/orders', returns: '/api/admin/returns', gps: '/api/admin/gps',
      };
      const res = await fetch(urls[t]);
      setData(await res.json());
      setLastUpdate(new Date().toLocaleTimeString());
    } catch { setData({ error: 'Failed to load' }); }
    finally { setLoading(false); }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'attendance', label: 'Attendance', icon: '📋' },
    { key: 'visits', label: 'Visits', icon: '🗺️' },
    { key: 'orders', label: 'Orders', icon: '📦' },
    { key: 'returns', label: 'Returns', icon: '↩️' },
    { key: 'gps', label: 'GPS Logs', icon: '📍' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: D.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <nav style={{ background: D.card, borderBottom: `1px solid ${D.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: D.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: D.text, letterSpacing: 0.3 }}>TrackForce</div>
            <div style={{ fontSize: 11, color: D.sub, letterSpacing: 1 }}>GPS FIELD MANAGEMENT</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10B98120', border: `1px solid #10B981`, borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, background: D.success, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: D.success, fontWeight: 700 }}>SYSTEM ONLINE</span>
          </div>
          <a href="/map" style={{ background: D.primary, color: '#fff', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            🗺️ Live Map
          </a>
          <button onClick={() => { loadTab(tab); loadSummary(); }} style={{ background: D.card2, border: `1px solid ${D.border}`, color: D.sub, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            🔄 Refresh
          </button>
        </div>
      </nav>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, padding: '24px 24px 0' }}>
          <SummaryCard icon="👥" label="Salesmen" value={summary.users ?? 0} color={D.primary} />
          <SummaryCard icon="🏪" label="Customers" value={summary.customers ?? 0} color={D.success} />
          <SummaryCard icon="📦" label="Total Orders" value={summary.orders ?? 0} color={D.warning} />
          <SummaryCard icon="✅" label="Total Visits" value={summary.visits ?? 0} color={D.purple} />
          <SummaryCard icon="↩️" label="Returns" value={summary.returns ?? 0} color={D.danger} />
          <SummaryCard icon="📍" label="GPS Points" value={summary.gpsLogs ?? 0} color='#06B6D4' />
        </div>
      )}

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, padding: '20px 24px 0', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
            background: tab === t.key ? D.primary : D.card,
            color: tab === t.key ? '#fff' : D.sub,
            border: `1px solid ${tab === t.key ? D.primary : D.border}`,
            transition: 'all 0.15s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: D.muted, alignSelf: 'center', whiteSpace: 'nowrap', paddingRight: 4 }}>
          Updated: {lastUpdate || '—'}
        </span>
      </div>

      {/* Table */}
      <div style={{ padding: '16px 24px 32px', flex: 1 }}>
        <div style={{ background: D.card, borderRadius: 16, border: `1px solid ${D.border}`, overflow: 'hidden' }}>
          {loading && (
            <div style={{ padding: 48, textAlign: 'center', color: D.sub }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>Loading...
            </div>
          )}
          {data?.error && <div style={{ padding: 32, color: D.danger, textAlign: 'center' }}>{data.error}</div>}
          {!loading && data && !data.error && (
            <>
              {tab === 'attendance' && <DataTable cols={['ID', 'User', 'Time In', 'Latitude', 'Longitude', 'Status']}
                rows={data.records ?? []} render={r => [r.id, r.user?.name ?? `User ${r.userId}`, fmt(r.timeIn), r.lat?.toFixed(5) ?? '—', r.lng?.toFixed(5) ?? '—',
                <Badge color={D.success}>{r.status}</Badge>]} />}
              {tab === 'visits' && <DataTable cols={['ID', 'Customer', 'Checked In', 'Checked Out', 'Duration', 'Notes']}
                rows={data.records ?? []} render={r => {
                  const dur = r.timeOut ? Math.round((new Date(r.timeOut).getTime() - new Date(r.timeIn).getTime()) / 60000) + ' min' : <Badge color={D.warning}>Active</Badge>;
                  return [r.id, r.customer?.name ?? `C${r.customerId}`, fmt(r.timeIn), r.timeOut ? fmt(r.timeOut) : '—', dur, r.notes ?? '—'];
                }} />}
              {tab === 'orders' && <DataTable cols={['ID', 'Customer', 'Items', 'Amount', 'Status', 'Date']}
                rows={data.records ?? []} render={r => {
                  let itemCount = '—'; try { itemCount = JSON.parse(r.items).length + ' items'; } catch { }
                  const sc = r.status === 'ORDERED' ? D.primary : r.status === 'DELIVERED' ? D.success : D.danger;
                  return [r.id, r.customer?.name ?? `C${r.customerId}`, itemCount,
                    <span style={{ color: D.success, fontWeight: 700 }}>Rs {Number(r.amount).toLocaleString()}</span>,
                    <Badge color={sc}>{r.status}</Badge>, fmt(r.createdAt)];
                }} />}
              {tab === 'returns' && <DataTable cols={['ID', 'Order', 'Reason', 'Status', 'Date']}
                rows={data.records ?? []} render={r => {
                  const sc = r.status === 'PENDING' ? D.warning : r.status === 'APPROVED' ? D.success : D.danger;
                  return [r.id, `#${r.orderId}`, r.reason, <Badge color={sc}>{r.status}</Badge>, fmt(r.createdAt)];
                }} />}
              {tab === 'gps' && <DataTable cols={['ID', 'User', 'Latitude', 'Longitude', 'Speed', 'Timestamp']}
                rows={data.records ?? []} render={r => [r.id, `User ${r.userId}`, r.lat.toFixed(5), r.lng.toFixed(5),
                  r.speed != null ? r.speed.toFixed(1) + ' m/s' : 'Stationary', fmt(r.timestamp)]} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: any) {
  return (
    <div style={{ background: D.card, borderRadius: 14, padding: 18, border: `1px solid ${D.border}`, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: D.sub, marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function DataTable({ cols, rows, render }: { cols: string[]; rows: any[]; render: (r: any) => any[] }) {
  if (rows.length === 0) return (
    <div style={{ padding: 48, textAlign: 'center', color: D.muted }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
      <div style={{ fontWeight: 600 }}>No records found</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>Data will appear here after activity</div>
    </div>
  );
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: D.card2 }}>
            {cols.map(c => <th key={c} style={{ padding: '12px 16px', textAlign: 'left', color: D.muted, fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${D.border}` }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${D.border}`, transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = D.card2)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {render(row).map((cell, j) => (
                <td key={j} style={{ padding: '12px 16px', color: j === 0 ? D.muted : D.text, whiteSpace: 'nowrap' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ children, color }: any) {
  return (
    <span style={{ background: color + '22', color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

const fmt = (d: string) => d ? new Date(d).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
