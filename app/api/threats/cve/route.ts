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
        error: error instanceof Error ? error.message : "Failed to fetch from CIRCL CVE API",
        status: "offline",
      },
      { status: 200 }
    )
  }
}
