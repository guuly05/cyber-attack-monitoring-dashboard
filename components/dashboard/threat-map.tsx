"use client"

import React, { useState, useMemo } from "react"
import { Globe, ShieldAlert, Zap, Radio, Activity, Filter, Pause, Play, RefreshCw, Crosshair } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSSEThreatStream, useLiveThreats } from "@/hooks/use-threats"
import type { ThreatIndicator } from "@/lib/types"

interface GeoNode {
  code: string
  name: string
  x: number // percentage 0-100 on SVG
  y: number // percentage 0-100 on SVG
  country: string
}

// Map key global SOC nodes onto SVG coordinate space
const WORLD_NODES: Record<string, GeoNode> = {
  US: { code: "US", name: "United States", x: 22, y: 38, country: "United States" },
  DE: { code: "DE", name: "Germany", x: 50, y: 28, country: "Germany" },
  CN: { code: "CN", name: "China", x: 78, y: 40, country: "China" },
  RU: { code: "RU", name: "Russia", x: 70, y: 22, country: "Russia" },
  BR: { code: "BR", name: "Brazil", x: 34, y: 70, country: "Brazil" },
  NL: { code: "NL", name: "Netherlands", x: 48, y: 27, country: "Netherlands" },
  JP: { code: "JP", name: "Japan", x: 88, y: 39, country: "Japan" },
  GB: { code: "GB", name: "United Kingdom", x: 46, y: 26, country: "United Kingdom" },
  IN: { code: "IN", name: "India", x: 68, y: 48, country: "India" },
  SG: { code: "SG", name: "Singapore", x: 76, y: 58, country: "Singapore" },
  AU: { code: "AU", name: "Australia", x: 85, y: 76, country: "Australia" },
  ZA: { code: "ZA", name: "South Africa", x: 54, y: 78, country: "South Africa" },
}

const DEFAULT_TARGET: GeoNode = WORLD_NODES.US

const threatTypeColors: Record<string, { stroke: string; fill: string; bg: string; text: string }> = {
  ransomware: { stroke: "#ef4444", fill: "rgba(239, 68, 68, 0.4)", bg: "bg-red-500/10 border-red-500/40", text: "text-red-400" },
  malware: { stroke: "#f97316", fill: "rgba(249, 115, 22, 0.4)", bg: "bg-orange-500/10 border-orange-500/40", text: "text-orange-400" },
  c2: { stroke: "#a855f7", fill: "rgba(168, 85, 247, 0.4)", bg: "bg-purple-500/10 border-purple-500/40", text: "text-purple-400" },
  botnet: { stroke: "#eab308", fill: "rgba(234, 179, 8, 0.4)", bg: "bg-yellow-500/10 border-yellow-500/40", text: "text-yellow-400" },
  phishing: { stroke: "#06b6d4", fill: "rgba(6, 182, 212, 0.4)", bg: "bg-cyan-500/10 border-cyan-500/40", text: "text-cyan-400" },
  unknown: { stroke: "#64748b", fill: "rgba(100, 116, 139, 0.4)", bg: "bg-slate-500/10 border-slate-500/40", text: "text-slate-400" },
}

export function ThreatMap() {
  const { streamThreats, isConnected } = useSSEThreatStream(30)
  const { threats: staticThreats } = useLiveThreats()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [hoveredThreat, setHoveredThreat] = useState<ThreatIndicator | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Combine stream and static threats
  const allThreats = useMemo(() => {
    const combined = [...streamThreats, ...staticThreats]
    const map = new Map<string, ThreatIndicator>()
    combined.forEach((t) => {
      if (!map.has(t.id)) map.set(t.id, t)
    })
    return Array.from(map.values())
  }, [streamThreats, staticThreats])

  const filteredThreats = useMemo(() => {
    if (selectedCategory === "all") return allThreats
    return allThreats.filter((t) => t.type === selectedCategory)
  }, [allThreats, selectedCategory])

  // Get active arcs for rendering SVG attack paths
  const attackArcs = useMemo(() => {
    if (isPaused) return []
    return filteredThreats.slice(0, 12).map((threat, idx) => {
      const raw = threat.raw as { origin?: GeoNode; target?: GeoNode } | undefined
      const originCode = raw?.origin?.code || (Object.keys(WORLD_NODES)[idx % Object.keys(WORLD_NODES).length])
      const originNode = WORLD_NODES[originCode] || WORLD_NODES.RU
      const targetCode = raw?.target?.code || (Object.keys(WORLD_NODES)[(idx + 3) % Object.keys(WORLD_NODES).length])
      const targetNode = WORLD_NODES[targetCode] || DEFAULT_TARGET

      const dx = targetNode.x - originNode.x
      const dy = targetNode.y - originNode.y
      // Arc curvature height
      const cx = (originNode.x + targetNode.x) / 2
      const cy = (originNode.y + targetNode.y) / 2 - Math.min(Math.abs(dx) * 0.35, 25)

      return {
        id: threat.id,
        threat,
        originNode,
        targetNode,
        path: `M ${originNode.x * 10} ${originNode.y * 5} Q ${cx * 10} ${cy * 5} ${targetNode.x * 10} ${targetNode.y * 5}`,
        style: threatTypeColors[threat.type] || threatTypeColors.unknown,
      }
    })
  }, [filteredThreats, isPaused])

  return (
    <Card className="relative overflow-hidden border-teal-500/20 bg-slate-950 text-slate-100 shadow-2xl">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#0d2b2a_0%,transparent_70%)] pointer-events-none opacity-40" />

      <CardHeader className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-teal-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-teal-400 animate-pulse" />
            <CardTitle className="text-xl font-mono tracking-wider text-teal-300">
              GLOBAL THREAT INTEL RADAR
            </CardTitle>
            <Badge variant="outline" className={isConnected ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-amber-500/50 bg-amber-500/10 text-amber-300"}>
              {isConnected ? "LIVE SSE STREAM" : "POLLING FEED"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Real-time geospatial vector mapping & telemetry arc tracking
          </p>
        </div>

        {/* Category Filters & Controls */}
        <div className="mt-3 md:mt-0 flex flex-wrap items-center gap-2">
          {["all", "ransomware", "malware", "c2", "botnet", "phishing"].map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? "bg-teal-500 text-black hover:bg-teal-400 font-mono text-xs uppercase" : "border-slate-800 text-slate-400 hover:text-teal-300 hover:bg-slate-900 font-mono text-xs uppercase"}
            >
              {cat}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaused(!isPaused)}
            className="border-slate-800 text-slate-300 hover:bg-slate-900"
          >
            {isPaused ? <Play className="h-4 w-4 text-emerald-400" /> : <Pause className="h-4 w-4 text-amber-400" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 p-2 md:p-6">
        {/* World Map SVG Viewport */}
        <div className="relative w-full aspect-[2/1] rounded-lg border border-teal-900/30 bg-slate-900/60 overflow-hidden shadow-inner">
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

          <svg viewBox="0 0 1000 500" className="w-full h-full">
            <defs>
              {/* Animated Gradient for Arcs */}
              <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Continent Outlines (Simplified Vector Landmasses) */}
            <g className="fill-slate-800/50 stroke-teal-900/40 stroke-[0.8]">
              {/* North America */}
              <path d="M 120 100 Q 180 80 280 120 T 320 220 Q 220 280 140 240 Z" />
              {/* South America */}
              <path d="M 280 270 Q 380 280 370 380 T 290 460 Q 250 360 280 270 Z" />
              {/* Europe */}
              <path d="M 450 110 Q 550 90 580 160 T 480 210 Q 420 180 450 110 Z" />
              {/* Africa */}
              <path d="M 460 220 Q 570 230 580 340 T 490 420 Q 430 320 460 220 Z" />
              {/* Asia */}
              <path d="M 590 100 Q 820 70 880 180 T 720 300 Q 610 210 590 100 Z" />
              {/* Australia */}
              <path d="M 780 340 Q 880 340 890 410 T 800 430 Q 760 390 780 340 Z" />
            </g>

            {/* Attack Arcs */}
            {attackArcs.map((arc) => (
              <g key={arc.id} className="cursor-pointer" onMouseEnter={() => setHoveredThreat(arc.threat)}>
                {/* Background path glow */}
                <path
                  d={arc.path}
                  fill="none"
                  stroke={arc.style.stroke}
                  strokeWidth="1.5"
                  strokeOpacity="0.25"
                />
                {/* Animated beam trajectory */}
                <path
                  d={arc.path}
                  fill="none"
                  stroke={arc.style.stroke}
                  strokeWidth="2.5"
                  strokeDasharray="15 30"
                  className="animate-pulse"
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="90"
                    to="0"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </path>
              </g>
            ))}

            {/* World Geographical Node Markers */}
            {Object.entries(WORLD_NODES).map(([code, node]) => {
              const cx = node.x * 10
              const cy = node.y * 5
              const activeCount = filteredThreats.filter((t) => {
                const raw = t.raw as { origin?: GeoNode } | undefined
                return raw?.origin?.code === code || t.ip?.startsWith(code)
              }).length

              return (
                <g
                  key={code}
                  transform={`translate(${cx}, ${cy})`}
                  className="cursor-pointer group"
                >
                  {/* Outer pulse */}
                  <circle
                    r="12"
                    fill="rgba(45, 212, 191, 0.15)"
                    className="animate-ping"
                  />
                  {/* Outer ring */}
                  <circle
                    r="6"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="1.5"
                    className="group-hover:stroke-emerald-300 transition-colors"
                  />
                  {/* Center node */}
                  <circle
                    r="3"
                    fill={activeCount > 0 ? "#ef4444" : "#2dd4bf"}
                  />
                  {/* Node label */}
                  <text
                    x="9"
                    y="4"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    className="group-hover:fill-teal-300 transition-colors pointer-events-none select-none"
                  >
                    {code}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredThreat && (
            <div className="absolute bottom-3 left-3 right-3 md:right-auto md:max-w-md p-3 rounded-lg border border-teal-500/40 bg-black/90 backdrop-blur-md font-mono text-xs shadow-2xl z-20 transition-all">
              <div className="flex items-center justify-between border-b border-teal-900/60 pb-1.5 mb-2">
                <span className="text-teal-300 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                  INDICATOR: {hoveredThreat.ip || hoveredThreat.host}
                </span>
                <Badge variant="outline" className={threatTypeColors[hoveredThreat.type]?.bg || ""}>
                  {hoveredThreat.type.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
                <div>
                  <span className="text-slate-500">Malware Family:</span>{" "}
                  <span className="text-teal-200">{hoveredThreat.malwareFamily || "Unknown"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Risk Score:</span>{" "}
                  <span className={hoveredThreat.riskScore > 75 ? "text-red-400 font-bold" : "text-amber-400"}>
                    {hoveredThreat.riskScore}/100
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Source:</span>{" "}
                  <span className="text-slate-300">{hoveredThreat.source}</span>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>{" "}
                  <span className="text-slate-400">{new Date(hoveredThreat.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] text-slate-400 truncate">
                Target URL: {hoveredThreat.url || "N/A"}
              </div>
            </div>
          )}
        </div>

        {/* Live Stream Telemetry Bar */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-md border border-teal-900/30 bg-slate-900/40">
            <span className="text-slate-400 block text-[10px] uppercase">Active Vector Streams</span>
            <span className="text-lg font-bold text-teal-300 flex items-center gap-1">
              <Activity className="h-4 w-4 text-teal-400" />
              {attackArcs.length} Trajectories
            </span>
          </div>
          <div className="p-3 rounded-md border border-teal-900/30 bg-slate-900/40">
            <span className="text-slate-400 block text-[10px] uppercase">Telemetry Buffer</span>
            <span className="text-lg font-bold text-emerald-300">
              {filteredThreats.length} Events
            </span>
          </div>
          <div className="p-3 rounded-md border border-teal-900/30 bg-slate-900/40">
            <span className="text-slate-400 block text-[10px] uppercase">Highest Criticality</span>
            <span className="text-lg font-bold text-red-400">
              98 / 100 (Ransomware)
            </span>
          </div>
          <div className="p-3 rounded-md border border-teal-900/30 bg-slate-900/40">
            <span className="text-slate-400 block text-[10px] uppercase">Connection Protocol</span>
            <span className="text-lg font-bold text-cyan-300">
              HTTP SSE / 3000ms
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
