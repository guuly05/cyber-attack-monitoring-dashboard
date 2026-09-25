import { NextRequest, NextResponse } from "next/server"
import { buildSecurityReport } from "@/lib/server/security-orchestrator"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Compatibility search endpoint backed directly by the orchestrator.
 * It intentionally avoids fetching this app's own HTTP endpoints. */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim()
  if (!query) return NextResponse.json({ error: "Search query is required", status: "error" }, { status: 400 })
  const result = await buildSecurityReport({ query })
  if (!("id" in result)) return NextResponse.json({ error: result.error, status: "error" }, { status: 400 })
  return NextResponse.json({ ...result, queryType: result.entityType, mitigationStrategies: result.mitigations }, { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } })
}
