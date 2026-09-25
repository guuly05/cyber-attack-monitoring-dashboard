"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { PageHeading } from "@/components/dashboard/page-heading"
import { ReportBuilder } from "@/components/reports/report-builder"
import { FileText } from "lucide-react"

export default function ReportsPage() { return <div className="min-h-screen bg-background"><DashboardHeader /><main className="container mx-auto space-y-6 px-4 py-6"><PageHeading eyebrow="Threat intelligence" title="Report center" description="Generate executive, technical, and vulnerability-focused intelligence packages with a local archive." icon={<FileText className="h-5 w-5" />} /><ReportBuilder /></main></div> }
