"use client";

import { useState, useEffect, createElement } from "react";
import { motion } from "framer-motion";
import {
  User, Cpu, Globe, GraduationCap, Target,
  Award, Building2, FileText, Send, CheckCircle2,
  Sparkles, ArrowDown, GitBranch, Database
} from "lucide-react";

interface Node {
  id: string;
  label: string;
  icon: typeof User;
  color: string;
  x: number;
  y: number;
}

const nodes: Node[] = [
  { id: "user", label: "User", icon: User, color: "text-primary", x: 50, y: 5 },
  { id: "skills", label: "Skills", icon: Cpu, color: "text-silver-400", x: 15, y: 22 },
  { id: "country", label: "Country", icon: Globe, color: "text-ash-400", x: 50, y: 22 },
  { id: "education", label: "Education", icon: GraduationCap, color: "text-iron-400", x: 85, y: 22 },
  { id: "career", label: "Career Goal", icon: Target, color: "text-stone-400", x: 50, y: 38 },
  { id: "scholarships", label: "Scholarships", icon: Award, color: "text-ash-400", x: 20, y: 55 },
  { id: "universities", label: "Universities", icon: Building2, color: "text-smoke-400", x: 50, y: 55 },
  { id: "opportunities", label: "Opportunities", icon: Database, color: "text-stone-400", x: 80, y: 55 },
  { id: "documents", label: "Documents", icon: FileText, color: "text-primary", x: 30, y: 75 },
  { id: "applications", label: "Applications", icon: Send, color: "text-ash-400", x: 70, y: 75 },
  { id: "complete", label: "Complete!", icon: CheckCircle2, color: "text-ash-400", x: 50, y: 92 },
];

const edges: [number, number][] = [
  [0, 1], [0, 2], [0, 3],
  [1, 4], [2, 4], [3, 4],
  [4, 5], [4, 6], [4, 7],
  [5, 8], [6, 8], [7, 8],
  [8, 9],
  [9, 10],
];

export function KnowledgeGraph() {
  const [activeNode, setActiveNode] = useState(0);
  const [visitedEdges, setVisitedEdges] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNode((p) => {
        const next = (p + 1) % nodes.length;
        setVisitedEdges((prev) => {
          const copy = new Set(prev);
          edges.forEach(([from, to]) => {
            if (from === next || to === next) {
              copy.add(`${from}-${to}`);
            }
          });
          return copy;
        });
        return next;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/2 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-iron-500/20 bg-iron-500/10 px-4 py-1.5 mb-4">
            <GitBranch className="h-3.5 w-3.5 text-iron-400" />
            <span className="text-sm font-medium text-iron-400">Knowledge Graph</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Live Knowledge <span className="text-gradient">Graph</span>
          </h2>
          <p className="text-muted-foreground/60 max-w-xl mx-auto text-sm">
            The agent builds a persistent knowledge graph — connecting your profile to opportunities, documents, and applications.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
            <svg viewBox="0 0 100 100" className="w-full h-auto" style={{ maxHeight: 500 }}>
              <defs>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgb(139,92,246)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(139,92,246)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(139,92,246)" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity="0.6" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Edges */}
              {edges.map(([from, to], i) => {
                const fromNode = nodes[from];
                const toNode = nodes[to];
                const isActive = visitedEdges.has(`${from}-${to}`) || visitedEdges.has(`${to}-${from}`);

                return (
                  <motion.line
                    key={`edge-${i}`}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={isActive ? "url(#edgeGradient)" : "rgba(255,255,255,0.06)"}
                    strokeWidth={isActive ? 1.2 : 0.5}
                    strokeDasharray={isActive ? "none" : "3 3"}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: isActive ? 1 : 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((node, i) => {
                const isNodeActive = activeNode === i;
                return (
                  <g key={node.id}>
                    {isNodeActive && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={8}
                        fill="url(#nodeGlow)"
                        filter="url(#glow)"
                      />
                    )}
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={3.5}
                      fill={isNodeActive ? "rgb(139,92,246)" : "rgba(255,255,255,0.08)"}
                      stroke={isNodeActive ? "rgb(139,92,246)" : "rgba(255,255,255,0.15)"}
                      strokeWidth={isNodeActive ? 1.5 : 0.5}
                      animate={isNodeActive ? {
                        r: [3.5, 5, 3.5],
                        opacity: [1, 0.7, 1],
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <text
                      x={node.x}
                      y={node.y + 5.5}
                      textAnchor="middle"
                      fill={isNodeActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)"}
                      fontSize="2.8"
                      fontWeight={isNodeActive ? "600" : "400"}
                      fontFamily="system-ui"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Active node info */}
            <motion.div
              key={activeNode}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-center gap-3"
            >
              {createElement(nodes[activeNode].icon, {
                className: `h-4 w-4 ${nodes[activeNode].color}`,
              })}
              <span className="text-sm text-foreground/70 font-mono">
                Processing: <span className="text-foreground/90 font-semibold">{nodes[activeNode].label}</span>
              </span>
              {activeNode < nodes.length - 1 && (
                <ArrowDown className="h-3 w-3 text-primary/40 animate-bounce" />
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
