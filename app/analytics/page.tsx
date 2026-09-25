"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { PageHeading } from "@/components/dashboard/page-heading"
import { AnalyticsWorkbench } from "@/components/analytics/analytics-workbench"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() { return <div className="min-h-screen bg-background"><DashboardHeader /><main className="container mx-auto space-y-6 px-4 py-6"><PageHeading eyebrow="Historical intelligence" title="Analytics & trends" description="Volume, attack-vector, malware-family, provider, and geographic analysis across the current feed window." icon={<BarChart3 className="h-5 w-5" />} /><AnalyticsWorkbench /></main></div> }
