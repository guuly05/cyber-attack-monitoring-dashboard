import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { access } from "node:fs/promises"

const root = new URL("../", import.meta.url)
const source = async (path) => readFile(new URL(path, root), "utf8")

test("feed routes use provider adapters instead of random generators", async () => {
  const [urlhaus, threatfox, stream] = await Promise.all([
    source("app/api/threats/urlhaus/route.ts"),
    source("app/api/threats/threatfox/route.ts"),
    source("app/api/threats/stream/route.ts"),
  ])
  assert.match(urlhaus, /getURLHausThreats/)
  assert.match(threatfox, /getThreatFoxThreats/)
  assert.match(stream, /getThreatFeeds/)
  assert.doesNotMatch(`${urlhaus}${threatfox}${stream}`, /Math\.random/)
})

test("IOC exports include all supported analyst formats", async () => {
  const exporter = await source("lib/ioc-export.ts")
  assert.match(exporter, /format === "csv"/)
  assert.match(exporter, /spec_version: "2\.1"/)
  assert.match(exporter, /format === "txt"/)
})

test("plan routes are present", async () => {
  for (const route of ["app/incidents/page.tsx", "app/reports/page.tsx", "app/analytics/page.tsx", "app/ioc-feed/page.tsx", "app/settings/page.tsx", "app/attack-surface/page.tsx", "app/mitre/page.tsx"]) {
    await access(new URL(route, root))
  }
})
