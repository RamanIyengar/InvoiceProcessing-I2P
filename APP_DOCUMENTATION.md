# UPS Invoice Processing — App Documentation

> Version 0.1.0 · React 18 · TypeScript · Vite 5

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Data Model](#data-model)
5. [Mock Data](#mock-data)
6. [App Routing & State](#app-routing--state)
7. [Invoice Processing Flow](#invoice-processing-flow)
8. [Exception Handling Flows](#exception-handling-flows)
9. [Email Workflow](#email-workflow)
10. [Component Reference](#component-reference)
11. [Known Issues](#known-issues)

---

## Overview

A fully client-side demo application simulating an **AI-powered Accounts Payable invoice processing platform** for UPS. The app demonstrates how an agentic AI system ingests invoices received via email, runs them through a multi-step validation pipeline, handles exceptions, and routes approved invoices to Oracle Payments — all with a real-time UI that mirrors what an AP operations team would see.

**No backend.** All data is mocked in `src/data/mockData.ts`. All state lives in React state (App-level) and module-level caches (ProcessingView).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.3 |
| Language | TypeScript 5.5 |
| Build Tool | Vite 5.4 |
| Styling | Inline styles only (no CSS-in-JS library) |
| Icons | Custom SVG inline components |
| State | React useState / useEffect / useRef (no external store) |
| Data | Static mock data (no API calls) |

---

## Project Structure

```
src/
├── main.tsx                    — React DOM entry point
├── App.tsx                     — Root component, all global state & handlers
├── types.ts                    — All TypeScript interfaces and enums
├── index.css                   — Global CSS resets and keyframe animations
│
├── data/
│   └── mockData.ts             — 11 mock invoices + reply email arrays + agent step configs
│
└── components/
    ├── ProcessingView.tsx      — Core processing UI (~2700 lines); all inner components defined inline
    ├── InvoiceWorkspace.tsx    — Thin props pass-through wrapper around ProcessingView
    ├── TicketsView.tsx         — Invoice inbox list
    ├── DashboardView.tsx       — KPI dashboard
    ├── AuditTrailPage.tsx      — Full audit trail page
    ├── Sidebar.tsx             — Left navigation
    ├── AppHeader.tsx           — Top header bar
    ├── LandingScreen.tsx       — Home/entry screen with Outlook & ServiceNow buttons
    ├── LoginScreen.tsx         — ServiceNow login form
    ├── OutlookLoginScreen.tsx  — Outlook login form
    ├── OutlookInbox.tsx        — Reply email inbox (simulated Outlook)
    ├── OutlookPanel.tsx        — Email reading panel
    ├── AgentTimeline.tsx       — Agent activity timeline
    ├── InvoiceCard.tsx         — Invoice list card component
    └── [other display components]
```

---

## Data Model

### Core Types (`src/types.ts`)

```typescript
InvoiceCategory  = 'PO' | 'Non-PO' | 'Oracle 26-B'
InvoiceStatus    = 'detected' | 'processing' | 'awaiting-approval' | 'approved' | 'rejected' | 'info-requested'
FailType         = 'gl-missing' | 'missing-gr' | 'duplicate' | 'tax-mismatch' | 'manual-approval'
ActorType        = 'Agent' | 'Human'
```

### Invoice

The central entity. Key fields:

| Field | Type | Purpose |
|---|---|---|
| `id` | string | Unique identifier (e.g. `inv-1`) |
| `invoiceNumber` | string | Display invoice number (e.g. `INV-UPS-458921`) |
| `supplier` | string | Vendor name |
| `category` | InvoiceCategory | PO / Non-PO / Oracle 26-B |
| `failType` | FailType? | Exception type if processing fails |
| `failAtStep` | number? | Which agent step triggers the failure |
| `failMessage` | string? | Message shown in the exception card |
| `glMissingVariant` | `'internal-approval' \| 'prt-coding' \| undefined` | Sub-type for GL missing flow |
| `straightforward` | boolean? | If true, invoice auto-approves with no human intervention |
| `extractedFields` | ExtractedFields | All parsed invoice field values + confidence scores |
| `agentSteps` | AgentStep[] | Processing pipeline steps |
| `auditTrail` | AuditEntry[] | Immutable log of all actions |
| `recommendation` | string? | Agent recommendation text shown in FinalSummary |

### ExtractedFields

Holds all parsed values from the invoice document including `invoiceNumber`, `supplierName`, `poNumber`, `grNumber`, `glAccount`, `costCenter`, `taxCode`, `lineItems[]`, `conflictingGLCodes[]`, `fieldConfidences` (Record of per-field confidence 0–1), and 20+ additional fields.

### ReplyEmail

Simulates an incoming email reply in the Outlook inbox:

```typescript
interface ReplyEmail {
  id: string
  senderName: string
  senderEmail: string
  subject: string
  time: string
  body: string
  relatedInvoiceId: string
  isUnread: boolean
  attachmentName?: string      // attachment display name
  attachmentInvoiceId?: string // links attachment to an invoice
}
```

---

## Mock Data

### Invoices (`src/data/mockData.ts`)

11 invoices covering all exception scenarios:

| ID | Invoice No. | Supplier | Category | Amount | Exception |
|---|---|---|---|---|---|
| inv-1 | INV-UPS-458921 | Global Packaging Supplies Inc. | PO | $48,438 | None — straight-through auto-approve |
| inv-2 | INV-UPS-391043 | Continental Logistics Ltd | PO | $23,800 | Missing GR |
| inv-3 | INV-UPS-507832 | Apex Industrial Components | PO | $67,400 | Duplicate invoice |
| inv-4 | INV-UPS-782104 | Metro Facilities Services LLC | Non-PO | $12,840 | GL Missing (internal-approval) |
| inv-5 | INV-UPS-634571 | City Office Solutions | PO | $48,438 | Tax mismatch |
| inv-6 | INV-UPS-895623 | ProClean Maintenance Co. | Non-PO | $8,150 | GL Missing (standard) |
| inv-7 | INV-UPS-660219 | Air Freight Systems | Oracle 26-B | $31,600 | None |
| inv-8 | INV-UPS-541097 | Global Customs Brokers | Oracle 26-B | $15,200 | None |
| inv-9 | INV-UPS-550181 | TechSupport Worldwide | PO | $50,000 | Manual approval required |
| inv-10 | INV-UPS-662550 | TechSupport Worldwide | Non-PO | $50,000 | GL Missing (standard) |
| inv-11 | INV-UPS-771430 | TechSupport Worldwide | Non-PO | $50,000 | GL Missing (prt-coding) |

### Reply Email Arrays

| Export | Invoice | Senders | Trigger |
|---|---|---|---|
| `taxMismatchReplyEmails` | inv-5 | City Office Solutions + Rachel Kim | Tax rejection email sent |
| `glApprovalReplyEmail` | inv-6, inv-10 | AP Automation | GL approval email sent |
| `metroGLReplyEmails` | inv-4 | James Wilson + Rachel Kim | Metro GL approval email sent |
| `prtGLReplyEmails` | inv-11 | Alex Morgan + David Turner | PRT coding approval email sent |

### Agent Step Configurations

- **`PO_STEPS`** (5 steps): Ingest → Extract → Completeness Check → Master Data Check → 3-Way Match
- **`NON_PO_STEPS`** (5 steps): Ingest → Extract → Completeness Check → Master Data Check → GL Coding

Each step has 2–4 named agents that appear in the Agent Huddle activity log.

---

## App Routing & State

### App Views (`appView` state)

```
'home'              — LandingScreen (Outlook + ServiceNow entry buttons)
'outlook-login'     — OutlookLoginScreen
'outlook'           — OutlookInbox (simulated Outlook with reply emails)
'servicenow-login'  — LoginScreen
(default)           — Main app (sidebar + content area)
```

### Global State (`src/App.tsx`)

| State | Type | Purpose |
|---|---|---|
| `activeTab` | SidebarTab | Current sidebar view |
| `selectedInvoice` | Invoice \| null | Invoice currently being processed |
| `processedInvoiceIds` | Set\<string\> | Completed invoice IDs (shown with ✓ badge) |
| `replyEmails` | ReplyEmail[] | Dynamic inbox — reply emails added by handlers |
| `taxMismatchEmailSent` | boolean | Tax rejection email dispatched |
| `taxMismatchRepliesReceived` | boolean | Corrected invoice received back |
| `missingGRSent` | boolean | Missing GR notification dispatched |
| `glApprovalEmailReceived` | boolean | Standard GL approval reply received |
| `prtGLBothApproved` | boolean | Both Alex Morgan AND David Turner approved PRT |
| `metroGLApprovalSent` | boolean | Metro GL request dispatched |
| `metroApprovedIds` | Set\<string\> | Metro-approved invoice IDs |

### Computed Values

```typescript
// True when both PRT reply emails are present AND both are marked read
const glEmailsViewed = selectedInvoice?.glMissingVariant === 'prt-coding'
  ? prtReplies.length === 2 && prtReplies.every(e => !e.isUnread)
  : replyEmails.some(e => e.id === 'reply-gl-approval' && !e.isUnread)

// True when any GL invoice has approval confirmed
const glApprovalReceived = failType === 'gl-missing'
  && glMissingVariant !== 'internal-approval'
  && (glMissingVariant === 'prt-coding' ? prtGLBothApproved : glApprovalEmailReceived)
```

---

## Invoice Processing Flow

### Step Engine (`ProcessingView.tsx`)

Each invoice runs through its `agentSteps` array sequentially. Timing constants:

- **`STEP_DURATION_MS`** = 6000ms — time allocated per step
- **`TICK_MS`** = 60ms — progress bar update interval

**State machine per invoice:**

```
queued → running (each step) → complete ──► isDone = true → AutoApprovePanel or ManualApprovalCard
                                  └──► isFailed = true → Exception Card + Sticky Panel
```

**Processing stops** when `currentStep === invoice.failAtStep`. The matching exception UI is shown.

**Auto-approve path** (`invoice.straightforward = true` or all validations pass): No human action required. AutoApprovePanel renders with "Auto-Approved · Sent to Oracle Payments Agent."

**FinalSummary** renders when:
- `isDone` (straight-through or manual approval), OR
- `isGLResolved && glEmailsViewed` (GL exception fully resolved and reply emails read)

---

## Exception Handling Flows

### GL Missing — Standard (`glMissingVariant: undefined`)

1. Agent step fails at GL Coding step
2. `GLMissingCard` renders with conflicting GL codes and manual entry
3. User selects or types a GL code → sets `appliedCode`
4. `GLModal` opens → user sends approval email to invoice sender
5. After 2s, `glApprovalReplyEmail` arrives in Outlook inbox
6. User navigates to Outlook, opens email → `isUnread = false`
7. `glEmailsViewed` becomes true → `AutoApprovePanel` variant `gl-resolved` renders:
   **"GL Code Approved — Sent to Oracle Payments"**

**DOA Notification tiles:** James Wilson (Requestor) · Rachel Kim (Head of Department)

---

### GL Missing — Metro Facilities (`glMissingVariant: 'internal-approval'`)

1. `MetroGLMissingCard` renders with internal approval prompt
2. `MetroGLApprovalModal` → sends internal request to James Wilson & Rachel Kim
3. After 2s, both reply emails arrive in Outlook
4. User marks emails as read → `metroApproved` becomes true
5. Invoice advances to Approved state

**DOA Notification tiles:** James Wilson (Requestor) · Rachel Kim (Head of Department)

---

### GL Missing — PRT Coding (`glMissingVariant: 'prt-coding'`)

1. `PRTCodingCard` renders with animated PRT system trace steps
2. Generates coding string: `3.2029.805089.805.000.773207.P42529.2029240740.CON82580.$12090. Item #`
3. `GLModal` (PRT variant) → sends rich HTML email to Alex Morgan (CC: David Turner)
4. After 2s: Alex Morgan's reply arrives (`reply-prt-gl-1`) — `glApprovalEmailReceived = true`
5. After 4s: David Turner's reply arrives (`reply-prt-gl-2`) — `prtGLBothApproved = true`
6. **Both** emails must be opened in Outlook → `glEmailsViewed = true`
7. `AutoApprovePanel` variant `gl-resolved` renders

**DOA Notification tiles:** Alex Morgan (Requestor) · David Turner (Head of Department)

**Dual-approval gate:** `prtGLBothApproved` only becomes true when David Turner's reply arrives (4s). The standard `glApprovalEmailReceived` flag set at 2s is not sufficient to unlock the PRT flow — the `glApprovalReceived` prop for PRT is wired to `prtGLBothApproved` only.

---

### Missing GR

1. Agent fails at 3-Way Match
2. `MissingGRCard` renders with PO owner contact details
3. `MissingGRModal` → sends GR request email
4. `StickyMissingGRPanel` shows "Awaiting GR confirmation" state

---

### Duplicate Invoice

1. Agent fails at Completeness Check / Master Data Check
2. `DuplicateCard` renders prior payment details (AP doc number, payment date, method)
3. `DuplicateModal` → sends notification to sender
4. `StickyDuplicatePanel` shows rejection state

---

### Tax Mismatch

1. Agent fails at 3-Way Match
2. `TaxMismatchCard` renders detected vs. expected tax code/rate and variance amount
3. `TaxMismatchModal` → sends rejection email to supplier
4. After 2s: corrected invoice reply emails arrive from supplier + Rachel Kim
5. `taxMismatchAutoResolved = true` → `AutoApprovePanel` renders

---

### Manual Approval Required

1. Low-confidence extracted fields trigger `ManualApprovalCard`
2. Shows fields below confidence threshold with RAG indicators
3. `StickyManualApprovalPanel` → AP officer clicks Approve
4. `invoiceApproved = true` → `FinalSummary` renders

---

## Email Workflow

### CommunicationPreviewModal

All outbound emails open a `CommunicationPreviewModal` before sending. It supports two rendering modes:

- **`body`** (string) — plain text, rendered in `<pre>`
- **`bodyHtml`** (string) — rich HTML, rendered via `dangerouslySetInnerHTML`

The HTML is fully code-generated (not user input), so `dangerouslySetInnerHTML` is safe.

### GLModal Email Content

**Standard GL invoices:**
- To: invoice sender email · CC: ap-operations@ups.com
- Subject: `GL Code Applied — Approval Required Before Processing — {invoiceNumber} — {supplier}`
- Body: HTML table with invoice details + Applied GL Code field + ServiceNow/AP Operations hyperlinks

**PRT Coding (inv-11):**
- To: a.morgan@ups.com · CC: d.turner@ups.com
- Subject: `PRT Coding String — DOA Approval Required — {invoiceNumber} — {supplier}`
- Body: HTML table + amber-highlighted coding string box + "Dear Alex & David" salutation

### Simulated Reply Timing

| Flow | Delay | What arrives |
|---|---|---|
| Tax mismatch rejection | 2s | 2 reply emails (supplier + Rachel Kim) |
| Standard GL approval | 2s | 1 reply email (AP Automation) |
| PRT GL — Requestor | 2s | Alex Morgan reply |
| PRT GL — HOD | 4s | David Turner reply |
| Metro GL | 2s | 2 reply emails (James Wilson + Rachel Kim) |

---

## Component Reference

### ProcessingView Inner Components

| Component | Purpose |
|---|---|
| `Stepper` | Numbered step circles with connecting lines, colour-coded by status |
| `AgentStatusBar` | Top bar showing active agent name + progress % + pause button |
| `AgentHuddle` | Expandable log of agent activity messages, collapsible |
| `AgentAvatar` | Coloured avatar badge for 28+ named agents |
| `LiveFieldsCard` | Animated "typing" display of extracted fields as agent runs |
| `CompletionCards` | All completed stage summaries (doc info, validation, GL/PO, matching) |
| `GLCodeRepositoryDrawer` | Searchable drawer of all GL codes, opens from GLMissingCard |
| `GLMissingCard` | Standard GL exception — manual code entry + approval email |
| `MetroGLMissingCard` | Metro GL exception — internal approval flow |
| `PRTCodingCard` | PRT coding exception — animated trace + dual approval |
| `MissingGRCard` | Missing GR exception — contact PO owner |
| `DuplicateCard` | Duplicate exception — shows prior payment details |
| `TaxMismatchCard` | Tax mismatch — detected vs. expected code/rate |
| `ManualApprovalCard` | Low-confidence fields requiring human review |
| `AutoApprovePanel` | Final green banner — auto-approved or GL code approved |
| `FinalSummary` | Completion card with audit trail link |
| `AuditDrawer` | Side drawer with full chronological audit trail |
| `SupplierDetailsCard` | Supplier info panel (ID, contact, payment terms, history) |
| `SlaBadge` | Live countdown display for SLA deadline |
| `ConfidenceRagRow` | Field confidence indicator (Strong / Moderate / Low) |
| `CommunicationPreviewModal` | Email draft preview before send |

### Sticky Footer Panels

Each exception type has a sticky bottom panel that persists while the exception is active:

| Panel | Invoice Type | Content |
|---|---|---|
| `StickyGLPanel` | GL Missing (standard/PRT) | Shows applied code, send/awaiting state |
| `StickyMetroGLPanel` | GL Missing (Metro) | Send request / awaiting state |
| `StickyPRTPanel` | GL Missing (PRT) | Amber "Awaiting Response" during dual-approval window |
| `StickyMissingGRPanel` | Missing GR | GR request sent state |
| `StickyDuplicatePanel` | Duplicate | Rejection sent state |
| `StickyTaxMismatchPanel` | Tax Mismatch | Rejection sent / awaiting corrected invoice |
| `StickyManualApprovalPanel` | Manual Approval | Approve button for AP officer |

---

## Known Issues

### Critical

| # | Description |
|---|---|
| C1 | Global flow state (`glApprovalEmailReceived`, `prtGLBothApproved`, etc.) is never reset when switching invoices — completing one GL flow contaminates other GL invoices |
| C2 | First PRT reply (Alex Morgan, 2s) sets `glApprovalEmailReceived` globally before the dual-approval gate closes — any non-PRT GL invoice opened afterward sees it as already approved |

### High

| # | Description |
|---|---|
| H1 | `setTimeout` callbacks in `handleGLApprovalSent` / `handleTaxMismatchSent` capture `selectedInvoice` at call time — switching invoices mid-timer fires state mutations against the wrong invoice with no `clearTimeout` cleanup |
| H2 | Module-level `glCodeCache` and `taxMismatchCache` are never cleared on invoice switch — cached approval state restores even after App-level state is reset |
| H3 | `inv-7` and `inv-8` (Oracle 26-B) have `agentSteps: []` — invoice selection silently fails, making both invoices permanently unclickable |
| H4 | Resolving `taxMismatchAutoResolved` for inv-5 and then opening a straight-through invoice hides its `AutoApprovePanel` because the guard is not scoped to the current invoice |

### Medium

| # | Description |
|---|---|
| M1 | `FinalSummary` returns `null` when `invoice.recommendation` is undefined — none of the GL-missing invoices have a recommendation field, so the Agent Recommendation panel never renders for any GL flow |
| M2 | Toast messages hardcode invoice numbers (e.g. "INV-UPS-895623") and sender names ("David Park") regardless of which invoice triggered the action |
| M3 | `glApprovalReplyEmail` hardcodes `relatedInvoiceId: 'inv-6'` — wrong when triggered from inv-10 |
| M4 | DOA notification tiles in `GLMissingCard` hardcode "James Wilson / Rachel Kim" for all standard GL invoices regardless of the actual invoice |
| M5 | `inv-5` mockData inconsistencies: emailBody shows wrong amount ($4,920 vs $48,438), PO numbers differ between `extractedFields` and audit trail, tax variance differs between audit trail ($61.75) and `taxMismatchInfo` ($448.50) |

### Low

| # | Description |
|---|---|
| L1 | Dashboard BarChart hardcodes wrong invoice counts (PO: 4 actual 5, Non-PO: 3 actual 4, Oracle: 1 actual 2) |
| L2 | PRT coding step animation replays from step 0 on remount (toggling "Show Invoice") |
| L3 | `DuplicateModal` passes `onSend={onClose}` — StickyDuplicatePanel button text never updates to "Sent" |
| L4 | `inv-9` email invoice number (26662550181) differs from `extractedFields.invoiceNumber` (INV-UPS-550181) |

---

*Documentation generated 24 June 2026*
