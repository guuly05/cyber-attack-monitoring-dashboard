"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { PageHeading } from "@/components/dashboard/page-heading"
import { IOCWorkbench } from "@/components/ioc/ioc-workbench"
import { Database } from "lucide-react"

export default function IOCFeedPage() { return <div className="min-h-screen bg-background"><DashboardHeader /><main className="container mx-auto space-y-6 px-4 py-6"><PageHeading eyebrow="Operational blocklists" title="IOC feed" description="Curate normalized indicators and export firewall, SIEM, or STIX-ready blocklists." icon={<Database className="h-5 w-5" />} /><IOCWorkbench /></main></div> }
