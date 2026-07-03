# InvoiceProcessing-Bertelsmann

## Project overview
A React + TypeScript demo/prototype for AI-driven invoice processing, built for the Bertelsmann client. Runs in the browser with Vite. All data is mocked — no real backend. Deployed via Netlify.

## Tech stack
- React 18, TypeScript, Vite
- All state lives in `src/App.tsx`; child components receive props
- Mock data in `src/data/mockData.ts` (invoices, emails, reply flows)
- Types in `src/types.ts`

## Key concepts
- **Invoice workspace** — the main working area (`InvoiceWorkspace.tsx`, `ProcessingView.tsx`, `ScannedInvoice.tsx`)
- **Agent timeline** — step-by-step AI processing view (`AgentTimeline.tsx`)
- **Tickets** — issue tracking view (`TicketsView.tsx`); ticket IDs follow the pattern `WYL-RY-2026-XXXX`
- **Outlook panel** — simulated email inbox/outbox (`OutlookInbox.tsx`, `OutlookPanel.tsx`)
- **Audit trail** — logging view (`AuditTrailPage.tsx`, `AuditModal.tsx`)
- **Sidebar tabs**: Dashboard, Invoices, Tickets, Audit Trail, Settings

## Build
```
npm run build   # vite build (tsc check is skipped — see commit dc12215)
npm run dev     # local dev server
```
Netlify runs `vite build` directly (not `tsc && vite build`) to avoid TypeScript errors blocking deploys.

## Working style with Claude
- Before applying any remembered context (from this file or memory), Claude should ask whether that context is relevant to the current task. One short question is enough — don't assume relevance.
- Keep responses concise; no trailing summaries.
