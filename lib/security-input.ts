import type { SecurityEntityType } from "@/lib/security-report"

const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/
const IPV6_RE = /^(?:(?:[a-fA-F0-9]{1,4}:){2,7}[a-fA-F0-9]{1,4}|::1|::)$/
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/
const CVE_RE = /^CVE-\d{4}-\d{4,}$/i
const HASH_RE = /^(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/
const COMPANY_RE = /^[a-zA-Z0-9][a-zA-Z0-9 .,&'()_-]{1,78}[a-zA-Z0-9)]$/
const DANGEROUS_RE = /[<>{}[\]\\`$;|]|\b(?:javascript|data|vbscript):/i

export interface SanitizedQuery {
  value: string
  type: SecurityEntityType
}

export function sanitizeReportQuery(input: string): SanitizedQuery | null {
  const cleaned = input.trim().replace(/\s+/g, " ")

  if (!cleaned || cleaned.length > 120 || DANGEROUS_RE.test(cleaned)) {
    return null
  }

  if (CVE_RE.test(cleaned)) {
    return { value: cleaned.toUpperCase(), type: "cve" }
  }

  if (IPV4_RE.test(cleaned) || IPV6_RE.test(cleaned)) {
    return { value: cleaned, type: "ip" }
  }

  if (HASH_RE.test(cleaned)) {
    return { value: cleaned.toLowerCase(), type: "hash" }
  }

  if (DOMAIN_RE.test(cleaned)) {
    return { value: cleaned.toLowerCase(), type: "domain" }
  }

  if (COMPANY_RE.test(cleaned)) {
    return { value: cleaned, type: "company" }
  }

  return null
}

export function escapePlainText(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .slice(0, 5000)
}

export function toSafeStringArray(value: unknown, limit = 20): string[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, limit).map(escapePlainText).filter(Boolean)
}
