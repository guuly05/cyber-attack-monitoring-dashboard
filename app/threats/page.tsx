"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { LiveThreatStream } from "@/components/dashboard/live-threat-stream"
import { ThreatTypeChart, RiskScoreChart, SourceActivityChart } from "@/components/dashboard/threat-charts"
import { useLiveThreats } from "@/hooks/use-threats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, ShieldAlert } from "lucide-react"

export default function ThreatsPage() {
  const { apiStatus, threats } = useLiveThreats()
  const topThreats = threats.slice(0, 12)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader apiStatus={apiStatus} />
      <main className="container mx-auto space-y-6 px-4 py-6">
        <section className="border-b border-primary/20 pb-5">
          <div className="flex items-center gap-3">
            <div className="rounded border border-teal-400/20 bg-teal-400/10 p-2 text-teal-200">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-mono text-2xl font-semibold text-teal-50">Live Threat Explorer</h1>
              <p className="text-sm text-muted-foreground">IOC feed triage, source yield, and analyst-ready top threats.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <LiveThreatStream />
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-5 w-5 text-red-300" />
                  Top Threats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topThreats.map((threat) => (
                  <div key={threat.id} className="rounded border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={threat.riskScore >= 80 ? "destructive" : "secondary"} className="font-mono">
                        {threat.riskScore}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">{threat.source}</span>
                    </div>
                    <p className="mt-2 break-all font-mono text-sm">{threat.host}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <ThreatTypeChart />
            <RiskScoreChart />
            <SourceActivityChart />
          </div>
        </div>
      </main>
    </div>
  )
}
