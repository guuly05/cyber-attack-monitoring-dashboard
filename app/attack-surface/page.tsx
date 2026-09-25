"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { PageHeading } from "@/components/dashboard/page-heading"
import { AttackSurfaceWorkbench } from "@/components/attack-surface/attack-surface-workbench"
import { Network } from "lucide-react"

export default function AttackSurfacePage() { return <div className="min-h-screen bg-background"><DashboardHeader /><main className="container mx-auto space-y-6 px-4 py-6"><PageHeading eyebrow="External discovery" title="Attack surface map" description="Discover certificate-backed subdomains, assess naming risk, and track exposed infrastructure signals." icon={<Network className="h-5 w-5" />} /><AttackSurfaceWorkbench /></main></div> }
