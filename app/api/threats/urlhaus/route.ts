import { NextResponse } from "next/server"
import type { ThreatIndicator } from "@/lib/types"

export const dynamic = "force-dynamic"

// Generate realistic mock URLHaus threat data
function generateMockURLHausData(): ThreatIndicator[] {
  const malwareFamilies = ["Emotet", "QakBot", "IcedID", "Dridex", "TrickBot", "BazarLoader", "Cobalt Strike", "AgentTesla", "AsyncRAT", "RedLine"]
  const threatTypes = ["malware", "phishing", "c2", "botnet"] as const
  const countries = ["US", "RU", "CN", "DE", "NL", "FR", "UA", "KR", "JP", "BR"]
  const tlds = [".ru", ".cn", ".xyz", ".top", ".pw", ".cc", ".su", ".info", ".biz", ".tk"]
  
  const threats: ThreatIndicator[] = []
  const now = Date.now()
  
  for (let i = 0; i < 35; i++) {
    const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)]
    const malwareFamily = malwareFamilies[Math.floor(Math.random() * malwareFamilies.length)]
    const country = countries[Math.floor(Math.random() * countries.length)]
    const tld = tlds[Math.floor(Math.random() * tlds.length)]
    const randomHost = `${Math.random().toString(36).substring(2, 10)}${tld}`
    const randomIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    
    threats.push({
      id: `urlhaus-${Date.now()}-${i}`,
      type: threatType,
      source: "URLHaus",
      host: Math.random() > 0.5 ? `http://${randomHost}/malware/${Math.random().toString(36).substring(2, 8)}.exe` : randomIP,
      timestamp: new Date(now - Math.random() * 3600000 * 24).toISOString(), // Random time within last 24h
      riskScore: Math.floor(50 + Math.random() * 50), // 50-100
      malwareFamily: threatType === "malware" ? malwareFamily : undefined,
      tags: [country, threatType, ...(Math.random() > 0.5 ? [malwareFamily.toLowerCase()] : [])],
      confidence: Math.floor(70 + Math.random() * 30),
      stixType: "indicator",
      stixPattern: `[url:value = '${randomHost}']`,
    })
  }
  
  return threats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function GET() {
  // Return mock data simulating live threat feed
  const threats = generateMockURLHausData()
  
  return NextResponse.json({ 
    threats, 
    status: "online",
    count: threats.length,
    timestamp: new Date().toISOString(),
    message: "Simulated threat data (API key required for live data)"
  })
}
