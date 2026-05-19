import { NextResponse } from "next/server"
import type { ThreatIndicator } from "@/lib/types"

export const dynamic = "force-dynamic"

// Generate realistic mock ThreatFox IOC data
function generateMockThreatFoxData(): ThreatIndicator[] {
  const malwareFamilies = ["Raccoon", "Vidar", "LokiBot", "FormBook", "NanoCore", "njRAT", "RemcosRAT", "SnakeKeylogger", "Pony", "AZORult"]
  const threatTypes = ["botnet", "ransomware", "c2", "malware"] as const
  const iocTypes = ["ip:port", "domain", "url", "hash_md5"]
  
  const threats: ThreatIndicator[] = []
  const now = Date.now()
  
  for (let i = 0; i < 25; i++) {
    const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)]
    const malwareFamily = malwareFamilies[Math.floor(Math.random() * malwareFamilies.length)]
    const iocType = iocTypes[Math.floor(Math.random() * iocTypes.length)]
    
    let host: string
    if (iocType === "ip:port") {
      host = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}:${Math.floor(1000 + Math.random() * 64000)}`
    } else if (iocType === "domain") {
      host = `${Math.random().toString(36).substring(2, 12)}.${["com", "net", "org", "io"][Math.floor(Math.random() * 4)]}`
    } else if (iocType === "hash_md5") {
      host = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    } else {
      host = `https://${Math.random().toString(36).substring(2, 8)}.com/${Math.random().toString(36).substring(2, 6)}`
    }
    
    threats.push({
      id: `threatfox-${Date.now()}-${i}`,
      type: threatType,
      source: "ThreatFox",
      host,
      timestamp: new Date(now - Math.random() * 3600000 * 12).toISOString(), // Random time within last 12h
      riskScore: Math.floor(60 + Math.random() * 40), // 60-100
      malwareFamily,
      tags: [malwareFamily.toLowerCase(), threatType, iocType],
      confidence: Math.floor(75 + Math.random() * 25),
      stixType: "indicator",
      stixPattern: `[file:hashes.MD5 = '${host}']`,
    })
  }
  
  return threats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function GET() {
  // Return mock data simulating live threat feed
  const threats = generateMockThreatFoxData()
  
  return NextResponse.json({
    threats,
    status: "online",
    count: threats.length,
    timestamp: new Date().toISOString(),
    message: "Simulated threat data (API key required for live data)"
  })
}
