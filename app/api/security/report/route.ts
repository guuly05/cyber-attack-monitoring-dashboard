import { NextRequest, NextResponse } from "next/server"
import { buildSecurityReport } from "@/lib/server/security-orchestrator"
import type { ReportRequest } from "@/lib/security-report"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let body: ReportRequest

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", status: "error" }, { status: 400 })
  }

  const result = await buildSecurityReport({
    query: String(body.query ?? ""),
    skipProviders: Array.isArray(body.skipProviders) ? body.skipProviders.map(String) : [],
  })

  if ("status" in result && result.status === 400) {
    return NextResponse.json({ error: result.error, status: "error" }, { status: 400 })
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  })
}
