import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { SecurityCommandCenter } from "@/components/dashboard/security-command-center"

interface CompanyPageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params
  const company = decodeURIComponent(id).replaceAll("-", " ")

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="pb-8">
        <Suspense fallback={null}>
          <SecurityCommandCenter initialQuery={company} />
        </Suspense>
      </main>
    </div>
  )
}
