"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { LiveThreatStream } from "@/components/dashboard/live-threat-stream"
import { ThreatSearchEngine } from "@/components/dashboard/threat-search"
import { ThreatTypeChart, RiskScoreChart, SourceActivityChart } from "@/components/dashboard/threat-charts"
import { useLiveThreats } from "@/hooks/use-threats"

export default function DashboardPage() {
  const { apiStatus } = useLiveThreats()

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader apiStatus={apiStatus} />
      
      <main className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <section className="mb-6">
          <DashboardStats />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Live Feed */}
          <div className="xl:col-span-2 space-y-6">
            <LiveThreatStream />
          </div>

          {/* Right Column - Search & Charts */}
          <div className="space-y-6">
            <ThreatSearchEngine />
            
            {/* Charts */}
            <div className="grid grid-cols-1 gap-4">
              <ThreatTypeChart />
              <RiskScoreChart />
              <SourceActivityChart />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Data sourced from URLHaus, ThreatFox, AbuseIPDB, and CIRCL CVE Search APIs
          </p>
        </div>
      </footer>
    </div>
  )
}
