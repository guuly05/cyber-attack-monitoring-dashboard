// Cybersecurity glossary for educating users
export interface GlossaryTerm {
  term: string
  definition: string
  example?: string
  severity?: "low" | "medium" | "high" | "critical"
}

export const cyberGlossary: Record<string, GlossaryTerm> = {
  malware: {
    term: "Malware",
    definition: "Malicious software designed to damage, disrupt, or gain unauthorized access to computer systems. This includes viruses, worms, trojans, and spyware.",
    example: "A trojan horse disguised as a legitimate software download that steals your passwords.",
    severity: "high",
  },
  phishing: {
    term: "Phishing",
    definition: "A social engineering attack where criminals impersonate trusted entities to trick victims into revealing sensitive information like passwords or credit card numbers.",
    example: "An email pretending to be from your bank asking you to 'verify' your account by clicking a link.",
    severity: "medium",
  },
  botnet: {
    term: "Botnet",
    definition: "A network of compromised computers (bots or zombies) controlled by an attacker. These are often used for DDoS attacks, spam campaigns, or cryptocurrency mining.",
    example: "Your computer could be part of a botnet without your knowledge, being used to attack other systems.",
    severity: "high",
  },
  ransomware: {
    term: "Ransomware",
    definition: "A type of malware that encrypts your files and demands payment (ransom) to restore access. Often spreads through phishing emails or vulnerable software.",
    example: "The WannaCry attack that affected hospitals and businesses worldwide, demanding Bitcoin payments.",
    severity: "critical",
  },
  c2: {
    term: "Command & Control (C2)",
    definition: "Infrastructure used by attackers to communicate with and control compromised systems. C2 servers send commands to malware and receive stolen data.",
    example: "Malware on your computer 'phones home' to a C2 server to receive instructions on what to steal.",
    severity: "critical",
  },
  ioc: {
    term: "Indicator of Compromise (IOC)",
    definition: "Evidence that a security breach has occurred. IOCs help identify malicious activity and include IP addresses, file hashes, domain names, and URLs.",
    example: "A suspicious IP address that your firewall detected trying to connect to your network.",
    severity: "medium",
  },
  riskScore: {
    term: "Risk Score",
    definition: "A numerical rating (0-100) indicating how dangerous a threat is. Higher scores mean greater risk to your systems and data.",
    example: "A score of 90+ indicates a critical threat that requires immediate attention.",
    severity: "high",
  },
  cve: {
    term: "CVE (Common Vulnerabilities and Exposures)",
    definition: "A standardized identifier for known security vulnerabilities. Each CVE ID refers to a specific security flaw in software or hardware.",
    example: "CVE-2021-44228 is the identifier for the Log4Shell vulnerability that affected millions of systems.",
    severity: "high",
  },
  hash: {
    term: "File Hash",
    definition: "A unique digital fingerprint of a file. Security tools use hashes (MD5, SHA256) to identify known malicious files without needing the actual file.",
    example: "If a file's hash matches a known malware hash, your antivirus will block it.",
    severity: "low",
  },
  threatIntelligence: {
    term: "Threat Intelligence",
    definition: "Information about current and emerging cyber threats collected from various sources. Helps organizations understand and defend against attacks.",
    example: "This dashboard aggregates threat intelligence from URLHaus, ThreatFox, and AbuseIPDB.",
    severity: "low",
  },
  urlhaus: {
    term: "URLHaus",
    definition: "A free threat intelligence feed operated by abuse.ch that tracks malicious URLs used for malware distribution. Updated continuously by security researchers.",
    example: "A URL serving a fake software download that actually installs ransomware.",
    severity: "medium",
  },
  threatfox: {
    term: "ThreatFox",
    definition: "A free platform by abuse.ch for sharing Indicators of Compromise (IOCs). Security researchers submit IOCs from malware samples they analyze.",
    example: "An IP address identified as a C2 server for the Emotet malware family.",
    severity: "medium",
  },
  abuseipdb: {
    term: "AbuseIPDB",
    definition: "A database of IP addresses reported for malicious activity. Users can check if an IP has been flagged for abuse like hacking attempts or spam.",
    example: "An IP address with 100 abuse reports is likely malicious and should be blocked.",
    severity: "medium",
  },
  ddos: {
    term: "DDoS (Distributed Denial of Service)",
    definition: "An attack that overwhelms a target with traffic from many sources, making it unavailable to legitimate users. Often executed using botnets.",
    example: "A website going offline because attackers flooded it with millions of requests per second.",
    severity: "high",
  },
  trojan: {
    term: "Trojan Horse",
    definition: "Malware disguised as legitimate software. Unlike viruses, trojans don't replicate but trick users into installing them.",
    example: "A 'free game' download that secretly installs a keylogger to steal your passwords.",
    severity: "high",
  },
  exploit: {
    term: "Exploit",
    definition: "Code or technique that takes advantage of a vulnerability in software to cause unintended behavior, often leading to system compromise.",
    example: "An exploit for a browser vulnerability that lets attackers run code just by visiting a webpage.",
    severity: "critical",
  },
  zeroDay: {
    term: "Zero-Day",
    definition: "A vulnerability unknown to the software vendor, meaning no patch exists. Called 'zero-day' because developers have had zero days to fix it.",
    example: "Attackers using a previously unknown flaw in Windows before Microsoft can release a patch.",
    severity: "critical",
  },
  apt: {
    term: "APT (Advanced Persistent Threat)",
    definition: "Sophisticated, long-term cyberattacks usually conducted by nation-states or well-funded groups. They remain undetected while stealing data over months or years.",
    example: "A state-sponsored group infiltrating a government network to steal classified information.",
    severity: "critical",
  },
}

export function getTermDefinition(term: string): GlossaryTerm | undefined {
  const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9]/g, "")
  return cyberGlossary[normalizedTerm]
}

export function getSeverityColor(severity: GlossaryTerm["severity"]): string {
  switch (severity) {
    case "critical":
      return "text-red-400"
    case "high":
      return "text-orange-400"
    case "medium":
      return "text-yellow-400"
    case "low":
      return "text-green-400"
    default:
      return "text-muted-foreground"
  }
}

// Generate mitigation strategies based on threat type
export function getMitigationStrategies(threatType: string, malwareFamily?: string): string[] {
  const baseStrategies: Record<string, string[]> = {
    malware: [
      "Immediately isolate the affected system from the network to prevent spread",
      "Run a full system scan with updated antivirus/anti-malware software",
      "Check for unauthorized processes and remove suspicious applications",
      "Update all software and apply security patches",
      "Reset passwords for any accounts accessed from the affected system",
      "Monitor network traffic for unusual outbound connections",
    ],
    phishing: [
      "Do not click any links or download attachments from the suspicious source",
      "Report the phishing attempt to your IT security team",
      "If credentials were entered, immediately change those passwords",
      "Enable multi-factor authentication (MFA) on all accounts",
      "Verify requests through official channels before taking action",
      "Mark the sender as spam and block future communications",
    ],
    botnet: [
      "Disconnect the system from the network immediately",
      "Run specialized botnet removal tools (Malwarebytes, HitmanPro)",
      "Check for and remove unauthorized startup programs",
      "Reset router to factory settings and update firmware",
      "Change all passwords from a clean device",
      "Consider reinstalling the operating system for complete removal",
    ],
    ransomware: [
      "IMMEDIATELY disconnect from all networks (unplug ethernet, disable WiFi)",
      "Do NOT pay the ransom - there's no guarantee of data recovery",
      "Report the incident to law enforcement (FBI IC3, local cyber crime unit)",
      "Restore files from offline backups if available",
      "Identify the ransomware variant using ID Ransomware tools",
      "Engage professional incident response if critical systems are affected",
    ],
    c2: [
      "Block the C2 IP/domain at the firewall immediately",
      "Identify and isolate all systems communicating with the C2 server",
      "Capture network traffic for forensic analysis",
      "Search for associated malware and remove it",
      "Review logs to determine the scope of compromise",
      "Consider the system fully compromised - plan for remediation",
    ],
    unknown: [
      "Investigate the indicator further before taking action",
      "Cross-reference with multiple threat intelligence sources",
      "Monitor systems for related suspicious activity",
      "Document findings for security team review",
      "Apply the principle of least privilege to limit potential damage",
    ],
  }

  const strategies = baseStrategies[threatType] || baseStrategies.unknown

  // Add malware family specific advice
  if (malwareFamily) {
    const familyAdvice: Record<string, string> = {
      emotet: "Emotet often spreads via malicious email attachments - review email security policies",
      trickbot: "TrickBot can steal banking credentials - monitor financial accounts closely",
      qakbot: "QakBot spreads laterally - check other systems on the same network segment",
      cobalt: "Cobalt Strike indicates sophisticated attackers - engage incident response team",
      raccoon: "Raccoon Stealer targets browser data - reset all saved passwords",
      redline: "RedLine targets cryptocurrency wallets - secure and monitor crypto accounts",
    }

    const familyKey = malwareFamily.toLowerCase().replace(/[^a-z]/g, "")
    for (const [key, advice] of Object.entries(familyAdvice)) {
      if (familyKey.includes(key)) {
        strategies.unshift(advice)
        break
      }
    }
  }

  return strategies
}

// Get cause analysis for a threat
export function getThreatCause(threatType: string, source: string): string {
  const causes: Record<string, string> = {
    malware: "This indicator was flagged because it matches known malware signatures or behavior patterns. The malicious code may have been distributed through compromised websites, malicious email attachments, or bundled with pirated software.",
    phishing: "This URL or domain has been identified as part of a phishing campaign. Attackers created this to impersonate legitimate services and steal user credentials or financial information.",
    botnet: "This IP address or domain is associated with botnet command infrastructure. Compromised computers (bots) connect to these addresses to receive instructions from attackers.",
    ransomware: "This indicator is linked to ransomware operations. The threat actor uses this infrastructure to distribute ransomware payloads or collect ransom payments.",
    c2: "This is a Command & Control server used by attackers to manage compromised systems. Malware on infected computers communicates with this address to receive commands and exfiltrate stolen data.",
    unknown: "This indicator was flagged by threat intelligence sources but the exact threat category could not be determined. Further investigation is recommended.",
  }

  const sourceContext: Record<string, string> = {
    URLHaus: " URLHaus specifically tracks URLs used for malware distribution, meaning this URL has been observed serving malicious payloads.",
    ThreatFox: " ThreatFox collects IOCs from malware analysis, so this indicator was extracted from actual malware samples by security researchers.",
    AbuseIPDB: " AbuseIPDB aggregates user reports of IP abuse, indicating multiple people have reported malicious activity from this address.",
  }

  return (causes[threatType] || causes.unknown) + (sourceContext[source] || "")
}
