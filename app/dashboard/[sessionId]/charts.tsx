"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { TrendingUp, Activity, PieChart as PieIcon } from "lucide-react";

const COLORS = [
  "#60a5fa", "#a78bfa", "#f59e0b", "#22d3ee", "#34d399", "#fb7185", "#fb923c", "#818cf8",
];

const PHASE_LABELS: Record<string, string> = {
  perceive: "Perceive",
  reason: "Reason",
  plan: "Plan",
  tool_select: "Select",
  tool_execute: "Execute",
  observe: "Observe",
  reflect: "Reflect",
  memory: "Memory",
};

export function DashboardCharts({
  phaseCounts,
  toolsList,
  iterationCount,
}: {
  phaseCounts: Record<string, number>;
  toolsList: string[];
  iterationCount: number;
}) {
  const phaseData = useMemo(
    () =>
      Object.entries(phaseCounts)
        .map(([name, value]) => ({ name: PHASE_LABELS[name] || name, value }))
        .filter((d) => d.value > 0),
    [phaseCounts]
  );

  const toolData = useMemo(
    () => toolsList.map((name, i) => ({ name: name.replace(/_/g, " "), value: 1 })),
    [toolsList]
  );

  const trendData = useMemo(
    () =>
      Array.from({ length: iterationCount || 0 }, (_, i) => ({
        iteration: i + 1,
        confidence: 50 + i * 5,
        tools: Math.min(i + 1, 5),
      })),
    [iterationCount]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Phase Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <PieIcon className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Phase Distribution</h3>
        </div>
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={phaseData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {phaseData.map((_entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "oklch(0.08 0.005 260)",
                  border: "1px solid oklch(0.2 0.01 260)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {phaseData.slice(0, 5).map((d, i) => (
            <span key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              {d.name}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Tool Usage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-ash-400" />
          <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Tool Usage</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={toolData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.6 0.01 260)" }} width={80} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.08 0.005 260)",
                border: "1px solid oklch(0.2 0.01 260)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {toolData.map((_entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {toolData.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center">No tools executed yet</p>
        )}
      </motion.div>

      {/* Performance Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-iron-400" />
          <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Performance Trend</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="iteration" tick={{ fontSize: 10, fill: "oklch(0.6 0.01 260)" }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "oklch(0.08 0.005 260)",
                border: "1px solid oklch(0.2 0.01 260)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area type="monotone" dataKey="confidence" stroke="#60a5fa" fill="url(#confidenceGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
