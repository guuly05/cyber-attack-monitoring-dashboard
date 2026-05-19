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
| URLHaus | Simulated route data | The dashboard currently generates realistic mock indicators for portfolio/demo use. |
| ThreatFox | Simulated route data | The dashboard currently generates realistic mock IOCs for portfolio/demo use. |
| AbuseIPDB | Live API when configured | Requires `ABUSEIPDB_API_KEY`; falls back to mock data when absent. |
| CIRCL CVE | Live public API | Used for CVE detail lookups. |

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
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Optionally add your AbuseIPDB key:

```env
ABUSEIPDB_API_KEY=your_abuseipdb_key_here
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

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
4. Add this environment variable in Vercel Project Settings:

```env
ABUSEIPDB_API_KEY=your_abuseipdb_key_here
```

5. Deploy and verify:
   - The dashboard loads.
   - Threat feed cards render.
   - Invalid searches are rejected.
   - IP lookup works with and without `ABUSEIPDB_API_KEY`.
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

| Variable | Required | Description |
| --- | --- | --- |
| `ABUSEIPDB_API_KEY` | No | Enables live AbuseIPDB IP reputation lookups. Without it, the route returns mock data. |

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
