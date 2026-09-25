import { NextRequest } from "next/server"
import { getThreatFeeds } from "@/lib/server/threat-feeds"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const initialPayload = JSON.stringify({
        event: "connected",
        message: "Threat Telemetry Stream Established",
        timestamp: new Date().toISOString(),
      })
      controller.enqueue(encoder.encode(`event: connected\ndata: ${initialPayload}\n\n`))

      let seen = new Set<string>()
      const poll = async () => {
        try {
          const result = await getThreatFeeds(12)
          const fresh = result.threats.filter((threat) => !seen.has(threat.id)).slice(0, 4)
          result.threats.forEach((threat) => seen.add(threat.id))
          if (seen.size > 250) seen = new Set(result.threats.map((threat) => threat.id))
          fresh.forEach((threat) => controller.enqueue(encoder.encode(`event: threat\ndata: ${JSON.stringify(threat)}\n\n`)))
          controller.enqueue(encoder.encode(`event: health\ndata: ${JSON.stringify({ timestamp: result.timestamp, statuses: { urlhaus: result.urlhaus.status, threatfox: result.threatfox.status } })}\n\n`))
        } catch (error) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: error instanceof Error ? error.message : "Feed polling failed" })}\n\n`))
        }
      }
      void poll()
      const interval = setInterval(() => void poll(), 30_000)

      // Clean up when request is aborted by client
      req.signal.addEventListener("abort", () => {
        clearInterval(interval)
        try {
          controller.close()
        } catch {
          // Stream already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
