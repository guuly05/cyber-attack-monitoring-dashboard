import type { ThreatIndicator, URLHausEntry, ThreatFoxEntry } from "./types"

// Map threat types to STIX-like categories
const THREAT_TYPE_MAP: Record<string, ThreatIndicator["type"]> = {
  malware_download: "malware",
  phishing: "phishing",
  botnet_cc: "botnet",
  ransomware: "ransomware",
  payload_delivery: "malware",
  c2: "c2",
}

// Calculate risk score based on threat characteristics
function calculateRiskScore(entry: URLHausEntry | ThreatFoxEntry): number {
  let score = 50 // Base score

  if ("threat" in entry) {
    // URLHaus entry
    const urlhausEntry = entry as URLHausEntry
    if (urlhausEntry.url_status === "online") score += 30
    if (urlhausEntry.threat === "malware_download") score += 15
    if (urlhausEntry.threat === "ransomware") score += 20
    if (urlhausEntry.tags.includes("exe")) score += 5
    if (urlhausEntry.tags.includes("dll")) score += 5
  } else if ("confidence_level" in entry) {
    // ThreatFox entry
    const threatfoxEntry = entry as ThreatFoxEntry
    score = threatfoxEntry.confidence_level || 50
    if (threatfoxEntry.threat_type === "botnet_cc") score += 15
    if (threatfoxEntry.threat_type === "payload_delivery") score += 10
  }

  return Math.min(100, Math.max(0, score))
}

export function normalizeURLHausEntry(entry: URLHausEntry): ThreatIndicator {
  return {
    id: `urlhaus-${entry.id}`,
    type: THREAT_TYPE_MAP[entry.threat] || "unknown",
    timestamp: entry.dateadded,
    source: "URLHaus",
    host: entry.host,
    url: entry.url,
    riskScore: calculateRiskScore(entry),
    tags: entry.tags || [],
    raw: entry,
  }
}

export function normalizeThreatFoxEntry(entry: ThreatFoxEntry): ThreatIndicator {
  return {
    id: `threatfox-${entry.id}`,
    type: THREAT_TYPE_MAP[entry.threat_type] || "unknown",
    timestamp: entry.first_seen,
    source: "ThreatFox",
    host: entry.ioc,
    ip: entry.ioc_type === "ip:port" ? entry.ioc.split(":")[0] : undefined,
    malwareFamily: entry.malware,
    riskScore: calculateRiskScore(entry),
    tags: entry.tags || [],
    raw: entry,
  }
}

export function generateMitigationStrategies(
  queryType: "ip" | "domain" | "cve",
  data: {
    abuseScore?: number
    threatType?: string
    cveId?: string
    cvss?: number
  }
): string[] {
  const strategies: string[] = []

  if (queryType === "ip") {
    strategies.push("Block IP address at Layer 3 firewall immediately")
    strategies.push("Add IP to threat intelligence blocklist")
    if (data.abuseScore && data.abuseScore > 80) {
      strategies.push("Flag all historical connections from this IP for forensic review")
      strategies.push("Update IDS/IPS signatures to detect traffic patterns")
    }
    strategies.push("Monitor network logs for lateral movement indicators")
  }

  if (queryType === "domain") {
    strategies.push("Add domain to DNS sinkhole")
    strategies.push("Block domain in web proxy and firewall")
    strategies.push("Scan endpoints for any historical connections to this domain")
    if (data.threatType === "phishing") {
      strategies.push("Alert users who may have accessed this domain")
      strategies.push("Force password resets for potentially compromised accounts")
    }
    if (data.threatType === "botnet") {
      strategies.push("Isolate potentially infected systems for malware scan")
    }
  }

  if (queryType === "cve") {
    strategies.push(`Review official vendor advisory for ${data.cveId}`)
    strategies.push("Inventory all systems running affected software versions")
    if (data.cvss && data.cvss >= 9) {
      strategies.push("CRITICAL: Apply emergency patch immediately")
      strategies.push("Consider temporary service isolation until patched")
    } else if (data.cvss && data.cvss >= 7) {
      strategies.push("Schedule priority patching within 24-48 hours")
    } else {
      strategies.push("Include in next maintenance window patching cycle")
    }
    strategies.push("Update vulnerability scanner signatures")
    strategies.push("Monitor for exploitation attempts in SIEM")
  }

  return strategies
}
