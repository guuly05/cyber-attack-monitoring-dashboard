"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  PieChart,
  BarChart3,
  Activity,
  BookOpen,
  AlertTriangle,
  Shield,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { cyberGlossary, getSeverityColor } from "@/lib/cyber-glossary"

type ChartType = "threatDistribution" | "riskScore" | "sourceActivity"

interface ChartInfoDialogProps {
  chartType: ChartType | null
  chartData: Array<{ name?: string; range?: string; source?: string; value?: number; count?: number; fill?: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
}

const chartInfo: Record<ChartType, {
  title: string
  icon: React.ElementType
  description: string
  whatItShows: string
  whyItMatters: string
  howToRead: string
  relatedTerms: string[]
}> = {
  threatDistribution: {
    title: "Threat Distribution",
    icon: PieChart,
    description: "Breakdown of detected threats by category",
    whatItShows: "This chart shows the proportion of different threat types currently active in the threat feed. Each segment represents a category like malware, phishing, botnets, or command & control (C2) servers.",
    whyItMatters: "Understanding the distribution of threats helps prioritize your security response. If you see a high percentage of ransomware, for example, you should ensure backups are current and endpoint protection is updated. A spike in phishing indicates the need for user awareness training.",
    howToRead: "Larger segments indicate more threats of that type. The percentage shows what portion of all detected threats fall into each category. Click on any segment to filter the threat stream by that type.",
    relatedTerms: ["malware", "phishing", "botnet", "ransomware", "c2"],
  },
  riskScore: {
    title: "Risk Score Distribution",
    icon: BarChart3,
    description: "How threats are distributed across severity levels",
    whatItShows: "This chart groups all detected threats by their risk score into four ranges: Low (0-25), Medium (26-50), High (51-75), and Critical (76-100). Risk scores are calculated based on factors like malware family severity, confidence level, and historical impact.",
    whyItMatters: "Risk scores help triage your response. Critical and high-risk threats (51-100) require immediate attention and may indicate active attacks. Medium-risk items should be investigated when time permits. Low-risk indicators are worth monitoring but may be false positives or less impactful.",
    howToRead: "Longer bars mean more threats in that risk range. A healthy security posture shows most threats in the low-to-medium range. If you see many critical threats, immediate action is needed. The color coding (green to red) provides quick visual severity assessment.",
    relatedTerms: ["riskScore", "ioc", "threatIntelligence"],
  },
  sourceActivity: {
    title: "Source Activity",
    icon: Activity,
    description: "Threat data volume by intelligence source",
    whatItShows: "This chart compares the number of threats reported by each threat intelligence feed. Currently, we aggregate data from URLHaus (malicious URLs) and ThreatFox (indicators of compromise from malware analysis).",
    whyItMatters: "Different sources specialize in different threat types. URLHaus focuses on URLs actively distributing malware, while ThreatFox collects IOCs from malware samples. If one source shows significantly more activity, it may indicate a surge in that threat category or an ongoing campaign.",
    howToRead: "Taller bars indicate more threats from that source. Comparing sources over time can reveal trends - a sudden increase from one source might indicate a new malware campaign or attack wave that you should investigate.",
    relatedTerms: ["urlhaus", "threatfox", "ioc", "threatIntelligence"],
  },
}

export function ChartInfoDialog({ chartType, chartData, open, onOpenChange }: ChartInfoDialogProps) {
  if (!chartType) return null

  const info = chartInfo[chartType]
  const Icon = info.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/20">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{info.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {info.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Current Data Summary */}
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Current Data
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {chartData.map((item, index) => {
                  const label = item.name || item.range || item.source || `Item ${index + 1}`
                  const value = item.value ?? item.count ?? 0
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-background/50 rounded"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.fill || "#6B7280" }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{label}</p>
                        <p className="text-xs text-muted-foreground">{value} threats</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* What It Shows */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">What This Chart Shows</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {info.whatItShows}
              </p>
            </div>

            {/* Why It Matters */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <h3 className="font-semibold text-foreground">Why It Matters</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {info.whyItMatters}
              </p>
            </div>

            {/* How to Read */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-green-400" />
                <h3 className="font-semibold text-foreground">How to Interpret</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {info.howToRead}
              </p>
            </div>

            <Separator className="bg-border" />

            {/* Related Terms Glossary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Key Terms Explained</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Understanding these cybersecurity terms will help you make sense of the data:
              </p>
              <div className="grid gap-3">
                {info.relatedTerms.map((termKey) => {
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
                      {entry.example && (
                        <p className="text-xs text-primary mt-2 italic">
                          Example: {entry.example}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Pro Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                {chartType === "threatDistribution" && (
                  <>
                    <li>- Track changes over time to identify emerging attack trends</li>
                    <li>- A sudden increase in one category may indicate a coordinated campaign</li>
                    <li>- Use this data to prioritize security tool configurations</li>
                  </>
                )}
                {chartType === "riskScore" && (
                  <>
                    <li>- Focus response efforts on critical (76-100) threats first</li>
                    <li>- Investigate patterns - do certain threat types consistently score higher?</li>
                    <li>- Use scores to justify security investments to leadership</li>
                  </>
                )}
                {chartType === "sourceActivity" && (
                  <>
                    <li>- Consider adding more threat intelligence sources for broader coverage</li>
                    <li>- Cross-reference findings across sources for higher confidence</li>
                    <li>- Sources with zero data may indicate API issues or rate limiting</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
