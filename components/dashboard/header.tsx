"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Bell, Menu, Moon, Shield, Activity, Sun, Wifi, WifiOff, Keyboard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface HeaderProps {
  apiStatus?: {
    urlhaus: "online" | "offline" | "rate-limited"
    threatfox: "online" | "offline" | "rate-limited"
  }
}

export function DashboardHeader({ apiStatus }: HeaderProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [unread, setUnread] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  useEffect(() => {
    setMounted(true)
    const update = () => setUnread(Number(window.localStorage.getItem("cybershield-unread-alerts") ?? 0))
    update()
    window.addEventListener("cybershield-alerts", update)
    const onHelp = (event: KeyboardEvent) => { if (event.key === "?" && document.activeElement?.tagName !== "INPUT") setShowHelp(true) }
    window.addEventListener("keydown", onHelp)
    return () => { window.removeEventListener("cybershield-alerts", update); window.removeEventListener("keydown", onHelp) }
  }, [])

  const links = [
    ["/", "Dashboard"], ["/search", "Search"], ["/threats", "Threats"], ["/incidents", "Incidents"], ["/analytics", "Analytics"], ["/ioc-feed", "IOC Feed"], ["/vulnerabilities", "CVEs"], ["/reports", "Reports"], ["/attack-surface", "Surface"], ["/mitre", "MITRE"], ["/settings", "Settings"],
  ]
  const navigation = links.map(([href, label]) => (
    <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`rounded border px-3 py-1.5 text-sm transition-colors ${pathname === href ? "border-primary/40 bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"}`}>
      {label}
    </Link>
  ))
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CyberShield</h1>
              <p className="text-xs text-muted-foreground">Threat Monitoring Dashboard</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">{navigation}</nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
              <Activity className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
            
            {apiStatus && (
              <div className="hidden sm:flex items-center gap-2">
                <StatusDot name="URLHaus" status={apiStatus.urlhaus} />
                <StatusDot name="ThreatFox" status={apiStatus.threatfox} />
              </div>
            )}
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" onClick={() => { window.localStorage.setItem("cybershield-unread-alerts", "0"); setUnread(0); window.dispatchEvent(new Event("cybershield-alerts")) }}>
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] text-white">{unread > 9 ? "9+" : unread}</span>}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" onClick={() => setShowHelp(true)}><Keyboard className="h-4 w-4" /></Button>
            <Sheet>
              <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu className="h-4 w-4" /></Button></SheetTrigger>
              <SheetContent side="left" className="w-72 bg-card">
                <SheetHeader><SheetTitle>CyberShield navigation</SheetTitle></SheetHeader>
                <nav className="mt-6 flex flex-col gap-2">{navigation}</nav>
                <p className="mt-8 text-xs text-muted-foreground">Shortcuts: <kbd className="rounded border px-1">/</kbd> search · <kbd className="rounded border px-1">?</kbd> help · <kbd className="rounded border px-1">R</kbd> refresh</p>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      {showHelp && <div role="dialog" aria-label="Keyboard shortcuts" className="fixed right-4 top-20 z-[60] w-72 rounded-lg border border-primary/30 bg-card p-4 shadow-2xl"><div className="flex items-center justify-between"><p className="font-mono text-sm text-primary">Keyboard shortcuts</p><button type="button" onClick={() => setShowHelp(false)} aria-label="Close shortcuts">×</button></div><div className="mt-3 space-y-2 text-xs text-muted-foreground"><p><kbd className="mr-2 rounded border px-1">/</kbd> Focus investigation search</p><p><kbd className="mr-2 rounded border px-1">R</kbd> Refresh the live feed</p><p><kbd className="mr-2 rounded border px-1">Esc</kbd> Close dialogs and panels</p><p><kbd className="mr-2 rounded border px-1">1–5</kbd> Use page navigation links</p></div></div>}
    </header>
  )
}

function StatusDot({ name, status }: { name: string; status: "online" | "offline" | "rate-limited" }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/30">
      {status === "online" ? (
        <Wifi className="h-3 w-3 text-green-400" />
      ) : (
        <WifiOff className="h-3 w-3 text-red-400" />
      )}
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  )
}
