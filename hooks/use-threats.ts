"use client"

import { useQuery } from "@tanstack/react-query"
import type { ThreatIndicator, APIStatus } from "@/lib/types"
import type { ReportRequest, SecurityReport } from "@/lib/security-report"

interface ThreatResponse {
  threats: ThreatIndicator[]
  status: "online" | "offline" | "error" | "mock"
  count?: number
  timestamp?: string
  message?: string
}

async function fetchURLHausThreats(): Promise<ThreatResponse> {
  const res = await fetch("/api/threats/urlhaus")
  if (!res.ok) throw new Error("Failed to fetch URLHaus data")
  return res.json()
}

async function fetchThreatFoxThreats(): Promise<ThreatResponse> {
  const res = await fetch("/api/threats/threatfox")
  if (!res.ok) throw new Error("Failed to fetch ThreatFox data")
  return res.json()
}

export function useLiveThreats() {
  const urlhausQuery = useQuery({
    queryKey: ["urlhaus-threats"],
    queryFn: fetchURLHausThreats,
    refetchInterval: 60000, // Poll every 60 seconds
    staleTime: 30000,
  })

  const threatfoxQuery = useQuery({
    queryKey: ["threatfox-threats"],
    queryFn: fetchThreatFoxThreats,
    refetchInterval: 60000,
    staleTime: 30000,
  })

  // Combine and sort threats by timestamp
  const allThreats: ThreatIndicator[] = [
    ...(urlhausQuery.data?.threats || []),
    ...(threatfoxQuery.data?.threats || []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const apiStatus: Pick<APIStatus, "urlhaus" | "threatfox"> = {
    urlhaus: urlhausQuery.data?.status === "online" ? "online" : 
             urlhausQuery.isLoading ? "online" : "offline",
    threatfox: threatfoxQuery.data?.status === "online" ? "online" : 
               threatfoxQuery.isLoading ? "online" : "offline",
  }

  return {
    threats: allThreats,
    apiStatus,
    isLoading: urlhausQuery.isLoading || threatfoxQuery.isLoading,
    isError: urlhausQuery.isError && threatfoxQuery.isError,
    lastUpdated: urlhausQuery.data?.timestamp || threatfoxQuery.data?.timestamp,
    refetch: () => {
      urlhausQuery.refetch()
      threatfoxQuery.refetch()
    },
  }
}

interface SearchResult {
  query: string
  queryType: "ip" | "domain" | "cve"
  timestamp: string
  abuseipdb?: {
    data?: {
      ipAddress: string
      abuseConfidenceScore: number
      countryCode: string
      isp: string
      totalReports: number
      lastReportedAt: string
    }
    status: string
  }
  urlhaus?: {
    threats: ThreatIndicator[]
    status: string
  }
  threatfox?: {
    threats: ThreatIndicator[]
    status: string
  }
  cve?: {
    data?: {
      id: string
      summary: string
      cvss?: number
      cvss3?: number
      references: string[]
      vulnerable_product: string[]
      Published: string
      Modified: string
    }
    status: string
  }
  mitigationStrategies: string[]
}

async function searchThreats(query: string): Promise<SearchResult> {
  const res = await fetch(`/api/threats/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error("Search failed")
  return res.json()
}

export function useThreatSearch(query: string) {
  return useQuery({
    queryKey: ["threat-search", query],
    queryFn: () => searchThreats(query),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

async function fetchSecurityReport(request: ReportRequest): Promise<SecurityReport> {
  const res = await fetch("/api/security/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => null)
    throw new Error(payload?.error ?? "Security report failed")
  }

  return res.json()
}

export function useSecurityReport(query: string, skipProviders: string[] = []) {
  return useQuery({
    queryKey: ["security-report", query, skipProviders],
    queryFn: () => fetchSecurityReport({ query, skipProviders }),
    enabled: query.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchInterval: false,
  })
}
