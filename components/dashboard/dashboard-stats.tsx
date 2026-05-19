"use client"

import { useLiveThreats } from "@/hooks/use-threats"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, Shield, AlertTriangle, Ban, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  variant?: "default" | "critical" | "warning" | "success"
}

function StatCard({ title, value, change, icon, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "border-border",
    critical: "border-red-500/30 bg-red-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    success: "border-green-500/30 bg-green-500/5",
  }

  return (
    <Card className={cn("bg-card", variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-400" />
                )}
                <span className={cn(
                  "text-xs font-mono",
                  change >= 0 ? "text-red-400" : "text-green-400"
                )}>
                  {change >= 0 ? "+" : ""}{change}%
                </span>
                <span className="text-xs text-muted-foreground">vs 24h</span>
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardStats() {
  const { threats, isLoading } = useLiveThreats()

  // Calculate stats from threats
  const totalThreats = threats.length
  const criticalThreats = threats.filter(t => t.riskScore >= 80).length
  const malwareCount = threats.filter(t => t.type === "malware" || t.type === "ransomware").length
  const botnetCount = threats.filter(t => t.type === "botnet" || t.type === "c2").length

  // Simulate 24h change (in real app, would compare with historical data)
  const change24h = Math.floor(Math.random() * 30) - 10

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Threats"
        value={totalThreats}
        change={change24h}
        icon={<Activity className="h-5 w-5 text-primary" />}
      />
      <StatCard
        title="Critical Alerts"
        value={criticalThreats}
        icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
        variant="critical"
      />
      <StatCard
        title="Active Malware"
        value={malwareCount}
        icon={<Shield className="h-5 w-5 text-orange-400" />}
        variant="warning"
      />
      <StatCard
        title="Botnet/C2"
        value={botnetCount}
        icon={<Ban className="h-5 w-5 text-yellow-400" />}
        variant="warning"
      />
    </div>
  )
}
