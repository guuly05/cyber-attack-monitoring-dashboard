import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const domain = (request.nextUrl.searchParams.get("domain") ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]
  if (!domain || !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(domain)) return NextResponse.json({ error: "Enter a valid domain." }, { status: 400 })
  try {
    const response = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, { headers: { Accept: "application/json", "User-Agent": "CyberShield-SOC-Dashboard/1.0" }, cache: "no-store" })
    if (!response.ok) throw new Error(`crt.sh returned ${response.status}`)
    const certificates = await response.json() as Array<{ id?: number; name_value?: string; issuer_name?: string; not_after?: string }>
    const names = [...new Set(certificates.flatMap((certificate) => String(certificate.name_value ?? "").split(/\r?\n/)).map((name) => name.trim().toLowerCase()).filter((name) => name && !name.includes("*") && name.endsWith(domain)).slice(0, 100))]
    const assets = names.map((name) => ({ name, type: name === domain ? "root domain" : "subdomain", risk: name.includes("dev") || name.includes("staging") || name.includes("admin") ? "high" : "medium", issuer: certificates.find((certificate) => certificate.name_value?.includes(name))?.issuer_name ?? "Certificate Transparency", observedAt: certificates.find((certificate) => certificate.name_value?.includes(name))?.not_after ?? null }))
    return NextResponse.json({ domain, assets, certificates: certificates.length, sources: ["crt.sh Certificate Transparency"], generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } })
  } catch (error) { return NextResponse.json({ domain, assets: [{ name: domain, type: "root domain", risk: "unknown", issuer: "crt.sh unavailable", observedAt: null }], certificates: 0, sources: [], generatedAt: new Date().toISOString(), warning: error instanceof Error ? error.message : "Discovery failed" }) }
}
