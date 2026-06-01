export type SecurityEntityType = "ip" | "domain" | "cve" | "hash" | "company"

export type ProviderStatus =
  | "fulfilled"
  | "partial"
  | "skipped"
  | "rate-limited"
  | "timeout"
  | "circuit-open"
  | "error"

export interface SecurityReportSource {
  id: string
  name: string
  status: ProviderStatus
  latencyMs?: number
  cached?: boolean
  message?: string
  records?: number
  quota?: {
    label: string
    limit?: number
    window?: string
  }
}

export interface ReportFinding {
  id: string
  source: string
  title: string
  severity: "critical" | "high" | "medium" | "low" | "info"
  confidence: number
  summary: string
  evidence?: string[]
  firstSeen?: string
  lastSeen?: string
  references?: string[]
  tags: string[]
}

export interface ReputationSignal {
  source: string
  score?: number
  verdict: "malicious" | "suspicious" | "clean" | "unknown"
  confidence?: number
  categories: string[]
  summary?: string
}

export interface VulnerabilitySignal {
  cveId: string
  title?: string
  description: string
  cvss?: number
  epss?: number
  kev: boolean
  cwe?: string
  published?: string
  modified?: string
  references: string[]
  affectedProducts: string[]
  source: string
}

export interface InfrastructureSignal {
  host?: string
  ip?: string
  asn?: string
  organization?: string
  country?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
  network?: string
  source: string
  tags: string[]
}

export interface ExposureSignal {
  source: string
  type: "subdomain" | "certificate" | "dns" | "email" | "breach" | "scan" | "whois"
  value: string
  observedAt?: string
  metadata?: Record<string, string | number | boolean>
}

export interface SecurityReport {
  id: string
  query: string
  entityType: SecurityEntityType
  normalizedQuery: string
  generatedAt: string
  expiresAt: string
  riskScore: number
  riskLevel: "critical" | "high" | "medium" | "low" | "unknown"
  executiveSummary: string
  sources: SecurityReportSource[]
  findings: ReportFinding[]
  reputation: ReputationSignal[]
  vulnerabilities: VulnerabilitySignal[]
  infrastructure: InfrastructureSignal[]
  exposures: ExposureSignal[]
  topThreats: ReportFinding[]
  mitigations: string[]
  legalDisclaimer: string
}

export interface ReportRequest {
  query: string
  skipProviders?: string[]
}
