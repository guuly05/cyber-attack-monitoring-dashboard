"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertTriangle,
  Shield,
  Globe,
  Tag,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ThreatIndicator } from "@/lib/types"
import {
  cyberGlossary,
  getMitigationStrategies,
  getThreatCause,
  getSeverityColor,
} from "@/lib/cyber-glossary"
import { useState } from "react"

interface ThreatDetailDialogProps {
  threat: ThreatIndicator | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function TermWithTooltip({ term, children }: { term: string; children: React.ReactNode }) {
  const glossaryEntry = cyberGlossary[term.toLowerCase()]
  
  if (!glossaryEntry) return <>{children}</>

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className="border-b border-dashed border-primary/50 cursor-help">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-card border-border p-3">
          <p className="font-semibold text-foreground mb-1">{glossaryEntry.term}</p>
          <p className="text-sm text-muted-foreground">{glossaryEntry.definition}</p>
          {glossaryEntry.example && (
            <p className="text-xs text-primary mt-2 italic">Example: {glossaryEntry.example}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ThreatDetailDialog({ threat, open, onOpenChange }: ThreatDetailDialogProps) {
  const [copied, setCopied] = useState(false)

  if (!threat) return null

  const cause = getThreatCause(threat.type, threat.source)
  const mitigations = getMitigationStrategies(threat.type, threat.malwareFamily)
  const riskLevel = threat.riskScore >= 80 ? "Critical" : threat.riskScore >= 60 ? "High" : threat.riskScore >= 40 ? "Medium" : "Low"
  const riskColor = threat.riskScore >= 80 ? "text-red-400" : threat.riskScore >= 60 ? "text-orange-400" : threat.riskScore >= 40 ? "text-yellow-400" : "text-green-400"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(threat.host)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-lg",
                threat.riskScore >= 80 ? "bg-red-500/20" : 
                threat.riskScore >= 60 ? "bg-orange-500/20" : 
                threat.riskScore >= 40 ? "bg-yellow-500/20" : "bg-green-500/20"
              )}>
                <AlertTriangle className={cn("h-6 w-6", riskColor)} />
              </div>
              <div>
                <DialogTitle className="text-xl">Threat Analysis</DialogTitle>
                <DialogDescription className="mt-1">
                  Detailed breakdown and recommended actions
                </DialogDescription>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-sm px-3 py-1",
                threat.riskScore >= 80 ? "bg-red-500/20 text-red-400 border-red-500/50" : 
                threat.riskScore >= 60 ? "bg-orange-500/20 text-orange-400 border-orange-500/50" : 
                threat.riskScore >= 40 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" : 
                "bg-green-500/20 text-green-400 border-green-500/50"
              )}
            >
              Risk: {threat.riskScore}/100
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Quick Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Threat Type</p>
                <p className="font-semibold text-foreground capitalize">
                  <TermWithTooltip term={threat.type}>{threat.type}</TermWithTooltip>
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                <p className={cn("font-semibold", riskColor)}>
                  <TermWithTooltip term="riskScore">{riskLevel}</TermWithTooltip>
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Source</p>
                <p className="font-semibold text-foreground">
                  <TermWithTooltip term={threat.source}>{threat.source}</TermWithTooltip>
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Detected</p>
                <p className="font-semibold text-foreground">
                  {new Date(threat.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Indicator Details */}
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    <TermWithTooltip term="ioc">Indicator of Compromise</TermWithTooltip>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-8 gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <code className="text-sm text-primary font-mono break-all bg-background/50 p-2 rounded block">
                {threat.host}
              </code>
              
              {threat.malwareFamily && (
                <div className="mt-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Malware Family:</span>
                  <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/50">
                    {threat.malwareFamily}
                  </Badge>
                </div>
              )}

              {threat.tags.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tags:</span>
                  {threat.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator className="bg-border" />

            {/* What Caused This */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">What Caused This Alert?</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {cause}
              </p>
            </div>

            <Separator className="bg-border" />

            {/* Mitigation Strategies */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-green-400" />
                <h3 className="font-semibold text-foreground">Recommended Actions</h3>
              </div>
              <div className="space-y-2">
                {mitigations.map((strategy, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm text-foreground">{strategy}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Glossary Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Understanding the Terms</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Hover over underlined terms throughout this report for definitions. Here are key terms related to this threat:
              </p>
              <div className="grid gap-3">
                {[threat.type, "ioc", "riskScore", threat.source.toLowerCase()].map((termKey) => {
                  const entry = cyberGlossary[termKey]
                  if (!entry) return null
                  return (
                    <div key={termKey} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{entry.term}</span>
                        {entry.severity && (
                          <Badge variant="outline" className={cn("text-xs", getSeverityColor(entry.severity))}>
                            {entry.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.definition}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* External Resources */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Want to investigate further? Search this indicator on:
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <a
                    href={`https://www.virustotal.com/gui/search/${encodeURIComponent(threat.host)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    VirusTotal
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <a
                    href={`https://www.shodan.io/search?query=${encodeURIComponent(threat.host)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Shodan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <a
                    href={`https://otx.alienvault.com/indicator/hostname/${encodeURIComponent(threat.host)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    AlienVault OTX
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
