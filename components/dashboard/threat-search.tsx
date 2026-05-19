"use client"

import { useState } from "react"
import { useThreatSearch } from "@/hooks/use-threats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Shield,
  AlertTriangle,
  Globe,
  Server,
  FileWarning,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function ThreatSearchEngine() {
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  
  const { data: results, isLoading, isError } = useThreatSearch(searchQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      setSearchQuery(inputValue.trim())
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Threat Investigation Engine</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Search IP addresses, domains, or CVE IDs
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter IP, domain, or CVE ID (e.g., CVE-2021-44228)"
            className="flex-1 bg-muted/50 border-border font-mono"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Investigate</span>
          </Button>
        </form>

        {isError && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <XCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">Search failed. Please check your input and try again.</p>
          </div>
        )}

        {results && <SearchResults results={results} />}
        
        {!results && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Enter a query to investigate threats</p>
            <p className="text-xs text-muted-foreground mt-2">
              Supported formats: IPv4/IPv6, domain names, CVE IDs
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface SearchResultsProps {
  results: {
    query: string
    queryType: "ip" | "domain" | "cve"
    timestamp: string
    abuseipdb?: {
      data?: {
        ipAddress: string
        abuseConfidenceScore: number
        countryCode: string
        isp: string
        totalReports: number
        lastReportedAt: string
      }
      status: string
    }
    urlhaus?: {
      threats: Array<{
        id: string
        type: string
        host: string
        riskScore: number
        timestamp: string
        malwareFamily?: string
      }>
      status: string
    }
    threatfox?: {
      threats: Array<{
        id: string
        type: string
        host: string
        riskScore: number
        malwareFamily?: string
      }>
      status: string
    }
    cve?: {
      data?: {
        id: string
        summary: string
        cvss?: number
        cvss3?: number
        references: string[]
        vulnerable_product: string[]
        Published: string
        Modified: string
      }
      status: string
    }
    mitigationStrategies: string[]
  }
}

function SearchResults({ results }: SearchResultsProps) {
  const queryTypeIcons = {
    ip: Server,
    domain: Globe,
    cve: FileWarning,
  }
  const Icon = queryTypeIcons[results.queryType]

  return (
    <div className="space-y-6">
      {/* Query Header */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Investigating {results.queryType.toUpperCase()}</p>
          <p className="font-mono text-lg text-foreground">{results.query}</p>
        </div>
        <Badge variant="outline" className="ml-auto">
          {new Date(results.timestamp).toLocaleTimeString()}
        </Badge>
      </div>

      {/* IP Investigation Results */}
      {results.queryType === "ip" && results.abuseipdb?.data && (
        <IPReputationCard data={results.abuseipdb.data} />
      )}

      {/* CVE Investigation Results */}
      {results.queryType === "cve" && results.cve?.data && (
        <CVEDetailsCard data={results.cve.data} />
      )}

      {/* Associated Threats from URLHaus */}
      {results.urlhaus && results.urlhaus.threats && results.urlhaus.threats.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              URLHaus Matches ({results.urlhaus.threats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.urlhaus.threats.slice(0, 5).map((threat) => (
                <div key={threat.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div className="font-mono text-sm truncate flex-1">{threat.host}</div>
                  <Badge variant={threat.riskScore >= 70 ? "destructive" : "secondary"}>
                    Risk: {threat.riskScore}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Associated Threats from ThreatFox */}
      {results.threatfox && results.threatfox.threats && results.threatfox.threats.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              ThreatFox Matches ({results.threatfox.threats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.threatfox.threats.slice(0, 5).map((threat) => (
                <div key={threat.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div>
                    <p className="font-mono text-sm truncate">{threat.host}</p>
                    {threat.malwareFamily && (
                      <p className="text-xs text-muted-foreground">Malware: {threat.malwareFamily}</p>
                    )}
                  </div>
                  <Badge variant={threat.riskScore >= 70 ? "destructive" : "secondary"}>
                    Risk: {threat.riskScore}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mitigation Strategies */}
      {results.mitigationStrategies.length > 0 && (
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Recommended Mitigation Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.mitigationStrategies.map((strategy, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{strategy}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function IPReputationCard({ data }: { data: NonNullable<SearchResultsProps["results"]["abuseipdb"]>["data"] }) {
  if (!data) return null
  
  const scoreColor = data.abuseConfidenceScore >= 80 ? "text-red-400" : 
                     data.abuseConfidenceScore >= 50 ? "text-yellow-400" : "text-green-400"
  const scoreBg = data.abuseConfidenceScore >= 80 ? "bg-red-500/10" : 
                  data.abuseConfidenceScore >= 50 ? "bg-yellow-500/10" : "bg-green-500/10"

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          IP Reputation (AbuseIPDB)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={cn("p-3 rounded-lg", scoreBg)}>
            <p className="text-xs text-muted-foreground">Abuse Score</p>
            <p className={cn("text-2xl font-bold font-mono", scoreColor)}>
              {data.abuseConfidenceScore}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Country</p>
            <p className="text-lg font-mono">{data.countryCode || "Unknown"}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Total Reports</p>
            <p className="text-lg font-mono">{data.totalReports}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">ISP</p>
            <p className="text-sm font-mono truncate">{data.isp || "Unknown"}</p>
          </div>
        </div>
        {data.lastReportedAt && (
          <p className="text-xs text-muted-foreground mt-3">
            Last reported: {new Date(data.lastReportedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function CVEDetailsCard({ data }: { data: NonNullable<SearchResultsProps["results"]["cve"]>["data"] }) {
  if (!data) return null
  
  const cvssScore = data.cvss3 || data.cvss || 0
  const severityColor = cvssScore >= 9 ? "text-red-400" : 
                        cvssScore >= 7 ? "text-orange-400" : 
                        cvssScore >= 4 ? "text-yellow-400" : "text-green-400"
  const severityBg = cvssScore >= 9 ? "bg-red-500/10" : 
                     cvssScore >= 7 ? "bg-orange-500/10" : 
                     cvssScore >= 4 ? "bg-yellow-500/10" : "bg-green-500/10"
  const severityLabel = cvssScore >= 9 ? "CRITICAL" : 
                        cvssScore >= 7 ? "HIGH" : 
                        cvssScore >= 4 ? "MEDIUM" : "LOW"

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileWarning className="h-4 w-4 text-primary" />
          CVE Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 mb-4">
          <div className={cn("p-3 rounded-lg text-center", severityBg)}>
            <p className="text-xs text-muted-foreground">CVSS Score</p>
            <p className={cn("text-2xl font-bold font-mono", severityColor)}>
              {cvssScore.toFixed(1)}
            </p>
            <Badge variant="outline" className={cn("mt-1", severityColor)}>
              {severityLabel}
            </Badge>
          </div>
          <div className="flex-1">
            <h3 className="font-mono text-lg text-foreground mb-2">{data.id}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3">{data.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Published</p>
            <p className="text-sm font-mono">{new Date(data.Published).toLocaleDateString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Last Modified</p>
            <p className="text-sm font-mono">{new Date(data.Modified).toLocaleDateString()}</p>
          </div>
        </div>

        {data.vulnerable_product.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Affected Products ({data.vulnerable_product.length})</p>
            <div className="flex flex-wrap gap-1">
              {data.vulnerable_product.slice(0, 5).map((product, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-mono">
                  {product.split(":").slice(-2).join(":")}
                </Badge>
              ))}
              {data.vulnerable_product.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{data.vulnerable_product.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {data.references.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">References</p>
            <div className="space-y-1">
              {data.references.slice(0, 3).map((ref, i) => (
                <a
                  key={i}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  {ref}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
