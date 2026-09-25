"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { PageHeading } from "@/components/dashboard/page-heading"
import { SettingsForm } from "@/components/settings/settings-form"
import { Settings2 } from "lucide-react"

export default function SettingsPage() { return <div className="min-h-screen bg-background"><DashboardHeader /><main className="container mx-auto space-y-6 px-4 py-6"><PageHeading eyebrow="Operator preferences" title="Settings" description="Configure provider participation, alerting, retention, refresh cadence, and visual theme." icon={<Settings2 className="h-5 w-5" />} /><SettingsForm /></main></div> }
