"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { PageHeading } from "@/components/dashboard/page-heading"
import { IncidentWorkbench } from "@/components/incidents/incident-workbench"
import { ShieldAlert } from "lucide-react"

export default function IncidentsPage() {
  return <div className="min-h-screen bg-background"><DashboardHeader /><main className="container mx-auto space-y-6 px-4 py-6"><PageHeading eyebrow="Response operations" title="Incident timeline" description="Correlated threat clusters, analyst ownership, and response state from Open to Resolved." icon={<ShieldAlert className="h-5 w-5" />} /><IncidentWorkbench /></main></div>
}
