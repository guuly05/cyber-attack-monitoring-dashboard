// STIX 2.1 inspired threat data types
export interface ThreatIndicator {
  id: string
  type: "malware" | "phishing" | "botnet" | "ransomware" | "c2" | "unknown"
  timestamp: string
  source: string
  host: string
  url?: string
  ip?: string
  malwareFamily?: string
  riskScore: number // 0-100
  confidence?: number // 0-100
  tags: string[]
  stixType?: string
  stixPattern?: string
  raw?: unknown
}

export interface URLHausEntry {
  id: string
  dateadded: string
  url: string
  url_status: string
  threat: string
  tags: string[]
  host: string
  reporter: string
}

export interface ThreatFoxEntry {
  id: string
  ioc: string
  ioc_type: string
  threat_type: string
  malware: string
  confidence_level: number
  first_seen: string
  last_seen: string
  tags: string[]
}

export interface AbuseIPDBEntry {
  ipAddress: string
  isPublic: boolean
  ipVersion: number
  isWhitelisted: boolean
  abuseConfidenceScore: number
  countryCode: string
  usageType: string
  isp: string
  domain: string
  totalReports: number
  numDistinctUsers: number
  lastReportedAt: string
  reports?: AbuseIPDBReport[]
}

export interface AbuseIPDBReport {
  reportedAt: string
  comment: string
  categories: number[]
  reporterId: number
  reporterCountryCode: string
}

export interface CVEEntry {
  id: string
  summary: string
  cvss?: number
  cvss3?: number
  references: string[]
  vulnerable_product: string[]
  Modified: string
  Published: string
  assigner?: string
  cwe?: string
}

export interface ThreatFile {
  query: string
  queryType: "ip" | "domain" | "cve"
  attackDetails?: {
    urlhaus?: URLHausEntry[]
    threatfox?: ThreatFoxEntry[]
    abuseipdb?: AbuseIPDBEntry
  }
  vulnerability?: CVEEntry
  mitigationStrategies: string[]
  timestamp: string
}

export interface APIStatus {
  urlhaus: "online" | "offline" | "rate-limited"
  threatfox: "online" | "offline" | "rate-limited"
  abuseipdb: "online" | "offline" | "rate-limited"
  cve: "online" | "offline" | "rate-limited"
}

export interface DashboardStats {
  totalThreats: number
  criticalThreats: number
  activeMalware: number
  blockedIPs: number
  last24hChange: number
}
