import { Shield, Activity, Wifi, WifiOff } from "lucide-react"

interface HeaderProps {
  apiStatus?: {
    urlhaus: "online" | "offline" | "rate-limited"
    threatfox: "online" | "offline" | "rate-limited"
  }
}

export function DashboardHeader({ apiStatus }: HeaderProps) {
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
          </div>
        </div>
      </div>
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
