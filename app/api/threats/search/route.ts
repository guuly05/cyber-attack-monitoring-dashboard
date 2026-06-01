import { NextRequest, NextResponse } from "next/server"
import { generateMitigationStrategies } from "@/lib/threat-normalizer"

export const dynamic = "force-dynamic"

// Input validation
function sanitizeInput(input: string): { value: string; type: "ip" | "domain" | "cve" } | null {
  const cleaned = input.trim()
  
  // Check for CVE format first
  const cveRegex = /^CVE-\d{4}-\d{4,}$/i
  if (cveRegex.test(cleaned)) {
    return { value: cleaned.toUpperCase(), type: "cve" }
  }
  
  // Check for IP address
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  if (ipv4Regex.test(cleaned)) {
    return { value: cleaned, type: "ip" }
  }
  
  // Check for domain
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  if (domainRegex.test(cleaned)) {
    return { value: cleaned.toLowerCase(), type: "domain" }
  }
  
  return null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required", status: "error" },
      { status: 400 }
    )
  }

  const sanitized = sanitizeInput(query)
  if (!sanitized) {
    return NextResponse.json(
      { error: "Invalid input. Please enter a valid IP address, domain, or CVE ID", status: "error" },
      { status: 400 }
    )
  }

  const { value, type } = sanitized
  const baseUrl = request.nextUrl.origin

  try {
    const results: Record<string, unknown> = {
      query: value,
      queryType: type,
      timestamp: new Date().toISOString(),
    }

    // Parallel fetch based on query type
    const fetchPromises: Promise<{ key: string; data: unknown }>[] = []

    if (type === "ip") {
      // Fetch AbuseIPDB data
      fetchPromises.push(
        fetch(`${baseUrl}/api/threats/abuseipdb?ip=${encodeURIComponent(value)}`)
          .then(res => res.json())
          .then(data => ({ key: "abuseipdb", data }))
          .catch(() => ({ key: "abuseipdb", data: { status: "offline" } }))
      )

      // Search URLHaus for this IP
      fetchPromises.push(
        fetch(`${baseUrl}/api/threats/urlhaus`)
          .then(res => res.json())
          .then(data => {
            const filtered = data.threats?.filter((t: { host?: string; ip?: string }) => 
              t.host?.includes(value) || t.ip === value
            ) || []
            return { key: "urlhaus", data: { threats: filtered, status: data.status } }
          })
          .catch(() => ({ key: "urlhaus", data: { status: "offline" } }))
      )
    }

    if (type === "domain") {
      // Search URLHaus for this domain
      fetchPromises.push(
        fetch(`${baseUrl}/api/threats/urlhaus`)
          .then(res => res.json())
          .then(data => {
            const filtered = data.threats?.filter((t: { host?: string }) => 
              t.host?.includes(value)
            ) || []
            return { key: "urlhaus", data: { threats: filtered, status: data.status } }
          })
          .catch(() => ({ key: "urlhaus", data: { status: "offline" } }))
      )

      // Search ThreatFox
      fetchPromises.push(
        fetch(`${baseUrl}/api/threats/threatfox`)
          .then(res => res.json())
          .then(data => {
            const filtered = data.threats?.filter((t: { host?: string }) => 
              t.host?.includes(value)
            ) || []
            return { key: "threatfox", data: { threats: filtered, status: data.status } }
          })
          .catch(() => ({ key: "threatfox", data: { status: "offline" } }))
      )
    }

    if (type === "cve") {
      // Fetch CVE details
      fetchPromises.push(
        fetch(`${baseUrl}/api/threats/cve?id=${encodeURIComponent(value)}`)
          .then(res => res.json())
          .then(data => ({ key: "cve", data }))
          .catch(() => ({ key: "cve", data: { status: "offline" } }))
      )
    }

    // Execute all fetches in parallel
    const responses = await Promise.all(fetchPromises)
    
    for (const { key, data } of responses) {
      results[key] = data
    }

    // Generate mitigation strategies based on results
    let mitigationData = {}
    if (type === "ip" && results.abuseipdb) {
      const abuseData = results.abuseipdb as { data?: { abuseConfidenceScore?: number } }
      mitigationData = { abuseScore: abuseData.data?.abuseConfidenceScore }
    }
    if (type === "cve" && results.cve) {
      const cveData = results.cve as { data?: { cvss?: number; cvss3?: number } }
      mitigationData = { 
        cveId: value, 
        cvss: cveData.data?.cvss3 || cveData.data?.cvss 
      }
    }

    results.mitigationStrategies = generateMitigationStrategies(type, mitigationData)

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      {
        error: "Search failed. Please retry later.",
        status: "error",
      },
      { status: 500 }
    )
  }
}
