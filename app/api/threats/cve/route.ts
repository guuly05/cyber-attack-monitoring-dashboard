import { NextRequest, NextResponse } from "next/server"
import type { CVEEntry } from "@/lib/types"

export const dynamic = "force-dynamic"

// Sanitize CVE ID input
function sanitizeCVE(input: string): string | null {
  const cleaned = input.trim().toUpperCase()
  // CVE format: CVE-YYYY-NNNNN (year and at least 4 digits)
  const cveRegex = /^CVE-\d{4}-\d{4,}$/
  
  if (cveRegex.test(cleaned)) {
    return cleaned
  }
  
  return null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const cveId = searchParams.get("id")

  if (!cveId && searchParams.get("recent") !== null) {
    try {
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace(".000Z", "Z")
      const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${encodeURIComponent(start)}&resultsPerPage=12`, { headers: { Accept: "application/json" }, next: { revalidate: 1800 } })
      if (!response.ok) throw new Error(`NVD returned ${response.status}`)
      const payload = await response.json() as { vulnerabilities?: Array<{ cve?: { id?: string; descriptions?: Array<{ lang?: string; value?: string }>; metrics?: Record<string, Array<{ cvssData?: { baseScore?: number } }>> } }> }
      const cves = (payload.vulnerabilities ?? []).map((item) => ({ id: item.cve?.id ?? "", summary: item.cve?.descriptions?.find((description) => description.lang === "en")?.value ?? "No description available", cvss: item.cve?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ?? item.cve?.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore })).filter((item) => item.id)
      return NextResponse.json({ data: cves, status: "online", timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } })
    } catch (error) {
      return NextResponse.json({ data: [], status: "offline", error: error instanceof Error ? error.message : "NVD unavailable", timestamp: new Date().toISOString() })
    }
  }

  if (!cveId) {
    return NextResponse.json(
      { error: "CVE ID is required", status: "error" },
      { status: 400 }
    )
  }

  const sanitizedCVE = sanitizeCVE(cveId)
  if (!sanitizedCVE) {
    return NextResponse.json(
      { error: "Invalid CVE ID format. Expected: CVE-YYYY-NNNNN", status: "error" },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://cve.circl.lu/api/cve/${encodeURIComponent(sanitizedCVE)}`,
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour (CVE data doesn't change frequently)
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `CVE ${sanitizedCVE} not found`, status: "not-found" },
          { status: 200 }
        )
      }
      throw new Error(`CIRCL CVE API returned ${response.status}`)
    }

    const data = await response.json()

    if (!data || !data.id) {
      return NextResponse.json(
        { error: `CVE ${sanitizedCVE} not found`, status: "not-found" },
        { status: 200 }
      )
    }

    const cveEntry: CVEEntry = {
      id: data.id,
      summary: data.summary || "No description available",
      cvss: data.cvss || undefined,
      cvss3: data.cvss3 || undefined,
      references: data.references || [],
      vulnerable_product: data.vulnerable_product || [],
      Modified: data.Modified || "",
      Published: data.Published || "",
      assigner: data.assigner,
      cwe: data.cwe,
    }

    return NextResponse.json({
      data: cveEntry,
      status: "online",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("CIRCL CVE API error:", error)
    return NextResponse.json(
      {
        error: "CIRCL CVE is unavailable. Please retry later.",
        status: "offline",
      },
      { status: 200 }
    )
  }
}
