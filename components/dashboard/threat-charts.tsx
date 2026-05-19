"use client"

import { useState } from "react"
import { useLiveThreats } from "@/hooks/use-threats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, PieChart, Info } from "lucide-react"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartInfoDialog } from "./chart-info-dialog"

const COLORS = {
  malware: "#EF4444",
  phishing: "#F97316",
  botnet: "#A855F7",
  ransomware: "#DC2626",
  c2: "#EAB308",
  unknown: "#6B7280",
}

export function ThreatTypeChart() {
  const { threats, isLoading } = useLiveThreats()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Aggregate threats by type
  const typeCounts = threats.reduce((acc, threat) => {
    acc[threat.type] = (acc[threat.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const data = Object.entries(typeCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: COLORS[name as keyof typeof COLORS] || COLORS.unknown,
  }))

  if (isLoading || data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Threat Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {isLoading ? "Loading..." : "No data available"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Threat Distribution
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-7 w-7 p-0"
          >
            <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B0F19",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#E2E8F0" }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <ChartInfoDialog
        chartType="threatDistribution"
        chartData={data}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  )
}

export function RiskScoreChart() {
  const { threats, isLoading } = useLiveThreats()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Group threats by risk score ranges
  const riskRanges = [
    { range: "0-25", min: 0, max: 25, color: "#10B981" },
    { range: "26-50", min: 26, max: 50, color: "#EAB308" },
    { range: "51-75", min: 51, max: 75, color: "#F97316" },
    { range: "76-100", min: 76, max: 100, color: "#EF4444" },
  ]

  const data = riskRanges.map(({ range, min, max, color }) => ({
    range,
    count: threats.filter((t) => t.riskScore >= min && t.riskScore <= max).length,
    fill: color,
  }))

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart className="h-4 w-4 text-primary" />
            Risk Score Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart className="h-4 w-4 text-primary" />
            Risk Score Distribution
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-7 w-7 p-0"
          >
            <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data} layout="vertical">
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis
                dataKey="range"
                type="category"
                stroke="#64748b"
                fontSize={12}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B0F19",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#E2E8F0" }}
                formatter={(value: number) => [`${value} threats`, "Count"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <ChartInfoDialog
        chartType="riskScore"
        chartData={data}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  )
}

export function SourceActivityChart() {
  const { threats, isLoading } = useLiveThreats()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Aggregate by source
  const sourceCounts = threats.reduce((acc, threat) => {
    acc[threat.source] = (acc[threat.source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const data = Object.entries(sourceCounts).map(([source, count]) => ({
    source,
    count,
    fill: source === "URLHaus" ? "#00D2FF" : "#1E40AF",
  }))

  if (isLoading || data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart className="h-4 w-4 text-primary" />
            Source Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {isLoading ? "Loading..." : "No data available"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart className="h-4 w-4 text-primary" />
            Source Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-7 w-7 p-0"
          >
            <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data}>
              <XAxis dataKey="source" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B0F19",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#E2E8F0" }}
                formatter={(value: number) => [`${value} threats`, "Count"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <ChartInfoDialog
        chartType="sourceActivity"
        chartData={data}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  )
}
