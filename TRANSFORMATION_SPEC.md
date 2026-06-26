# Bertelsmann AP Automation — Transformation Spec

Single source of truth for re-skinning the UPS/Oracle demo into a **Bertelsmann Group
(Communications & Media)** Accounts Payable demo on **SAP**. Every file must follow the maps below.

## 1. Brand & platform tokens (global find → replace intent)

| Old (UPS/Oracle) | New (Bertelsmann/SAP) |
|---|---|
| UPS / United Parcel Service | Bertelsmann / Bertelsmann Group |
| UPS Source-to-Pay | Bertelsmann Global Source-to-Pay |
| Oracle ERP | SAP S/4HANA |
| Oracle Inventory | SAP MM (Goods Receipt) |
| Oracle Supplier Master | SAP Vendor / Business Partner Master |
| Oracle Payments (Agent) | SAP Payment Run |
| Oracle 26-B (category) | **ECC Legacy** (category literal: `'ECC Legacy'`) |
| @ups.com (internal) | @bertelsmann.de |
| ServiceNow | ServiceNow (KEEP — in the stack) |
| FDAO | S/4 Data Hub |
| I2P / SMC agents | Playbook agents (see §3) |
| Atlanta, GA HQ | Gütersloh, Germany (group HQ) |

Stack vocabulary to use freely: SAP S/4HANA (JP5), OpenText VIM, SAP DOX (AI OCR),
SAP DRC (statutory e-invoicing/tax), SAP FIORI, Concur, Tungsten Network, ICE (intercompany), SynOps, Signavio.
Primary accent color stays `#0074d7` (blue); warning `#b06b00`; success `#1b823f`. (Palette unchanged to limit risk.)

## 2. People (internal Bertelsmann)

| Role (old) | New name | Email |
|---|---|---|
| AP Specialist / current user (Sarah Chen) | **Lena Fischer** | l.fischer@bertelsmann.de |
| AP Lead (Rachel Kim) | **Anja Krüger** | a.krueger@bertelsmann.de |
| Procurement Buyer (James Wilson) | **Markus Weber** | m.weber@bertelsmann.de |
| Production Manager / PO owner (David Park) | **Sophie Brandt** | s.brandt@fremantle.com |
| IT Requestor (Alex Morgan) | **Daniel Roth** | d.roth@arvato-systems.de |
| Head of IT (David Turner) | **Thomas Lindqvist** | t.lindqvist@arvato-systems.de |
| Royalties Manager (new) | **Claire Newton** | c.newton@penguinrandomhouse.com |
| Group IC Accounting (new) | **Pieter Janssen** | p.janssen@bertelsmann.de |

## 3. Agent vocabulary (canonical names — used in mockData audit trails, agentSteps, AND ProcessingView dictionaries)

| Canonical name | initials |
|---|---|
| VIM Mailbox Adapter | VM |
| Document Status Agent | DS |
| Invoice Classification (Ic) | Ic |
| SAP DOX Digitization Agent | Id |
| Invoice Extractor (Id) | Ex |
| Formatter Agent | Fm |
| Field Validation Agent | Fv |
| Invoice Validation (Iv) | Iv |
| Matching & GL Advisor (Ma) | Ma |
| S/4 Data Hub | S4 |
| 3-Way Match Agent | 3W |
| Payment Validator (Pv) | Pv |
| Anomaly Sensor (As) | As |
| Tax & DRC Agent (Tx) | Tx |
| NPO Exception Orchestrator (Eg) | NP |
| Exception Gatekeeper (Eg) | Eg |
| Predictive IC & Royalty Agent | IC |
| Workflow Advisor (Wa) | Wa |
| Helpdesk Advisor (Ha) | Ha |

**PO_STEPS:** 1 Invoice Ingestion [VIM Mailbox Adapter, Document Status Agent, Invoice Classification (Ic)] ·
2 Field Extraction [SAP DOX Digitization Agent, Invoice Extractor (Id), Formatter Agent] ·
3 Data Completeness Check [Field Validation Agent, Invoice Validation (Iv)] ·
4 Master Data Check [Field Validation Agent, Matching & GL Advisor (Ma), S/4 Data Hub] ·
5 3-Way Match [3-Way Match Agent, Matching & GL Advisor (Ma), Payment Validator (Pv), Anomaly Sensor (As)]

**NON_PO_STEPS:** 1,2,3 same · 4 Master Data Check [Field Validation Agent, S/4 Data Hub] ·
5 GL Coding [Matching & GL Advisor (Ma), Tax & DRC Agent (Tx), NPO Exception Orchestrator (Eg), Field Validation Agent]

## 4. Invoice dataset (ids preserved for App.tsx wiring; inv-4 GL & inv-5 tax flows must keep ids)

| id | division / entity | supplier | category | failType | currency | scenario |
|---|---|---|---|---|---|---|
| inv-1 | RTL / Fremantle | ARRI Rental Deutschland GmbH | PO | — (straight-through) | EUR | Production camera/lens/lighting rental; clean 3-way (SES) match |
| inv-2 | RTL / Fremantle | Sunset Post Production Ltd | PO | missing-gr | EUR | **Missing Service Entry Sheet / milestone "Ep.6 Picture Lock" not booked** → contact Sophie Brandt |
| inv-3 | Penguin Random House (US) | Maersk Line | PO | duplicate | USD | Duplicate freight/distribution invoice — Payment Validator (Pv) auto-reject |
| inv-4 | Arvato Connect (BPS) | Deloitte Consulting GmbH | Non-PO | gl-missing (internal-approval) | EUR | NPO advisory, 3 conflicting GL → buyer Markus Weber + AP Lead Anja Krüger approve |
| inv-5 | Bertelsmann Education / BMS | Lehmanns Media GmbH | PO | tax-mismatch | EUR | **German e-invoicing (DRC): VAT 19% applied vs 7% reduced book rate** → supplier resubmits |
| inv-6 | BMS / Territory | Jung von Matt AG | Non-PO | gl-missing | EUR | Creative agency NPO, ambiguous GL |
| inv-7 | Penguin Random House (US) | RR Donnelley | ECC Legacy | — (queued) | USD | Print/freight queued on ECC 6.0 |
| inv-8 | Penguin Random House (US) | Ingram Content Group | ECC Legacy | — (queued) | USD | Distribution queued on ECC |
| inv-9 | BMG | Kobalt Music Group | PO | manual-approval | EUR | **Scanned royalty/usage statement, 84% OCR** → manual review (HTML scanned render, no PNG) |
| inv-10 | Arvato Systems (ASYS) | T-Systems International GmbH | Non-PO | gl-missing | EUR | IT managed services NPO, ambiguous GL (scanned render) |
| inv-11 | Arvato Systems (ASYS) | T-Systems International GmbH | Non-PO | gl-missing (prt-coding) | EUR | **SAP WBS / cost-object coding string** required → Daniel Roth + Thomas Lindqvist (scanned render) |
| inv-12 | RTL / Fremantle ↔ RTL Deutschland | (intercompany) | Non-PO | **ic-mismatch (NEW)** | EUR | Intercompany content-charge mismatch → Predictive IC & Royalty Agent triggers ICE reconciliation (self-contained) |
| inv-13 | Penguin Random House (US) | The Wylie Agency LLC | Non-PO | **royalty-mismatch (NEW)** | USD | Royalty invoiced rate 15% vs contract 12.5% → GenAI flags, route to Royalties Manager Claire Newton (self-contained) |

inv-5-r1 = corrected resubmission of inv-5 (VAT 7%). Reply email ids preserved: `reply-1`, `reply-2`,
`reply-gl-approval`, `reply-metro-gl-1/2`, `reply-prt-gl-1/2`.

## 5. New exception types (self-contained — resolved by local state in ProcessingView, no App.tsx wiring)

- **`royalty-mismatch`** (`royaltyMismatchInfo`): card shows contract rate vs invoiced rate vs variance,
  basis, contract ref; sticky panel button "Send query to Royalties Management" → resolved card + AutoApprovePanel.
- **`ic-mismatch`** (`icMismatchInfo`): card shows both entities, both postings, variance, ICE ref;
  sticky panel button "Trigger ICE Reconciliation" → resolved card + AutoApprovePanel.

## 6. Re-theme notes for engine cards (ProcessingView)
- `MissingGRCard` / modal / sticky: relabel "Goods Receipt / Oracle Inventory" → "Service Entry Sheet / milestone in SAP".
- `TaxMismatchCard`: generalize the hardcoded 8%/7% math to parse `detectedRate`/`expectedRate` (now 19%/7%).
- `PRTCodingCard`: relabel "PRT" → "SAP WBS coding string"; cost centre `CC-ASYS-IT-0042`.
- All "Sent to Oracle Payments Agent" → "Sent to SAP Payment Run".
