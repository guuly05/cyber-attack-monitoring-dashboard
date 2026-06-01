"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleDot,
  DatabaseZap,
  ExternalLink,
  FileWarning,
  Globe2,
  MapPinned,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  SkipForward,
  Terminal,
  Zap,
} from "lucide-react"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useSecurityReport } from "@/hooks/use-threats"
import type { ProviderStatus, SecurityReport } from "@/lib/security-report"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const riskColors: Record<SecurityReport["riskLevel"], string> = {
  critical: "text-red-300 border-red-500/40 bg-red-500/10",
  high: "text-orange-300 border-orange-500/40 bg-orange-500/10",
  medium: "text-yellow-300 border-yellow-500/40 bg-yellow-500/10",
  low: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  unknown: "text-slate-300 border-slate-500/40 bg-slate-500/10",
}

const statusStyles: Record<ProviderStatus, string> = {
  fulfilled: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  partial: "text-yellow-300 border-yellow-500/30 bg-yellow-500/10",
  skipped: "text-slate-300 border-slate-500/30 bg-slate-500/10",
  "rate-limited": "text-amber-300 border-amber-500/30 bg-amber-500/10",
  timeout: "text-orange-300 border-orange-500/30 bg-orange-500/10",
  "circuit-open": "text-red-300 border-red-500/30 bg-red-500/10",
  error: "text-red-300 border-red-500/30 bg-red-500/10",
}

interface SecurityCommandCenterProps {
  initialQuery?: string
  compact?: boolean
}

export function SecurityCommandCenter({ initialQuery = "", compact = false }: SecurityCommandCenterProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryFromUrl = searchParams.get("q") ?? initialQuery
  const [input, setInput] = useState(queryFromUrl)
  const [query, setQuery] = useState(queryFromUrl)
  const [skipProviders, setSkipProviders] = useState<string[]>([])
  const { data, isFetching, isError, error, refetch } = useSecurityReport(query, skipProviders)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next = input.trim()
    if (!next) return
    setSkipProviders([])
    setQuery(next)
    router.replace(`/search?q=${encodeURIComponent(next)}`)
  }

  const skipProvider = (providerId: string) => {
    setSkipProviders((current) => Array.from(new Set([...current, providerId])))
  }

  return (
    <div className="space-y-5">
      <section className={cn("relative overflow-hidden border-b border-primary/20 bg-[radial-gradient(circle_at_top_left,#0f3f3a55,transparent_32%),linear-gradient(135deg,#020303,#071312_52%,#020303)]", compact ? "rounded-lg border" : "")}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.07)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-teal-200/80">
            <Terminal className="h-4 w-4" />
            SOC unified entity search
            <span className="h-1 w-1 rounded-full bg-teal-300" />
            server-side intelligence fanout
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-300" />
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Search company, domain, IP, hash, or CVE-ID"
                className="h-14 border-teal-400/30 bg-black/70 pl-12 font-mono text-base text-teal-50 shadow-[0_0_30px_rgba(20,184,166,0.12)] placeholder:text-slate-500 focus-visible:ring-teal-300"
              />
            </div>
            <Button type="submit" className="h-14 gap-2 bg-teal-300 px-6 font-semibold text-black hover:bg-teal-200" disabled={isFetching || !input.trim()}>
              {isFetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
              Investigate
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
            {["cloudflare.com", "8.8.8.8", "CVE-2021-44228", "Microsoft"].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setInput(sample)
                  setQuery(sample)
                  router.replace(`/search?q=${encodeURIComponent(sample)}`)
                }}
                className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono hover:border-teal-300/50 hover:text-teal-100"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isError && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-red-100">
              <AlertTriangle className="h-5 w-5 text-red-300" />
              <span>{error instanceof Error ? error.message : "Report failed. Please retry with a valid entity."}</span>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {isFetching && !data && <ReportSkeleton />}

      {data && (
        <div className="mx-auto grid max-w-7xl gap-5 px-4 md:px-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <ReportOverview report={data} isFetching={isFetching} />
            <ThreatCharts report={data} />
            <FindingsPanel report={data} />
            <ExposurePanel report={data} />
          </div>
          <aside className="space-y-5">
            <SourceHealth report={data} onSkip={skipProvider} onRetry={() => refetch()} />
            <GeoPanel report={data} />
            <MitigationPanel report={data} />
          </aside>
        </div>
      )}

      {!query && !data && !isFetching && (
        <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3 md:px-6">
          <StarterPanel icon={<Server className="h-5 w-5" />} title="IP intelligence" text="Reputation, ASN, proxy/Tor/VPN, abuse, scanner and firewall-sensor context." />
          <StarterPanel icon={<Globe2 className="h-5 w-5" />} title="Domain posture" text="Certificate transparency, IOC enrichment, URL reputation, DNS and public exposure signals." />
          <StarterPanel icon={<FileWarning className="h-5 w-5" />} title="CVE triage" text="NVD, CIRCL, CISA KEV, EPSS-ready providers and mitigation-focused summaries." />
        </div>
      )}
    </div>
  )
}

function ReportOverview({ report, isFetching }: { report: SecurityReport; isFetching: boolean }) {
  return (
    <Card className="border-teal-500/20 bg-card/90">
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-teal-400/40 bg-teal-400/10 font-mono text-teal-200">
                {report.entityType.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={cn("font-mono", riskColors[report.riskLevel])}>
                {report.riskLevel.toUpperCase()}
              </Badge>
              {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-teal-300" />}
            </div>
            <h2 className="mt-3 break-all font-mono text-2xl font-semibold text-teal-50">{report.normalizedQuery}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{report.executiveSummary}</p>
          </div>
          <div className="min-w-40 rounded border border-white/10 bg-black/40 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-500">Risk Score</p>
            <p className="font-mono text-5xl font-bold text-teal-200">{report.riskScore}</p>
            <p className="text-xs text-slate-500">expires {new Date(report.expiresAt).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Findings" value={report.findings.length} icon={<ShieldAlert className="h-4 w-4 text-red-300" />} />
          <Metric label="Intel Sources" value={report.sources.length} icon={<DatabaseZap className="h-4 w-4 text-teal-300" />} />
          <Metric label="Exposures" value={report.exposures.length} icon={<Globe2 className="h-4 w-4 text-sky-300" />} />
          <Metric label="Vulnerabilities" value={report.vulnerabilities.length} icon={<FileWarning className="h-4 w-4 text-yellow-300" />} />
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded border border-white/10 bg-white/[0.03] p-3">
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-mono text-2xl text-slate-100">{value}</p>
      </div>
      {icon}
    </div>
  )
}

function ThreatCharts({ report }: { report: SecurityReport }) {
  const severityData = useMemo(() => {
    const counts = report.findings.reduce<Record<string, number>>((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] ?? 0) + 1
      return acc
    }, {})
    return ["critical", "high", "medium", "low", "info"].map((severity) => ({
      severity,
      count: counts[severity] ?? 0,
    }))
  }, [report.findings])

  const sourceData = useMemo(
    () =>
      report.sources
        .filter((source) => source.records)
        .slice(0, 8)
        .map((source) => ({ name: source.name, records: source.records ?? 0 })),
    [report.sources]
  )

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="border-border bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-teal-300" />
            Finding Severity
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityData}>
              <XAxis dataKey="severity" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#050807", border: "1px solid #1f3b37" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {severityData.map((entry) => (
                  <Cell key={entry.severity} fill={entry.severity === "critical" ? "#f87171" : entry.severity === "high" ? "#fb923c" : entry.severity === "medium" ? "#facc15" : "#2dd4bf"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="border-border bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CircleDot className="h-4 w-4 text-teal-300" />
            Source Yield
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {sourceData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} dataKey="records" nameKey="name" innerRadius={50} outerRadius={82}>
                  {sourceData.map((entry, index) => (
                    <Cell key={entry.name} fill={["#2dd4bf", "#38bdf8", "#facc15", "#fb923c", "#f87171", "#a3e635", "#e879f9", "#94a3b8"][index % 8]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#050807", border: "1px solid #1f3b37" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No source records yet." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FindingsPanel({ report }: { report: SecurityReport }) {
  const rows = report.topThreats.length ? report.topThreats : report.findings.slice(0, 8)
  return (
    <Card className="border-border bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-5 w-5 text-red-300" />
          Top Threats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="space-y-2">
            {rows.map((finding) => (
              <div key={finding.id} className="rounded border border-white/10 bg-white/[0.03] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("font-mono", riskColors[finding.severity === "critical" ? "critical" : finding.severity === "high" ? "high" : finding.severity === "medium" ? "medium" : "low"])}>
                    {finding.severity}
                  </Badge>
                  <span className="font-mono text-xs text-slate-500">{finding.source}</span>
                  <span className="ml-auto font-mono text-xs text-teal-300">{finding.confidence}% confidence</span>
                </div>
                <p className="mt-2 font-medium text-slate-100">{finding.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{finding.summary}</p>
                {!!finding.references?.length && (
                  <a href={finding.references[0]} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-teal-300 hover:underline">
                    Reference <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No high-confidence findings returned." />
        )}
      </CardContent>
    </Card>
  )
}

function ExposurePanel({ report }: { report: SecurityReport }) {
  return (
    <Card className="border-border bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-sky-300" />
          Exposure Inventory
        </CardTitle>
      </CardHeader>
      <CardContent>
        {report.exposures.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {report.exposures.slice(0, 24).map((exposure, index) => (
              <div key={`${exposure.source}-${exposure.value}-${index}`} className="rounded border border-white/10 bg-black/30 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">{exposure.type}</Badge>
                  <span className="text-xs text-slate-500">{exposure.source}</span>
                </div>
                <p className="mt-2 break-all font-mono text-sm text-slate-200">{exposure.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No public exposures returned for this entity." />
        )}
      </CardContent>
    </Card>
  )
}

function SourceHealth({ report, onSkip, onRetry }: { report: SecurityReport; onSkip: (id: string) => void; onRetry: () => void }) {
  return (
    <Card className="border-border bg-card/90">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Source Health
          <Button variant="ghost" size="sm" onClick={onRetry} className="h-8 gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {report.sources.map((source) => (
          <div key={source.id} className="rounded border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("font-mono text-[10px]", statusStyles[source.status])}>
                {source.status}
              </Badge>
              <span className="text-sm text-slate-200">{source.name}</span>
              <span className="ml-auto font-mono text-xs text-slate-500">{source.latencyMs ?? 0}ms</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{source.message ?? source.quota?.label}</p>
            {source.status !== "fulfilled" && source.status !== "skipped" && (
              <Button variant="ghost" size="sm" onClick={() => onSkip(source.id)} className="mt-2 h-7 gap-1 text-xs">
                <SkipForward className="h-3 w-3" />
                Skip on retry
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function GeoPanel({ report }: { report: SecurityReport }) {
  const geo = report.infrastructure.filter((item) => item.country || item.asn || item.organization).slice(0, 8)
  return (
    <Card className="border-border bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPinned className="h-5 w-5 text-teal-300" />
          Network Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 h-32 overflow-hidden rounded border border-teal-500/20 bg-[radial-gradient(circle_at_20%_40%,rgba(45,212,191,.28),transparent_12%),radial-gradient(circle_at_68%_45%,rgba(56,189,248,.24),transparent_10%),radial-gradient(circle_at_45%_70%,rgba(250,204,21,.18),transparent_8%),linear-gradient(135deg,#020303,#0b1513)]" />
        {geo.length ? (
          <div className="space-y-2">
            {geo.map((item, index) => (
              <div key={`${item.source}-${index}`} className="rounded border border-white/10 bg-white/[0.03] p-2">
                <p className="font-mono text-sm text-slate-200">{item.asn ?? item.ip ?? item.host ?? "network"}</p>
                <p className="text-xs text-slate-500">{[item.organization, item.city, item.region, item.country].filter(Boolean).join(" / ")}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No geolocation or ASN data available." />
        )}
      </CardContent>
    </Card>
  )
}

function MitigationPanel({ report }: { report: SecurityReport }) {
  return (
    <Card className="border-teal-500/20 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          Analyst Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {report.mitigations.map((item) => (
          <div key={item} className="flex gap-2 text-sm text-slate-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <span>{item}</span>
          </div>
        ))}
        <p className="border-t border-white/10 pt-3 text-xs leading-5 text-slate-500">{report.legalDisclaimer}</p>
      </CardContent>
    </Card>
  )
}

function StarterPanel({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="border-border bg-card/80">
      <CardContent className="p-5">
        <div className="mb-4 inline-flex rounded border border-teal-400/20 bg-teal-400/10 p-2 text-teal-200">{icon}</div>
        <h3 className="font-mono text-lg text-slate-100">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex min-h-28 items-center justify-center rounded border border-dashed border-white/10 text-sm text-slate-500">{text}</div>
}

function ReportSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 md:px-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <Skeleton className="h-52 border border-white/10 bg-white/[0.05]" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-72 border border-white/10 bg-white/[0.05]" />
          <Skeleton className="h-72 border border-white/10 bg-white/[0.05]" />
        </div>
        <Skeleton className="h-96 border border-white/10 bg-white/[0.05]" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-96 border border-white/10 bg-white/[0.05]" />
        <Skeleton className="h-72 border border-white/10 bg-white/[0.05]" />
      </div>
    </div>
  )
}
