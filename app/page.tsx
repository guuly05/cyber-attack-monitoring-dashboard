"use client"

import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { LiveThreatStream } from "@/components/dashboard/live-threat-stream"
import { ThreatTypeChart, RiskScoreChart, SourceActivityChart } from "@/components/dashboard/threat-charts"
import { useLiveThreats } from "@/hooks/use-threats"
import { SecurityCommandCenter } from "@/components/dashboard/security-command-center"

export default function DashboardPage() {
  const { apiStatus } = useLiveThreats()

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader apiStatus={apiStatus} />
      
      <main className="pb-6">
        <Suspense fallback={null}>
          <SecurityCommandCenter compact />
        </Suspense>

        <section className="container mx-auto mt-6 px-4">
          <DashboardStats />
        </section>

        <div className="container mx-auto mt-6 grid grid-cols-1 gap-6 px-4 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">
            <LiveThreatStream />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <ThreatTypeChart />
              <RiskScoreChart />
              <SourceActivityChart />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-8 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Defensive intelligence only. Data may be incomplete, stale, or rate-limited; verify before enforcement.
          </p>
        </div>
      </footer>
    </div>
  )
}
