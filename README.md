# Bertelsmann Invoice Processing Automation — Demo App

An interactive React/TypeScript prototype demonstrating AI-native, agentic Accounts Payable
invoice processing for the **Bertelsmann Group** (Communications & Media) global Source-to-Pay
programme on **SAP S/4HANA**. It is a Bertelsmann/SAP re-skin of the original UPS V5 demo, built
to showcase the media-industry nuances from the AP Division Playbook.

See [TRANSFORMATION_SPEC.md](TRANSFORMATION_SPEC.md) for the full mapping (brand, people, SAP
stack, agent vocabulary, and the invoice scenario set).

---

## Quick Start

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

Open the printed `http://localhost:5173` (or next free port) in your browser.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Inline styles (no CSS framework) |
| Data | Mock data only — no backend |
| State | Lifted to `App.tsx`, passed as props |

---

## Platform & vocabulary (SAP)

ERP/stack referenced throughout: **SAP S/4HANA**, **OpenText VIM** (workflow/ingestion),
**SAP DOX** (AI OCR), **SAP DRC** (statutory e-invoicing/VAT), **SAP FIORI**, **Concur**,
**Tungsten Network**, **ICE** (intercompany), **ServiceNow** (inquiries). The agentic pipeline
uses the playbook agent names: Invoice Classification (Ic), Invoice Extractor (Id),
Invoice Validation (Iv), Matching & GL Advisor (Ma), Payment Validator (Pv), Anomaly Sensor (As),
Tax & DRC Agent (Tx), NPO Exception Orchestrator (Eg), Predictive IC & Royalty Agent, and more.

---

## Demo invoices (across Bertelsmann divisions)

| Ticket | Division | Supplier | Scenario |
|--------|----------|----------|----------|
| AP-TKT-100248 | RTL / Fremantle | ARRI Rental Deutschland | Straight-through PO (camera/lighting rental, SES match) |
| AP-TKT-100261 | RTL / Fremantle | Stellify Media | **GenAI milestone interpretation** — reads the contract clause, books the SES, clears straight-through |
| AP-TKT-100249 | RTL / Fremantle | Sunset Post Production | **Missing Service Entry Sheet** — milestone not booked |
| AP-TKT-100250 | Penguin Random House | Maersk Line | Duplicate freight invoice — Payment Validator auto-reject |
| AP-TKT-100251 | Arvato Connect | Deloitte Consulting | Non-PO GL ambiguity — buyer + AP Lead approval |
| AP-TKT-100252 | Bertelsmann Education | Lehmanns Media | **German e-invoicing VAT mismatch** (19% vs 7% book rate) — supplier resubmits |
| AP-TKT-100253 | BMS / Territory | Jung von Matt | Non-PO creative GL ambiguity |
| AP-TKT-100254 | BMG | Kobalt Music Group | Scanned royalty statement, 84% OCR — manual review |
| AP-TKT-100255/6 | Penguin Random House | RR Donnelley / Ingram | ECC Legacy — queued |
| AP-TKT-100257 | Arvato Systems | T-Systems | Non-PO IT GL ambiguity |
| AP-TKT-100258 | Arvato Systems | T-Systems | **SAP WBS / cost-object coding string** required |
| AP-TKT-100259 | RTL ↔ RTL Deutschland | (intercompany) | **Intercompany content-charge mismatch** — ICE reconciliation |
| AP-TKT-100260 | Penguin Random House | The Wylie Agency | **Royalty vs contract deviation** (15% invoiced vs 12.5% contract) |

The **bold NEW** media-industry scenarios directly demonstrate the playbook nuances: VAT/e-invoicing,
intercompany mismatch, royalty-vs-contract, and the Fremantle **GenAI milestone interpretation**
straight-through. Royalty and intercompany resolve in-app via a single agentic action (no email
round-trip); the VAT case demonstrates the full reject → supplier resubmit → auto-approve loop; and
the Stellify case shows GenAI autonomously clearing a contract-described milestone with no analyst.

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server.

---

## Notes

- All data is mocked — no API calls, no authentication required.
- UI state resets on page reload (demo/presentation use).
- Two entry points from the landing screen: a Microsoft Outlook-style AP mailbox and a
  ServiceNow-style AP ticket console.
