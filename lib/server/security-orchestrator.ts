import "server-only"

import { randomUUID } from "crypto"
import { sanitizeReportQuery, escapePlainText } from "@/lib/security-input"
import type {
  ExposureSignal,
  InfrastructureSignal,
  ProviderStatus,
  ReportFinding,
  ReportRequest,
  ReputationSignal,
  SecurityEntityType,
  SecurityReport,
  SecurityReportSource,
  VulnerabilitySignal,
} from "@/lib/security-report"

const REPORT_TTL_MS = 10 * 60 * 1000
const DEFAULT_TIMEOUT_MS = 60 * 1000
const CIRCUIT_OPEN_MS = 5 * 60 * 1000
const FAILURE_THRESHOLD = 3

type ProviderId =
  | "contrastapi"
  | "reportedip"
  | "ipdetails"
  | "crtsh"
  | "ripestat"
  | "nvd"
  | "cisa-kev"
  | "circl-cve"
  | "circl-hashlookup"
  | "dshield"
  | "urlhaus"
  | "threatfox"
  | "abuseipdb"

interface ProviderRuntime {
  failures: number
  circuitOpenedAt?: number
  recentCalls: number[]
}

interface ProviderResult {
  source: SecurityReportSource
  findings?: ReportFinding[]
  reputation?: ReputationSignal[]
  vulnerabilities?: VulnerabilitySignal[]
  infrastructure?: InfrastructureSignal[]
  exposures?: ExposureSignal[]
}

interface ProviderDefinition {
  id: ProviderId
  name: string
  types: SecurityEntityType[]
  ttlMs: number
  minIntervalMs: number
  quotaLabel: string
  keyEnv?: string
  endpointEnv?: string
  request: (query: string, type: SecurityEntityType) => Promise<ProviderResult>
}

const providerState = new Map<ProviderId, ProviderRuntime>()
const responseCache = new Map<string, { expiresAt: number; value: ProviderResult }>()

function now() {
  return Date.now()
}

function getState(id: ProviderId): ProviderRuntime {
  const existing = providerState.get(id)
  if (existing) return existing
  const created = { failures: 0, recentCalls: [] }
  providerState.set(id, created)
  return created
}

async function waitForProvider(definition: ProviderDefinition) {
  const state = getState(definition.id)
  const lastCall = state.recentCalls.at(-1) ?? 0
  const waitMs = Math.max(0, definition.minIntervalMs - (now() - lastCall))
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  state.recentCalls.push(now())
  state.recentCalls = state.recentCalls.filter((call) => now() - call < 60 * 60 * 1000)
}

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "CyberShield-SOC-Dashboard/1.0",
        ...(init.headers ?? {}),
      },
    })

    if (response.status === 429) {
      const error = new Error("rate-limited")
      error.name = "RateLimited"
      throw error
    }

    if (!response.ok) {
      throw new Error(`upstream-${response.status}`)
    }

    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

function source(
  id: ProviderId,
  name: string,
  status: ProviderStatus,
  startedAt: number,
  extras: Partial<SecurityReportSource> = {}
): SecurityReportSource {
  return {
    id,
    name,
    status,
    latencyMs: now() - startedAt,
    ...extras,
  }
}

function skipped(definition: ProviderDefinition, message: string): ProviderResult {
  return {
    source: {
      id: definition.id,
      name: definition.name,
      status: "skipped",
      message,
      quota: { label: definition.quotaLabel },
    },
  }
}

function severityFromScore(score?: number): ReportFinding["severity"] {
  if ((score ?? 0) >= 90) return "critical"
  if ((score ?? 0) >= 70) return "high"
  if ((score ?? 0) >= 40) return "medium"
  if ((score ?? 0) > 0) return "low"
  return "info"
}

function verdictFromScore(score?: number): ReputationSignal["verdict"] {
  if ((score ?? 0) >= 80) return "malicious"
  if ((score ?? 0) >= 40) return "suspicious"
  if (score !== undefined) return "clean"
  return "unknown"
}

function normalizeCveFromNvd(item: Record<string, unknown>): VulnerabilitySignal | null {
  const cve = item.cve as Record<string, unknown> | undefined
  if (!cve?.id) return null
  const metrics = cve.metrics as Record<string, unknown> | undefined
  const metric =
    (metrics?.cvssMetricV31 as Record<string, unknown>[] | undefined)?.[0] ??
    (metrics?.cvssMetricV30 as Record<string, unknown>[] | undefined)?.[0] ??
    (metrics?.cvssMetricV2 as Record<string, unknown>[] | undefined)?.[0]
  const cvssData = metric?.cvssData as Record<string, unknown> | undefined
  const descriptions = cve.descriptions as Array<{ lang?: string; value?: string }> | undefined
  const refs = cve.references as { referenceData?: Array<{ url?: string }> } | undefined

  return {
    cveId: escapePlainText(cve.id),
    description: escapePlainText(descriptions?.find((desc) => desc.lang === "en")?.value ?? "No description available."),
    cvss: typeof cvssData?.baseScore === "number" ? cvssData.baseScore : undefined,
    kev: Boolean(cve.cisaExploitAdd),
    cwe: ((cve.weaknesses as Array<{ description?: Array<{ value?: string }> }> | undefined)?.[0]?.description?.[0]?.value),
    published: escapePlainText(cve.published),
    modified: escapePlainText(cve.lastModified),
    references: (refs?.referenceData ?? []).slice(0, 10).map((ref) => escapePlainText(ref.url)),
    affectedProducts: [],
    source: "NVD/NIST",
  }
}

function cveFinding(vulnerability: VulnerabilitySignal): ReportFinding {
  const score = vulnerability.cvss ? vulnerability.cvss * 10 : vulnerability.kev ? 90 : 35
  return {
    id: `${vulnerability.source}-${vulnerability.cveId}`,
    source: vulnerability.source,
    title: vulnerability.kev ? `${vulnerability.cveId} is in CISA KEV` : vulnerability.cveId,
    severity: severityFromScore(score),
    confidence: vulnerability.kev ? 95 : 80,
    summary: vulnerability.description,
    references: vulnerability.references,
    firstSeen: vulnerability.published,
    lastSeen: vulnerability.modified,
    tags: [vulnerability.cveId, vulnerability.kev ? "kev" : "cve"].filter(Boolean),
  }
}

function endpointFromEnv(envName: string, fallback: string) {
  return process.env[envName] || fallback
}

function keyedProvider(
  definition: Omit<ProviderDefinition, "request">,
  handler: (query: string, type: SecurityEntityType, key: string, endpoint: string) => Promise<ProviderResult>
): ProviderDefinition {
  return {
    ...definition,
    request: async (query, type) => {
      const key = definition.keyEnv ? process.env[definition.keyEnv] : undefined
      if (!key) {
        return skipped(definition as ProviderDefinition, `Configure ${definition.keyEnv} on the server to enable this source.`)
      }
      const endpoint = definition.endpointEnv ? endpointFromEnv(definition.endpointEnv, "") : ""
      return handler(query, type, key, endpoint)
    },
  }
}

const providers: ProviderDefinition[] = [
  {
    id: "contrastapi",
    name: "ContrastAPI",
    types: ["domain", "ip", "cve", "hash", "company"],
    ttlMs: REPORT_TTL_MS,
    minIntervalMs: 36_000,
    quotaLabel: "100 req/hr, no key",
    request: async (query, type) => {
      const started = now()
      const endpoint = endpointFromEnv("CONTRASTAPI_BASE_URL", "https://api.contrastcyber.com")
      const path =
        type === "cve"
          ? `/v1/cve/${encodeURIComponent(query)}`
          : type === "domain"
            ? `/v1/audit/${encodeURIComponent(query)}`
            : type === "ip"
              ? `/v1/ip/${encodeURIComponent(query)}`
              : `/v1/ioc/${encodeURIComponent(query)}`
      const data = await fetchJson(`${endpoint}${path}`)
      const payload = data as Record<string, unknown>
      const risk = Number(payload.riskScore ?? payload.score ?? 0)
      return {
        source: source("contrastapi", "ContrastAPI", "fulfilled", started, {
          records: Array.isArray(payload.results) ? payload.results.length : risk > 0 ? 1 : 0,
          quota: { label: "100 req/hr, no key" },
        }),
        reputation: [
          {
            source: "ContrastAPI",
            score: risk || undefined,
            verdict: verdictFromScore(risk),
            confidence: Number(payload.confidence ?? 70),
            categories: ["cve", "epss", "kev", "atlas", "d3fend"],
            summary: escapePlainText(payload.summary ?? payload.verdict ?? "Contrast intelligence returned data."),
          },
        ],
      }
    },
  },
  {
    id: "reportedip",
    name: "ReportedIP",
    types: ["ip"],
    ttlMs: REPORT_TTL_MS,
    minIntervalMs: 90_000,
    quotaLabel: "1,000 checks/day, no key",
    request: async (query) => {
      const started = now()
      const endpoint = endpointFromEnv("REPORTEDIP_BASE_URL", "https://reportedip.de/api/v1")
      const data = (await fetchJson(`${endpoint}/check/${encodeURIComponent(query)}`)) as Record<string, unknown>
      const score = Number(data.confidence ?? data.score ?? data.abuseConfidenceScore ?? 0)
      return {
        source: source("reportedip", "ReportedIP", "fulfilled", started, {
          records: 1,
          quota: { label: "1,000 checks/day, no key" },
        }),
        reputation: [
          {
            source: "ReportedIP",
            score,
            verdict: verdictFromScore(score),
            confidence: score,
            categories: Array.isArray(data.categories) ? data.categories.map(escapePlainText) : ["community-blacklist"],
            summary: escapePlainText(data.message ?? data.summary ?? "Community IP reputation signal."),
          },
        ],
      }
    },
  },
  {
    id: "ipdetails",
    name: "IPDetails.io",
    types: ["ip"],
    ttlMs: REPORT_TTL_MS,
    minIntervalMs: 1_000,
    quotaLabel: "Free, no key",
    request: async (query) => {
      const started = now()
      const endpoint = endpointFromEnv("IPDETAILS_BASE_URL", "https://ipdetails.io/ip")
      const data = (await fetchJson(`${endpoint}/${encodeURIComponent(query)}`)) as Record<string, unknown>
      const security = data.security as Record<string, unknown> | undefined
      const location = data.location as Record<string, unknown> | undefined
      const flags = ["vpn", "proxy", "tor", "hosting"].filter((key) => Boolean(security?.[key] ?? data[key]))
      return {
        source: source("ipdetails", "IPDetails.io", "fulfilled", started, {
          records: 1,
          quota: { label: "Free, no key" },
        }),
        reputation: [
          {
            source: "IPDetails.io",
            verdict: flags.length ? "suspicious" : "unknown",
            confidence: flags.length ? 70 : undefined,
            categories: flags,
            summary: flags.length ? `Network flags detected: ${flags.join(", ")}` : "No proxy/VPN/Tor flags returned.",
          },
        ],
        infrastructure: [
          {
            ip: query,
            asn: escapePlainText(data.asn ?? data.asnNumber),
            organization: escapePlainText(data.org ?? data.organization ?? data.isp),
            country: escapePlainText(data.country ?? location?.country),
            region: escapePlainText(data.region ?? location?.region),
            city: escapePlainText(data.city ?? location?.city),
            latitude: typeof data.latitude === "number" ? data.latitude : undefined,
            longitude: typeof data.longitude === "number" ? data.longitude : undefined,
            source: "IPDetails.io",
            tags: flags,
          },
        ],
      }
    },
  },
  {
    id: "crtsh",
    name: "crt.sh",
    types: ["domain", "company"],
    ttlMs: 15 * 60 * 1000,
    minIntervalMs: 1_000,
    quotaLabel: "No published rate limit",
    request: async (query, type) => {
      const started = now()
      const term = type === "domain" ? `%.${query}` : query
      const data = await fetchJson(`https://crt.sh/?q=${encodeURIComponent(term)}&output=json`, {}, DEFAULT_TIMEOUT_MS)
      const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : []
      const names = new Set<string>()
      for (const row of rows.slice(0, 150)) {
        String(row.name_value ?? "")
          .split(/\n+/)
          .map((item) => item.replace(/^\*\./, "").toLowerCase())
          .filter(Boolean)
          .forEach((name) => names.add(name))
      }
      return {
        source: source("crtsh", "crt.sh", "fulfilled", started, {
          records: names.size,
          quota: { label: "No published rate limit" },
        }),
        exposures: [...names].slice(0, 50).map((name) => ({
          source: "crt.sh",
          type: "subdomain",
          value: escapePlainText(name),
          metadata: { certificates: rows.length },
        })),
      }
    },
  },

  {
    id: "ripestat",
    name: "RIPEstat",
    types: ["ip"],
    ttlMs: REPORT_TTL_MS,
    minIntervalMs: 1_000,
    quotaLabel: "Free, no key",
    request: async (query) => {
      const started = now()
      const data = (await fetchJson(`https://stat.ripe.net/data/prefix-overview/data.json?resource=${encodeURIComponent(query)}`)) as {
        data?: Record<string, unknown>
      }
      const holder = data.data?.asns as Array<{ asn?: number; holder?: string }> | undefined
      return {
        source: source("ripestat", "RIPEstat", "fulfilled", started, {
          records: holder?.length ?? 0,
          quota: { label: "Free, no key" },
        }),
        infrastructure: (holder ?? []).slice(0, 5).map((asn) => ({
          ip: query,
          asn: asn.asn ? `AS${asn.asn}` : undefined,
          organization: escapePlainText(asn.holder),
          network: escapePlainText(data.data?.resource),
          source: "RIPEstat",
          tags: ["asn", "bgp"],
        })),
      }
    },
  },

  {
    id: "nvd",
    name: "NVD/NIST CVE API",
    types: ["cve"],
    ttlMs: 15 * 60 * 1000,
    minIntervalMs: 6_000,
    quotaLabel: "Free, no key",
    request: async (query) => {
      const started = now()
      const data = (await fetchJson(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(query)}`)) as {
        vulnerabilities?: Array<Record<string, unknown>>
      }
      const vulnerabilities = (data.vulnerabilities ?? []).map(normalizeCveFromNvd).filter(Boolean) as VulnerabilitySignal[]
      return {
        source: source("nvd", "NVD/NIST CVE API", "fulfilled", started, {
          records: vulnerabilities.length,
          quota: { label: "Free, no key" },
        }),
        vulnerabilities,
        findings: vulnerabilities.map(cveFinding),
      }
    },
  },
  {
    id: "cisa-kev",
    name: "CISA KEV",
    types: ["cve"],
    ttlMs: 15 * 60 * 1000,
    minIntervalMs: 1_000,
    quotaLabel: "Free, no key",
    request: async (query) => {
      const started = now()
      const data = (await fetchJson("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json")) as {
        vulnerabilities?: Array<Record<string, unknown>>
      }
      const match = data.vulnerabilities?.find((item) => String(item.cveID).toUpperCase() === query)
      if (!match) {
        return { source: source("cisa-kev", "CISA KEV", "fulfilled", started, { records: 0 }) }
      }
      const vulnerability: VulnerabilitySignal = {
        cveId: query,
        title: escapePlainText(match.vulnerabilityName),
        description: escapePlainText(match.shortDescription),
        kev: true,
        published: escapePlainText(match.dateAdded),
        references: [],
        affectedProducts: [escapePlainText(match.vendorProject), escapePlainText(match.product)].filter(Boolean),
        source: "CISA KEV",
      }
      return {
        source: source("cisa-kev", "CISA KEV", "fulfilled", started, { records: 1 }),
        vulnerabilities: [vulnerability],
        findings: [cveFinding(vulnerability)],
      }
    },
  },
  {
    id: "circl-cve",
    name: "CIRCL CVE",
    types: ["cve"],
    ttlMs: 15 * 60 * 1000,
    minIntervalMs: 1_000,
    quotaLabel: "Free, no key",
    request: async (query) => {
      const started = now()
      const data = (await fetchJson(`https://cve.circl.lu/api/cve/${encodeURIComponent(query)}`)) as Record<string, unknown>
      const vulnerability: VulnerabilitySignal = {
        cveId: escapePlainText(data.id ?? query),
        description: escapePlainText(data.summary ?? "No description available."),
        cvss: typeof data.cvss === "number" ? data.cvss : undefined,
        kev: false,
        cwe: escapePlainText(data.cwe),
        published: escapePlainText(data.Published),
        modified: escapePlainText(data.Modified),
        references: Array.isArray(data.references) ? data.references.slice(0, 10).map(escapePlainText) : [],
        affectedProducts: Array.isArray(data.vulnerable_product) ? data.vulnerable_product.slice(0, 20).map(escapePlainText) : [],
        source: "CIRCL CVE",
      }
      return {
        source: source("circl-cve", "CIRCL CVE", "fulfilled", started, { records: data.id ? 1 : 0 }),
        vulnerabilities: data.id ? [vulnerability] : [],
        findings: data.id ? [cveFinding(vulnerability)] : [],
      }
    },
  },
  {
    id: "circl-hashlookup",
    name: "CIRCL hashlookup",
    types: ["hash"],
    ttlMs: 15 * 60 * 1000,
    minIntervalMs: 1_000,
    quotaLabel: "Free, no key",
    request: async (query) => {
      const started = now()
      const hashType = query.length === 32 ? "md5" : query.length === 40 ? "sha1" : "sha256"
      const data = (await fetchJson(`https://hashlookup.circl.lu/lookup/${hashType}/${encodeURIComponent(query)}`)) as Record<string, unknown>
      const known = Boolean(data.KnownMalicious || data.hashlookup || data.FileName)
      return {
        source: source("circl-hashlookup", "CIRCL hashlookup", "fulfilled", started, { records: known ? 1 : 0 }),
        reputation: [
          {
            source: "CIRCL hashlookup",
            verdict: known ? "suspicious" : "unknown",
            confidence: known ? 75 : undefined,
            categories: [hashType, known ? "known-file" : "not-found"],
            summary: escapePlainText(data.FileName ?? data.message ?? "Hash lookup completed."),
          },
        ],
      }
    },
  },

  {
    id: "dshield",
    name: "SANS ISC/DShield",
    types: ["ip"],
    ttlMs: REPORT_TTL_MS,
    minIntervalMs: 1_000,
    quotaLabel: "Free, no key",
    request: async (query) => {
      const started = now()
      const data = (await fetchJson(`https://isc.sans.edu/api/ip/${encodeURIComponent(query)}?json`)) as Record<string, unknown>
      const attacks = Number(data.attacks ?? data.count ?? 0)
      return {
        source: source("dshield", "SANS ISC/DShield", "fulfilled", started, { records: attacks ? 1 : 0 }),
        reputation: [
          {
            source: "SANS ISC/DShield",
            score: Math.min(100, attacks),
            verdict: attacks > 20 ? "suspicious" : "unknown",
            confidence: attacks > 0 ? 65 : undefined,
            categories: ["firewall-logs", "global-sensors"],
            summary: attacks ? `${attacks} DShield observations returned.` : "No recent DShield observations returned.",
          },
        ],
      }
    },
  },

  {
    id: "urlhaus",
    name: "URLhaus",
    types: ["domain", "ip"],
    ttlMs: REPORT_TTL_MS,
    minIntervalMs: 1_000,
    quotaLabel: "Free, no key",
    request: async (query, type) => {
      const started = now()
      const form = new URLSearchParams(type === "ip" ? { host: query } : { host: query })
      const data = (await fetchJson("https://urlhaus-api.abuse.ch/v1/host/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      })) as Record<string, unknown>
      const urls = Array.isArray(data.urls) ? (data.urls as Array<Record<string, unknown>>) : []
      return {
        source: source("urlhaus", "URLhaus", "fulfilled", started, { records: urls.length }),
        findings: urls.slice(0, 15).map((url, index) => ({
          id: `urlhaus-${query}-${index}`,
          source: "URLhaus",
          title: "Malicious URL observed",
          severity: "high",
          confidence: 85,
          summary: escapePlainText(url.url ?? "URLhaus match"),
          firstSeen: escapePlainText(url.date_added),
          references: [escapePlainText(url.urlhaus_reference)].filter(Boolean),
          tags: Array.isArray(url.tags) ? url.tags.slice(0, 8).map(escapePlainText) : ["urlhaus"],
        })),
      }
    },
  },
  {
    id: "threatfox",
    name: "ThreatFox",
    types: ["domain", "ip", "hash"],
    ttlMs: REPORT_TTL_MS,
    minIntervalMs: 1_000,
    quotaLabel: "Free, no key",
    request: async (query) => {
      const started = now()
      const data = (await fetchJson("https://threatfox-api.abuse.ch/api/v1/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "search_ioc", search_term: query, exact_match: true }),
      })) as Record<string, unknown>
      const rows = Array.isArray(data.data) ? (data.data as Array<Record<string, unknown>>) : []
      return {
        source: source("threatfox", "ThreatFox", "fulfilled", started, { records: rows.length }),
        findings: rows.slice(0, 15).map((row, index) => ({
          id: `threatfox-${query}-${index}`,
          source: "ThreatFox",
          title: escapePlainText(row.threat_type ?? "IOC match"),
          severity: severityFromScore(Number(row.confidence_level ?? 70)),
          confidence: Number(row.confidence_level ?? 70),
          summary: escapePlainText(row.ioc ?? query),
          firstSeen: escapePlainText(row.first_seen),
          lastSeen: escapePlainText(row.last_seen),
          tags: [row.malware, row.ioc_type, row.threat_type].map(escapePlainText).filter(Boolean),
        })),
      }
    },
  },

  keyedProvider({ id: "abuseipdb", name: "AbuseIPDB", types: ["ip"], ttlMs: REPORT_TTL_MS, minIntervalMs: 2_000, quotaLabel: "API key", keyEnv: "ABUSEIPDB_API_KEY", endpointEnv: "ABUSEIPDB_API_URL" }, async (query, _type, key, endpoint) => {
    const started = now()
    const base = endpoint || "https://api.abuseipdb.com/api/v2/check"
    const data = (await fetchJson(`${base}?ipAddress=${encodeURIComponent(query)}&maxAgeInDays=90&verbose=true`, {
      headers: { Key: key },
    })) as { data?: Record<string, unknown> }
    const item = data.data ?? {}
    const score = Number(item.abuseConfidenceScore ?? 0)
    return {
      source: source("abuseipdb", "AbuseIPDB", "fulfilled", started, { records: 1 }),
      reputation: [
        {
          source: "AbuseIPDB",
          score,
          verdict: verdictFromScore(score),
          confidence: score,
          categories: ["ip-reputation", "community-reports"],
          summary: `${Number(item.totalReports ?? 0)} reports from ${Number(item.numDistinctUsers ?? 0)} distinct users.`,
        },
      ],
      infrastructure: [
        {
          ip: query,
          country: escapePlainText(item.countryCode),
          organization: escapePlainText(item.isp),
          source: "AbuseIPDB",
          tags: [escapePlainText(item.usageType)].filter(Boolean),
        },
      ],
    }
  }),
]



async function runProvider(definition: ProviderDefinition, query: string, type: SecurityEntityType): Promise<ProviderResult> {
  const started = now()
  const state = getState(definition.id)

  if (state.circuitOpenedAt && now() - state.circuitOpenedAt < CIRCUIT_OPEN_MS) {
    return {
      source: source(definition.id, definition.name, "circuit-open", started, {
        message: "Provider temporarily paused after repeated failures.",
        quota: { label: definition.quotaLabel },
      }),
    }
  }

  const cacheKey = `${definition.id}:${type}:${query}`
  const cached = responseCache.get(cacheKey)
  if (cached && cached.expiresAt > now()) {
    return {
      ...cached.value,
      source: { ...cached.value.source, cached: true },
    }
  }

  try {
    await waitForProvider(definition)
    const result = await definition.request(query, type)
    state.failures = 0
    state.circuitOpenedAt = undefined
    result.source.quota ??= { label: definition.quotaLabel }
    responseCache.set(cacheKey, { expiresAt: now() + definition.ttlMs, value: result })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown"
    const status: ProviderStatus =
      error instanceof Error && error.name === "AbortError"
        ? "timeout"
        : error instanceof Error && error.name === "RateLimited"
          ? "rate-limited"
          : "error"

    if (status === "error" || status === "timeout") {
      state.failures += 1
      if (state.failures >= FAILURE_THRESHOLD) {
        state.circuitOpenedAt = now()
      }
    }

    console.error(`[security-provider:${definition.id}]`, message)

    return {
      source: source(definition.id, definition.name, status, started, {
        message: status === "rate-limited" ? "Provider quota reached. Try again later or skip this source." : "Provider unavailable. Other sources are still shown.",
        quota: { label: definition.quotaLabel },
      }),
    }
  }
}

function calculateRiskScore(
  findings: ReportFinding[],
  reputation: ReputationSignal[],
  vulnerabilities: VulnerabilitySignal[]
) {
  const findingScore = findings.reduce((max, finding) => {
    const score = finding.severity === "critical" ? 95 : finding.severity === "high" ? 80 : finding.severity === "medium" ? 55 : finding.severity === "low" ? 25 : 10
    return Math.max(max, score)
  }, 0)
  const reputationScore = reputation.reduce((max, signal) => Math.max(max, signal.score ?? (signal.verdict === "malicious" ? 85 : signal.verdict === "suspicious" ? 55 : 0)), 0)
  const vulnerabilityScore = vulnerabilities.reduce((max, vulnerability) => Math.max(max, vulnerability.kev ? 95 : (vulnerability.cvss ?? 0) * 10), 0)
  return Math.min(100, Math.round(Math.max(findingScore, reputationScore, vulnerabilityScore)))
}

function riskLevel(score: number): SecurityReport["riskLevel"] {
  if (score >= 90) return "critical"
  if (score >= 70) return "high"
  if (score >= 40) return "medium"
  if (score > 0) return "low"
  return "unknown"
}

function buildMitigations(type: SecurityEntityType, score: number, vulnerabilities: VulnerabilitySignal[]): string[] {
  if (type === "cve") {
    const kev = vulnerabilities.some((item) => item.kev)
    return [
      kev ? "Prioritize emergency remediation because this CVE appears in the CISA KEV catalog." : "Validate asset exposure before scheduling remediation.",
      score >= 70 ? "Create a short-lived exception only if compensating controls are documented." : "Track the CVE in the normal vulnerability management queue.",
      "Monitor exploitation telemetry and vendor advisories until the patch is verified.",
    ]
  }

  if (type === "ip") {
    return [
      score >= 70 ? "Block or challenge the IP at perimeter controls while validating business impact." : "Monitor the IP in SIEM and EDR telemetry before blocking.",
      "Review recent inbound and outbound connections involving this address.",
      "Add a temporary watch rule with source attribution and expiry.",
    ]
  }

  if (type === "domain" || type === "company") {
    return [
      "Review discovered subdomains and certificate names for shadow IT or takeover exposure.",
      score >= 70 ? "Add malicious or suspicious hosts to DNS, proxy, and email controls." : "Tag findings for analyst review before enforcement.",
      "Validate SPF, DKIM, DMARC, and exposed services before contacting owners.",
    ]
  }

  return [
    "Quarantine matching files until hash provenance is confirmed.",
    "Search EDR telemetry for historical executions or downloads.",
    "Preserve samples and logs for incident response review.",
  ]
}

export async function buildSecurityReport(request: ReportRequest): Promise<SecurityReport | { error: string; status: 400 }> {
  const sanitized = sanitizeReportQuery(request.query)
  if (!sanitized) {
    return { error: "Enter a valid company name, IP address, domain, CVE ID, or MD5/SHA1/SHA256 hash.", status: 400 }
  }

  console.info("[security-query]", {
    type: sanitized.type,
    queryHash: Buffer.from(sanitized.value).toString("base64").slice(0, 18),
    timestamp: new Date().toISOString(),
  })

  const skipProviders = new Set(request.skipProviders ?? [])
  const activeProviders = providers.filter((provider) => provider.types.includes(sanitized.type) && !skipProviders.has(provider.id))
  const skippedByUser: ProviderResult[] = providers
    .filter((provider) => provider.types.includes(sanitized.type) && skipProviders.has(provider.id))
    .map((provider) => ({
      source: {
        id: provider.id,
        name: provider.name,
        status: "skipped" as const,
        message: "Skipped for this retry.",
        quota: { label: provider.quotaLabel },
      },
    }))

  const settled = await Promise.all(activeProviders.map((provider) => runProvider(provider, sanitized.value, sanitized.type)))
  const results = [...settled, ...skippedByUser]
  const findings = results.flatMap((result) => result.findings ?? [])
  const reputation = results.flatMap((result) => result.reputation ?? [])
  const vulnerabilities = results.flatMap((result) => result.vulnerabilities ?? [])
  const infrastructure = results.flatMap((result) => result.infrastructure ?? [])
  const exposures = results.flatMap((result) => result.exposures ?? [])
  const riskScore = calculateRiskScore(findings, reputation, vulnerabilities)
  const level = riskLevel(riskScore)
  const topThreats = findings
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8)

  return {
    id: randomUUID(),
    query: request.query,
    entityType: sanitized.type,
    normalizedQuery: sanitized.value,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(now() + REPORT_TTL_MS).toISOString(),
    riskScore,
    riskLevel: level,
    executiveSummary:
      level === "unknown"
        ? `No high-confidence threat signals were returned for ${sanitized.value}. Treat this as absence of evidence, not proof of safety.`
        : `${sanitized.value} currently rates ${level.toUpperCase()} with ${findings.length} finding(s), ${reputation.length} reputation signal(s), and ${vulnerabilities.length} vulnerability record(s).`,
    sources: results.map((result) => result.source),
    findings,
    reputation,
    vulnerabilities,
    infrastructure,
    exposures,
    topThreats,
    mitigations: buildMitigations(sanitized.type, riskScore, vulnerabilities),
    legalDisclaimer: "Use this intelligence for authorized defensive security work only. Third-party data may be incomplete, stale, or rate-limited; verify important decisions with primary sources.",
  }
}
