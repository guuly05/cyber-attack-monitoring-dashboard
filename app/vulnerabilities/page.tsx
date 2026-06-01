"use client"

import { Suspense, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { SecurityCommandCenter } from "@/components/dashboard/security-command-center"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileWarning, Search } from "lucide-react"

const priorityCves = [
  "CVE-2021-44228",
  "CVE-2023-34362",
  "CVE-2024-3094",
  "CVE-2024-3400",
  "CVE-2025-53770",
]

export default function VulnerabilitiesPage() {
  const [selected, setSelected] = useState("CVE-2021-44228")

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="space-y-6 pb-8">
        <section className="container mx-auto px-4 pt-6">
          <div className="flex flex-col gap-4 border-b border-primary/20 pb-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded border border-yellow-400/20 bg-yellow-400/10 p-2 text-yellow-200">
                <FileWarning className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-mono text-2xl font-semibold text-teal-50">Vulnerability Explorer</h1>
                <p className="text-sm text-muted-foreground">CVE, KEV, CVSS, EPSS-ready and source health triage.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {priorityCves.map((cve) => (
                <Button key={cve} variant={selected === cve ? "default" : "outline"} size="sm" onClick={() => setSelected(cve)} className="gap-2 font-mono">
                  <Search className="h-3.5 w-3.5" />
                  {cve}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <SecurityCommandCenter key={selected} initialQuery={selected} compact />
        </Suspense>

        <section className="container mx-auto px-4">
          <Card className="border-yellow-500/20 bg-card/90">
            <CardHeader>
              <CardTitle className="text-base">Triage Rules</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-red-500/30 text-red-300">KEV first</Badge>
              <Badge variant="outline" className="border-orange-500/30 text-orange-300">CVSS 9+ emergency</Badge>
              <Badge variant="outline" className="border-teal-500/30 text-teal-300">Asset exposure required</Badge>
              <Badge variant="outline" className="border-slate-500/30 text-slate-300">Verify vendor advisory</Badge>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
