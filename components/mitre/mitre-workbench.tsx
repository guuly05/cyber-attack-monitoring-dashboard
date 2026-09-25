"use client"

import { useMemo, useState } from "react"
import { useLiveThreats } from "@/hooks/use-threats"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crosshair, ShieldCheck } from "lucide-react"

const tactics = [
  ["Initial Access", ["T1566 Phishing", "T1190 Exploit Public-Facing App"]],
  ["Execution", ["T1059 Command and Scripting"]],
  ["Command & Control", ["T1071 Web Protocols", "T1573 Encrypted Channel"]],
  ["Impact", ["T1486 Data Encrypted for Impact", "T1490 Inhibit Recovery"]],
  ["Credential Access", ["T1003 OS Credential Dumping"]],
]
const mapType = (type: string) => type === "phishing" ? "Initial Access" : type === "ransomware" ? "Impact" : type === "c2" || type === "botnet" ? "Command & Control" : type === "malware" ? "Execution" : "Credential Access"

export function MitreWorkbench() {
  const { threats } = useLiveThreats()
  const [active, setActive] = useState<string | null>(null)
  const observed: Set<string> = useMemo(() => new Set<string>(threats.map((threat) => mapType(threat.type))), [threats])
  const selectedThreats = active ? threats.filter((threat) => mapType(threat.type) === active) : threats
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><Card className="border-border bg-card/90"><CardHeader><CardTitle className="flex items-center gap-2"><Crosshair className="h-5 w-5 text-red-300" /> ATT&CK coverage matrix</CardTitle></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-5">{tactics.map(([tactic, techniques]) => { const name = String(tactic); const isObserved = observed.has(name); return <button key={name} type="button" onClick={() => setActive(active === name ? null : name)} className={`rounded border p-3 text-left transition-colors ${active === name ? "border-primary bg-primary/10" : isObserved ? "border-orange-500/40 bg-orange-500/5" : "border-border/70 bg-background/30"}`}><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">{name}</p><span className={`h-2 w-2 rounded-full ${isObserved ? "bg-orange-400" : "bg-muted-foreground/30"}`} /></div><div className="mt-3 space-y-2">{(techniques as string[]).map((technique) => <p key={technique} className="text-[11px] leading-4 text-muted-foreground">{technique}</p>)}</div></button> })}</div><div className="mt-5 flex flex-wrap gap-2"><Badge variant="outline" className="border-orange-500/40 text-orange-300">Observed tactic</Badge><Badge variant="outline" className="border-border">Coverage gap</Badge><span className="text-xs text-muted-foreground">Click a tactic to inspect linked indicators.</span></div></CardContent></Card><Card className="border-primary/20 bg-card/90"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-teal-300" /> {active ?? "All"} indicators</CardTitle></CardHeader><CardContent className="space-y-2">{selectedThreats.length ? selectedThreats.slice(0, 12).map((threat) => <div key={threat.id} className="rounded border border-border/70 p-3"><div className="flex items-center justify-between gap-2"><span className="break-all font-mono text-xs">{threat.ip ?? threat.url ?? threat.host}</span><Badge variant="outline">{threat.riskScore}</Badge></div><p className="mt-1 text-[11px] text-muted-foreground">{threat.type} · {threat.source}</p></div>) : <p className="text-sm text-muted-foreground">No indicators mapped yet.</p>}</CardContent></Card></div>
}
