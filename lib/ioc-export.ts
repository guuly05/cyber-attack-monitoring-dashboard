import type { ThreatIndicator } from "@/lib/types"

export type IOCFormat = "csv" | "stix" | "txt"

function escapeCSV(value: unknown) {
  const text = String(value ?? "")
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function exportIOCContent(threats: ThreatIndicator[], format: IOCFormat) {
  if (format === "txt") return threats.map((threat) => threat.ip ?? threat.url ?? threat.host).join("\n")
  if (format === "csv") {
    const header = ["id", "type", "indicator", "source", "malwareFamily", "riskScore", "confidence", "timestamp", "tags"]
    const rows = threats.map((threat) => [threat.id, threat.type, threat.ip ?? threat.url ?? threat.host, threat.source, threat.malwareFamily, threat.riskScore, threat.confidence, threat.timestamp, threat.tags.join("|")])
    return [header, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n")
  }
  return JSON.stringify({ type: "bundle", id: `bundle--${crypto.randomUUID()}`, spec_version: "2.1", objects: threats.map((threat) => ({ type: "indicator", id: `indicator--${threat.id.replace(/[^a-zA-Z0-9-]/g, "-")}`, created: threat.timestamp, modified: threat.timestamp, pattern: threat.stixPattern ?? `[artifact:value = '${(threat.ip ?? threat.url ?? threat.host).replaceAll("'", "\\'")}']`, pattern_type: "stix", labels: [threat.type, ...threat.tags], confidence: threat.confidence })) }, null, 2)
}

export function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
