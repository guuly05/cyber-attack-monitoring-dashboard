import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { SecurityCommandCenter } from "@/components/dashboard/security-command-center"
import { Skeleton } from "@/components/ui/skeleton"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="pb-8">
        <Suspense fallback={<div className="container mx-auto p-6"><Skeleton className="h-72 w-full" /></div>}>
          <SecurityCommandCenter />
        </Suspense>
      </main>
    </div>
  )
}
