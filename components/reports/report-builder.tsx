"use client"

import { useEffect, useMemo, useState } from "react"
import { useLiveThreats } from "@/hooks/use-threats"
import { downloadText, exportIOCContent } from "@/lib/ioc-export"
import type { ThreatIndicator } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileDown, FileText, History, Printer, ShieldCheck } from "lucide-react"

type ArchiveItem = { id: string; title: string; createdAt: string; template: string; count: number }

function summarize(threats: ThreatIndicator[]) {
  const critical = threats.filter((threat) => threat.riskScore >= 90).length
  const families = [...new Set(threats.map((threat) => threat.malwareFamily).filter(Boolean))].slice(0, 6)
  return `The selected feed contains ${threats.length} normalized indicators, including ${critical} critical-risk records. Highest-observed families: ${families.join(", ") || "none reported"}. Validate upstream context before enforcement.`
}

export function ReportBuilder() {
  const { threats, isLoading, lastUpdated } = useLiveThreats()
  const [template, setTemplate] = useState("Executive Brief")
  const [archive, setArchive] = useState<ArchiveItem[]>([])
  useEffect(() => { try { setArchive(JSON.parse(window.localStorage.getItem("cybershield-report-archive") ?? "[]")) } catch { setArchive([]) } }, [])

  const reportThreats = useMemo(() => threats.slice(0, template === "Technical IOC List" ? 100 : 35), [template, threats])
  const generate = (format: "csv" | "stix" | "txt") => {
    downloadText(`cybershield-${template.toLowerCase().replaceAll(" ", "-")}-${new Date().toISOString().slice(0, 10)}.${format === "stix" ? "json" : format}`, exportIOCContent(reportThreats, format), format === "csv" ? "text/csv" : "application/json")
    saveArchive()
  }
  const saveArchive = () => {
    const next = [{ id: crypto.randomUUID(), title: `${template} · ${new Date().toLocaleDateString()}`, createdAt: new Date().toISOString(), template, count: reportThreats.length }, ...archive].slice(0, 20)
    setArchive(next); window.localStorage.setItem("cybershield-report-archive", JSON.stringify(next))
  }
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
    <Card className="border-border bg-card/90"><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-teal-300" /> Report composer</CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">{["Executive Brief", "Technical IOC List", "Vulnerability Digest"].map((name) => <button key={name} type="button" onClick={() => setTemplate(name)} className={`rounded border p-4 text-left ${template === name ? "border-primary bg-primary/10" : "border-border"}`}><p className="font-medium">{name}</p><p className="mt-1 text-xs text-muted-foreground">{name === "Executive Brief" ? "Risk posture and decisions" : name === "Technical IOC List" ? "Export-ready indicators" : "CVE and exposure triage"}</p></button>)}</div>
      <div className="rounded border border-primary/20 bg-primary/5 p-4"><div className="flex items-center justify-between gap-2"><p className="font-mono text-sm text-primary">{template}</p><Badge variant="outline">{reportThreats.length} records</Badge></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{isLoading ? "Collecting the latest feed…" : summarize(reportThreats)}</p><p className="mt-3 text-xs text-muted-foreground">Feed snapshot: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "pending"}</p></div>
      <div className="flex flex-wrap gap-2"><Button onClick={() => generate("csv")} className="gap-2"><FileDown className="h-4 w-4" /> CSV export</Button><Button onClick={() => generate("stix")} variant="outline" className="gap-2">STIX 2.1 JSON</Button><Button onClick={() => generate("txt")} variant="outline">Plain text</Button><Button onClick={() => { saveArchive(); window.print() }} variant="outline" className="gap-2"><Printer className="h-4 w-4" /> Print / PDF</Button></div>
      <div className="rounded border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-100/80"><ShieldCheck className="mr-2 inline h-4 w-4" /> Reports are generated from the visible normalized feed. Keep provenance and verify indicators with the original provider.</div>
    </CardContent></Card>
    <Card className="border-border bg-card/90"><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-sky-300" /> Archive</CardTitle></CardHeader><CardContent className="space-y-2">{archive.length ? archive.map((item) => <div key={item.id} className="rounded border border-border/70 p-3"><p className="text-sm">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.count} indicators · {new Date(item.createdAt).toLocaleString()}</p></div>) : <p className="text-sm text-muted-foreground">Generated reports will appear here on this device.</p>}</CardContent></Card>
  </div>
}
