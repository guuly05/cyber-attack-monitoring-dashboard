"use client"

import { useMemo, useState } from "react"
import { useLiveThreats } from "@/hooks/use-threats"
import type { ThreatIndicator } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CheckCircle2, CircleDot, Search, ShieldAlert, UserRound } from "lucide-react"

type IncidentStatus = "Open" | "Investigating" | "Contained" | "Resolved"
type Incident = { id: string; title: string; status: IncidentStatus; severity: string; updatedAt: string; threats: ThreatIndicator[] }

const statusOrder: IncidentStatus[] = ["Open", "Investigating", "Contained", "Resolved"]

export function IncidentWorkbench() {
  const { threats, isLoading } = useLiveThreats()
  const [filter, setFilter] = useState("")
  const [severity, setSeverity] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Record<string, IncidentStatus>>({})

  const incidents = useMemo<Incident[]>(() => {
    const groups = new Map<string, ThreatIndicator[]>()
    threats.forEach((threat) => {
      const key = `${threat.malwareFamily ?? threat.type}:${threat.source}`
      groups.set(key, [...(groups.get(key) ?? []), threat])
    })
    return [...groups.entries()].map(([key, rows], index) => {
      const hottest = [...rows].sort((a, b) => b.riskScore - a.riskScore)[0]
      return { id: `INC-${String(index + 1).padStart(3, "0")}`, title: `${hottest.malwareFamily ?? hottest.type.toUpperCase()} activity cluster`, status: statuses[`INC-${String(index + 1).padStart(3, "0")}`] ?? (hottest.riskScore >= 90 ? "Investigating" : "Open"), severity: hottest.riskScore >= 90 ? "Critical" : hottest.riskScore >= 75 ? "High" : "Medium", updatedAt: hottest.timestamp, threats: rows.slice(0, 12) }
    }).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  }, [threats, statuses])

  const visible = incidents.filter((incident) => (severity === "all" || incident.severity.toLowerCase() === severity) && `${incident.title} ${incident.id}`.toLowerCase().includes(filter.toLowerCase()))
  const selected = incidents.find((incident) => incident.id === selectedId) ?? visible[0]
  const setStatus = (id: string, status: IncidentStatus) => setStatuses((current) => ({ ...current, [id]: status }))

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
    <Card className="border-border bg-card/90">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-300" /> Correlated incident timeline</CardTitle><Badge variant="outline">{visible.length} clusters</Badge></div>
        <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter incidents or IDs" className="pl-9" /></div><select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-md border border-input bg-background px-3 text-sm"><option value="all">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option></select></div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Correlating live feed…</p>}
        {visible.map((incident) => <button key={incident.id} type="button" onClick={() => setSelectedId(incident.id)} className={cn("w-full rounded-lg border p-4 text-left transition-colors", selected?.id === incident.id ? "border-primary/60 bg-primary/10" : "border-border/70 bg-background/30 hover:border-primary/40")}>
          <div className="flex items-start gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.8)]" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-primary">{incident.id}</span><Badge variant="outline" className={incident.severity === "Critical" ? "border-red-500/40 text-red-300" : "border-orange-500/40 text-orange-300"}>{incident.severity}</Badge><Badge variant="secondary">{incident.status}</Badge></div><p className="mt-2 font-medium">{incident.title}</p><p className="mt-1 text-xs text-muted-foreground">{incident.threats.length} linked indicators · updated {new Date(incident.updatedAt).toLocaleString()}</p></div></div>
        </button>)}
        {!isLoading && !visible.length && <div className="rounded border border-dashed p-8 text-center text-sm text-muted-foreground">No incidents match this filter.</div>}
      </CardContent>
    </Card>
    <Card className="border-primary/20 bg-card/90">
      <CardHeader><CardTitle>{selected ? selected.id : "Incident detail"}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {selected ? <>
          <div><p className="text-lg font-medium">{selected.title}</p><p className="mt-1 text-sm text-muted-foreground">Auto-generated from shared type, malware family, and provider signals.</p></div>
          <div className="grid grid-cols-2 gap-2">{statusOrder.map((status, index) => <button key={status} type="button" onClick={() => setStatus(selected.id, status)} className={cn("rounded border p-2 text-xs", selected.status === status ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}><span className="block font-mono">0{index + 1}</span>{status}</button>)}</div>
          <div className="flex gap-2"><Button size="sm" onClick={() => setStatus(selected.id, "Investigating")} className="gap-1"><CircleDot className="h-3.5 w-3.5" /> Escalate</Button><Button size="sm" variant="outline" onClick={() => setStatus(selected.id, "Contained")} className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Contain</Button><Button size="sm" variant="outline" onClick={() => setStatus(selected.id, "Resolved")} className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Resolve</Button></div>
          <div><div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><UserRound className="h-3.5 w-3.5" /> Assignment</div><Button variant="outline" size="sm" className="w-full justify-start">Assign to SOC queue</Button></div>
          <div><p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Linked IOCs</p><div className="space-y-2">{selected.threats.map((threat) => <div key={threat.id} className="rounded border border-border/70 bg-background/30 p-2"><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs break-all">{threat.ip ?? threat.url ?? threat.host}</span><Badge variant="outline">{threat.riskScore}</Badge></div><p className="mt-1 text-[11px] text-muted-foreground">{threat.source} · {threat.type}</p></div>)}</div></div>
        </> : <p className="text-sm text-muted-foreground">Select an incident to inspect its correlated indicators.</p>}
      </CardContent>
    </Card>
  </div>
}
