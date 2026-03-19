"use client";

import { useState, useCallback, useMemo, DragEvent, ChangeEvent } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend, Cell,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────
interface Ticket {
  ticket_id: string;
  date: string;
  category: string;
  priority: string;
  "response_time_(hrs)": string;
  "resolution_time_(hrs)": string;
  status: string;
  [key: string]: string;
}

interface DayVolume {
  date: string;
  count: number;
}

interface CatVolume {
  category: string;
  count: number;
}

interface CatResponse {
  category: string;
  avg: number;
}

interface ScatterPoint {
  id: string;
  resp: number;
  resol: number;
  cat: string;
}

interface Stats {
  total: number;
  resolved: number;
  resolutionRate: string;
  avgRes: string;
  avgResol: string;
  volumeByDay: DayVolume[];
  volumeByCat: CatVolume[];
  responseByCategory: CatResponse[];
  scatter: ScatterPoint[];
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

// ── CSV Parser ─────────────────────────────────────────────────────────────
function parseCSV(text: string): Ticket[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = vals[i] ?? ""));
    return obj as Ticket;
  });
}

// ── Sample CSV ─────────────────────────────────────────────────────────────
const SAMPLE_CSV = `Ticket ID,Date,Category,Priority,Response Time (hrs),Resolution Time (hrs),Status
T001,2024-01-02,Billing,High,1.2,4.5,Resolved
T002,2024-01-02,Technical,Critical,0.5,12.0,Resolved
T003,2024-01-03,Onboarding,Low,6.0,24.0,Resolved
T004,2024-01-03,Technical,High,2.1,8.3,Resolved
T005,2024-01-03,Billing,Medium,3.4,6.2,Resolved
T006,2024-01-04,Feature Request,Low,18.0,72.0,Open
T007,2024-01-04,Technical,Critical,0.3,5.5,Resolved
T008,2024-01-05,Onboarding,Medium,4.2,18.0,Resolved
T009,2024-01-05,Billing,High,1.8,7.1,Resolved
T010,2024-01-05,Technical,Medium,3.0,10.0,Resolved
T011,2024-01-06,Feature Request,Low,22.0,96.0,Open
T012,2024-01-06,Billing,Medium,2.5,5.8,Resolved
T013,2024-01-07,Technical,High,1.1,9.2,Resolved
T014,2024-01-07,Onboarding,Low,8.0,36.0,Resolved
T015,2024-01-07,Account,Medium,4.0,12.0,Resolved
T016,2024-01-08,Technical,Critical,0.4,6.8,Resolved
T017,2024-01-08,Billing,High,1.5,4.2,Resolved
T018,2024-01-08,Account,Low,12.0,48.0,Open
T019,2024-01-09,Technical,Medium,2.8,11.5,Resolved
T020,2024-01-09,Feature Request,Low,20.0,84.0,Open
T021,2024-01-09,Onboarding,High,3.2,16.0,Resolved
T022,2024-01-10,Billing,Critical,0.8,3.5,Resolved
T023,2024-01-10,Technical,High,1.6,8.7,Resolved
T024,2024-01-10,Account,Medium,5.5,20.0,Resolved
T025,2024-01-11,Technical,Low,7.0,28.0,Resolved`;

// ── Stat Card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function StatCard({ label, value, sub, color = COLORS.accent }: StatCardProps) {
  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 12, padding: "20px 24px", display: "flex",
      flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: COLORS.muted, fontFamily: "'DM Mono', monospace" }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: COLORS.muted }}>{sub}</span>}
    </div>
  );
}

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
  const [dragging, setDragging] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCSV = useCallback((text: string, name: string): void => {
    try {
      const rows = parseCSV(text);
      setTickets(rows);
      setFileName(name);
      setError(null);
    } catch {
      setError("Could not parse CSV. Check column names and formatting.");
    }
  }, []);

  const handleFile = useCallback((file: File | undefined): void => {
    if (!file || !file.name.endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => loadCSV(e.target?.result as string, file.name);
    reader.readAsText(file);
  }, [loadCSV]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    handleFile(e.target.files?.[0]);
  }, [handleFile]);

  // ── Derived Data ───────────────────────────────────────────────────────
  const stats = useMemo((): Stats | null => {
    if (!tickets) return null;
    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status.toLowerCase() === "resolved").length;
    const avgRes = tickets.reduce((s, t) => s + (parseFloat(t["response_time_(hrs)"]) || 0), 0) / total;
    const avgResol = tickets.reduce((s, t) => s + (parseFloat(t["resolution_time_(hrs)"]) || 0), 0) / total;

    const byDay: Record<string, number> = {};
    tickets.forEach((t) => { byDay[t.date] = (byDay[t.date] || 0) + 1; });
    const volumeByDay: DayVolume[] = Object.entries(byDay)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, count]) => ({ date: date.slice(5), count }));

    const byCat: Record<string, number> = {};
    tickets.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + 1; });
    const volumeByCat: CatVolume[] = Object.entries(byCat)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }));

    const catResp: Record<string, { sum: number; n: number; }> = {};
    tickets.forEach((t) => {
      if (!catResp[t.category]) catResp[t.category] = { sum: 0, n: 0 };
      catResp[t.category].sum += parseFloat(t["response_time_(hrs)"]) || 0;
      catResp[t.category].n++;
    });
    const responseByCategory: CatResponse[] = Object.entries(catResp)
      .map(([category, { sum, n }]) => ({ category, avg: +(sum / n).toFixed(2) }))
      .sort((a, b) => b.avg - a.avg);

    const scatter: ScatterPoint[] = tickets.map((t, i) => ({
      id: t.ticket_id || `T${i + 1}`,
      resp: parseFloat(t["response_time_(hrs)"]) || 0,
      resol: parseFloat(t["resolution_time_(hrs)"]) || 0,
      cat: t.category,
    }));

    return {
      total,
      resolved,
      resolutionRate: ((resolved / total) * 100).toFixed(1),
      avgRes: avgRes.toFixed(1),
      avgResol: avgResol.toFixed(1),
      volumeByDay,
      volumeByCat,
      responseByCategory,
      scatter,
    };
  }, [tickets]);

  const categories = useMemo<string[]>(
    () => (stats ? [...new Set(stats.scatter.map((s) => s.cat))] : []),
    [stats]
  );

  // ── Upload Screen ──────────────────────────────────────────────────────
  if (!tickets) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", padding: 24 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Space+Grotesk:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: ${COLORS.bg}; }
          .drop-zone { transition: border-color .2s, background .2s; }
          .drop-zone:hover { border-color: ${COLORS.accent} !important; background: ${COLORS.accentDim} !important; cursor: pointer; }
          .sample-btn { transition: background .2s, color .2s; }
          .sample-btn:hover { background: ${COLORS.accent} !important; color: ${COLORS.bg} !important; }
        `}</style>

        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "inline-block", background: COLORS.accentDim, border: `1px solid ${COLORS.accentMid}`, borderRadius: 6, padding: "4px 12px", fontSize: 10, letterSpacing: 3, color: COLORS.accent, marginBottom: 20, textTransform: "uppercase" }}>
              Emerge Career · Customer Engineer
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.15, marginBottom: 12 }}>
              Support Ticket<br /><span style={{ color: COLORS.accent }}>Classifier</span>
            </h1>
            <p style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.7 }}>
              Upload a CSV of support tickets to visualize volume, category distribution, and response &amp; resolution times.
            </p>
          </div>

          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => document.getElementById("csv-input")?.click()}
            style={{
              border: `2px dashed ${dragging ? COLORS.accent : COLORS.border}`,
              background: dragging ? COLORS.accentDim : COLORS.surface,
              borderRadius: 16, padding: "48px 32px", marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
            <div style={{ color: COLORS.text, fontSize: 14, marginBottom: 6 }}>Drop your CSV file here</div>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>or click to browse</div>
            <input id="csv-input" type="file" accept=".csv" style={{ display: "none" }} onChange={handleInputChange} />
          </div>

          {error && <div style={{ color: COLORS.rose, fontSize: 12, marginBottom: 12 }}>{error}</div>}

          <button
            className="sample-btn"
            onClick={() => loadCSV(SAMPLE_CSV, "sample_tickets.csv")}
            style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 24px", color: COLORS.muted, fontSize: 12, letterSpacing: 1, cursor: "pointer", width: "100%" }}
          >
            → USE SAMPLE DATA (25 tickets)
          </button>

          <div style={{ marginTop: 32, borderTop: `1px solid ${COLORS.border}`, paddingTop: 24, textAlign: "left" }}>
            <div style={{ color: COLORS.muted, fontSize: 11, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Expected CSV columns</div>
            {["Ticket ID", "Date (YYYY-MM-DD)", "Category", "Priority", "Response Time (hrs)", "Resolution Time (hrs)", "Status"].map((c) => (
              <div key={c} style={{ fontSize: 11, color: COLORS.text, padding: "4px 0", borderBottom: `1px solid ${COLORS.border}20` }}>
                <span style={{ color: COLORS.accent }}>›</span> {c}
              </div>
            ))}
          </div>
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
        .reset-btn { transition: color .15s; }
        .reset-btn:hover { color: ${COLORS.accent} !important; }
      `}</style>

      {/* Top Nav */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: COLORS.accent, fontSize: 18 }}>◈</span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15 }}>Support Ticket Classifier</span>
          <span style={{ background: COLORS.accentDim, border: `1px solid ${COLORS.accentMid}`, borderRadius: 4, padding: "2px 8px", fontSize: 10, color: COLORS.accent, letterSpacing: 1 }}>EMERGE CAREER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: COLORS.muted, fontSize: 11 }}>{fileName}</span>
          <button
            className="reset-btn"
            onClick={() => { setTickets(null); setFileName(null); }}
            style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 11, cursor: "pointer", letterSpacing: 1 }}
          >
            ↩ RESET
          </button>
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1280, margin: "0 auto" }}>
        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Tickets" value={stats!.total} sub={`${stats!.resolved} resolved`} />
          <StatCard label="Resolution Rate" value={`${stats!.resolutionRate}%`} color={COLORS.gold} />
          <StatCard label="Avg Response Time" value={`${stats!.avgRes}h`} color={COLORS.accent} />
          <StatCard label="Avg Resolution Time" value={`${stats!.avgResol}h`} color={COLORS.rose} />
        </div>

        {/* Charts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>

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
                    <Cell key={i} fill={COLORS.cats[i % COLORS.cats.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Avg Response by Category */}
          <ChartCard title="Avg Response Time by Category (hrs)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats!.responseByCategory} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fill: COLORS.text, fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(val: number) => [`${val}h`, "Avg Response"]}
                />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]} name="Avg Response (hrs)">
                  {stats!.responseByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS.cats[i % COLORS.cats.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Response vs Resolution Scatter */}
          <ChartCard title="Response vs. Resolution Time (hrs)" span={2}>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis
                  dataKey="resp"
                  name="Response Time"
                  type="number"
                  tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "DM Mono" }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Response (hrs)", fill: COLORS.muted, fontSize: 10, position: "insideBottom", offset: -2 }}
                />
                <YAxis
                  dataKey="resol"
                  name="Resolution Time"
                  type="number"
                  tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "DM Mono" }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Resolution (hrs)", fill: COLORS.muted, fontSize: 10, angle: -90, position: "insideLeft" }}
                />
                <ZAxis range={[50, 50]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: COLORS.border }}
                  contentStyle={{ background: "#1a2035", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, color: COLORS.text }}
                  formatter={(val: number, name: string) => [`${val}h`, name === "resp" ? "Response" : "Resolution"]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: COLORS.muted, fontFamily: "DM Mono" }} />
                {categories.map((cat, i) => (
                  <Scatter
                    key={cat}
                    name={cat}
                    data={stats!.scatter.filter((s) => s.cat === cat)}
                    fill={COLORS.cats[i % COLORS.cats.length]}
                    opacity={0.85}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        {/* Raw Table */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginTop: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase" }}>
            Ticket Log — {tickets.length} records
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {Object.keys(tickets[0]).map((k) => (
                    <th key={k} style={{ padding: "10px 16px", textAlign: "left", color: COLORS.muted, fontWeight: 400, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>
                      {k.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}20`, background: i % 2 === 0 ? "transparent" : "#ffffff04" }}>
                    {Object.entries(t).map(([k, v]) => (
                      <td
                        key={k}
                        style={{
                          padding: "9px 16px",
                          color: k === "status" ? (v.toLowerCase() === "resolved" ? COLORS.accent : COLORS.gold) : COLORS.text,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v}
                      </td>
                    ))}
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
