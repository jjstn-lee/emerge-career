"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────
interface Ticket {
  id: number;
  sender: string;
  timestamp: string;
  subject: string;
  body: string;
  category: string;
}

interface DayVolume {
  date: string;
  count: number;
}

interface CatVolume {
  category: string;
  count: number;
}

interface Stats {
  total: number;
  volumeByDay: DayVolume[];
  volumeByCat: CatVolume[];
}

// ── Palette ────────────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0b0e14",
  surface: "#12161f",
  border: "#1e2535",
  accent: "#00e5c8",
  accentDim: "#00e5c820",
  accentMid: "#00e5c860",
  gold: "#f0c040",
  rose: "#f05060",
  text: "#e2e8f0",
  muted: "#64748b",
  cats: ["#00e5c8", "#f0c040", "#f05060", "#818cf8", "#fb923c", "#34d399", "#f472b6"],
} as const;

// ── Chart Card ─────────────────────────────────────────────────────────────
interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  span?: number;
}

function ChartCard({ title, children, span = 1 }: ChartCardProps) {
  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 12, padding: "20px 24px", gridColumn: `span ${span}`,
    }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: COLORS.muted, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: "#1a2035", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 12 },
  labelStyle: { color: COLORS.accent },
  cursor: { fill: COLORS.accentDim },
};

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/ticket', { method: 'GET' });

        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }

        const data = await response.json();
        setTickets(data.tickets || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tickets');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // ── Derived Data ───────────────────────────────────────────────────────
  const stats = useMemo((): Stats | null => {
    if (!tickets || tickets.length === 0) return null;

    const total = tickets.length;

    // Volume by day
    const byDay: Record<string, number> = {};
    tickets.forEach((t) => {
      const date = new Date(t.timestamp).toISOString().split('T')[0];
      byDay[date] = (byDay[date] || 0) + 1;
    });
    const volumeByDay: DayVolume[] = Object.entries(byDay)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, count]) => ({ date: date.slice(5), count }));

    // Volume by category
    const byCat: Record<string, number> = {};
    tickets.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + 1; });
    const volumeByCat: CatVolume[] = Object.entries(byCat)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }));

    return {
      total,
      volumeByDay,
      volumeByCat,
    };
  }, [tickets]);

  // ── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", color: COLORS.text }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Space+Grotesk:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: ${COLORS.bg}; }
        `}</style>
        <div style={{ fontSize: 14 }}>Loading tickets...</div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────
  if (error || !tickets) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", color: COLORS.text }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Space+Grotesk:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: ${COLORS.bg}; }
        `}</style>
        <div style={{ fontSize: 14, color: COLORS.rose }}>Error: {error || 'Unknown error'}</div>
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────
  if (tickets.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", color: COLORS.text }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Space+Grotesk:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: ${COLORS.bg}; }
        `}</style>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 12 }}>
            No Tickets Yet
          </h1>
          <p style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.7 }}>
            Send emails to your configured Mailgun inbox to start collecting support tickets.
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Space+Grotesk:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${COLORS.bg}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
        .refresh-btn { transition: color .15s; }
        .refresh-btn:hover { color: ${COLORS.accent} !important; }
      `}</style>

      {/* Top Nav */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: COLORS.accent, fontSize: 18 }}>◈</span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15 }}>Support Ticket Classifier</span>
          <span style={{ background: COLORS.accentDim, border: `1px solid ${COLORS.accentMid}`, borderRadius: 4, padding: "2px 8px", fontSize: 10, color: COLORS.accent, letterSpacing: 1 }}>EMERGE CAREER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: COLORS.muted, fontSize: 11 }}>{stats?.total} tickets</span>
          <button
            className="refresh-btn"
            onClick={() => window.location.reload()}
            style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 11, cursor: "pointer", letterSpacing: 1 }}
          >
            ↻ REFRESH
          </button>
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1280, margin: "0 auto" }}>
        {/* Charts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>

          {/* Volume by Day */}
          <ChartCard title="Volume by Day" span={2}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats!.volumeByDay} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill={COLORS.accent} radius={[4, 4, 0, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Volume by Category */}
          <ChartCard title="Volume by Category">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats!.volumeByCat} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="category" tick={{ fill: COLORS.text, fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Tickets">
                  {stats!.volumeByCat.map((_, i) => (
                    <text key={i} x={0} y={0} fill={COLORS.cats[i % COLORS.cats.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        {/* Raw Table */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase" }}>
            Ticket Log — {tickets.length} records
          </div>
          <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, background: COLORS.surface }}>
                <tr>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: COLORS.muted, fontWeight: 400, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>Sender</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: COLORS.muted, fontWeight: 400, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>Date</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: COLORS.muted, fontWeight: 400, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>Category</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: COLORS.muted, fontWeight: 400, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>Subject</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}20`, background: i % 2 === 0 ? "transparent" : "#ffffff04" }}>
                    <td style={{ padding: "9px 16px", color: COLORS.text, whiteSpace: "nowrap" }}>{t.sender}</td>
                    <td style={{ padding: "9px 16px", color: COLORS.muted, whiteSpace: "nowrap", fontSize: 11 }}>{new Date(t.timestamp).toLocaleDateString()}</td>
                    <td style={{ padding: "9px 16px", color: COLORS.accent, whiteSpace: "nowrap" }}>{t.category}</td>
                    <td style={{ padding: "9px 16px", color: COLORS.text, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis" }}>{t.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: "center", color: COLORS.muted, fontSize: 10, letterSpacing: 2 }}>
          BUILT FOR EMERGE CAREER · CUSTOMER ENGINEER APPLICATION
        </div>
      </div>
    </div>
  );
}
