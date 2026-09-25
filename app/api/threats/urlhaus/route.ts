import { NextResponse } from "next/server"
import { getURLHausThreats } from "@/lib/server/threat-feeds"

export async function GET() {
  const result = await getURLHausThreats()
  return NextResponse.json({ ...result, count: result.threats.length }, { headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120" } })
}
