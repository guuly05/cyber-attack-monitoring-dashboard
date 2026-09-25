import { Suspense } from "react"
import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { SecurityCommandCenter } from "@/components/dashboard/security-command-center"

interface CompanyPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { id } = await params
  const company = decodeURIComponent(id).replaceAll("-", " ")
  return { title: `${company} — CyberShield Investigation`, description: `Security intelligence report for ${company}.` }
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params
  const company = decodeURIComponent(id).replaceAll("-", " ")

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="pb-8">
        <Suspense fallback={<div className="container mx-auto p-6"><div className="h-56 animate-pulse rounded-lg bg-muted/30" /></div>}>
          <SecurityCommandCenter initialQuery={company} />
        </Suspense>
      </main>
    </div>
  )
}
