"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { PageHeading } from "@/components/dashboard/page-heading"
import { MitreWorkbench } from "@/components/mitre/mitre-workbench"
import { Crosshair } from "lucide-react"

export default function MitrePage() { return <div className="min-h-screen bg-background"><DashboardHeader /><main className="container mx-auto space-y-6 px-4 py-6"><PageHeading eyebrow="Adversary behavior" title="MITRE ATT&CK mapping" description="Map observed indicator classes to tactics and inspect coverage gaps for detection engineering." icon={<Crosshair className="h-5 w-5" />} /><MitreWorkbench /></main></div> }
