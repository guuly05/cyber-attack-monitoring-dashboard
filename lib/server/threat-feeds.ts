import "server-only"

import type { ThreatIndicator } from "@/lib/types"

export type FeedStatus = "online" | "offline" | "rate-limited"

export interface ThreatFeedResult {
  threats: ThreatIndicator[]
  status: FeedStatus
  timestamp: string
  message?: string
}

const timeoutMs = 12_000

const fallbackURLHaus: ThreatIndicator[] = [
  { id: "fallback-urlhaus-1", type: "malware", timestamp: "2026-09-23T08:12:00.000Z", source: "URLHaus snapshot", host: "198.51.100.23", url: "http://198.51.100.23/payload.exe", ip: "198.51.100.23", malwareFamily: "Emotet", riskScore: 88, confidence: 82, tags: ["urlhaus", "malware", "snapshot"], stixType: "indicator", stixPattern: "[url:value = 'http://198.51.100.23/payload.exe']" },
  { id: "fallback-urlhaus-2", type: "phishing", timestamp: "2026-09-23T06:47:00.000Z", source: "URLHaus snapshot", host: "203.0.113.44", url: "https://203.0.113.44/login", ip: "203.0.113.44", riskScore: 76, confidence: 78, tags: ["urlhaus", "phishing", "snapshot"], stixType: "indicator", stixPattern: "[url:value = 'https://203.0.113.44/login']" },
  { id: "fallback-urlhaus-3", type: "c2", timestamp: "2026-09-22T19:25:00.000Z", source: "URLHaus snapshot", host: "192.0.2.91", ip: "192.0.2.91", riskScore: 69, confidence: 75, tags: ["urlhaus", "c2", "snapshot"], stixType: "indicator", stixPattern: "[ipv4-addr:value = '192.0.2.91']" },
]

const fallbackThreatFox: ThreatIndicator[] = [
  { id: "fallback-threatfox-1", type: "botnet", timestamp: "2026-09-23T07:32:00.000Z", source: "ThreatFox snapshot", host: "198.51.100.77:443", ip: "198.51.100.77", malwareFamily: "Mirai", riskScore: 91, confidence: 94, tags: ["threatfox", "botnet", "snapshot"], stixType: "indicator", stixPattern: "[network-traffic:dst_ref.value = '198.51.100.77']" },
  { id: "fallback-threatfox-2", type: "malware", timestamp: "2026-09-22T16:10:00.000Z", source: "ThreatFox snapshot", host: "update-control.example", malwareFamily: "AsyncRAT", riskScore: 83, confidence: 89, tags: ["threatfox", "malware", "snapshot"], stixType: "indicator", stixPattern: "[domain-name:value = 'update-control.example']" },
  { id: "fallback-threatfox-3", type: "ransomware", timestamp: "2026-09-21T11:05:00.000Z", source: "ThreatFox snapshot", host: "203.0.113.88", ip: "203.0.113.88", malwareFamily: "LockBit", riskScore: 96, confidence: 91, tags: ["threatfox", "ransomware", "snapshot"], stixType: "indicator", stixPattern: "[ipv4-addr:value = '203.0.113.88']" },
]

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "CyberShield-SOC-Dashboard/1.0", ...(init?.headers ?? {}) } })
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeType(value: string): ThreatIndicator["type"] {
  const normalized = value.toLowerCase()
  if (normalized.includes("ransom")) return "ransomware"
  if (normalized.includes("phish")) return "phishing"
  if (normalized.includes("bot")) return "botnet"
  if (normalized.includes("c2") || normalized.includes("command")) return "c2"
  if (normalized.includes("malware") || normalized.includes("payload")) return "malware"
  return "unknown"
}

function score(confidence: number, type: ThreatIndicator["type"]) {
  const baseline = type === "ransomware" ? 92 : type === "malware" ? 82 : type === "c2" ? 78 : 68
  return Math.max(0, Math.min(100, Math.round((baseline + confidence) / 2)))
}

export async function getURLHausThreats(limit = 50): Promise<ThreatFeedResult> {
  try {
    const response = await fetchWithTimeout("https://urlhaus-api.abuse.ch/v1/urls/recent/", { method: "POST", body: new URLSearchParams({ limit: String(Math.min(limit, 100)) }), headers: { "Content-Type": "application/x-www-form-urlencoded" }, cache: "no-store" })
    if (!response.ok) throw new Error(`URLhaus upstream ${response.status}`)
    const payload = await response.json() as { urls?: Array<Record<string, unknown>> }
    const threats = (payload.urls ?? []).map((row, index) => {
      const url = String(row.url ?? row.host ?? "unknown")
      const tags = Array.isArray(row.tags) ? row.tags.map(String) : []
      const confidence = 80
      return { id: `urlhaus-${String(row.id ?? index)}-${String(row.dateadded ?? "")}`, type: normalizeType(String(row.threat ?? tags.join(" ") ?? "malware")), timestamp: String(row.dateadded ?? new Date().toISOString()), source: "URLHaus", host: String(row.host ?? url), url, ip: typeof row.host === "string" && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(row.host) ? row.host : undefined, riskScore: score(confidence, normalizeType(String(row.threat ?? "malware"))), confidence, tags: ["urlhaus", ...tags].slice(0, 8), stixType: "indicator", stixPattern: `[url:value = '${url.replaceAll("'", "\\'")}']`, raw: row } satisfies ThreatIndicator
    })
    return { threats, status: "online", timestamp: new Date().toISOString(), message: "Live URLHaus telemetry" }
  } catch (error) {
    return { threats: fallbackURLHaus, status: "offline", timestamp: new Date().toISOString(), message: `URLHaus unavailable; showing the last curated baseline snapshot (${error instanceof Error ? error.message : "upstream error"}).` }
  }
}

export async function getThreatFoxThreats(limit = 50): Promise<ThreatFeedResult> {
  try {
    const response = await fetchWithTimeout("https://threatfox-api.abuse.ch/api/v1/", { method: "POST", body: JSON.stringify({ query: "get_iocs", days: 3 }), headers: { "Content-Type": "application/json" }, cache: "no-store" })
    if (!response.ok) throw new Error(`ThreatFox upstream ${response.status}`)
    const payload = await response.json() as { data?: Array<Record<string, unknown>> }
    const threats = (payload.data ?? []).slice(0, limit).map((row, index) => {
      const type = normalizeType(String(row.threat_type ?? row.malware ?? "malware"))
      const confidence = Number(row.confidence_level ?? 80)
      const host = String(row.ioc ?? "unknown")
      const tags = Array.isArray(row.tags) ? row.tags.map(String) : []
      return { id: `threatfox-${String(row.id ?? index)}-${String(row.first_seen ?? "")}`, type, timestamp: String(row.first_seen ?? row.last_seen ?? new Date().toISOString()), source: "ThreatFox", host, ip: /^\d{1,3}(?:\.\d{1,3}){3}/.test(host) ? host.split(":")[0] : undefined, malwareFamily: String(row.malware_printable ?? row.malware ?? "unknown"), riskScore: score(confidence, type), confidence, tags: ["threatfox", ...tags].slice(0, 8), stixType: "indicator", stixPattern: `[${String(row.ioc_type ?? "artifact").replaceAll("'", "")} = '${host.replaceAll("'", "\\'")}']`, raw: row } satisfies ThreatIndicator
    })
    return { threats, status: "online", timestamp: new Date().toISOString(), message: "Live ThreatFox telemetry" }
  } catch (error) {
    return { threats: fallbackThreatFox, status: "offline", timestamp: new Date().toISOString(), message: `ThreatFox unavailable; showing the last curated baseline snapshot (${error instanceof Error ? error.message : "upstream error"}).` }
  }
}

export async function getThreatFeeds(limit = 50) {
  const [urlhaus, threatfox] = await Promise.all([getURLHausThreats(limit), getThreatFoxThreats(limit)])
  return { urlhaus, threatfox, threats: [...urlhaus.threats, ...threatfox.threats].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)), timestamp: new Date().toISOString() }
}
