import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { SecurityCommandCenter } from "@/components/dashboard/security-command-center"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="pb-8">
        <Suspense fallback={null}>
          <SecurityCommandCenter />
        </Suspense>
      </main>
    </div>
  )
}
