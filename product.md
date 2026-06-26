# UPS Source-to-Pay — Invoice Processing Automation
## Product Documentation

---

## 1. Overview

This is an interactive prototype of UPS's **AI-native Accounts Payable (AP) invoice processing automation platform**, built as part of the Source-to-Pay (S2P) transformation programme. The product demonstrates how AI agents can autonomously process supplier invoices end-to-end — from detection in an Outlook inbox, through classification, extraction, validation, GL coding, and 3-way match, to approval and Oracle payment routing — with human intervention only when exceptions arise.

The prototype is designed for use in executive demos, analyst walkthroughs, and stakeholder presentations. It tells a complete story across two enterprise systems: **Microsoft Outlook** (invoice receipt) and **ServiceNow** (structured AP ticket processing).

---

## 2. Problem Statement

UPS processes thousands of supplier invoices monthly across multiple categories (Purchase Order backed, Non-PO service invoices, Oracle 26-B intercompany transactions). The traditional manual process involves:

- AP analysts manually checking each email for invoice attachments
- Hand-keying invoice data into Oracle ERP
- Manually verifying PO and goods receipt records
- Manually assigning GL codes for non-PO invoices
- Chasing suppliers and internal stakeholders for missing information
- High error rates, SLA breaches, and late payment penalties

**The solution:** A multi-agent AI system that monitors the AP mailbox, extracts and validates all invoice fields, performs PO matching, assigns GL codes, detects duplicates, identifies tax mismatches, and routes invoices to human approval only when confidence thresholds are not met or exceptions are detected.

---

## 3. Target Users

| Role | Description |
|------|-------------|
| **AP Analyst** | Primary daily user. Reviews the Outlook inbox for invoices, monitors the ServiceNow ticket queue, handles exceptions, approves processed invoices. Persona: Sarah Chen (AP Analyst) |
| **AP Lead / Manager** | Supervises the queue, approves escalated exceptions, reviews analytics. Persona: Rachel Kim |
| **Procurement Buyer** | Confirms GL coding, validates PO details, resolves tax mismatches. Persona: James Wilson |
| **PO Owner** | Confirms goods receipts for 3-way match. Persona: David Park |
| **Finance Executive / Demo Viewer** | Observes the end-to-end flow in demos and presentations |

---

## 4. Application Structure & Navigation

### 4.1 Landing Screen (Entry Point)

After login, the analyst lands on an enterprise app launcher with two choices:

**Outlook Card**
- Opens the Microsoft Outlook-style invoice email inbox
- Shows all received supplier invoice emails with reading pane
- Demonstrates the email-origination side of the workflow
- Has a "← Back to Apps" button to return to the launcher

**ServiceNow Card**
- Opens the ServiceNow invoice processing platform
- Shows the AP ticket queue with the full agentic processing workflow
- The primary working environment for AP analysts

### 4.2 Outlook Flow

The Outlook experience reproduces the look and feel of Microsoft Outlook:
- Left folder rail (Favorites, AP Invoice Mailbox)
- Top command bar with search
- Message list with unread dots, sender avatars, category chips, amounts
- Reading pane showing full email body, attachment details, and invoice metadata
- Reply emails (from internal stakeholders) appear at the top of the inbox

The Outlook view is **read-only** — it demonstrates how invoices originate and establishes context before they appear as ServiceNow tickets.

### 4.3 ServiceNow Flow

The ServiceNow experience is the main working platform:

**Navigation tabs (left sidebar):**
- **Tickets** — AP invoice ticket queue (primary view, replaces old "Inbox")
- **Dashboard** — KPI summary view with invoice counts, exception metrics, processing statistics
- **Audit Trail** — Full audit log of all agent and human actions
- **Analytics** — Charts and metrics (volume by category, agent vs human actions, processing time trends)
- **Settings** — Agentic processing rules, SLA configuration, system settings

---

## 5. Invoice Categories

The system processes three types of invoices, each with a distinct processing pipeline:

### 5.1 PO (Purchase Order) Invoices
Invoices backed by an approved Purchase Order in Oracle ERP. The core validation is a **3-way match**: invoice vs PO vs Goods Receipt (GR).

Pipeline stages:
1. Invoice Ingestion
2. Field Extraction
3. Data Completeness Check
4. Master Data Check (supplier, PO, GR lookup)
5. 3-Way Match

### 5.2 Non-PO (Service) Invoices
Invoices for services without a Purchase Order reference (e.g. facility management, cleaning, IT consulting). Require **GL code assignment** instead of PO matching.

Pipeline stages:
1. Invoice Ingestion
2. Field Extraction
3. Data Completeness Check
4. Master Data Check (supplier, cost centre, tax configuration)
5. GL Coding (AI-driven account code assignment)

### 5.3 Oracle 26-B Invoices
Intercompany / cross-entity invoices processed through Oracle 26-B. Shown in the queue but with simplified processing (queued for processing, minimal agent steps shown in prototype).

---

## 6. Invoice Dataset (Demo Invoices)

The prototype uses 9 realistic invoices, each representing a specific processing scenario:

| Ticket ID | Invoice # | Supplier | Category | Amount | Scenario |
|-----------|-----------|----------|----------|--------|----------|
| AP-TKT-100248 | INV-UPS-458921 | Global Packaging Supplies Inc. | PO | $48,250 | Straight-through — all validations pass, 3-way match complete |
| AP-TKT-100249 | INV-UPS-391043 | Continental Logistics Ltd | PO | $23,800 | Missing Goods Receipt — 3-way match blocked, PO owner contacted |
| AP-TKT-100250 | INV-UPS-507832 | Apex Industrial Components | PO | $67,400 | Duplicate Invoice — auto-rejected, supplier notification sent |
| AP-TKT-100251 | INV-UPS-782104 | Metro Facilities Services LLC | Non-PO | $12,840 | Straight-through Non-PO — GL coded at 91% confidence, approved |
| AP-TKT-100252 | INV-UPS-634571 | City Office Solutions | PO | $4,920 | Tax Code Mismatch — CA tax rate applied to GA delivery, $61.75 variance |
| AP-TKT-100253 | INV-UPS-895623 | ProClean Maintenance Co. | Non-PO | $8,150 | GL Code Missing — ambiguous category, 3 conflicting GL codes, manual assignment required |
| AP-TKT-100254 | INV-UPS-550181 | TechSupport Worldwide | PO | $50,000 | Manual Approval Required — scanned document, moderate confidence (84%), below 90% threshold |
| AP-TKT-100255 | INV-UPS-660219 | Air Freight Systems | Oracle 26-B | $31,600 | Queued for processing |
| AP-TKT-100256 | INV-UPS-541097 | Global Customs Brokers | Oracle 26-B | $15,200 | Queued for processing |

---

## 7. Exception Scenarios (Detailed)

### 7.1 Straight-Through Processing (inv-1, inv-4)

**What it demonstrates:** The ideal path. Agent processes the invoice fully autonomously — no human interaction required.

**Flow:**
- All validations pass
- For PO: 3-way match passes within ±5% tolerance
- For Non-PO: GL coded with confidence above threshold
- Invoice auto-approved and routed to Oracle Payments Agent
- Agent recommendation displayed: "Straight-Through Processing Eligible"
- Sticky panel shows green "Auto-Approved · Sent to Oracle Payments Agent"

**Key data point:** inv-1 (Global Packaging) — PO $50,000, invoice $48,250, within tolerance; all 7 confidence fields at 98–100%.

---

### 7.2 Missing Goods Receipt (inv-2)

**What it demonstrates:** 3-way match blocked because no GR exists in Oracle Inventory for the referenced PO.

**Invoice:** INV-UPS-391043, Continental Logistics Ltd, $23,800, PO-UPS-2026-11032

**Exception flow:**
1. Agent locates PO-UPS-2026-11032 in Oracle ERP (PO amount $24,500)
2. GR lookup returns nothing — no goods receipt recorded
3. Agent raises exception: "No goods receipt found"
4. SLA countdown starts (4h 29m remaining at detection)
5. AP Analyst sees "3-Way Match Blocked — Goods Receipt Missing" card
6. Sticky panel shows "Generate Communication" button
7. Analyst clicks → pre-drafted email to PO owner **David Park** (d.park@ups.com)
8. After email sent: inbox notification appears from David Park confirming GR
9. Invoice view updates to "Goods Receipt Confirmed — 3-Way Match Resolved" (green)
10. Invoice routes to approval

**Stakeholder:** PO Owner David Park — notified to submit GR in Oracle Inventory.

---

### 7.3 Duplicate Invoice Detection (inv-3)

**What it demonstrates:** Invoice Duplicate Agent detects a resubmitted invoice that has already been paid.

**Invoice:** INV-UPS-507832, Apex Industrial Components, $67,400

**Exception flow:**
1. Agent detects this invoice number was already processed on **2026-03-14**
2. Original payment: $67,400 via ACH on 2026-03-21, AP document AP-DOC-2026-04421
3. Invoice is **automatically rejected** (no human needed for detection)
4. Sticky panel shows "Duplicate Invoice Detected — Rejected" with auto-rejection notice
5. "Generate Communication" button allows analyst to notify supplier (Apex Industrial, invoices@apexindustrial.com)
6. Pre-drafted rejection email explains the original processing details

**Key behaviour:** The auto-rejection is a terminal state — no approval flow, only the communication to the supplier.

---

### 7.4 Tax Code Mismatch (inv-5)

**What it demonstrates:** Invoice has the wrong tax jurisdiction applied. Supplier applied California tax rate (8.25%) but goods delivered to Georgia (7.0% applies).

**Invoice:** INV-UPS-634571, City Office Solutions, $4,920

**Detected mismatch:**
- Invoice tax code: TX-US-CA-SRV (8.25%)
- Expected tax code: TX-US-GA-SRV (7.0%)
- Tax variance: $61.75

**Exception flow:**
1. I2P Tax Agent detects code mismatch
2. "Tax Code Mismatch" card shown with full breakdown (detected vs expected, variance amount)
3. SLA countdown starts (4h 22m remaining)
4. Stakeholders identified: **James Wilson** (Procurement Buyer) and **Rachel Kim** (AP Lead)
5. Analyst sends notification → both receive the tax mismatch notification email
6. Inbox receives reply emails from both confirming the Georgia tax code
7. Invoice view updates to "Tax Code Mismatch — Resolved"
8. After auto-resolution, sticky panel shows "Tax Mismatch Resolved — Ready for Approval"
9. "Approve Invoice" button appears → invoice approved

**Reply emails received:**
- James Wilson: confirms TX-US-GA-SRV is correct for Atlanta, GA delivery
- Rachel Kim: authorises processing to continue with revised total

---

### 7.5 GL Code Missing (inv-6)

**What it demonstrates:** The most complex exception. Non-PO invoice where the GL Coding Agent cannot determine the correct account code because the supplier's service category matches multiple conflicting GL codes.

**Invoice:** INV-UPS-895623, ProClean Maintenance Co., $8,150

**GL coding failure:**
- Service category "Commercial Cleaning & Maintenance" matched 3 GL accounts:
  - 6150-008 (Facilities & Services, 21% confidence)
  - 6180-002 (IT Services & Support, 38% confidence)
  - 6200-001 (Office Equipment, 41% confidence)
- Confidence below 60% threshold — cannot auto-assign

**Full exception flow (4-state progression):**

**State 1 — Approval Required:**
- Card shows "GL Code Not Found" with fail message
- Sticky bar shows only two options: **"Send mail for approval"** (blue) + **"Reject"** (red)
- Analyst cannot apply GL code until approval email is sent
- Clicking "Send mail for approval" → opens Communication Preview Modal
  - Pre-drafted to: billing@procleanmaintenance.com
  - Cc: ap-operations@ups.com
  - Full GL code request body generated by GL Coding Agent

**State 2 — Approval Granted, Apply GL Code:**
- After sending: inbox notification appears "GL Code Approval Granted for INV-UPS-895623" (from ap-automation@ups.com)
- Sticky bar transitions to amber: "GL Code Approval Granted — Apply GL Code to Proceed"
- Green approval banner appears inside the GL card
- **The GL code entered before sending the email is pre-filled** in a disabled input field (persisted in cache)
- Analyst can choose from:
  - AI-recommended codes (6200-001, 6210-005, 6150-008 with confidence %)
  - Manual text entry
  - GL Code Repository (slide-over with all 8 available codes)
- Two buttons available: "Apply GL Code" (blue) + "Approve Invoice" (green — applies code and approves in one step)

**State 3 — GL Code Applied, Ready for Invoice Approval:**
- Sticky bar turns green: "GL Code Applied — Ready for Invoice Approval"
- "Approve Invoice" (green) + "Reject" (red) buttons shown

**State 4 — Invoice Approved:**
- Sticky bar: "Invoice Approved — Sent to Oracle Payments Agent"
- Terminal green success state

**On return visit (after GL approval email received):**
- Agentic stepper/loader does NOT restart
- Invoice opens directly at the GL code step
- All previous stages shown as complete in Agent Huddle
- Agent Huddle is collapsed by default
- Pre-filled GL code shown as disabled in the input field

---

### 7.6 Manual Approval Required (inv-9)

**What it demonstrates:** Scanned invoice with moderate OCR confidence — agent cannot auto-approve because overall confidence (84%) is below the 90% auto-approval threshold.

**Invoice:** INV-UPS-550181, TechSupport Worldwide, $50,000

**Issue:** Scanned paper invoice (not a native PDF). OCR quality is moderate:
- Invoice Number: 88%
- PO Number: 75%
- GR Number: 78%
- Payment Terms: 80%
- Overall mean: 84%

**Special feature:** Confidence scores are displayed **as overlays directly on the scanned invoice image** — coloured dashed boxes around each field with RAG-coloured badge (green ≥90%, amber 70–89%, red <70%).

**Exception flow:**
1. Agent pauses at 3-Way Match step
2. "Manual Approval Required — Moderate Confidence" card shown with per-field confidence breakdown
3. "Moderate Confidence — Manual Approval Required" sticky bar shown
4. AP Analyst reviews fields vs scanned image
5. Clicks "Approve Invoice" if satisfied with the fields
6. After approval: "Manually Approved · Sent to Oracle Payments Agent"

---

## 8. Agent System

### 8.1 Agent Architecture

The system uses a multi-agent pipeline where specialist AI agents handle discrete stages of the invoice processing workflow. Each agent has:
- A specific domain of responsibility
- Coloured avatar with initials
- A gradient colour scheme to distinguish it visually
- Contextual in-progress messages
- Detailed completion messages
- Expandable activity trace (chevron accordion in the Agent Huddle)

### 8.2 Full Agent Roster

| Agent | Role |
|-------|------|
| **SMC Email Inbox Adapter** | Monitors AP mailbox, detects incoming emails, extracts attachments, runs antivirus scan |
| **I2P Document Status Agent** | Creates invoice record in FDAO, assigns UUID, starts SLA clock |
| **I2P Classification Agent** | Determines invoice type (PO/Non-PO), detects PO references, routes accordingly |
| **I2P Digitization Agent** | Runs OCR on PDF attachments, segments document sections |
| **I2P Extraction Agent** | Extracts all invoice fields (header, line items, totals) with confidence scores |
| **Formatter Agent** | Normalises dates (ISO 8601), currency (ISO 4217), payment terms, supplier IDs |
| **I2P Field Validation Agent** | Validates field presence, formats, OFAC screening, supplier master lookup |
| **Invoice Validation Agent** | Applies business rules (payment terms, date delta, description completeness) |
| **I2P PO Mapping & Matching Agent** | Queries Oracle ERP for PO and GR records |
| **I2P Invoice Validation Agent** | Executes 3-way match with tolerance rules |
| **I2P Invoice Duplicate Agent** | Scans 12-month invoice history for exact and fuzzy duplicate matches |
| **Anomaly Agent** | ML-based anomaly detection on invoice amounts, unit prices, line item counts |
| **I2P GL Coding Agent** | Assigns GL account code using semantic similarity against GL code repository |
| **I2P Tax Agent** | Validates tax code and rate against service type and jurisdiction |
| **Non-PO Router Agent** | Sets up Non-PO approval workflow and routing |
| **FDAO** | Immutable audit logging, SHA-256 chain-of-custody hashing |

### 8.3 Processing Pipelines

**PO Pipeline (5 stages):**
1. Invoice Ingestion → SMC Email Inbox Adapter, I2P Document Status Agent, I2P Classification Agent
2. Field Extraction → I2P Digitization Agent, I2P Extraction Agent, Formatter Agent
3. Data Completeness Check → I2P Field Validation Agent, Invoice Validation Agent
4. Master Data Check → I2P Field Validation Agent, I2P PO Mapping & Matching Agent, FDAO
5. 3-Way Match → I2P Invoice Validation Agent, I2P PO Mapping & Matching Agent, I2P Invoice Duplicate Agent, Anomaly Agent

**Non-PO Pipeline (5 stages):**
1. Invoice Ingestion → same as PO
2. Field Extraction → same as PO
3. Data Completeness Check → same as PO
4. Master Data Check → I2P Field Validation Agent, FDAO
5. GL Coding → I2P GL Coding Agent, I2P Tax Agent, Non-PO Router Agent, I2P Field Validation Agent

---

## 9. Agent Huddle

The Agent Huddle is the central real-time activity panel in the invoice processing view. It:

- Shows which agents are active, which have completed, and which are waiting
- Groups agents by processing stage with stage headers (numbered, coloured)
- Shows an animated pipeline trace with per-agent completion messages
- Each agent entry has a small grey chevron (▾) to expand a detailed activity log showing 5–7 sub-steps
- The huddle auto-scrolls to the latest activity
- Can be collapsed/expanded via header click — collapses to a 40px header bar
- When expanded with content scrolled: reduces to 128px (compact mode)
- When idle/full: 290px height

**Agentic Huddle traces** include messages such as:
- "Monitoring AP mailbox — new email received, parsing MIME headers"
- "Attachment extracted: PDF document — initiating antivirus scan"
- "Running OCR pipeline — segmenting text blocks and table regions"
- "Querying Oracle ERP PO registry using extracted PO reference"
- "Applying configured tolerance rules for this supplier tier"

---

## 10. Processing View Layout

When an invoice is opened from the ticket queue, the Processing View shows:

### 10.1 Top Bar
- Back navigation ("← Inbox")
- Invoice number + category chip
- "Straight-forward" green badge (if applicable)
- Audit Trail button (opens slide-over drawer)
- Show Invoice toggle (splits view)

### 10.2 Stepper
- Compact horizontal stepper showing all pipeline stages (24px circles)
- Stages coloured: green (complete), blue (active/pulsing), red (failed), grey (pending)
- Connector lines turn green as stages complete
- Always animates from scratch on entry — GL approved invoices skip to the failed step directly

### 10.3 Agent Status Bar
- Shows current step name, active agent name, progress bar, step counter
- Pause/Resume button for the processing animation
- Turns red when exception detected

### 10.4 Agent Huddle Panel
- Real-time agent trace (see section 9)
- Collapsible with chevron

### 10.5 Document Details Panel
- Accordion below Agent Huddle (same visual style — "DOCUMENT DETAILS" header)
- Contains: Live Fields Card, Completion Cards, Exception Cards (GL/GR/Duplicate/Tax)
- Has its own scroll area

### 10.6 Invoice View (Split)
- When "Show Invoice" toggle is on: left half shows scanned invoice
- Scanned invoice has confidence score overlays (coloured dashed boxes on field areas)
- Confidence scores shown as RAG badges directly on the document

### 10.7 Sticky Action Panel
- Fixed at bottom of the processing view
- Changes based on invoice state and exception type:
  - Green: auto-approved / invoice approved
  - Red + buttons: exception requiring action
  - Amber: waiting for GL code / GR confirmation / tax resolution
  - Blue: communication actions (send email)

---

## 11. Initial Agentic Huddle (Ticket Click)

When an analyst clicks a ticket in the ServiceNow queue, an **Initial Agentic Huddle** modal appears before navigating to the full processing view.

This modal (900×560px) shows:
- **Left panel:** Full ticket and invoice metadata (Ticket ID, Invoice #, Supplier, Category, Amount, Source, Attachment, Priority, SLA, Assigned To, Status)
- **Right panel:** Animated 6-stage processing trace:
  1. Scanning AP mailbox inbox → email detected
  2. Parsing PDF attachment → attachment validated
  3. Creating invoice ticket → ticket registered in AP queue
  4. Classifying invoice document → classified as category + confidence
  5. Initiating field extraction pipeline → 12 fields queued
  6. Preparing validation workflow → 5-stage pipeline configured
- Each stage completes at 1.2s intervals
- "Open Processing View" button unlocks after all 6 stages complete

---

## 12. ServiceNow Tickets Table

The Tickets section shows the full invoice queue in a tabulated format:

**Columns:** # · Ticket ID · Invoice # · Supplier · Category · Amount · Received · Status · Priority · Confidence · Assigned To · SLA · Action

**Status chips (RAG coloured):**
- Ready for Agentic Huddle → green
- Needs Attention → red
- Ready for Review → amber
- Processing → blue
- Approved → green
- Rejected → red

**Priority indicators:**
- High → red dot
- Medium → amber dot
- Low → grey dot

**Confidence labels:**
- Ready to Proceed → green (≥90%)
- Review Recommended → amber (70–89%)
- Needs Attention → red (<70%)

**SLA colouring:**
- <8h remaining → red
- 8–24h → amber
- >24h → green

**Filters:** Category (All / PO / Non-PO / Oracle 26-B), Status, search by ticket ID / invoice / supplier

---

## 13. GL Code Repository

When assigning a GL code manually, analysts can access the GL Code Repository — a slide-over drawer showing all available GL codes:

| Code | Name | Category | Dept | Tax Code |
|------|------|----------|------|----------|
| 6200-001 | Office Equipment | Fixed Assets | All Departments | TX-US-GA-EQ |
| 6210-005 | Stationery & Supplies | Operating Expenses | All Departments | TX-US-GA-SRV |
| 6150-008 | Facilities & Services | Operating Expenses | Facilities | TX-US-GA-SRV |
| 6180-002 | IT Services & Support | Operating Expenses | Technology | TX-US-GA-SRV |
| 6220-010 | Marketing & Advertising | Operating Expenses | Marketing | TX-US-GA-MKT |
| 6100-003 | Travel & Entertainment | Operating Expenses | All Departments | TX-US-GA-TE |
| 6300-007 | Professional Services | Operating Expenses | Finance & Legal | TX-US-GA-SRV |
| 6250-004 | Training & Development | HR Expenses | Human Resources | TX-US-GA-SRV |

Codes can be selected (click to toggle, blue highlight) and applied. Also accessible via AI recommendation chips in the GL Missing card.

---

## 14. Communication System

The prototype simulates outbound communications through a **Communication Preview Modal** — a pre-drafted email composer that shows:
- To / Cc fields (pre-populated based on exception type)
- Subject line
- Full email body (auto-generated by the relevant agent)
- "Send Communication" button

Supported communication types:
- **Tax Mismatch Notification** → to James Wilson (Buyer) + Rachel Kim (AP Lead)
- **Missing GR Notification** → to David Park (PO Owner)
- **GL Code Request** → to supplier finance team + ap-operations@ups.com
- **Duplicate Invoice Rejection** → to supplier

After sending:
- Toast notification appears (bottom-right): "Mail has been sent to [recipients]"
- Inbox notification(s) appear as unread reply emails
- Invoice state updates to reflect the communication sent

---

## 15. Inbox Reply Emails

Reply emails appear in both the Outlook inbox and the ServiceNow notification system. They:
- Appear at the top of the message list with visual distinction
- Are marked unread (red badge on sidebar)
- Link to a specific invoice via `relatedInvoiceId`
- Navigating to the related invoice auto-resolves the exception (tax mismatch, GL approval)

**Known reply emails:**
1. James Wilson confirming correct tax code for INV-UPS-634571
2. Rachel Kim authorising processing for INV-UPS-634571
3. AP Automation confirming GL code approval granted for INV-UPS-895623

---

## 16. Analytics & Dashboard

### Dashboard View
KPI cards: total invoices, processing, exceptions, approved today, auto-processed rate, avg processing time.
Invoice grid view of all invoices with status indicators.

### Analytics Page
- Invoice Volume by Category (bar chart: PO=4, Non-PO=3, Oracle 26-B=1)
- Actions by Actor Type (donut: 84% Agent, 16% Human)
- Processing Volume — last 7 days (line chart, 2–8 invoices/day)
- Performance KPIs: Straight-Through Rate 87.4%, Avg Processing Time 4.2 min (−73% vs manual), Auto-resolved Exceptions 94.6%, Supplier Queries Avoided 1,240

---

## 17. Audit Trail

The Audit Trail page (and slide-over drawer on individual invoices) shows:
- Full immutable log of all agent and human actions
- Timestamp, actor type (Agent / Human), actor name, action taken, result, evidence
- Colour coded: blue for agent entries, green for human entries
- Timeline visualisation with connecting line

---

## 18. Settings (Agentic Processing Rules)

The Settings page shows the active processing rules governing agent behaviour:

1. **SLA Rule** — Process all invoices within SLA (Standard: 2 days, Urgent: 4 hours, Month-end: prior to close day)
2. **Discount Capture and Maximisation** — Prioritise discount-eligible invoices
3. **Paid On Time / Ready To Pay** — Ensure all invoices posted before due date
4. **Hold all Payments above $50k** — Senior AP manager approval required
5. **Tax Jurisdiction Verification** — Auto-flag jurisdiction mismatches
6. **Duplicate Detection** — 12-month lookback, ±2% fuzzy match, same-day resubmission check

---

## 19. Performance Claims (Demo Narrative)

| Metric | Value |
|--------|-------|
| Straight-Through Rate | 87.4% (invoices processed with zero human touch) |
| Average Processing Time | 4.2 minutes (vs 3–5 days manual) |
| Reduction vs manual | −73% processing time |
| Auto-resolved Exceptions | 94.6% |
| Supplier Queries Avoided | 1,240 per month |
| Agent vs Human Actions | 84% agent / 16% human |

---

## 20. Demo Flow (Recommended Walkthrough)

1. **Open prototype** → land on login screen → enter credentials
2. **Landing screen** → demonstrate two-system story (Outlook + ServiceNow)
3. **Open Outlook** → show invoice emails as received by AP team → read one email (Global Packaging)
4. **Return to landing** → open ServiceNow
5. **Tickets queue** → show tabulated queue, explain columns (Ticket ID, Status, Priority, SLA)
6. **Click a straight-through ticket** (AP-TKT-100248) → Initial Agentic Huddle → 6-stage trace → Open Processing View
7. **Processing View** → show stepper, agent huddle, live field extraction, completion cards → Auto-approved
8. **Go back** → click a GL missing ticket (AP-TKT-100253 / ProClean)
9. **GL Missing flow** → show agent exception, send approval email, receive inbox notification, apply GL code, approve
10. **Go back** → click Duplicate ticket (AP-TKT-100250 / Apex) → show auto-rejection
11. **Navigate to Analytics** → show performance metrics
12. **Navigate to Audit Trail** → show immutable log
