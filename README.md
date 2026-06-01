# Cyber Attack Monitoring Dashboard

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38B2AC?logo=tailwindcss&logoColor=fff)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=fff)
![Recharts](https://img.shields.io/badge/Recharts-2.15-22B5BF)
![Radix UI](https://img.shields.io/badge/Radix_UI-Components-161618?logo=radixui&logoColor=fff)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=fff)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

A portfolio-ready cyber threat intelligence dashboard built with Next.js. It visualizes live-style security indicators, lets analysts search IPs, domains, and CVEs, and presents mitigation guidance in a clean operational interface.

## Preview

<img width="1901" height="937" alt="image" src="https://github.com/user-attachments/assets/a8f31de3-ee5b-4b89-8224-951b399291a7" />


## Features

- Live-style threat stream for malware, phishing, command-and-control, botnet, and ransomware indicators.
- Threat search for IP addresses, domains, and CVE IDs.
- AbuseIPDB integration for IP reputation lookups when `ABUSEIPDB_API_KEY` is configured.
- CVE lookup through the CIRCL CVE API.
- Risk scoring, status indicators, charts, and mitigation recommendations.
- Detailed threat dialogs with safe outbound links to VirusTotal, Shodan, and AlienVault OTX.
- Vercel Analytics enabled only in production.
- Production security headers configured in `next.config.mjs`.

## Completely Keyless – No Registration Required

This dashboard operates entirely on free, publicly accessible APIs that require no authentication or registration. You can simply clone the repository and run it without configuring any API keys. The app gathers threat intelligence dynamically from the following sources, gracefully respecting their free-tier rate limits:

- **ContrastAPI** (CVE/EPSS/KEV – 100 req/hr, no key)
- **ReportedIP** (IP threat intel – 1,000 checks/day, no key)
- **IPDetails.io** (IP geolocation + threat intel, no key)
- **crt.sh** (subdomain discovery, no key, no published limits)
- **ASN Lookup (RIPEstat)** (ASN data, no key)
- **NVD/NIST CVE API** (Vulnerability data, no key)
- **CISA KEV** (Known exploited vulnerabilities, no key)
- **CIRCL CVE API** (Vulnerability summaries, no key)
- **CIRCL hashlookup** (Hash reputation, no key)
- **URLhaus** (Malicious URLs, no key)
- **ThreatFox** (IOC search, no key)
- **SANS ISC/DShield** (IP attack logs, no key)

*(Note: The dashboard optionally supports an `ABUSEIPDB_API_KEY` for live IP reputation, but falls back to realistic mock data natively if omitted.)*

## Tech Stack

- **Framework:** Next.js App Router
- **UI:** React, TypeScript, Tailwind CSS, Radix UI primitives, lucide-react
- **Data fetching:** TanStack Query
- **Charts:** Recharts
- **Validation and utilities:** TypeScript, zod, clsx, tailwind-merge
- **Deployment:** Vercel
- **Package manager:** pnpm

## Data Sources

| Source | Current behavior | Notes |
| --- | --- | --- |
| ContrastAPI | Live public API | CVE/EPSS/KEV and risk scoring. |
| ReportedIP | Live public API | IP threat intelligence. |
| IPDetails.io | Live public API | Network infrastructure and geolocation. |
| crt.sh | Live public API | Certificate transparency and subdomains. |
| RIPEstat | Live public API | ASN and BGP routing data. |
| NVD / CISA KEV | Live public API | Primary vulnerability information. |
| CIRCL | Live public API | Secondary CVE summaries and hash lookups. |
| URLhaus / ThreatFox | Live public API & Mocked feeds | Live search APIs; dashboard cards optionally use simulated streams for demo visual volume. |
| SANS ISC/DShield | Live public API | Global sensor threat observations. |
| AbuseIPDB | Mock data (or Live if configured) | Returns simulated data unless `ABUSEIPDB_API_KEY` is explicitly configured. |

This project is a monitoring and education dashboard. Treat simulated indicators as demo data, not operational intelligence.

## Architecture

```text
app/
  api/threats/          Server-side API routes for search and source adapters
  page.tsx              Main dashboard screen
components/dashboard/   Dashboard UI, charts, search, and details
components/ui/          Reusable UI primitives
hooks/use-threats.ts    TanStack Query hooks for live feed and search
lib/                    Types, glossary, normalization, and mitigation logic
```

Sensitive API calls are handled server-side through Next.js route handlers. The AbuseIPDB key is read from `process.env.ABUSEIPDB_API_KEY` and is never exposed as a `NEXT_PUBLIC_*` variable.

## Getting Started

### Prerequisites

- Node.js 22 LTS or newer is recommended.
- pnpm 10.

If pnpm is not installed globally, use npm to invoke the pinned version:

```bash
npm exec pnpm@10.0.0 -- install
```

### Installation

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The dashboard operates out-of-the-box using purely keyless APIs. No `.env.local` file or key configuration is required to get started.

## Security

Security-focused launch work included in this repository:

- TypeScript build errors are no longer ignored in `next.config.mjs`.
- Global security headers are configured:
  - `Content-Security-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- External investigation links use `target="_blank"` with `rel="noopener noreferrer"`.
- Secrets are excluded through `.gitignore`; real `.env*.local` files should never be committed.
- `ABUSEIPDB_API_KEY` remains server-only.
- pnpm overrides pin patched transitive versions for `lodash` and `postcss`.

Run these checks before publishing changes:

```bash
pnpm audit --audit-level moderate
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Use the default Next.js framework settings:
   - Install command: `pnpm install`
   - Build command: `pnpm build`
   - Output directory: Next.js default
4. Deploy and verify:
   - The dashboard loads.
   - Threat feed cards render.
   - Invalid searches are rejected.
   - Response headers include the configured security headers.

## GitHub Launch

If this folder is not yet a Git repository:

```bash
git init
git add .
git commit -m "Prepare secure public launch"
```

Create a public GitHub repository named `cyber-attack-monitoring-dashboard`, then connect and push:

```bash
git remote add origin https://github.com/<your-username>/cyber-attack-monitoring-dashboard.git
git branch -M main
git push -u origin main
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run the local development server. |
| `pnpm build` | Build the production app. |
| `pnpm start` | Start the production server after building. |
| `pnpm lint` | Run ESLint. |
| `pnpm audit --audit-level moderate` | Check dependency advisories. |

## Environment Variables

No environment variables are required to run this dashboard. It relies on publicly accessible, authentication-free APIs. 

*(Optional)* You may define `ABUSEIPDB_API_KEY` to enable live lookups against AbuseIPDB instead of the default mock fallback data.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).