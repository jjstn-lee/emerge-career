"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from "recharts";

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

const COLORS = {
  bg: "#fffbf5",
  surface: "whitesmoke",
  border: "#f76754ff",
  accent: "#f24029",
  accentDim: "#f2402980",
  text: "#1a1a1aff",
  muted: "#1a1a1aff",
  bars: "#E78B48ff",
} as const;

const tooltipStyle = {
  contentStyle: { background: "#fffbf5", border: `2px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 12 },
  labelStyle: { color: COLORS.accent },
  itemStyle: { color: COLORS.text },
  cursor: { fill: COLORS.accentDim },
};

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  span?: number;
}

function ChartCard({ title, children, span = 1 }: ChartCardProps) {
  return (
    <div style={{
      background: COLORS.surface, border: `2px solid ${COLORS.border}`,
      borderRadius: 16, padding: "20px 24px", gridColumn: `span ${span}`,
    }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: COLORS.muted, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

export default function TicketCharts({ stats }: { stats: Stats | null; }) {
  if (!stats) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
      {/* Volume by Category */}
      <ChartCard title="Volume by Category" span={1}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.volumeByCat} layout="vertical" barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
            <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "'Noto Sans', sans-serif" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="category" tick={{ fill: COLORS.text, fontSize: 11, fontFamily: "'Noto Sans', sans-serif" }} axisLine={false} tickLine={false} width={110} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Tickets">
              {stats.volumeByCat.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS.bars}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Volume by Day */}
      <ChartCard title="Volume by Day" span={1}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.volumeByDay} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "'Noto Sans', sans-serif" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "'Noto Sans', sans-serif" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" fill={COLORS.bars} radius={[4, 4, 0, 0]} name="Tickets" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
