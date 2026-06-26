# UPS Invoice Processing — Technical Context
## Implementation Reference for Developers

---

## 1. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 |
| Language | TypeScript 5 (strict) |
| Build tool | Vite 5 |
| Styling | 100% inline styles — no CSS modules, no Tailwind, no styled-components |
| Fonts | Cabin (headings, labels, chips) and Lato (body text) — loaded via Google Fonts in `index.html` |
| Icons | Custom inline SVG components (`CheckIcon`, `CloseIcon`, inline `<svg>` tags) |
| State | React `useState` / `useEffect` only — no Zustand, no Redux, no Context |
| Persistence | Module-level `Map` objects (process lifetime, no localStorage) |
| Animations | CSS transitions + `useEffect`-driven `setInterval` |
| Routing | Enum state (`appView`, `activeTab`, `selectedInvoice`) — no React Router |

No backend. No API calls. Everything is mock data.

---

## 2. Project Structure

```
InvoiceProcessing-V5/
├── src/
│   ├── App.tsx                     # Root component — top-level state, routing, handlers
│   ├── main.tsx                    # Vite entry point
│   ├── types.ts                    # All TypeScript interfaces and types (124 lines)
│   ├── data/
│   │   └── mockData.ts             # All mock invoices, agent steps, reply emails (577 lines)
│   └── components/
│       ├── LandingScreen.tsx       # App launcher (Outlook + ServiceNow cards) (~246 lines)
│       ├── OutlookInbox.tsx        # Outlook-style email client (~599 lines)
│       ├── TicketsView.tsx         # ServiceNow ticket table + AgenticHuddleModal (~736 lines)
│       ├── Sidebar.tsx             # Left nav rail with tab icons
│       ├── InvoiceWorkspace.tsx    # Thin wrapper that renders ProcessingView (27 lines)
│       ├── ProcessingView.tsx      # Core invoice processing view (largest file, ~2800+ lines)
│       └── [Dashboard, AuditTrail, Analytics, Settings views]
├── product.md                      # Product documentation
├── context.md                      # This file
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. TypeScript Interfaces (`src/types.ts`)

### Invoice
```ts
interface Invoice {
  id: string                          // unique key, used as glCodeCache key
  invoiceNumber: string               // e.g. "INV-UPS-458921"
  ticketId: string                    // e.g. "AP-TKT-100248"
  supplier: string
  category: InvoiceCategory           // 'po' | 'non-po' | 'oracle-26b'
  amount: number
  currency: string                    // 'USD'
  status: InvoiceStatus
  failType?: FailType                 // present only on exception invoices
  failAtStep?: number                 // 0-indexed step index where failure occurs
  receivedDate: string
  dueDate: string
  paymentTerms: string
  agentSteps: AgentStep[]
  extractedFields?: ExtractedFields
  auditEntries?: AuditEntry[]
  poNumber?: string
  grNumber?: string
  duplicate?: DuplicateInfo
  missingGR?: MissingGRInfo
  taxMismatch?: TaxMismatchInfo
  tags?: string[]
  priority?: 'high' | 'medium' | 'low'
  confidence?: number                 // 0–100, overall confidence
  sla?: string                        // e.g. "28h 30m"
  assignedTo?: string
  source?: string                     // e.g. "AP Invoice Mailbox"
  attachmentName?: string
}
```

### InvoiceCategory
```ts
type InvoiceCategory = 'po' | 'non-po' | 'oracle-26b'
```

### InvoiceStatus
```ts
type InvoiceStatus =
  | 'ready-for-agentic-huddle'
  | 'needs-attention'
  | 'ready-for-review'
  | 'processing'
  | 'approved'
  | 'rejected'
```

### FailType
```ts
type FailType =
  | 'gl-missing'           // Non-PO, GL Coding Agent cannot assign code
  | 'missing-gr'           // PO, Goods Receipt not found in Oracle
  | 'duplicate'            // Invoice Duplicate Agent detected duplicate
  | 'tax-mismatch'         // I2P Tax Agent detected wrong jurisdiction
  | 'manual-approval'      // Confidence below threshold, human approval required
```

### AgentStep
```ts
interface AgentStep {
  stepLabel: string                   // e.g. "Invoice Ingestion"
  agents: AgentEntry[]
}

interface AgentEntry {
  agentName: string
  agentInitials: string              // 2-char, displayed in coloured avatar
  gradientColors: [string, string]   // [from, to] for CSS gradient
  completionMessage: string          // shown when agent finishes
  failureMessage?: string            // shown when agent fails (only on fail step)
  detailMessages?: string[]          // 5-7 messages shown in expandable trace
}
```

### ExtractedFields
```ts
interface ExtractedFields {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  paymentTerms: string
  supplierName: string
  supplierAddress: string
  supplierTaxId: string
  billToEntity: string
  poNumber?: string
  grNumber?: string
  lineItems: LineItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  bankDetails?: BankDetails
  confidenceScores?: Record<string, number>   // field name → 0–100
}
```

### ReplyEmail
```ts
interface ReplyEmail {
  id: string
  from: string
  fromEmail: string
  subject: string
  body: string
  timestamp: string
  isRead: boolean
  relatedInvoiceId: string            // links to Invoice.id for exception resolution
  avatarColor: string
}
```

### DuplicateInfo
```ts
interface DuplicateInfo {
  originalDate: string
  originalAmount: number
  originalDocumentId: string
  paymentDate: string
  paymentMethod: string
}
```

### MissingGRInfo
```ts
interface MissingGRInfo {
  poNumber: string
  poAmount: number
  invoiceAmount: number
  supplierContact: string
  supplierEmail: string
  poOwner: string
  poOwnerEmail: string
}
```

### TaxMismatchInfo
```ts
interface TaxMismatchInfo {
  detectedCode: string              // e.g. "TX-US-CA-SRV"
  expectedCode: string              // e.g. "TX-US-GA-SRV"
  detectedRate: number              // e.g. 8.25
  expectedRate: number              // e.g. 7.0
  variance: number                  // e.g. 61.75
  buyerName: string
  buyerEmail: string
  apLeadName: string
  apLeadEmail: string
}
```

---

## 4. Navigation / Routing State

All routing is managed with plain `useState` — no router library.

### App-level routing (`src/App.tsx`)
```ts
const [appView, setAppView] = useState<'landing' | 'outlook' | 'servicenow'>('landing')
```

Render order:
1. `appView === 'landing'` → render `<LandingScreen />`
2. `appView === 'outlook'` → render `<OutlookInbox />`
3. `appView === 'servicenow'` → fall through to the ServiceNow layout

### ServiceNow tab routing
```ts
const [activeTab, setActiveTab] = useState<'inbox' | 'dashboard' | 'audit' | 'analytics' | 'settings'>('inbox')
```

Note: the tab is labelled "Tickets" in the UI but the state value is `'inbox'` (legacy).

### Invoice selection
```ts
const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
```

When `selectedInvoice` is set, the main content area renders `<InvoiceWorkspace />` instead of the tab content.

### Full navigation paths
```
Login screen
  → Landing screen (appView: 'landing')
    → Outlook inbox (appView: 'outlook')
      → Back to landing (appView: 'landing')
    → ServiceNow (appView: 'servicenow')
      → Tickets tab (activeTab: 'inbox')
        → AgenticHuddleModal (local state in TicketsView)
          → Processing View (selectedInvoice !== null)
            → Back (selectedInvoice = null, back to Tickets)
      → Dashboard tab
      → Audit Trail tab
      → Analytics tab
      → Settings tab
```

---

## 5. Module-Level Cache (`src/components/ProcessingView.tsx`)

The GL code state must survive component unmounts (when user navigates back from Processing View and returns). React `useState` resets on unmount. The solution is a module-level `Map` that persists for the life of the JS module.

### Declaration (at module scope, outside all components)
```ts
const glCodeCache = new Map<string, {
  appliedCode: string | null
  glApprovalEmailSent: boolean
  invoiceApproved: boolean
  manualGLCode: string
}>()
```

### Read on mount (before useState calls)
```ts
const cachedGL = invoice.failType === 'gl-missing'
  ? (glCodeCache.get(invoice.id) ?? null)
  : null
```

### Write in useEffect (after any GL state changes)
```ts
useEffect(() => {
  if (invoice.failType !== 'gl-missing') return
  glCodeCache.set(invoice.id, {
    appliedCode: appliedGLCode,
    glApprovalEmailSent,
    invoiceApproved: glInvoiceApproved,
    manualGLCode
  })
}, [invoice.id, invoice.failType, appliedGLCode, glApprovalEmailSent, glInvoiceApproved, manualGLCode])
```

### Cache key
`invoice.id` — matches the `id` field on each mock invoice object.

---

## 6. GL Skip-Animation Logic

When a user returns to a `gl-missing` invoice after the GL approval email has been sent, the processing animation should not replay from the beginning. The stepper jumps directly to the failure step.

### Computed BEFORE useState (critical — these values are used as useState initial values)
```ts
const cachedGL = invoice.failType === 'gl-missing'
  ? (glCodeCache.get(invoice.id) ?? null)
  : null

const skipGLAnimation = invoice.failType === 'gl-missing'
  && (cachedGL?.glApprovalEmailSent === true)

const _stepsForInit = invoice.agentSteps
const _failStepForInit = invoice.failAtStep
  ?? Math.max(0, _stepsForInit.length - 1)
```

### State initialisation using skipGLAnimation
```ts
const [currentStep, setCurrentStep] = useState(
  skipGLAnimation ? _failStepForInit : 0
)
const [progress, setProgress] = useState(
  skipGLAnimation ? 100 : 0
)
const [agentIdx, setAgentIdx] = useState(
  skipGLAnimation
    ? Math.max(0, (_stepsForInit[_failStepForInit]?.agents.length ?? 1) - 1)
    : 0
)
const [completed, setCompleted] = useState<Set<number>>(() =>
  skipGLAnimation
    ? new Set(Array.from({ length: _failStepForInit }, (_, i) => i))
    : new Set()
)
const [isFailed, setIsFailed] = useState(skipGLAnimation)
const [agentActivityCollapsed, setAgentActivityCollapsed] = useState(skipGLAnimation)

// GL-specific state (restored from cache)
const [manualGLCode, setManualGLCode] = useState(cachedGL?.manualGLCode ?? '')
const [glApprovalEmailSent, setGlApprovalEmailSent] = useState(
  cachedGL?.glApprovalEmailSent ?? false
)
const [glInvoiceApproved, setGlInvoiceApproved] = useState(
  cachedGL?.invoiceApproved ?? false
)
```

### Animation useEffect guard
```ts
useEffect(() => {
  if (steps.length === 0) return
  if (skipGLAnimation) return   // <-- guard: abort early if returning to approved GL
  // ... setInterval animation logic
}, [steps, invoice.failAtStep])
```

---

## 7. StickyGLPanel — 4-State Logic

The `StickyGLPanel` component (defined inside ProcessingView.tsx) renders one of four sticky bars at the bottom of the GL missing flow. It is a pure presentational component — all state is passed as props.

### Props
```ts
interface StickyGLPanelProps {
  onDraftEmail: () => void         // open Communication Preview Modal
  appliedCode: string | null       // set after GL code is applied
  manualGLCode: string             // current value of manual input field
  onApply: (code: string) => void  // called to apply a GL code
  glApprovalEmailSent: boolean     // true after outbound email sent
  invoiceApproved: boolean         // true after final approve action
  onInvoiceApprove: () => void     // called when Approve Invoice clicked
}
```

### State Machine
```
                  glApprovalEmailSent === false
                  appliedCode === null
                         │
                         ▼
                     [ State 1 ]
               "GL Code Not Found"
               Buttons: Send mail for approval (blue) | Reject (red)
                         │
                         │ user sends email
                         ▼
                     [ State 2 ]
               "GL Code Approval Granted — Apply GL Code to Proceed"
               Amber (#b06b00) border + #fff3d6 background
               Buttons: Apply GL Code (blue) | Approve Invoice (green) | Reject (red)
                         │
                         │ user applies GL code (without approve)
                         ▼
                     [ State 3 ]
               "GL Code Applied — Ready for Invoice Approval"
               Green (#1b823f) border + #e6f5eb background
               Buttons: Approve Invoice (green) | Reject (red)
                         │
                         │ user clicks Approve Invoice
                         ▼
                     [ State 4 ]
               "Invoice Approved — Sent to Oracle Payments Agent"
               Green background — terminal state
```

### Transition conditions (evaluated in order)
```ts
if (invoiceApproved) → render State 4
if (appliedCode) → render State 3
if (glApprovalEmailSent) → render State 2
// else → render State 1
```

---

## 8. DocumentPanel Component

`DocumentPanel` is a collapsible accordion wrapper for the document details scroll area. Defined immediately before the main ProcessingView component.

```ts
function DocumentPanel({
  children,
  scrollRef,
  onScroll,
  hasContent
}: {
  children: React.ReactNode
  scrollRef: React.RefObject<HTMLDivElement>
  onScroll: () => void
  hasContent: boolean
})
```

### Behaviour
- Header: "DOCUMENT DETAILS" label in Cabin font, uppercase, 11px, grey (#6b767b)
- Status dot (7px circle): green (#1b823f) when `hasContent`, grey (#c8cccf) otherwise
- Chevron SVG rotates: 0deg (collapsed) / 180deg (expanded) — 0.25s ease transition
- When collapsed: hides scroll content, header has no bottom border
- When expanded: shows scroll content in a `flex: 1` overflowing-y auto div with 24px 28px padding
- Background: #f6f7f7

### Visual parity with AgentHuddle header
Both use the same header pattern:
- 9px 16px padding
- Cabin 700 11px 0.08em letter-spacing UPPERCASE label
- Coloured status dot
- Chevron right-aligned
- borderTop: '1px solid #e4e6e7'

---

## 9. AgentHuddle Implementation Details

### Layout of each agent entry

```tsx
{/* Outer row for this agent entry */}
<div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '6px 0' }}>

  {/* Coloured avatar circle with initials */}
  <div style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}>
    {agentInitials}
  </div>

  {/* Content column */}
  <div style={{ flex: 1, minWidth: 0 }}>

    {/* Name row: [name + chevron] flex-1 | [status icon] */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>

      {/* Name + chevron group — takes all remaining space */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1, minWidth: 0 }}>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agentName}
        </span>
        {/* Chevron button — only shown when entry is complete AND has detail messages */}
        {detailMsgs.length > 0 && (entry.isEntryComplete || entry.isEntryFailed) && (
          <button onClick={toggleAgent}>
            <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s ease' }}>
              ▾ svg
            </span>
          </button>
        )}
      </div>

      {/* Status icon — at natural right end of the flex row */}
      {entry.isCurrentEntry && <div>...pulse dot...</div>}
      {entry.isEntryComplete && !entry.isEntryFailed && <CheckIcon />}
      {entry.isEntryFailed && <CloseIcon />}
    </div>

    {/* Message text */}
    <span style={{ fontSize: '11px', color: '#4a5568' }}>{currentMessage}</span>

    {/* Expandable detail messages */}
    {isExpanded && detailMsgs.map(msg => <div key={msg}>{msg}</div>)}

  </div>
</div>
```

### Agent activity wrapper (no shadow)
```tsx
<div style={{
  height: agentActivityCollapsed ? '40px' : contentScrolled ? '128px' : '290px',
  flexShrink: 0,
  overflow: 'hidden',
  transition: 'height 0.25s ease'
  // No boxShadow, no zIndex, no position — these were explicitly removed
}}>
```

### Height modes
- `agentActivityCollapsed` (true): 40px — shows only the header bar
- `contentScrolled` (true) + not collapsed: 128px — compact mode when user scrolls document
- default: 290px — full height

---

## 10. Mock Data (`src/data/mockData.ts`)

### Invoice IDs and basic structure
```ts
export const mockInvoices: Invoice[] = [
  { id: 'inv-1', ticketId: 'AP-TKT-100248', invoiceNumber: 'INV-UPS-458921', supplier: 'Global Packaging Supplies Inc.', category: 'po', amount: 48250, status: 'ready-for-agentic-huddle', priority: 'medium', confidence: 98, sla: '28h 30m', assignedTo: 'Sarah Chen', agentSteps: PO_STEPS },
  { id: 'inv-2', ticketId: 'AP-TKT-100249', invoiceNumber: 'INV-UPS-391043', supplier: 'Continental Logistics Ltd', category: 'po', amount: 23800, failType: 'missing-gr', failAtStep: 4, ... },
  { id: 'inv-3', ticketId: 'AP-TKT-100250', invoiceNumber: 'INV-UPS-507832', supplier: 'Apex Industrial Components', category: 'po', amount: 67400, failType: 'duplicate', failAtStep: 4, ... },
  { id: 'inv-4', ticketId: 'AP-TKT-100251', invoiceNumber: 'INV-UPS-782104', supplier: 'Metro Facilities Services LLC', category: 'non-po', amount: 12840, status: 'ready-for-agentic-huddle', agentSteps: NON_PO_STEPS },
  { id: 'inv-5', ticketId: 'AP-TKT-100252', invoiceNumber: 'INV-UPS-634571', supplier: 'City Office Solutions', category: 'po', amount: 4920, failType: 'tax-mismatch', failAtStep: 4, ... },
  { id: 'inv-6', ticketId: 'AP-TKT-100253', invoiceNumber: 'INV-UPS-895623', supplier: 'ProClean Maintenance Co.', category: 'non-po', amount: 8150, failType: 'gl-missing', failAtStep: 4, agentSteps: NON_PO_STEPS },
  { id: 'inv-7', ticketId: 'AP-TKT-100254', invoiceNumber: 'INV-UPS-550181', supplier: 'TechSupport Worldwide', category: 'po', amount: 50000, failType: 'manual-approval', failAtStep: 4, confidence: 84, ... },
  { id: 'inv-8', ticketId: 'AP-TKT-100255', invoiceNumber: 'INV-UPS-660219', supplier: 'Air Freight Systems', category: 'oracle-26b', amount: 31600, status: 'processing', ... },
  { id: 'inv-9', ticketId: 'AP-TKT-100256', invoiceNumber: 'INV-UPS-541097', supplier: 'Global Customs Brokers', category: 'oracle-26b', amount: 15200, status: 'processing', ... },
]
```

### PO Processing Pipeline — `PO_STEPS: AgentStep[]`
5 stages, 13 total agents:

**Stage 0 — Invoice Ingestion:**
- SMC Email Inbox Adapter (SM)
- I2P Document Status Agent (DS)
- I2P Classification Agent (CL)

**Stage 1 — Field Extraction:**
- I2P Digitization Agent (DG)
- I2P Extraction Agent (EX)
- Formatter Agent (FM)

**Stage 2 — Data Completeness Check:**
- I2P Field Validation Agent (FV)
- Invoice Validation Agent (IV)

**Stage 3 — Master Data Check:**
- I2P Field Validation Agent (FV) ← second appearance
- I2P PO Mapping & Matching Agent (PM)
- FDAO (FD)

**Stage 4 — 3-Way Match:**
- I2P Invoice Validation Agent (IV2)
- I2P PO Mapping & Matching Agent (PM) ← second appearance
- I2P Invoice Duplicate Agent (DD)
- Anomaly Agent (AN)

### Non-PO Processing Pipeline — `NON_PO_STEPS: AgentStep[]`
5 stages, 12 total agents:

**Stage 0 — Invoice Ingestion:** (identical to PO)
**Stage 1 — Field Extraction:** (identical to PO)
**Stage 2 — Data Completeness Check:** (identical to PO)

**Stage 3 — Master Data Check:**
- I2P Field Validation Agent (FV)
- FDAO (FD)

**Stage 4 — GL Coding:**
- I2P GL Coding Agent (GL)
- I2P Tax Agent (TX)
- Non-PO Router Agent (NR)
- I2P Field Validation Agent (FV) ← third appearance

### Reply Emails
```ts
export const taxMismatchReplyEmails: ReplyEmail[] = [
  { id: 'reply-tax-1', from: 'James Wilson', fromEmail: 'j.wilson@ups.com', relatedInvoiceId: 'inv-5', ... },
  { id: 'reply-tax-2', from: 'Rachel Kim', fromEmail: 'r.kim@ups.com', relatedInvoiceId: 'inv-5', ... },
]

export const glApprovalReplyEmail: ReplyEmail = {
  id: 'reply-gl-1',
  from: 'AP Automation',
  fromEmail: 'ap-automation@ups.com',
  subject: 'GL Code Approval Granted for INV-UPS-895623',
  relatedInvoiceId: 'inv-6',
  ...
}
```

### Agent Huddle Messages (maps defined in mockData.ts)
Three Maps, each keyed by agent name string:

```ts
AGENT_HUDDLE_MESSAGES: Map<string, string[]>
// 5-7 trace messages per agent e.g.:
// 'SMC Email Inbox Adapter' → [
//   "Monitoring AP mailbox — new email received, parsing MIME headers",
//   "Attachment extracted: PDF document — initiating antivirus scan",
//   ...
// ]

AGENT_IN_PROGRESS: Map<string, string>
// Short in-progress label e.g.:
// 'I2P Extraction Agent' → "Extracting 12 invoice fields..."

AGENT_COMPLETION: Map<string, string>
// Short completion label e.g.:
// 'I2P Extraction Agent' → "12 fields extracted"
```

---

## 11. Design Tokens

### Colour System
```
ServiceNow green:     #1b823f   (success, approve, strong confidence)
ServiceNow blue:      #0074d7   (primary action, active step)
ServiceNow amber:     #b06b00   (warning, moderate confidence)
ServiceNow red:       #b91f1f   (error, reject, low confidence)

Background:           #f6f7f7   (page background, document panel)
Card background:      #ffffff
Border grey:          #e4e6e7   (light borders)
Border medium:        #c8cccf   (input borders)
Text primary:         #1d2f36   (headings)
Text secondary:       #6b767b   (labels, subtext)
Text body:            #4a5568

Outlook blue:         #0078d4   (primary)
Outlook ribbon dark:  #0F3C78   (top bar, left rail)
Outlook purple:       #742774   (calendar accent)

Landing background:   #1d2f36   (dark green-blue)
```

### RAG Confidence Thresholds
```
Strong   (≥90%):  colour #1b823f, background #e6f5eb, label "Ready to Proceed"
Moderate (70–89%): colour #b06b00, background #fff3d6, label "Review Recommended"
Low      (<70%):  colour #b91f1f, background #fde8e8, label "Needs Attention"
```

### Typography
```
Cabin 700, 11px, 0.08em letter-spacing, uppercase → section headers, chips, labels
Cabin 700, 12px → agent names in huddle
Cabin 600, 13px → card headings
Lato 400, 13px → body text
Lato 400, 11px → sub-labels, timestamps
```

### Agent Avatar Gradients (examples)
```
SMC Email Inbox Adapter:      #667eea → #764ba2
I2P Document Status Agent:    #f093fb → #f5576c
I2P Classification Agent:     #4facfe → #00f2fe
I2P GL Coding Agent:          #f6d365 → #fda085
I2P Tax Agent:                #a18cd1 → #fbc2eb
Anomaly Agent:                #ffecd2 → #fcb69f
```

---

## 12. Key Component: ProcessingView

ProcessingView.tsx is the most complex file (2800+ lines). It handles the entire invoice processing experience for any invoice type. Key sections:

### State declaration order (critical for skipGLAnimation pattern)
```
1. [module scope] glCodeCache Map
2. [module scope] StickyGLPanel function component
3. [module scope] GLMissingCard function component
4. [module scope] DocumentPanel function component
5. ProcessingView function:
   a. Destructure props (invoice, onBack, handlers...)
   b. Compute cachedGL and skipGLAnimation (BEFORE any useState)
   c. Compute _stepsForInit and _failStepForInit
   d. All useState calls (some initialised with skipGLAnimation values)
   e. Derived state (steps, failStep, appliedGLCode etc)
   f. useEffects (animation loop, cache sync, scroll tracking)
   g. Handler functions (onApply, onSend, onInvoiceApprove...)
   h. JSX return
```

### Animation useEffect (simplified)
```ts
useEffect(() => {
  if (steps.length === 0) return
  if (skipGLAnimation) return

  let stepIdx = 0
  let agentI = 0

  const tick = () => {
    const step = steps[stepIdx]
    // advance agentI within step, then advance stepIdx
    // when all steps done: setCompleted, setIsFailed or set success state
  }

  const id = setInterval(tick, ANIMATION_INTERVAL_MS)
  return () => clearInterval(id)
}, [steps, invoice.failAtStep])
```

### Prop threading chain
```
App.tsx
  → handleGLApprovalSent (updates replyEmails state)
  → InvoiceWorkspace (onGLApprovalSent prop)
    → ProcessingView (onGLApprovalSent prop)
      → GLModal.onSend → setGlApprovalEmailSent(true) + onGLApprovalSent?.()
```

---

## 13. TicketsView & AgenticHuddleModal

### TicketsView (`src/components/TicketsView.tsx`)

Props:
```ts
interface TicketsViewProps {
  onSelectInvoice: (invoice: Invoice) => void
  replyEmails: ReplyEmail[]
  onMarkReplyRead: (id: string) => void
}
```

Internal state:
```ts
const [selectedTicket, setSelectedTicket] = useState<Invoice | null>(null)
const [huddleComplete, setHuddleComplete] = useState(false)
const [huddleStage, setHuddleStage] = useState(0)   // 0–5 (6 stages)
```

Table renders all `mockInvoices` plus reply email notifications in a banner area above.

### AgenticHuddleModal (defined inside TicketsView.tsx)

Dimensions: 900px wide × 560px tall, `position: fixed`, centered, dark backdrop.

Left panel (280px): Invoice metadata in key-value rows — Ticket ID, Invoice #, Supplier, Category, Amount, Source, Attachment, Priority, SLA, Assigned To, Status.

Right panel (flex 1): 6-stage animated trace. Each stage has:
- Number badge (1–6)
- Stage title
- Description (short phase description)
- Status: pending (grey) → active (blue spinner) → complete (green checkmark)

Stages:
1. Scanning AP mailbox inbox → email detected
2. Parsing PDF attachment → attachment validated  
3. Creating invoice ticket → ticket registered in AP queue
4. Classifying invoice document → classified as [category] · [confidence]%
5. Initiating field extraction pipeline → 12 fields queued
6. Preparing validation workflow → [N]-stage pipeline configured

Animation: stages complete sequentially at 1200ms intervals via `setInterval`.

"Open Processing View" button:
- Disabled + grey until `huddleStage >= 6`
- After completion: enabled, green (#1b823f), onClick calls `onSelectInvoice(selectedTicket)`

---

## 14. LandingScreen (`src/components/LandingScreen.tsx`)

Full-viewport dark background (#1d2f36). Two app cards side by side.

**Outlook card:**
- Background: #0078d4 (blue)
- Hover: lifts with box-shadow, slight translateY(-4px)
- Calls `onSelectOutlook()`

**ServiceNow card:**
- Background: #1b823f (green)
- Hover: same lift animation
- Calls `onSelectServiceNow()`

Both cards: 280px wide, 200px tall, border-radius 12px, Cabin font headings.

Footer: UPS logo + "Source-to-Pay · Invoice Processing Automation" copyright line.

---

## 15. OutlookInbox (`src/components/OutlookInbox.tsx`)

Three-pane layout (classic Outlook):

**Left rail (240px, #0F3C78 dark blue):**
- "New mail" compose button
- Folder list: Favorites (Inbox, Sent, Drafts), AP Invoice Mailbox subfolder
- Unread badge (red pill) showing count of unread reply emails + invoice emails

**Message list (320px, white with grey dividers):**
- Reply emails appear at top with distinct styling (blue left border)
- Invoice emails below (sorted by date)
- Each row: sender avatar (coloured circle), sender name, subject, timestamp, category chip
- Unread: bold sender name, blue dot indicator

**Reading pane (flex 1):**
- Email header: From/To/Subject/Date
- Attachment card (PDF icon, filename, size)
- Email body with proper paragraph formatting
- For invoice emails: structured invoice summary table

**Top bar (#0F3C78):** 
- Search bar (mock)
- "← Back to Apps" button (right side) → calls `onClose()`
- Outlook logo + "Outlook" text (white)

---

## 16. App.tsx — Key State and Handlers

```ts
// Multi-app routing
const [appView, setAppView] = useState<'landing' | 'outlook' | 'servicenow'>('landing')

// ServiceNow tab
const [activeTab, setActiveTab] = useState<'inbox' | 'dashboard' | 'audit' | 'analytics' | 'settings'>('inbox')

// Invoice selection (opens ProcessingView)
const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

// Reply emails (start with tax mismatch pre-loaded)
const [replyEmails, setReplyEmails] = useState<ReplyEmail[]>(taxMismatchReplyEmails)

// Exception resolution flags
const [taxMismatchAutoResolved, setTaxMismatchAutoResolved] = useState(false)
const [missingGRAutoResolved, setMissingGRAutoResolved] = useState(false)
```

### Handlers
```ts
const handleSelectInvoice = (invoice: Invoice) => setSelectedInvoice(invoice)
const handleBack = () => setSelectedInvoice(null)

const handleMarkReplyRead = (id: string) => {
  setReplyEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e))
}

const handleTaxMismatchSent = () => {
  // add tax reply emails if not already present (avoid duplication)
}

const handleMissingGRSent = () => {
  // add missing GR reply email
  setMissingGRAutoResolved(true)
}

const handleGLApprovalSent = () => {
  setReplyEmails(prev => {
    if (prev.find(e => e.id === 'reply-gl-1')) return prev
    return [glApprovalReplyEmail, ...prev]
  })
}
```

---

## 17. TypeScript Compilation

Run with:
```bash
./node_modules/.bin/tsc --noEmit
```

No output = no errors. The project uses strict TypeScript throughout. All component props are typed. No `any` escapes.

---

## 18. Development Server

```bash
npm run dev
```

Runs Vite dev server, typically at `http://localhost:5173`. Hot module replacement enabled.

---

## 19. Key Implementation Decisions

### Why inline styles everywhere?
Prototyping speed and portability. No CSS build step, no class name collisions, styles travel with the component and are immediately readable alongside JSX.

### Why module-level Map for GL cache?
React state resets on unmount. The user navigates back from ProcessingView to the ticket list, which unmounts ProcessingView. Module-level state persists for the lifetime of the tab. `localStorage` would persist too aggressively (across hard reloads). A module Map is the right scope for a prototype demo.

### Why no router?
The prototype has a simple linear navigation tree with at most 3 levels of depth (Landing → ServiceNow → Processing View). React Router would add boilerplate and URL complexity for no demo benefit. State-based routing is explicit and easy to follow.

### Why 4 separate GL states rather than a boolean pair?
The UI requirements for each state are sufficiently different (different backgrounds, different button sets, different messaging) that a single conditional chain is clearer than nested boolean logic. The 4-state priority order (invoiceApproved → appliedCode → glApprovalEmailSent → initial) is easy to reason about.

### Why skipGLAnimation before useState?
React requires that hook calls are unconditional and in a stable order. To use `skipGLAnimation` as the initial value for multiple `useState` calls, it must be computed before those calls — it cannot be declared inside a `useEffect` or after any hook.
