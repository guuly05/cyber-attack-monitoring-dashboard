import { NextRequest, NextResponse } from "next/server"
import type { AbuseIPDBEntry } from "@/lib/types"

export const dynamic = "force-dynamic"

// Simple input sanitization for IP addresses
function sanitizeIP(input: string): string | null {
  // Remove any whitespace
  const cleaned = input.trim()
  
  // IPv4 validation regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/
  
  if (ipv4Regex.test(cleaned) || ipv6Regex.test(cleaned)) {
    return cleaned
  }
  
  return null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ip = searchParams.get("ip")

  if (!ip) {
    return NextResponse.json(
      { error: "IP address is required", status: "error" },
      { status: 400 }
    )
  }

  const sanitizedIP = sanitizeIP(ip)
  if (!sanitizedIP) {
    return NextResponse.json(
      { error: "Invalid IP address format", status: "error" },
      { status: 400 }
    )
  }

  const apiKey = process.env.ABUSEIPDB_API_KEY

  if (!apiKey) {
    // Return mock data if API key is not configured
    const mockData: AbuseIPDBEntry = {
      ipAddress: sanitizedIP,
      isPublic: true,
      ipVersion: 4,
      isWhitelisted: false,
      abuseConfidenceScore: Math.floor(Math.random() * 100),
      countryCode: "US",
      usageType: "Data Center/Web Hosting/Transit",
      isp: "Unknown ISP",
      domain: "unknown.com",
      totalReports: Math.floor(Math.random() * 500),
      numDistinctUsers: Math.floor(Math.random() * 50),
      lastReportedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      data: mockData,
      status: "mock",
      message: "Using mock data - ABUSEIPDB_API_KEY not configured",
    })
  }

  try {
    const response = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(sanitizedIP)}&maxAgeInDays=90&verbose=true`,
      {
        headers: {
          Key: apiKey,
          Accept: "application/json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limited by AbuseIPDB", status: "rate-limited" },
          { status: 200 }
        )
      }
      throw new Error(`AbuseIPDB API returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      data: data.data as AbuseIPDBEntry,
      status: "online",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("AbuseIPDB API error:", error)
    return NextResponse.json(
      {
        error: "AbuseIPDB is unavailable. Please retry later.",
        status: "offline",
      },
      { status: 200 }
    )
  }
}
