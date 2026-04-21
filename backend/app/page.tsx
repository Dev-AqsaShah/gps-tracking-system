'use client';
import { useEffect, useState } from 'react';

const D = {
  bg: '#0A0F1E', card: '#111827', card2: '#1A2035',
  border: '#1E293B',
  primary: '#3B82F6', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444',
  text: '#F1F5F9', sub: '#94A3B8', muted: '#475569',
};

type Tab = 'attendance' | 'gps';

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
      setSummary(await res.json());
    } catch { }
  };

  const loadTab = async (t: Tab) => {
    setLoading(true); setData(null);
    try {
      const url = t === 'attendance' ? '/api/admin/attendance' : '/api/admin/gps';
      const res = await fetch(url);
      setData(await res.json());
      setLastUpdate(new Date().toLocaleTimeString());
    } catch { setData({ error: 'Failed to load' }); }
    finally { setLoading(false); }
  };

  const refresh = () => { loadSummary(); loadTab(tab); };

  return (
    <div style={{ minHeight: '100vh', background: D.bg, fontFamily: 'system-ui, sans-serif' }}>

      {/* Navbar */}
      <nav style={{
        background: D.card, borderBottom: `1px solid ${D.border}`,
        padding: '0 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: D.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📡</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: D.text, letterSpacing: 0.3 }}>TrackForce</div>
            <div style={{ fontSize: 11, color: D.sub, letterSpacing: 1.5 }}>GPS FIELD MANAGEMENT</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10B98118', border: `1px solid #10B981`, borderRadius: 20, padding: '5px 14px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: D.success, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: D.success, fontWeight: 700 }}>SYSTEM ONLINE</span>
          </span>
          <a href="/map" style={{ background: D.primary, color: '#fff', padding: '9px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
            🗺️ Live Map
          </a>
          <button onClick={refresh} style={{ background: D.card2, border: `1px solid ${D.border}`, color: D.sub, padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>
            🔄 Refresh
          </button>
        </div>
      </nav>

      <div style={{ padding: '28px 28px 0' }}>
        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
            <SummaryCard icon="👥" label="Total Salesmen" value={summary.totalSalesmen ?? 0} color={D.primary} sub="Registered accounts" />
            <SummaryCard icon="📲" label="Checked In Today" value={summary.todayCheckins ?? 0} color={D.success} sub="Attendance marked" />
            <SummaryCard icon="🟢" label="Active Right Now" value={summary.activeNow ?? 0} color="#10B981" sub="Shift in progress" />
            <SummaryCard icon="📍" label="GPS Points Today" value={summary.gpsPoints ?? 0} color="#06B6D4" sub="Location pings" />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center' }}>
          {([
            { key: 'attendance', label: '📋 Attendance', },
            { key: 'gps', label: '📍 GPS Logs', },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
              fontWeight: 700, fontSize: 13, border: 'none',
              background: tab === t.key ? D.primary : D.card,
              color: tab === t.key ? '#fff' : D.sub,
              outline: tab === t.key ? 'none' : `1px solid ${D.border}`,
            }}>
              {t.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: D.muted }}>
            Last updated: {lastUpdate || '—'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 28px 40px' }}>
        <div style={{ background: D.card, borderRadius: 16, border: `1px solid ${D.border}`, overflow: 'hidden' }}>
          {loading && (
            <div style={{ padding: 60, textAlign: 'center', color: D.sub }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
              <div>Loading...</div>
            </div>
          )}
          {!loading && data && !data.error && tab === 'attendance' && (
            <DataTable
              cols={['#', 'Salesman', 'Company', 'Check In', 'End Duty', 'Duration', 'GPS Location', 'Status']}
              rows={data.records ?? []}
              render={r => {
                const duration = r.timeOut
                  ? (() => {
                    const mins = Math.floor((new Date(r.timeOut).getTime() - new Date(r.timeIn).getTime()) / 60000);
                    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
                  })()
                  : <Badge color={D.success}>Active</Badge>;
                return [
                  r.id,
                  <b style={{ color: D.text }}>{r.user?.name ?? `User ${r.userId}`}</b>,
                  r.user?.companyName ?? '—',
                  fmt(r.timeIn),
                  r.timeOut ? fmt(r.timeOut) : <span style={{ color: D.muted }}>—</span>,
                  duration,
                  (r.lat && r.lng) ? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}` : '—',
                  <Badge color={r.timeOut ? D.muted : D.success}>{r.timeOut ? 'Closed' : 'On Duty'}</Badge>,
                ];
              }}
            />
          )}
          {!loading && data && !data.error && tab === 'gps' && (
            <DataTable
              cols={['#', 'Salesman', 'Latitude', 'Longitude', 'Speed', 'Timestamp']}
              rows={data.records ?? []}
              render={r => [
                r.id,
                r.userName ?? `User ${r.userId}`,
                r.lat.toFixed(5),
                r.lng.toFixed(5),
                r.speed != null ? r.speed.toFixed(1) + ' m/s' : 'Stationary',
                fmt(r.timestamp),
              ]}
            />
          )}
          {!loading && data?.error && (
            <div style={{ padding: 40, textAlign: 'center', color: D.danger }}>{data.error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color, sub }: any) {
  return (
    <div style={{ background: D.card, borderRadius: 16, padding: 22, border: `1px solid ${D.border}`, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: D.text, fontWeight: 700, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: D.muted }}>{sub}</div>
    </div>
  );
}

function DataTable({ cols, rows, render }: { cols: string[]; rows: any[]; render: (r: any) => any[] }) {
  if (!rows.length) return (
    <div style={{ padding: 60, textAlign: 'center', color: D.muted }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: D.sub, marginBottom: 6 }}>No records yet</div>
      <div style={{ fontSize: 13 }}>Data will appear here once salesmen use the mobile app</div>
    </div>
  );
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: D.card2 }}>
            {cols.map(c => (
              <th key={c} style={{ padding: '13px 18px', textAlign: 'left', color: D.muted, fontWeight: 700, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${D.border}` }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              style={{ borderBottom: `1px solid ${D.border}`, transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = D.card2)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {render(row).map((cell, j) => (
                <td key={j} style={{ padding: '13px 18px', color: D.sub, whiteSpace: 'nowrap' }}>
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
    <span style={{ background: color + '20', color, padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${color}40` }}>
      {children}
    </span>
  );
}

const fmt = (d: string) =>
  d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
