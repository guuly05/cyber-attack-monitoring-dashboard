"use client"

import { useState } from "react"
import { useLiveThreats } from "@/hooks/use-threats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle, Shield, Activity, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ThreatIndicator } from "@/lib/types"
import { ThreatDetailDialog } from "./threat-detail-dialog"

function ThreatTypeBadge({ type }: { type: ThreatIndicator["type"] }) {
  const colors: Record<ThreatIndicator["type"], string> = {
    malware: "bg-red-500/20 text-red-400 border-red-500/50",
    phishing: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    botnet: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    ransomware: "bg-red-600/20 text-red-300 border-red-600/50",
    c2: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    unknown: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  }

  return (
    <Badge variant="outline" className={cn("font-mono text-xs", colors[type])}>
      {type.toUpperCase()}
    </Badge>
  )
}

function RiskScoreIndicator({ score }: { score: number }) {
  const color = score >= 80 ? "text-red-400" : score >= 50 ? "text-yellow-400" : "text-green-400"
  const bgColor = score >= 80 ? "bg-red-500/20" : score >= 50 ? "bg-yellow-500/20" : "bg-green-500/20"

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded", bgColor)}>
      <AlertTriangle className={cn("h-3 w-3", color)} />
      <span className={cn("font-mono text-sm font-bold", color)}>{score}</span>
    </div>
  )
}

function ThreatRow({ threat, onClick }: { threat: ThreatIndicator; onClick: () => void }) {
  const timestamp = new Date(threat.timestamp)
  const timeAgo = getTimeAgo(timestamp)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer text-left"
    >
      <div className="flex-shrink-0">
        <RiskScoreIndicator score={threat.riskScore} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ThreatTypeBadge type={threat.type} />
          <span className="text-xs text-muted-foreground font-mono">{threat.source}</span>
        </div>
        <p className="text-sm text-foreground truncate font-mono">{threat.host}</p>
        {threat.malwareFamily && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Malware: <span className="text-primary">{threat.malwareFamily}</span>
          </p>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
        {threat.tags.length > 0 && (
          <div className="flex gap-1 mt-1 justify-end flex-wrap">
            {threat.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function LiveThreatStream() {
  const { threats, apiStatus, isLoading, lastUpdated, refetch } = useLiveThreats()
  const [selectedThreat, setSelectedThreat] = useState<ThreatIndicator | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleThreatClick = (threat: ThreatIndicator) => {
    setSelectedThreat(threat)
    setDialogOpen(true)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Live Threat Stream</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time feed from URLHaus & ThreatFox
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <StatusIndicator name="URLHaus" status={apiStatus.urlhaus} />
              <StatusIndicator name="ThreatFox" status={apiStatus.threatfox} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mb-3">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
        
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {isLoading && threats.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Loading threat data...</span>
              </div>
            </div>
          ) : threats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-primary/50 mb-3" />
              <p className="text-muted-foreground">No threats detected</p>
              <p className="text-xs text-muted-foreground mt-1">
                The feed will update automatically every 60 seconds
              </p>
            </div>
          ) : (
            threats.slice(0, 50).map((threat) => (
              <ThreatRow key={threat.id} threat={threat} onClick={() => handleThreatClick(threat)} />
            ))
          )}
        </div>
        
        {threats.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Showing {Math.min(50, threats.length)} of {threats.length} threats | Click any threat for details
          </p>
        </div>
      )}

      <ThreatDetailDialog
        threat={selectedThreat}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </CardContent>
    </Card>
  )
}

function StatusIndicator({ name, status }: { name: string; status: "online" | "offline" | "rate-limited" }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50">
      {status === "online" ? (
        <Wifi className="h-3 w-3 text-green-400" />
      ) : (
        <WifiOff className="h-3 w-3 text-red-400" />
      )}
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  )
}
