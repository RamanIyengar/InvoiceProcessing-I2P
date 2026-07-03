import { Invoice, ReplyEmail, SentEmail } from '../types'

// ─── Agentic pipeline definitions (SAP / OpenText VIM stack, playbook agent vocabulary) ──

const PO_STEPS = [
  { id: 'ingest', name: 'Invoice Ingestion', description: 'Detects supplier email and invoice attachment via the OpenText VIM mailbox adapter. Creates the invoice record and logs intake metadata to the S/4 Data Hub.', agents: ['VIM Mailbox Adapter', 'Document Status Agent', 'Invoice Classification (Ic)'] },
  { id: 'extract', name: 'Field Extraction', description: 'Extracts all header and line-level fields using SAP DOX AI-powered OCR. Confidence scores assigned per field.', agents: ['SAP DOX Digitization Agent', 'Invoice Extractor (Id)', 'Formatter Agent'] },
  { id: 'completeness', name: 'Data Completeness Check', description: 'Validates all mandatory fields are present and correctly formatted; rejects invalid invoices at the door.', agents: ['Field Validation Agent', 'Invoice Validation (Iv)'] },
  { id: 'masterdata', name: 'Master Data Check', description: 'Cross-references extracted fields against the SAP Vendor / Business Partner master, PO register, and Service Entry / Goods Receipt records.', agents: ['Field Validation Agent', 'Matching & GL Advisor (Ma)', 'S/4 Data Hub'] },
  { id: 'match', name: '3-Way Match', description: 'Compares invoice values against PO quantities/amounts and the Service Entry Sheet / goods receipt. Tolerance rules applied; pre-payment duplicate control runs in parallel.', agents: ['3-Way Match Agent', 'Matching & GL Advisor (Ma)', 'Payment Validator (Pv)', 'Anomaly Sensor (As)'] },
]

const NON_PO_STEPS = [
  { id: 'ingest', name: 'Invoice Ingestion', description: 'Detects supplier email and invoice attachment via the OpenText VIM mailbox adapter. Creates the invoice record and logs intake metadata to the S/4 Data Hub.', agents: ['VIM Mailbox Adapter', 'Document Status Agent', 'Invoice Classification (Ic)'] },
  { id: 'extract', name: 'Field Extraction', description: 'Extracts all header and line-level fields using SAP DOX AI-powered OCR. Confidence scores assigned per field.', agents: ['SAP DOX Digitization Agent', 'Invoice Extractor (Id)', 'Formatter Agent'] },
  { id: 'completeness', name: 'Data Completeness Check', description: 'Validates all mandatory fields are present and correctly formatted; rejects invalid invoices at the door.', agents: ['Field Validation Agent', 'Invoice Validation (Iv)'] },
  { id: 'masterdata', name: 'Master Data Check', description: 'Cross-references the SAP Vendor master, cost-centre records, tax configuration, and historical coding patterns.', agents: ['Field Validation Agent', 'S/4 Data Hub'] },
  { id: 'glcode', name: 'GL Coding', description: 'Non-PO invoice coded via AI-powered touchless Non-PO coding using supplier category, line descriptions, cost centre, historical patterns, and SAP DRC tax rules.', agents: ['Matching & GL Advisor (Ma)', 'Tax & DRC Agent (Tx)', 'NPO Exception Orchestrator (Eg)'] },
]

const IC_STEPS = [
  { id: 'ingest', name: 'Invoice Ingestion', description: 'Detects the intercompany posting via the OpenText VIM mailbox adapter and creates the invoice record in the S/4 Data Hub.', agents: ['VIM Mailbox Adapter', 'Document Status Agent', 'Invoice Classification (Ic)'] },
  { id: 'extract', name: 'Field Extraction', description: 'Extracts all header and line-level fields using SAP DOX AI-powered OCR. Confidence scores assigned per field.', agents: ['SAP DOX Digitization Agent', 'Invoice Extractor (Id)', 'Formatter Agent'] },
  { id: 'completeness', name: 'Data Completeness Check', description: 'Validates all mandatory fields and intercompany trading-partner codes are present.', agents: ['Field Validation Agent', 'Invoice Validation (Iv)'] },
  { id: 'masterdata', name: 'Master Data Check', description: 'Cross-references the SAP Vendor master and intercompany clearing accounts.', agents: ['Field Validation Agent', 'S/4 Data Hub'] },
  { id: 'icmatch', name: 'Intercompany Matching', description: 'Predictive IC & Royalty Settlement agent matches both sides of the intercompany posting in real time and reconciles against the ICE system across affiliated entities.', agents: ['Matching & GL Advisor (Ma)', 'Predictive IC & Royalty Agent', 'S/4 Data Hub'] },
]

const ROYALTY_STEPS = [
  { id: 'ingest', name: 'Invoice Ingestion', description: 'Detects the royalty invoice via the OpenText VIM mailbox adapter and creates the invoice record in the S/4 Data Hub.', agents: ['VIM Mailbox Adapter', 'Document Status Agent', 'Invoice Classification (Ic)'] },
  { id: 'extract', name: 'Field Extraction', description: 'Extracts royalty lines, rates, and contract references using SAP DOX AI-powered OCR.', agents: ['SAP DOX Digitization Agent', 'Invoice Extractor (Id)', 'Formatter Agent'] },
  { id: 'completeness', name: 'Data Completeness Check', description: 'Validates mandatory fields and that a contract reference is present.', agents: ['Field Validation Agent', 'Invoice Validation (Iv)'] },
  { id: 'masterdata', name: 'Master Data Check', description: 'Cross-references the SAP Vendor master and the abstracted royalty contract terms.', agents: ['Field Validation Agent', 'S/4 Data Hub'] },
  { id: 'royaltycheck', name: 'Royalty Validation', description: 'GenAI compares each royalty invoice line against the abstracted contract terms (rate, basis, clauses) and flags genuine deviations for review.', agents: ['Matching & GL Advisor (Ma)', 'Predictive IC & Royalty Agent'] },
]

const FREMANTLE_STEPS = [
  { id: 'ingest', name: 'Invoice Ingestion', description: 'Detects the production invoice via the OpenText VIM mailbox adapter and creates the invoice record in the S/4 Data Hub.', agents: ['VIM Mailbox Adapter', 'Document Status Agent', 'Invoice Classification (Ic)'] },
  { id: 'extract', name: 'Field Extraction', description: 'Extracts header and line-level production fields using SAP DOX AI-powered OCR.', agents: ['SAP DOX Digitization Agent', 'Invoice Extractor (Id)', 'Formatter Agent'] },
  { id: 'completeness', name: 'Data Completeness Check', description: 'Validates all mandatory fields are present and correctly formatted.', agents: ['Field Validation Agent', 'Invoice Validation (Iv)'] },
  { id: 'masterdata', name: 'Master Data Check', description: 'Cross-references the SAP Vendor master, the production PO, and the project structure.', agents: ['Field Validation Agent', 'Matching & GL Advisor (Ma)', 'S/4 Data Hub'] },
  { id: 'match', name: 'Milestone Match (GenAI)', description: 'Where the milestone is described in the production contract rather than structured in SAP, GenAI reads the contract clause, confirms the condition is met, books the Service Entry Sheet, and completes the 3-way match — clearing the invoice without an analyst.', agents: ['GenAI Milestone Interpreter', '3-Way Match Agent', 'Matching & GL Advisor (Ma)', 'Payment Validator (Pv)'] },
]

export const mockInvoices: Invoice[] = [
  // ── PO Invoice 1 — RTL / Fremantle production equipment (Straight-through) ─────
  {
    id: 'inv-1',
    invoiceNumber: 'ARRI-2026-148750',
    supplier: 'ARRI Rental Deutschland GmbH',
    supplierId: 'ARRI-4821',
    amount: 148750,
    currency: 'EUR',
    category: 'PO',
    straightforward: true,
    emailSubject: 'Invoice ARRI-2026-148750 – Camera & Lighting Rental (Fremantle Production)',
    emailPreview: 'Please find attached our invoice for PO 4500291837 covering camera, lens and lighting rental for the Fremantle production...',
    emailSender: 'ARRI Rental Deutschland GmbH',
    emailSenderEmail: 'billing@arrirental.de',
    emailTime: '09:14',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'ARRI_2026_148750.pdf',
    status: 'awaiting-approval',
    recommendation: 'Straight-Through Processing Eligible — All validations passed and the PO 3-way match against the Service Entry Sheet is complete. Invoice is eligible for straight-through processing. Routing to approval step.',
    emailBody: `Dear Bertelsmann / Fremantle Accounts Payable Team,

Please find attached our invoice ARRI-2026-148750 covering the camera, lens, lighting and grip rental supplied for the Fremantle production under Purchase Order 4500291837.

All equipment was delivered and the rental period confirmed on the production Service Entry Sheet on June 10, 2026.

Invoice Details:
  Invoice Number:  ARRI-2026-148750
  Invoice Date:    June 12, 2026
  Due Date:        July 12, 2026
  PO Reference:    4500291837
  SES Reference:   SES-FRM-291837-006
  Total Amount:    €148,750.00 EUR

Please process payment to Commerzbank per the instructions on the attached invoice.

Best regards,
ARRI Rental Deutschland GmbH
billing@arrirental.de`,
    extractedFields: {
      invoiceNumber: 'ARRI-2026-148750', supplierName: 'ARRI Rental Deutschland GmbH', supplierId: 'ARRI-4821',
      poNumber: '4500291837', grNumber: 'SES-FRM-291837-006', sesNumber: 'SES-FRM-291837-006',
      invoiceDate: 'June 12, 2026', dueDate: 'July 12, 2026', paymentTerms: 'Net 30', currency: 'EUR',
      subtotal: 125000, tax: 23750, totalAmount: 148750,
      bankAccountStatus: 'Verified', duplicateCheck: 'No Duplicate Found', matchStatus: '3-Way Match Passed',
      fieldConfidences: { invoiceNumber: 100, supplierName: 100, poNumber: 100, grNumber: 98, invoiceDate: 100, dueDate: 100, totalAmount: 100 },
    },
    agentSteps: PO_STEPS,
    auditTrail: [
      { id: 'a1', timestamp: '09:14:23', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected from AP mailbox', result: 'Detected email from billing@arrirental.de', evidence: 'Attachment: ARRI_2026_148750.pdf' },
      { id: 'a2', timestamp: '09:14:25', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Attachment classified as invoice', result: 'Document type confirmed as PO Purchase Invoice', evidence: 'Confidence: 99.2%' },
      { id: 'a3', timestamp: '09:14:31', actorType: 'Agent', actorName: 'SAP DOX Digitization Agent', action: 'Invoice fields extracted', result: '18 fields extracted with mean confidence 96.4%' },
      { id: 'a4', timestamp: '09:14:35', actorType: 'Agent', actorName: 'Field Validation Agent', action: 'Mandatory fields validated', result: 'All 18 mandatory fields present', evidence: 'Validation: PASS' },
      { id: 'a5', timestamp: '09:14:38', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'Supplier master matched', result: 'Vendor ARRI-4821 verified in SAP Business Partner master', evidence: 'Sanctions screening: CLEAR' },
      { id: 'a6', timestamp: '09:14:41', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'PO and Service Entry Sheet matched', result: 'PO 4500291837 located. SES-FRM-291837-006 confirmed', evidence: 'PO amount: €150,000.00' },
      { id: 'a7', timestamp: '09:14:45', actorType: 'Agent', actorName: '3-Way Match Agent', action: '3-way match completed', result: 'Invoice €148,750.00 within tolerance of PO €150,000.00', evidence: 'Match: PASS' },
      { id: 'a8', timestamp: '09:14:48', actorType: 'Agent', actorName: 'Payment Validator (Pv)', action: 'Duplicate check passed', result: 'No duplicate found across 12-month invoice history' },
    ],
  },

  // ── PO Invoice 2 — Fremantle post-production (Missing Service Entry Sheet) ─────
  {
    id: 'inv-2',
    invoiceNumber: 'SPP-2026-0461',
    supplier: 'Sunset Post Production Ltd',
    supplierId: 'SPP-6300',
    amount: 312000,
    currency: 'EUR',
    category: 'PO',
    failAtStep: 4,
    failType: 'missing-gr',
    missingGRInfo: {
      poNumber: '4500288120',
      poOwnerName: 'Sophie Brandt',
      poOwnerEmail: 's.brandt@fremantle.com',
      slaMinutes: 269,
    },
    emailSubject: 'Invoice SPP-2026-0461 – Picture & Sound Post, "Coastlines" S2 Ep.6',
    emailPreview: 'Please find attached our invoice SPP-2026-0461 for picture and sound post-production. PO No.: 4500288120...',
    emailSender: 'Sunset Post Production Ltd',
    emailSenderEmail: 'accounts@sunsetpost.co.uk',
    emailTime: '08:41',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'SPP-2026-0461.pdf',
    status: 'processing',
    emailBody: `Dear Fremantle Accounts Payable Team,

Please find attached our invoice SPP-2026-0461 for picture and sound post-production services on the series "Coastlines" Season 2, Episode 6, referencing your Purchase Order No. 4500288120.

This invoice covers the Episode 6 picture-lock milestone as defined in the production agreement.

Invoice Details:
  Invoice Number:  SPP-2026-0461
  Invoice Date:    14 June 2026
  PO Reference:    4500288120
  Milestone:       Ep.6 Picture Lock
  Total Amount:    €312,000.00 EUR
  Payment Terms:   Net 45

Best regards,
Sunset Post Production Ltd
accounts@sunsetpost.co.uk`,
    extractedFields: {
      invoiceNumber: 'SPP-2026-0461', supplierName: 'Sunset Post Production Ltd', supplierId: 'SPP-6300',
      poNumber: '4500288120', contractRef: 'Ep.6 Picture Lock',
      invoiceDate: 'June 14, 2026', dueDate: 'July 29, 2026', paymentTerms: 'Net 45', currency: 'EUR',
      subtotal: 312000, tax: 0, totalAmount: 312000,
      taxCode: 'DE-VAT-RC',
      bankAccountStatus: 'Verified', duplicateCheck: 'Pending',
      fieldConfidences: { invoiceNumber: 100, supplierName: 100, poNumber: 100, invoiceDate: 98, totalAmount: 100 },
    },
    agentSteps: PO_STEPS,
    auditTrail: [
      { id: 'b1', timestamp: '08:41:05', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected', result: 'Detected email from accounts@sunsetpost.co.uk', evidence: 'Attachment: SPP-2026-0461.pdf' },
      { id: 'b2', timestamp: '08:41:08', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as PO invoice', result: 'PO reference 4500288120 detected', evidence: 'Confidence: 97.1%' },
      { id: 'b3', timestamp: '08:41:15', actorType: 'Agent', actorName: 'Invoice Extractor (Id)', action: 'Fields extracted', result: '16 fields extracted, mean confidence 95.2%' },
      { id: 'b4', timestamp: '08:41:22', actorType: 'Agent', actorName: 'Field Validation Agent', action: 'Completeness check passed', result: 'All mandatory fields present', evidence: 'Validation: PASS' },
      { id: 'b5', timestamp: '08:41:29', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'PO record located in SAP S/4HANA', result: 'PO 4500288120 found. Amount: €315,000.00', evidence: 'PO status: Open' },
      { id: 'b6', timestamp: '08:41:34', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'Service Entry Sheet lookup failed', result: 'ERROR: No Service Entry Sheet found in SAP for the Ep.6 Picture Lock milestone on PO 4500288120', evidence: 'SES status: Not booked' },
    ],
  },

  // ── PO Invoice 3 — PRH distribution freight (Duplicate Detected) ──────────────
  {
    id: 'inv-3',
    invoiceNumber: 'MAEU-2026-58900',
    supplier: 'Maersk Line',
    supplierId: 'MAEU-7741',
    amount: 58900,
    currency: 'USD',
    category: 'PO',
    failAtStep: 4,
    failType: 'duplicate',
    duplicateInfo: {
      originalInvoiceNumber: 'MAEU-2026-58900',
      processedDate: '2026-03-14',
      apDocNumber: 'AP-DOC-2026-04421',
      paymentAmount: 58900,
      paymentDate: '2026-03-21',
      paymentMethod: 'ACH',
      senderEmail: 'invoices@maersk.com',
      slaMinutes: 265,
    },
    emailSubject: 'Invoice MAEU-2026-58900 – Ocean Freight, Penguin Random House Distribution',
    emailPreview: 'Attached please find invoice MAEU-2026-58900 for ocean freight on book distribution containers...',
    emailSender: 'Maersk Line',
    emailSenderEmail: 'invoices@maersk.com',
    emailTime: '07:55',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'MAEU_58900.pdf',
    status: 'detected',
    emailBody: `Dear Penguin Random House Finance Team,

Please find attached invoice MAEU-2026-58900 for ocean freight services on book distribution containers shipped to your Westminster, MD distribution center in June 2026.

Invoice Details:
  Invoice Number:  MAEU-2026-58900
  Invoice Date:    June 12, 2026
  Due Date:        July 12, 2026
  Total Amount:    $58,900.00 USD
  Payment Terms:   Net 30

Please process at your earliest convenience.

Best regards,
Maersk Line
invoices@maersk.com`,
    extractedFields: {
      invoiceNumber: 'MAEU-2026-58900', supplierName: 'Maersk Line', supplierId: 'MAEU-7741',
      poNumber: 'PO-PRH-2026-04417',
      invoiceDate: 'June 12, 2026', dueDate: 'July 12, 2026', paymentTerms: 'Net 30', currency: 'USD',
      subtotal: 58900, tax: 0, totalAmount: 58900,
      bankAccountStatus: 'Verified', duplicateCheck: 'DUPLICATE DETECTED',
      fieldConfidences: { invoiceNumber: 100, supplierName: 100, invoiceDate: 98, totalAmount: 100 },
    },
    agentSteps: PO_STEPS,
    auditTrail: [
      { id: 'c1', timestamp: '07:55:12', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected', result: 'Detected email from invoices@maersk.com', evidence: 'Attachment: MAEU_58900.pdf' },
      { id: 'c2', timestamp: '07:55:15', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as PO invoice', result: 'Document type confirmed as Freight Invoice', evidence: 'Confidence: 96.8%' },
      { id: 'c3', timestamp: '07:55:22', actorType: 'Agent', actorName: 'Invoice Extractor (Id)', action: 'Fields extracted', result: '17 fields extracted, mean confidence 94.9%' },
      { id: 'c4', timestamp: '07:55:30', actorType: 'Agent', actorName: 'Field Validation Agent', action: 'Completeness check passed', result: 'All mandatory fields present' },
      { id: 'c5', timestamp: '07:55:37', actorType: 'Agent', actorName: 'Payment Validator (Pv)', action: 'Duplicate invoice detected', result: 'DUPLICATE: MAEU-2026-58900 was processed on 2026-03-14 as AP-DOC-2026-04421. Payment of $58,900.00 via ACH on 2026-03-21.', evidence: 'AUTO-REJECTED' },
    ],
  },

  // ── Non-PO Invoice — Arvato Connect advisory (GL Missing — Internal Approval) ──
  {
    id: 'inv-4',
    invoiceNumber: 'DLT-2026-7741',
    supplier: 'Deloitte Consulting GmbH',
    supplierId: 'DLT-4451',
    amount: 42840,
    currency: 'EUR',
    category: 'Non-PO',
    failAtStep: 4,
    failType: 'gl-missing',
    glMissingVariant: 'internal-approval',
    emailSubject: 'Invoice DLT-2026-7741 – Advisory Services (Arvato Connect)',
    emailPreview: 'Please find our invoice for advisory services for May 2026. GL coding required...',
    emailSender: 'Deloitte Consulting GmbH',
    emailSenderEmail: 'billing@deloitte.de',
    emailTime: '10:02',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'DLT-2026-7741.pdf',
    status: 'info-requested',
    emailBody: `Dear Bertelsmann / Arvato Accounts Payable Team,

Please find attached invoice DLT-2026-7741 for advisory services provided to Arvato Connect during May 2026.

Services include operating-model design workshops, process diagnostics, and an implementation roadmap per our engagement letter.

Invoice Details:
  Invoice Number:  DLT-2026-7741
  Invoice Date:    June 10, 2026
  Due Date:        June 25, 2026
  Service Period:  May 1–31, 2026
  Total Amount:    €42,840.00 EUR
  Payment Terms:   Net 15

Best regards,
Deloitte Consulting GmbH
billing@deloitte.de`,
    extractedFields: {
      invoiceNumber: 'DLT-2026-7741', supplierName: 'Deloitte Consulting GmbH', supplierId: 'DLT-4451',
      billNo: 'DLT-2026-05-001',
      invoiceDate: 'June 10, 2026', dueDate: 'June 25, 2026', paymentTerms: 'Net 15', currency: 'EUR',
      subtotal: 36000, tax: 6840, totalAmount: 42840,
      bankAccountStatus: 'Verified', duplicateCheck: 'No Duplicate Found',
      expenseDescription: 'Advisory services for Arvato Connect — operating-model design workshops, process diagnostics, and implementation roadmap per engagement letter.',
      fieldConfidences: { invoiceNumber: 100, supplierName: 100, invoiceDate: 100, dueDate: 98, totalAmount: 100 },
      conflictingGLCodes: [
        { code: '6720-001', label: 'Management Consulting', percentage: 34 },
        { code: '6740-003', label: 'Legal & Professional Fees', percentage: 28 },
        { code: '6810-002', label: 'Project / Transformation', percentage: 38 },
      ],
    },
    agentSteps: NON_PO_STEPS,
    auditTrail: [
      { id: 'd1', timestamp: '10:02:11', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected', result: 'Detected email from billing@deloitte.de', evidence: 'Attachment: DLT-2026-7741.pdf' },
      { id: 'd2', timestamp: '10:02:14', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as Non-PO invoice', result: 'No PO reference. Routed to GL coding path.', evidence: 'Document type: Service Invoice' },
      { id: 'd3', timestamp: '10:02:19', actorType: 'Agent', actorName: 'Invoice Extractor (Id)', action: 'Fields extracted', result: '14 fields extracted, mean confidence 94.1%' },
      { id: 'd4', timestamp: '10:02:23', actorType: 'Agent', actorName: 'Field Validation Agent', action: 'Completeness check passed', result: 'All 14 mandatory fields present', evidence: 'Validation: PASS' },
      { id: 'd5', timestamp: '10:02:31', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'GL coding failed — 3 conflicting accounts', result: 'ERROR: Service category "Advisory / Consulting" matched 3 GL accounts (6720-001 Management Consulting 34%, 6740-003 Legal & Professional Fees 28%, 6810-002 Project / Transformation 38%). No single code exceeds 60% confidence threshold. Internal approval required.', evidence: 'Human intervention required.' },
    ],
  },

  // ── PO Invoice — Bertelsmann Education book supply (German e-invoicing VAT mismatch) ──
  {
    id: 'inv-5',
    invoiceNumber: 'LM-2026-04781',
    supplier: 'Lehmanns Media GmbH',
    supplierId: 'LM-2241',
    amount: 59500,
    currency: 'EUR',
    category: 'PO',
    failAtStep: 4,
    failType: 'tax-mismatch',
    taxMismatchInfo: {
      detectedCode: 'DE-VAT-STD',
      detectedRate: '19%',
      expectedCode: 'DE-VAT-RED',
      expectedRate: '7%',
      taxDifference: 6000,
      buyerName: 'Markus Weber',
      buyerEmail: 'm.weber@bertelsmann.de',
      apLeadName: 'Anja Krüger',
      apLeadEmail: 'a.krueger@bertelsmann.de',
      slaMinutes: 262,
    },
    emailSubject: 'Invoice LM-2026-04781 – Printed Educational Books',
    emailPreview: 'Please find attached invoice LM-2026-04781 for printed educational books supplied to Bertelsmann Education. PO Ref: 4500301992...',
    emailSender: 'Lehmanns Media GmbH',
    emailSenderEmail: 'rechnung@lehmanns.de',
    emailTime: '11:30',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'LM_2026_04781.pdf',
    status: 'info-requested',
    emailBody: `Dear Bertelsmann Education Finance Team,

Please find attached invoice LM-2026-04781 for printed educational books supplied in accordance with Purchase Order 4500301992.

Invoice Details:
  Invoice Number:  LM-2026-04781
  Invoice Date:    15.04.2026
  PO Reference:    4500301992
  SES Reference:   SES-EDU-301992-001
  VAT applied:     19% (DE-VAT-STD)
  Total Amount:    €59,500.00 EUR
  Payment Terms:   Net 30

Best regards,
Lehmanns Media GmbH
Debitorenbuchhaltung
rechnung@lehmanns.de`,
    extractedFields: {
      invoiceNumber: 'LM-2026-04781', supplierName: 'Lehmanns Media GmbH', supplierId: 'LM-2241',
      poNumber: '4500301992', grNumber: 'SES-EDU-301992-001', sesNumber: 'SES-EDU-301992-001',
      invoiceDate: 'April 15, 2026', dueDate: 'May 15, 2026', paymentTerms: 'Net 30', currency: 'EUR',
      subtotal: 50000, tax: 9500, totalAmount: 59500,
      bankAccountStatus: 'Verified', duplicateCheck: 'No Duplicate Found',
      taxCode: 'DE-VAT-STD',
      expenseDescription: 'Printed educational books for Bertelsmann Education — hardcover textbooks, paperback study guides, and reference atlases per PO 4500301992.',
      lineItems: [
        { description: 'Hardcover Textbook "Medizinische Grundlagen"', qty: 1000, unitPrice: 35 },
        { description: 'Paperback Study Guides', qty: 1500, unitPrice: 8 },
        { description: 'Reference Atlas (Hardcover)', qty: 200, unitPrice: 15 },
      ],
      fieldConfidences: { invoiceNumber: 100, supplierName: 100, poNumber: 100, grNumber: 100, invoiceDate: 98, totalAmount: 100 },
    },
    agentSteps: PO_STEPS,
    auditTrail: [
      { id: 'e1', timestamp: '11:30:08', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected', result: 'Detected email from rechnung@lehmanns.de', evidence: 'Attachment: LM_2026_04781.pdf' },
      { id: 'e2', timestamp: '11:30:11', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as PO invoice', result: 'PO reference detected: 4500301992', evidence: 'Confidence: 97.1%' },
      { id: 'e3', timestamp: '11:30:17', actorType: 'Agent', actorName: 'Invoice Extractor (Id)', action: 'Fields extracted', result: '9 fields extracted, mean confidence 96.4%' },
      { id: 'e4', timestamp: '11:30:24', actorType: 'Agent', actorName: 'Tax & DRC Agent (Tx)', action: 'VAT code mismatch detected', result: 'ERROR: Invoice applied VAT 19% (DE-VAT-STD). Printed books qualify for the reduced rate 7% (DE-VAT-RED) under German VAT law. SAP DRC flagged the discrepancy.', evidence: 'Tax variance: €6,000.00' },
    ],
  },

  // ── Non-PO Invoice — BMS / Territory creative agency (GL Code Missing) ─────────
  {
    id: 'inv-6',
    invoiceNumber: 'JVM-2026-0623',
    supplier: 'Jung von Matt AG',
    supplierId: 'JVM-5591',
    amount: 21896,
    currency: 'EUR',
    category: 'Non-PO',
    failAtStep: 4,
    failType: 'gl-missing',
    failMessage: 'GL Code Not Found — the Matching & GL Advisor (Ma) could not determine an appropriate GL account for Jung von Matt AG. The category "Creative / Agency Services" matched 3 conflicting GL accounts (6610-002, 6620-001, 6630-005) with insufficient confidence to auto-assign. Manual GL assignment or confirmation from the cost-centre manager is required before this invoice can proceed.',
    emailSubject: 'Campaign Creative Services Invoice – JVM-2026-0623',
    emailPreview: 'Invoice for campaign creative and production services rendered for the Territory marketing team...',
    emailSender: 'Jung von Matt AG',
    emailSenderEmail: 'billing@jvm.de',
    emailTime: '13:05',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'JVM_2026_0623.pdf',
    status: 'info-requested',
    emailBody: `Dear Bertelsmann Marketing Services Accounts Payable Team,

Please find attached invoice JVM-2026-0623 for campaign creative and production services rendered for the Territory marketing team in June 2026.

Services include concept development, key visual design, and asset production for a seasonal campaign.

Invoice Details:
  Invoice Number:  JVM-2026-0623
  Invoice Date:    June 16, 2026
  Due Date:        July 1, 2026
  Total Amount:    €21,896.00 EUR
  Payment Terms:   Net 15

Best regards,
Jung von Matt AG
billing@jvm.de`,
    extractedFields: {
      invoiceNumber: 'JVM-2026-0623', supplierName: 'Jung von Matt AG', supplierId: 'JVM-5591',
      billNo: 'JVM-2026-06-A',
      invoiceDate: 'June 16, 2026', dueDate: 'July 1, 2026', paymentTerms: 'Net 15', currency: 'EUR',
      subtotal: 18400, tax: 3496, totalAmount: 21896,
      bankAccountStatus: 'Verified', duplicateCheck: 'No Duplicate Found',
      expenseDescription: 'Campaign creative and production services for the Territory marketing team — concept development, key visual design, and asset production for a seasonal campaign.',
      costCenter: 'CC-BMS-MKT-2026',
      businessUnit: 'Bertelsmann Marketing Services — Territory',
      taxCode: 'DE-VAT-STD',
      conflictingGLCodes: [
        { code: '6610-002', label: 'Marketing & Advertising', percentage: 38 },
        { code: '6620-001', label: 'Creative Agency Fees', percentage: 34 },
        { code: '6630-005', label: 'Brand & Campaign Services', percentage: 28 },
      ],
      fieldConfidences: { invoiceNumber: 100, supplierName: 100, invoiceDate: 98, totalAmount: 100 },
    },
    agentSteps: NON_PO_STEPS,
    auditTrail: [
      { id: 'f1', timestamp: '13:05:04', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected', result: 'Detected email from billing@jvm.de', evidence: 'Attachment: JVM_2026_0623.pdf' },
      { id: 'f2', timestamp: '13:05:07', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as Non-PO invoice', result: 'No PO reference. Routed to GL coding path.', evidence: 'Confidence: 95.1%' },
      { id: 'f3', timestamp: '13:05:13', actorType: 'Agent', actorName: 'Invoice Extractor (Id)', action: 'Fields extracted', result: '11 fields extracted, mean confidence 95.3%' },
      { id: 'f4', timestamp: '13:05:21', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'GL coding failed — ambiguous category', result: 'ERROR: 3 conflicting GL accounts matched (6610-002, 6620-001, 6630-005). Confidence below 60% threshold.', evidence: 'Human intervention required.' },
    ],
  },

  // ── PO Invoice — BMG royalty statement (Scanned — Manual Approval Required) ────
  {
    id: 'inv-9',
    invoiceNumber: 'KOB-RY-2026-0831',
    supplier: 'Kobalt Music Group',
    supplierId: 'KOB-3674',
    amount: 48250,
    currency: 'EUR',
    category: 'PO',
    failAtStep: 4,
    failType: 'manual-approval',
    emailSubject: 'Royalty Statement KOB-RY-2026-0831 – Q1 Usage Pool – Kobalt Music Group',
    emailPreview: 'Please find attached our royalty/usage statement under the administration agreement for Q1 2026...',
    emailSender: 'Kobalt Music Group',
    emailSenderEmail: 'royalties@kobaltmusic.com',
    emailTime: '08:45',
    receivedAt: 'Sep 2, 2026',
    attachmentName: 'KOB_RY_2026_0831.pdf',
    status: 'info-requested',
    emailBody: `Dear BMG Royalty Accounting Team,\n\nPlease find attached royalty/usage statement KOB-RY-2026-0831 for the Q1 2026 usage pool under the administration agreement.\n\nStatement Details:\n  Statement Number: KOB-RY-2026-0831\n  Statement Date:   30-Aug-2026\n  Payment Due:      28-Dec-2026\n  Payment Terms:    Net 120 days\n  Total Amount:     €48,250.00 EUR\n  Period:           Q1 2026\n  Contract Ref:     Admin Agreement 10008, Exhibit B\n\nBest regards,\nKobalt Music Group\nroyalties@kobaltmusic.com`,
    extractedFields: {
      invoiceNumber: 'KOB-RY-2026-0831',
      supplierName: 'Kobalt Music Group',
      supplierId: 'KOB-3674',
      invoiceDate: 'Aug 30, 2026',
      dueDate: 'Dec 28, 2026',
      paymentTerms: 'Net 120',
      currency: 'EUR',
      subtotal: 48250,
      tax: 0,
      totalAmount: 48250,
      poNumber: 'PO-BMG-10008-Q1',
      grNumber: 'SO-8426',
      contractRef: 'Admin Agreement 10008',
      taxCode: 'DE-VAT-RC',
      bankAccountStatus: 'Verified',
      duplicateCheck: 'No Duplicate Found',
      matchStatus: 'Pending Manual Review',
      fieldConfidences: {
        invoiceNumber: 88, supplierName: 92, invoiceDate: 85, dueDate: 85, paymentTerms: 80,
        poNumber: 75, grNumber: 78, subtotal: 90, tax: 88, totalAmount: 90, bankAccountStatus: 80,
      },
    },
    agentSteps: ROYALTY_STEPS,
    auditTrail: [
      { id: 'i1', timestamp: '08:45:03', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected', result: 'Detected email from royalties@kobaltmusic.com', evidence: 'Attachment: KOB_RY_2026_0831.pdf' },
      { id: 'i2', timestamp: '08:45:07', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as royalty statement', result: 'Contract reference detected: Admin Agreement 10008. Category: Royalty Invoice.', evidence: 'Confidence: 89.2%' },
      { id: 'i3', timestamp: '08:45:14', actorType: 'Agent', actorName: 'SAP DOX Digitization Agent', action: 'Fields extracted from scanned document', result: '11 fields extracted, mean confidence 84.3% — moderate quality scan', evidence: 'OCR confidence: moderate' },
      { id: 'i4', timestamp: '08:45:21', actorType: 'Agent', actorName: 'Field Validation Agent', action: 'Completeness check passed with warnings', result: 'All mandatory fields present. Some fields below 85% confidence threshold.', evidence: 'Low confidence: PO Number (75%), GR Number (78%), Payment Terms (80%)' },
      { id: 'i5', timestamp: '08:45:29', actorType: 'Agent', actorName: 'Invoice Validation (Iv)', action: '3-way match paused for manual review', result: 'MANUAL REVIEW: Overall document confidence 84% is below the auto-approval threshold (90%). Amounts match but field confidence requires human verification.', evidence: 'Action: Manual approval required' },
    ],
  },

  // ── Non-PO Invoice — Arvato Systems IT services (GL Code Missing — Standard) ───
  {
    id: 'inv-10',
    invoiceNumber: 'TSI-2026-IT-4471',
    supplier: 'T-Systems International GmbH',
    supplierId: 'TSI-3674',
    amount: 75446,
    currency: 'EUR',
    category: 'Non-PO',
    failAtStep: 4,
    failType: 'gl-missing',
    emailSubject: 'Invoice TSI-2026-IT-4471 – Managed IT Services – Non-PO',
    emailPreview: 'Please find attached our invoice for managed IT services rendered in August 2026 under MSA #1...',
    emailSender: 'T-Systems International GmbH',
    emailSenderEmail: 'billing@t-systems.com',
    emailTime: '09:15',
    receivedAt: 'Sep 2, 2026',
    attachmentName: 'TSI_2026_IT_4471.pdf',
    status: 'info-requested',
    emailBody: `Dear Arvato Systems Accounts Payable Team,

Please find attached our invoice TSI-2026-IT-4471 for managed IT services rendered in August 2026 under Master Services Agreement #1 (Contract 10008, Exhibit B).

Invoice Details:
• Invoice Number: TSI-2026-IT-4471
• Invoice Date: August 30, 2026
• Due Date: December 28, 2026
• Payment Terms: Net 120 Days
• Net Amount: EUR 63,400.00
• VAT (19% DE): EUR 12,046.00
• Amount Due: EUR 75,446.00

This invoice covers the managed-services hours pool as defined in the Statement of Work #1.

Best regards,
T-Systems International GmbH Billing Team`,
    extractedFields: {
      invoiceNumber: 'TSI-2026-IT-4471',
      supplierName: 'T-Systems International GmbH',
      supplierId: 'TSI-3674',
      invoiceDate: 'Aug 30, 2026',
      dueDate: 'Dec 28, 2026',
      paymentTerms: 'Net 120',
      currency: 'EUR',
      subtotal: 63400,
      tax: 12046,
      totalAmount: 75446,
      taxCode: 'DE-VAT-STD',
      bankAccountStatus: 'Verified',
      duplicateCheck: 'No Duplicate Found',
      expenseDescription: 'Managed IT services — MSA #1 hours pool, per Contract 10008 Exhibit B.',
      fieldConfidences: { invoiceNumber: 92, supplierName: 98, invoiceDate: 89, totalAmount: 95 },
      conflictingGLCodes: [
        { code: '6180-002', label: 'IT Managed Services', percentage: 41 },
        { code: '6300-007', label: 'Professional Services', percentage: 35 },
        { code: '6185-004', label: 'Cloud & Hosting', percentage: 24 },
      ],
    },
    failMessage: 'GL Code Not Found — the Matching & GL Advisor (Ma) could not determine a unique GL account for T-Systems International GmbH. The category "Managed IT Services — MSA #1" matched 3 competing GL accounts (6180-002 IT Managed Services, 6300-007 Professional Services, 6185-004 Cloud & Hosting) with no single code above the 60% confidence threshold. Manual GL assignment is required before this Non-PO invoice can proceed to payment.',
    agentSteps: NON_PO_STEPS,
    auditTrail: [
      { id: 'j1', timestamp: '09:15:02', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected', result: 'Detected email from billing@t-systems.com', evidence: 'Attachment: TSI_2026_IT_4471.pdf' },
      { id: 'j2', timestamp: '09:15:05', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as Non-PO invoice', result: 'No PO reference. Contract reference detected. Routed to GL coding path.', evidence: 'Confidence: 91.8%' },
      { id: 'j3', timestamp: '09:15:12', actorType: 'Agent', actorName: 'Invoice Extractor (Id)', action: 'Fields extracted', result: '10 fields extracted, mean confidence 93.5%' },
      { id: 'j4', timestamp: '09:15:19', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'GL coding failed — ambiguous IT category', result: 'ERROR: Service category "Managed IT Services" matched 3 GL accounts (6180-002 IT Managed Services 41%, 6300-007 Professional Services 35%, 6185-004 Cloud & Hosting 24%). Confidence below 60% threshold. Human intervention required.', evidence: 'Human intervention required.' },
    ],
  },

  // ── Non-PO Invoice — Pixomondo GmbH VFX (GL Missing — Production WBS cost split) ──
  {
    id: 'inv-11',
    invoiceNumber: 'PXM-2026-FRM-1142',
    supplier: 'Pixomondo GmbH',
    supplierId: 'PXM-0571',
    amount: 175000,
    currency: 'EUR',
    category: 'Non-PO',
    failAtStep: 4,
    failType: 'gl-missing',
    glMissingVariant: 'prt-coding',
    emailSubject: 'Invoice PXM-2026-FRM-1142 – VFX Services "Rising Tides" S01 EP7–10 – Non-PO',
    emailPreview: 'Invoice for VFX compositing and digital post-production services for Fremantle drama "Rising Tides", S01 Episodes 7–10...',
    emailSender: 'Pixomondo GmbH',
    emailSenderEmail: 'billing@pixomondo.com',
    emailTime: '10:30',
    receivedAt: 'Sep 9, 2026',
    attachmentName: 'PXM_2026_FRM_1142.pdf',
    status: 'info-requested',
    emailBody: `Dear Fremantle Germany Accounts Payable Team,

Please find attached our invoice PXM-2026-FRM-1142 for VFX compositing and digital post-production services delivered in September 2026 for the RTL+ Original drama series "Rising Tides", Season 1.

Invoice Details:
• Invoice Number: PXM-2026-FRM-1142
• Invoice Date: September 8, 2026
• Due Date: October 8, 2026
• Payment Terms: Net 30 Days
• Amount Due: EUR 175,000.00 (VAT: Reverse Charge — §13b UStG)

Service Description:
  Visual effects compositing and digital post-production for "Rising Tides", S01, Episodes 7–10.
  Per Production Contract C-FRM-PXM-2026, Milestone 3 (Post-Production Delivery).

Note: Episodes 9–10 are subject to the Fremantle / Canal+ International co-production agreement (Co-Prod Ref: CPRO-2026-RT-003). Cost allocation per episode range should be confirmed by your Production Finance team before processing.

Best regards,
Pixomondo GmbH — Accounts Receivable
billing@pixomondo.com | www.pixomondo.com`,
    extractedFields: {
      invoiceNumber: 'PXM-2026-FRM-1142',
      supplierName: 'Pixomondo GmbH',
      supplierId: 'PXM-0571',
      invoiceDate: 'Sep 8, 2026',
      dueDate: 'Oct 8, 2026',
      paymentTerms: 'Net 30',
      currency: 'EUR',
      subtotal: 175000,
      tax: 0,
      totalAmount: 175000,
      bankAccountStatus: 'Verified',
      duplicateCheck: 'No Duplicate Found',
      costCenter: 'CC-FRM-PROD-2026',
      accountNumber: '6320-001',
      wbsElement: 'FRM.PROD.2026.RT-S01.VFX',
      appropriationNumber: 'E07-10',
      parNumber: 'P-RT01-26',
      expenseDescription: 'VFX compositing and digital post-production for "Rising Tides" S01, EP7–10, per Contract C-FRM-PXM-2026 Milestone 3.',
      fieldConfidences: { invoiceNumber: 97, supplierName: 99, invoiceDate: 95, totalAmount: 98 },
    },
    failMessage: 'GL coding halted — production cost allocation split required. Invoice PXM-2026-FRM-1142 covers VFX for Episodes 7–10 of "Rising Tides" (S01), spanning two WBS elements: FRM.PROD.2026.RT-S01.VFX (EP7–8, 100% Fremantle-funded) and FRM.COPRO.2026.RT-S01.VFX (EP9–10, 50% co-produced with Canal+ International). The Matching & GL Advisor cannot auto-split €175,000 across these elements without the signed Production Cost Allocation Schedule. Dual approval required from Production Finance and RTL Group Content Finance before payment release.',
    agentSteps: NON_PO_STEPS,
    auditTrail: [
      { id: 'k1', timestamp: '10:30:02', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected', result: 'Detected email from billing@pixomondo.com', evidence: 'Attachment: PXM_2026_FRM_1142.pdf' },
      { id: 'k2', timestamp: '10:30:05', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as Non-PO invoice', result: 'No PO reference. Production contract reference detected (C-FRM-PXM-2026). Routed to GL coding path.', evidence: 'Confidence: 95.1%' },
      { id: 'k3', timestamp: '10:30:12', actorType: 'Agent', actorName: 'Invoice Extractor (Id)', action: 'Fields extracted', result: '10 fields extracted, mean confidence 97.3%. Co-production flag detected on invoice.' },
      { id: 'k4', timestamp: '10:30:21', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'GL coding halted — co-production WBS split required', result: 'ERROR: Invoice spans co-produced episodes with different WBS elements. Cannot auto-split €175,000 across FRM.PROD.2026.RT-S01.VFX (EP7–8, 100% Fremantle) and FRM.COPRO.2026.RT-S01.VFX (EP9–10, co-production). Production Cost Allocation Schedule required from Production Finance.', evidence: 'WBS coding pattern: FRM.PROD/COPRO.YYYY.SHOW-SXX.CATEGORY.PROD-NO.EP-RANGE.CONTRACT-REF' },
    ],
  },

  // ── Intercompany Invoice — RTL / Fremantle content charge (IC Mismatch — NEW) ──
  {
    id: 'inv-12',
    invoiceNumber: 'IC-INV-FRM-88421',
    supplier: 'Fremantle Ltd (UK)',
    supplierId: 'IC-FRM-0001',
    amount: 214000,
    currency: 'EUR',
    category: 'Non-PO',
    failAtStep: 4,
    failType: 'ic-mismatch',
    icMismatchInfo: {
      entityA: 'Fremantle Ltd (UK)',
      entityB: 'RTL Deutschland GmbH',
      docA: 'IC-INV-FRM-88421',
      docB: 'IC-CLR-RTL-77120',
      amountA: 214000,
      amountB: 198500,
      variance: 15500,
      iceRef: 'ICE-REC-2026-0619',
      contactName: 'Pieter Janssen',
      contactEmail: 'p.janssen@bertelsmann.de',
      slaMinutes: 258,
    },
    emailSubject: 'Intercompany Charge IC-INV-FRM-88421 – Content Cross-Charge',
    emailPreview: 'Intercompany content cross-charge from Fremantle Ltd (UK) to RTL Deutschland GmbH for shared format rights...',
    emailSender: 'Fremantle Ltd (UK) — Intercompany',
    emailSenderEmail: 'ic-billing@fremantle.com',
    emailTime: '12:10',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'IC_INV_FRM_88421.pdf',
    status: 'processing',
    emailBody: `Intercompany posting notice.

Fremantle Ltd (UK) has raised an intercompany content cross-charge to RTL Deutschland GmbH for shared format rights and production cost recharges for June 2026.

Posting Details:
  IC Invoice (Fremantle UK):  IC-INV-FRM-88421  €214,000.00
  IC Clearing (RTL DE):       IC-CLR-RTL-77120  €198,500.00
  Trading Partner:            RTL Deutschland GmbH
  Period:                     June 2026

Both sides post to the standard intercompany clearing account.`,
    extractedFields: {
      invoiceNumber: 'IC-INV-FRM-88421', supplierName: 'Fremantle Ltd (UK)', supplierId: 'IC-FRM-0001',
      invoiceDate: 'June 17, 2026', dueDate: 'July 17, 2026', paymentTerms: 'IC Net 30', currency: 'EUR',
      subtotal: 214000, tax: 0, totalAmount: 214000,
      bankAccountStatus: 'Intercompany', duplicateCheck: 'No Duplicate Found',
      contractRef: 'IC Clearing — RTL Deutschland GmbH',
      expenseDescription: 'Intercompany content cross-charge — shared format rights and production cost recharges for June 2026.',
      fieldConfidences: { invoiceNumber: 100, supplierName: 100, invoiceDate: 98, totalAmount: 100 },
    },
    agentSteps: IC_STEPS,
    auditTrail: [
      { id: 'm1', timestamp: '12:10:04', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Intercompany posting detected', result: 'Detected IC posting from ic-billing@fremantle.com', evidence: 'Attachment: IC_INV_FRM_88421.pdf' },
      { id: 'm2', timestamp: '12:10:08', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as intercompany invoice', result: 'Trading partner RTL Deutschland GmbH detected. Routed to IC matching path.', evidence: 'Confidence: 96.4%' },
      { id: 'm3', timestamp: '12:10:15', actorType: 'Agent', actorName: 'Invoice Extractor (Id)', action: 'Fields extracted', result: '12 fields extracted, mean confidence 95.8%' },
      { id: 'm4', timestamp: '12:10:23', actorType: 'Agent', actorName: 'Predictive IC & Royalty Agent', action: 'Intercompany mismatch detected', result: 'ERROR: IC invoice IC-INV-FRM-88421 (€214,000.00) does not reconcile against clearing posting IC-CLR-RTL-77120 (€198,500.00). Variance €15,500.00.', evidence: 'ICE reconciliation required: ICE-REC-2026-0619' },
    ],
  },

  // ── Royalty Invoice — PRH author royalty vs contract (Royalty Mismatch — NEW) ──
  {
    id: 'inv-13',
    invoiceNumber: 'WYL-RY-2026-0312',
    supplier: 'The Wylie Agency LLC',
    supplierId: 'WYL-9043',
    amount: 32400,
    currency: 'USD',
    category: 'Non-PO',
    failAtStep: 4,
    failType: 'royalty-mismatch',
    royaltyMismatchInfo: {
      author: 'Eleanor Vance',
      title: 'The Long Horizon',
      contractRef: 'PRH-CTR-2023-4471',
      basis: 'Hardback net receipts',
      contractRate: '12.5%',
      invoicedRate: '15.0%',
      variance: 5400,
      royaltyManagerName: 'Claire Newton',
      royaltyManagerEmail: 'c.newton@penguinrandomhouse.com',
      slaMinutes: 260,
    },
    emailSubject: 'Royalty Invoice WYL-RY-2026-0312 – Eleanor Vance, "The Long Horizon"',
    emailPreview: 'Royalty invoice for author Eleanor Vance, title "The Long Horizon", hardback net receipts H1 2026...',
    emailSender: 'The Wylie Agency LLC',
    emailSenderEmail: 'royalties@wylieagency.com',
    emailTime: '14:20',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'WYL_RY_2026_0312.pdf',
    status: 'info-requested',
    emailBody: `Dear Penguin Random House Royalty Accounting Team,

Please find attached royalty invoice WYL-RY-2026-0312 on behalf of our client, author Eleanor Vance, for the title "The Long Horizon".

Invoice Details:
  Invoice Number:  WYL-RY-2026-0312
  Author:          Eleanor Vance
  Title:           The Long Horizon
  Basis:           Hardback net receipts (H1 2026)
  Royalty Rate:    15.0%
  Contract Ref:    PRH-CTR-2023-4471
  Total Amount:    $32,400.00 USD
  Payment Terms:   Net 30

Best regards,
The Wylie Agency LLC
royalties@wylieagency.com`,
    extractedFields: {
      invoiceNumber: 'WYL-RY-2026-0312', supplierName: 'The Wylie Agency LLC', supplierId: 'WYL-9043',
      invoiceDate: 'June 15, 2026', dueDate: 'July 15, 2026', paymentTerms: 'Net 30', currency: 'USD',
      subtotal: 32400, tax: 0, totalAmount: 32400,
      bankAccountStatus: 'Verified', duplicateCheck: 'No Duplicate Found',
      contractRef: 'PRH-CTR-2023-4471',
      glAccount: '4501-003', costCenter: 'CC-PRH-PUB-01', businessUnit: 'Penguin Random House',
      taxCode: 'US-EXP-ROYALTY', codingConfidence: 92,
      expenseDescription: 'Author royalty — Eleanor Vance, "The Long Horizon", hardback net receipts H1 2026 at 15.0% (contract rate 12.5%).',
      fieldConfidences: { invoiceNumber: 100, supplierName: 100, invoiceDate: 98, totalAmount: 100 },
    },
    agentSteps: ROYALTY_STEPS,
    auditTrail: [
      { id: 'n1', timestamp: '14:20:05', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected', result: 'Detected email from royalties@wylieagency.com', evidence: 'Attachment: WYL_RY_2026_0312.pdf' },
      { id: 'n2', timestamp: '14:20:09', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as royalty invoice', result: 'Contract reference PRH-CTR-2023-4471 detected. Routed to royalty validation path.', evidence: 'Confidence: 95.7%' },
      { id: 'n3', timestamp: '14:20:16', actorType: 'Agent', actorName: 'Invoice Extractor (Id)', action: 'Fields extracted', result: '12 fields extracted, mean confidence 95.1%' },
      { id: 'n4', timestamp: '14:20:24', actorType: 'Agent', actorName: 'Predictive IC & Royalty Agent', action: 'Royalty vs contract deviation detected', result: 'ERROR: Invoiced royalty rate 15.0% deviates from the abstracted contract rate 12.5% (PRH-CTR-2023-4471) on hardback net receipts. Variance $5,400.00.', evidence: 'GenAI contract comparison — deviation flagged for review' },
    ],
  },

  // ── PO Invoice — RTL / Fremantle production (Milestone cleared by GenAI) ───────
  {
    id: 'inv-14',
    invoiceNumber: 'STM-2026-0188',
    supplier: 'Stellify Media Ltd',
    supplierId: 'STM-7720',
    amount: 185000,
    currency: 'EUR',
    category: 'PO',
    straightforward: true,
    emailSubject: 'Invoice STM-2026-0188 – Episode 1 Final Cut Delivery (Fremantle Production)',
    emailPreview: 'Please find attached our invoice STM-2026-0188 for the Episode 1 final-cut milestone. PO 4500294500...',
    emailSender: 'Stellify Media Ltd',
    emailSenderEmail: 'accounts@stellifymedia.com',
    emailTime: '09:40',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'STM_2026_0188.pdf',
    status: 'awaiting-approval',
    recommendation: 'Straight-Through Processing Eligible — The milestone was described in the production contract rather than structured in SAP. GenAI milestone interpretation read the contract clause, confirmed the Episode 1 final-cut condition was met, and booked the Service Entry Sheet. 3-way match complete — routing to approval with no analyst intervention.',
    emailBody: `Dear Fremantle Accounts Payable Team,

Please find attached our invoice STM-2026-0188 for the delivery of the Episode 1 final cut on the series "Northern Lines", referencing Purchase Order 4500294500.

The milestone is defined in Schedule 2, Clause 4.3 of the production agreement ("payment due on delivery and acceptance of the Episode 1 final cut master").

Invoice Details:
  Invoice Number:  STM-2026-0188
  Invoice Date:    June 13, 2026
  PO Reference:    4500294500
  Milestone:       Episode 1 Final Cut (Schedule 2, Clause 4.3)
  Total Amount:    €185,000.00 EUR
  Payment Terms:   Net 45

Best regards,
Stellify Media Ltd
accounts@stellifymedia.com`,
    extractedFields: {
      invoiceNumber: 'STM-2026-0188', supplierName: 'Stellify Media Ltd', supplierId: 'STM-7720',
      poNumber: '4500294500', grNumber: 'SES-FRM-294500-001', sesNumber: 'SES-FRM-294500-001',
      contractRef: 'Schedule 2, Clause 4.3',
      invoiceDate: 'June 13, 2026', dueDate: 'July 28, 2026', paymentTerms: 'Net 45', currency: 'EUR',
      subtotal: 185000, tax: 0, totalAmount: 185000,
      bankAccountStatus: 'Verified', duplicateCheck: 'No Duplicate Found', matchStatus: '3-Way Match Passed',
      fieldConfidences: { invoiceNumber: 100, supplierName: 100, poNumber: 100, grNumber: 97, invoiceDate: 100, dueDate: 100, totalAmount: 100 },
    },
    agentSteps: FREMANTLE_STEPS,
    auditTrail: [
      { id: 'p1', timestamp: '09:40:05', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected', result: 'Detected email from accounts@stellifymedia.com', evidence: 'Attachment: STM_2026_0188.pdf' },
      { id: 'p2', timestamp: '09:40:09', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as PO invoice', result: 'PO reference 4500294500 detected', evidence: 'Confidence: 98.1%' },
      { id: 'p3', timestamp: '09:40:16', actorType: 'Agent', actorName: 'Invoice Extractor (Id)', action: 'Fields extracted', result: '15 fields extracted, mean confidence 96.2%' },
      { id: 'p4', timestamp: '09:40:23', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'PO located; no structured milestone SES', result: 'PO 4500294500 found (€185,000.00). No Service Entry Sheet pre-booked — milestone is contract-described.', evidence: 'Milestone: Schedule 2, Clause 4.3' },
      { id: 'p5', timestamp: '09:40:29', actorType: 'Agent', actorName: 'GenAI Milestone Interpreter', action: 'Interpreted milestone clause from contract', result: 'GenAI read Schedule 2, Clause 4.3 ("payment due on delivery and acceptance of the Episode 1 final cut master") and confirmed the milestone condition is met. Service Entry Sheet SES-FRM-294500-001 booked automatically.', evidence: 'Milestone condition: MET' },
      { id: 'p6', timestamp: '09:40:34', actorType: 'Agent', actorName: '3-Way Match Agent', action: '3-way match completed', result: 'Invoice €185,000.00 matched to PO and the GenAI-booked SES. Within tolerance.', evidence: 'Match: PASS' },
      { id: 'p7', timestamp: '09:40:38', actorType: 'Agent', actorName: 'Payment Validator (Pv)', action: 'Duplicate check passed', result: 'No duplicate found across 12-month invoice history' },
    ],
  },

  // ── Non-PO Invoice — PRH / DK academic print run (Paper Cost Surcharge Dispute) ─
  {
    id: 'inv-7',
    invoiceNumber: 'RRD-2026-660219',
    supplier: 'RR Donnelley',
    supplierId: 'RRD-8812',
    amount: 31600,
    currency: 'USD',
    category: 'Non-PO',
    failAtStep: 4,
    failType: 'gl-missing',
    failMessage: 'Invoice amount $31,600.00 USD cannot be coded — Framework Agreement PRH-RRD-PRINT-2024 authorises print services at $29,200.00 for this print specification. An unsanctioned Paper Cost Surcharge of $2,400.00 (8.2% — attributed to PPPC Q2 2026 index) has been applied by the vendor. Clause 8.2 (Material Cost Escalation) requires prior written approval from PRH Procurement before surcharges may be applied. AP must obtain vendor confirmation before GL coding can proceed.',
    emailSubject: 'Print & Bindery Invoice RRD-2026-660219 — DK Science Encyclopedia 5th Ed.',
    emailPreview: 'Invoice for print and binding — DK Complete Science Encyclopedia, 5th Edition. 3,200 copies. Framework Ref: PRH-RRD-PRINT-2024...',
    emailSender: 'RR Donnelley',
    emailSenderEmail: 'invoicing@rrd.com',
    emailTime: '08:20',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'RRD_660219.pdf',
    status: 'info-requested',
    emailBody: `Dear Penguin Random House Finance Team,

Please find attached invoice RRD-2026-660219 for the print and binding of DK Complete Science Encyclopedia, 5th Edition, under Framework Agreement PRH-RRD-PRINT-2024.

Invoice Details:
  Invoice Number:    RRD-2026-660219
  Invoice Date:      June 8, 2026
  Due Date:          July 8, 2026
  Framework Ref:     PRH-RRD-PRINT-2024
  Job Reference:     PRH-DK-PRINT-2026-412
  Print Run:         3,200 copies
  Total Amount:      $31,600.00 USD

Note: A paper cost surcharge of $2,400.00 has been applied in line with the Q2 2026 PPPC Paper Price Index increase of 8.2% (Clause 8.2 — Material Cost Escalation).

Please process at your earliest convenience.

Best regards,
RR Donnelley — Billing Operations
invoicing@rrd.com`,
    extractedFields: {
      invoiceNumber: 'RRD-2026-660219', supplierName: 'RR Donnelley', supplierId: 'RRD-8812',
      billNo: 'RRD-2026-660219',
      invoiceDate: 'June 8, 2026', dueDate: 'July 8, 2026', paymentTerms: 'Net 30', currency: 'USD',
      subtotal: 29200, tax: 2400, totalAmount: 31600,
      bankAccountStatus: 'Verified', duplicateCheck: 'No Duplicate Found',
      expenseDescription: 'Print and binding services — DK Complete Science Encyclopedia, 5th Edition, 3,200 copies. Framework Agreement PRH-RRD-PRINT-2024, Job Ref: PRH-DK-PRINT-2026-412.',
      fieldConfidences: { invoiceNumber: 100, supplierName: 100, invoiceDate: 98, totalAmount: 100 },
    },
    agentSteps: NON_PO_STEPS,
    auditTrail: [
      { id: 'g1', timestamp: '08:20:04', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected from AP mailbox', result: 'Detected email from invoicing@rrd.com', evidence: 'Attachment: RRD_660219.pdf' },
      { id: 'g2', timestamp: '08:20:07', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Classified as Non-PO invoice', result: 'No PO reference. Framework Agreement PRH-RRD-PRINT-2024 detected. Routed to GL coding path.', evidence: 'Confidence: 96.3%' },
      { id: 'g3', timestamp: '08:20:14', actorType: 'Agent', actorName: 'SAP DOX Digitization Agent', action: 'Invoice fields extracted', result: '14 fields extracted with mean confidence 97.2%' },
      { id: 'g4', timestamp: '08:20:19', actorType: 'Agent', actorName: 'Field Validation Agent', action: 'Mandatory fields validated', result: 'All 14 mandatory fields present', evidence: 'Validation: PASS' },
      { id: 'g5', timestamp: '08:20:23', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'Supplier master matched', result: 'Vendor RRD-8812 verified in SAP Business Partner master', evidence: 'Sanctions screening: CLEAR' },
      { id: 'g6', timestamp: '08:20:28', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'GL coding halted — invoice amount dispute', result: 'ERROR: Invoice total $31,600.00 exceeds framework ceiling $29,200.00. Unsanctioned paper cost surcharge of $2,400.00 detected. Clause 8.2 approval required.', evidence: 'Human intervention required.' },
    ],
  },

  // ── PO Invoice — Ingram Content Group book distribution (Straight-through) ────
  {
    id: 'inv-8',
    invoiceNumber: 'ING-2026-541097',
    supplier: 'Ingram Content Group',
    supplierId: 'ING-6634',
    amount: 15200,
    currency: 'USD',
    category: 'PO',
    straightforward: true,
    emailSubject: 'Distribution Services Invoice – ING-2026-541097',
    emailPreview: 'Invoice for book distribution and fulfilment services (May 16 – Jun 15, 2026). PO: PO-PRH-2026-05891...',
    emailSender: 'Ingram Content Group',
    emailSenderEmail: 'accounts@ingramcontent.com',
    emailTime: '14:15',
    receivedAt: 'Jun 18, 2026',
    attachmentName: 'ING_541097.pdf',
    status: 'awaiting-approval',
    recommendation: 'Straight-Through Processing Eligible — All validations passed and the PO 3-way match against the Goods Receipt is complete. Invoice is eligible for straight-through processing. Routing to approval step.',
    emailBody: `Dear Penguin Random House Accounts Payable Team,

Please find attached invoice ING-2026-541097 for distribution and fulfilment services provided under Blanket Purchase Order PO-PRH-BLKT-2026-00891 (Distribution Agreement PRH-ING-DA-2024-001) for the period May 16 – June 15, 2026.

The Service Entry Sheet SES-PRH-2026-03122 confirming services rendered has been booked in your system.

Invoice Details:
  Invoice Number:   ING-2026-541097
  Invoice Date:     June 14, 2026
  Due Date:         July 14, 2026
  Blanket PO Ref:   PO-PRH-BLKT-2026-00891
  SES Reference:    SES-PRH-2026-03122
  Total Amount:     $15,200.00 USD

Please remit payment via ACH to our Wells Fargo account on file.

Best regards,
Ingram Content Group — Accounts Receivable
accounts@ingramcontent.com`,
    extractedFields: {
      invoiceNumber: 'ING-2026-541097', supplierName: 'Ingram Content Group', supplierId: 'ING-6634',
      poNumber: 'PO-PRH-BLKT-2026-00891', sesNumber: 'SES-PRH-2026-03122',
      invoiceDate: 'June 14, 2026', dueDate: 'July 14, 2026', paymentTerms: 'Net 30', currency: 'USD',
      subtotal: 14000, tax: 1200, totalAmount: 15200,
      bankAccountStatus: 'Verified', duplicateCheck: 'No Duplicate Found', matchStatus: '3-Way Match Passed',
      fieldConfidences: { invoiceNumber: 100, supplierName: 99, poNumber: 100, sesNumber: 97, invoiceDate: 100, dueDate: 100, totalAmount: 100 },
    },
    agentSteps: PO_STEPS,
    auditTrail: [
      { id: 'h1', timestamp: '14:15:08', actorType: 'Agent', actorName: 'VIM Mailbox Adapter', action: 'Email detected from AP mailbox', result: 'Detected email from accounts@ingramcontent.com', evidence: 'Attachment: ING_541097.pdf' },
      { id: 'h2', timestamp: '14:15:11', actorType: 'Agent', actorName: 'Invoice Classification (Ic)', action: 'Attachment classified as invoice', result: 'Document type confirmed as PO Purchase Invoice (Blanket PO drawdown)', evidence: 'Confidence: 98.6%' },
      { id: 'h3', timestamp: '14:15:18', actorType: 'Agent', actorName: 'SAP DOX Digitization Agent', action: 'Invoice fields extracted', result: '16 fields extracted with mean confidence 98.1%' },
      { id: 'h4', timestamp: '14:15:22', actorType: 'Agent', actorName: 'Field Validation Agent', action: 'Mandatory fields validated', result: 'All 16 mandatory fields present', evidence: 'Validation: PASS' },
      { id: 'h5', timestamp: '14:15:26', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'Supplier master matched', result: 'Vendor ING-6634 verified in SAP Business Partner master', evidence: 'Sanctions screening: CLEAR' },
      { id: 'h6', timestamp: '14:15:30', actorType: 'Agent', actorName: 'Matching & GL Advisor (Ma)', action: 'Blanket PO and Service Entry Sheet matched', result: 'Blanket PO PO-PRH-BLKT-2026-00891 located. SES-PRH-2026-03122 confirmed (monthly drawdown — $15,200.00 of $185,000.00 annual commitment)', evidence: 'PO status: Open — remaining balance $112,400.00' },
      { id: 'h7', timestamp: '14:15:34', actorType: 'Agent', actorName: '3-Way Match Agent', action: '3-way match completed', result: 'Invoice $15,200.00 matches SES-PRH-2026-03122 service confirmation. Within tolerance of contracted rate card (Distribution Agreement PRH-ING-DA-2024-001)', evidence: 'Match: PASS' },
      { id: 'h8', timestamp: '14:15:37', actorType: 'Agent', actorName: 'Payment Validator (Pv)', action: 'Duplicate check passed', result: 'No duplicate found across 12-month invoice history' },
    ],
  },
]

// Missing GR reply email — Sophie Brandt confirms SES booked (appears after notification sent)
export const missingGRReplyEmail: ReplyEmail = {
  id: 'reply-missing-gr',
  senderName: 'SAP VIM — Automated Notification',
  senderEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-8823 Completed — SES Posted by Sophie Brandt',
  time: 'just now',
  relatedInvoiceId: 'inv-2',
  isUnread: true,
  body: `VIM Work Item WI-2026-8823 has been completed.

Completion Details:
  Work Item ID:   WI-2026-8823
  Completed By:   Sophie Brandt — Production Manager, Fremantle Germany
  Action Taken:   Service Entry Sheet posted in SAP S/4HANA

SES Auto-Captured from SAP:
  SES Number:     SES-2026-88412
  PO Reference:   4500288120
  Milestone:      Episode 6 — Picture Lock
  SES Amount:     €312,000.00 EUR
  Booked in SAP:  ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
  Company Code:   BERT | Plant: DE01

3-way match (PO · SES · Invoice) is now complete. Invoice SPP-2026-0461 has been released for payment processing.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
}

// Tax/VAT mismatch reply emails (appear in inbox after rejection notification is sent)
export const taxMismatchReplyEmails: ReplyEmail[] = [
  {
    id: 'reply-1',
    senderName: 'Lehmanns Media GmbH',
    senderEmail: 'rechnung@lehmanns.de',
    subject: 'Re: Invoice Rejected — VAT Rate Error — Please Resubmit — LM-2026-04781',
    time: 'just now',
    relatedInvoiceId: 'inv-5',
    isUnread: true,
    attachmentName: 'LM_2026_04781-R1.pdf',
    attachmentInvoiceId: 'inv-5-r1',
    body: `Dear Lena Fischer,

Thank you for bringing this to our attention. We apologise for the error on invoice LM-2026-04781.

You are correct — we applied the standard VAT rate of 19% (DE-VAT-STD) instead of the reduced 7% rate (DE-VAT-RED) that applies to printed books under German VAT law.

We have raised a corrected invoice with the following updated details:

  Corrected Invoice Number: LM-2026-04781-R1
  Net Amount:               €50,000.00
  Corrected VAT (7%):       €3,500.00
  Corrected Total:          €53,500.00

The corrected invoice (XRechnung-compliant) is attached. Please use LM-2026-04781-R1 as the payment reference.

We apologise for any inconvenience caused.

Best regards,
Lehmanns Media GmbH
Debitorenbuchhaltung
rechnung@lehmanns.de`,
  },
  {
    id: 'reply-2',
    senderName: 'Anja Krüger',
    senderEmail: 'a.krueger@bertelsmann.de',
    subject: 'Re: Invoice Rejected — VAT Rate Error — LM-2026-04781 — AP Acknowledged',
    time: 'just now',
    relatedInvoiceId: 'inv-5',
    isUnread: true,
    body: `Hi Lena,

Acknowledged — I've reviewed the rejection notice sent to Lehmanns Media for LM-2026-04781.

The correct tax code is DE-VAT-RED (reduced book rate 7%), giving a corrected VAT of €3,500.00 (not €9,500.00) and a revised invoice total of €53,500.00.

Once the supplier resubmits the corrected (XRechnung) invoice, please route it back through the AP validation pipeline. I'll approve it promptly.

Best,
Anja Krüger
AP Lead — Bertelsmann Finance Operations
a.krueger@bertelsmann.de`,
  },
]

// ── Sent emails (AP outbound) ─────────────────────────────────────────────────

// Tax mismatch — AP rejects Lehmanns invoice, asks for resubmission with correct VAT
export const taxMismatchSentEmail: SentEmail = {
  id: 'sent-tax-mismatch',
  toName: 'Lehmanns Media GmbH',
  toEmail: 'rechnung@lehmanns.de',
  subject: 'Invoice Rejected — VAT Rate Error — Please Resubmit — LM-2026-04781',
  time: 'just now',
  relatedInvoiceId: 'inv-5',
  body: `CC: Anja Krüger <a.krueger@bertelsmann.de>

Dear Lehmanns Media,

We are returning invoice LM-2026-04781 (invoiced total €59,500.00) as it contains a VAT rate error that must be corrected before payment can proceed.

Invoice Details:
  Invoice Number:  LM-2026-04781
  Supplier:        Lehmanns Media GmbH
  PO Reference:    4500301992
  Net Amount:      €50,000.00

Error Identified:
  VAT Code Applied:   DE-VAT-STD (19%)
  VAT Amount Billed:  €9,500.00
  Invoice Total:      €59,500.00

Correct Treatment:
  VAT Code Required:  DE-VAT-RED (7% reduced rate)
  Reason:             Printed books are subject to the reduced rate under §12 Abs. 2 Nr. 14 UStG
  Correct VAT:        €3,500.00
  Correct Total:      €53,500.00

Action Required:
Please resubmit a corrected XRechnung-compliant invoice (reference LM-2026-04781-R1) applying the 7% reduced rate. The original invoice has been rejected in SAP and cannot be reprocessed. Please quote PO reference 4500301992 on the corrected invoice.

Kind regards,
Lena Fischer
Accounts Payable — Bertelsmann Finance Operations
accounts.payable@bertelsmann.de`,
}

// Missing GR — AP requests SES confirmation from Fremantle PO owner
export const missingGRSentEmail: SentEmail = {
  id: 'sent-missing-gr',
  toName: 'SAP VIM — Fremantle Germany Worklist',
  toEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-8823 Dispatched — SES Confirmation — SPP-2026-0461',
  time: 'just now',
  relatedInvoiceId: 'inv-2',
  body: `VIM Work Item WI-2026-8823 has been routed to Sophie Brandt's SAP VIM worklist.

Work Item Details:
  Work Item ID:   WI-2026-8823
  Task Type:      Service Entry Sheet Confirmation
  Priority:       HIGH
  Assigned To:    Sophie Brandt — Production Manager, Fremantle Germany
  Invoice:        SPP-2026-0461 — Sunset Post Production Ltd
  Invoice Amount: €312,000.00 EUR
  PO Number:      4500288120
  Milestone:      Episode 6 — Picture Lock
  Issue:          No SES found in SAP for this milestone

Sophie Brandt will receive this work item in her SAP VIM inbox. When she books the SES in SAP S/4HANA, the 3-way match (PO · SES · Invoice) will complete and the invoice will be released for payment automatically.

AP Automation Engine — SAP OpenText VIM
Bertelsmann Finance Operations`,
}

// RRD paper cost surcharge — AP queries PRH Procurement on whether surcharge was pre-approved
export const rrdDisputeSentEmail: SentEmail = {
  id: 'sent-rrd-dispute',
  toName: 'SAP VIM — PRH Procurement Worklist',
  toEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-2281 Dispatched — Surcharge Pre-Approval Check — RRD-2026-660219',
  time: 'just now',
  relatedInvoiceId: 'inv-7',
  body: `VIM Work Item WI-2026-2281 has been routed to Julia Hartmann's SAP VIM worklist.

Work Item Details:
  Work Item ID:   WI-2026-2281
  Task Type:      Surcharge Pre-Approval Check
  Priority:       MEDIUM
  Assigned To:    Julia Hartmann — Procurement Manager, Penguin Random House
  Invoice:        RRD-2026-660219 — RR Donnelley
  Invoice Amount: $31,600.00 USD (incl. $2,400.00 Clause 8.2 surcharge)
  Framework:      PRH-RRD-PRINT-2024

Julia Hartmann will receive this work item in her SAP VIM inbox. She must confirm whether PRH Procurement issued advance written notice authorising the Q2 2026 PPPC-linked surcharge under Clause 8.2.

AP Automation Engine — SAP OpenText VIM
Penguin Random House / Bertelsmann Finance Operations`,
}

export const rrdDisputeReplyEmail: ReplyEmail = {
  id: 'reply-rrd-dispute',
  senderName: 'SAP VIM — Automated Notification',
  senderEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-2281 Completed — Surcharge Approved by Julia Hartmann (PRH Procurement)',
  time: 'just now',
  relatedInvoiceId: 'inv-7',
  isUnread: true,
  body: `VIM Work Item WI-2026-2281 has been completed.

Completion Details:
  Work Item ID:   WI-2026-2281
  Completed By:   Julia Hartmann — Procurement Manager, Penguin Random House
  Decision:       APPROVED — Clause 8.2 surcharge is contractually authorised

Confirmation Captured in VIM:
  — RRD Q2 2026 Framework Bulletin: RRD-BULK-2026-Q2-PRH (received 15 Mar 2026)
  — PPPC Paper Price Index Q2 2026: +8.2% (PPPC Weekly, 2 Apr 2026)
  — Clause 8.2 advance notice: received and acknowledged by PRH Procurement on 17 Mar 2026
  — Decision: Process invoice RRD-2026-660219 at full amount of $31,600.00 USD

Invoice RRD-2026-660219 has been cleared for GL coding and payment posting.

SAP VIM — Automated Workflow Notification
Penguin Random House / Bertelsmann Finance Operations`,
}

// Standard GL approval — AP requests GL code confirmation for JVM invoice
export const glApprovalSentEmail: SentEmail = {
  id: 'sent-gl-approval-jvm',
  toName: 'SAP VIM — BMS Marketing Worklist',
  toEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-7714 Dispatched — GL Code Confirmation — JVM-2026-0623',
  time: 'just now',
  relatedInvoiceId: 'inv-6',
  body: `VIM Work Item WI-2026-7714 has been routed to Caroline Hoffmann's SAP VIM worklist.

Work Item Details:
  Work Item ID:   WI-2026-7714
  Task Type:      GL Code Confirmation
  Priority:       MEDIUM
  Assigned To:    Caroline Hoffmann — Marketing Director, Bertelsmann Marketing Services
  Invoice:        JVM-2026-0623 — Jung von Matt AG
  Invoice Amount: €21,896.00 EUR
  Cost Centre:    CC-BMS-MKT-2026
  Payment Terms:  Net 15 (due 1 Jul 2026)

AI GL Coding Ambiguity (confirmation required):
  6610-002 — Marketing & Advertising    38% ← top recommendation
  6620-001 — Creative Agency Fees       34%
  6630-005 — Brand & Campaign Services  28%
  None exceeded the 60% auto-assign threshold.

Caroline Hoffmann will receive this work item in her SAP VIM inbox. She must confirm the correct GL account and service receipt before the invoice can be released for payment.

AP Automation Engine — SAP OpenText VIM
Bertelsmann Finance Operations`,
}

// IC Mismatch — AP notifies Pieter Janssen (IC Accounting) to trigger ICE reconciliation
export const icMismatchSentEmail: SentEmail = {
  id: 'sent-ic-mismatch',
  toName: 'SAP VIM — Bertelsmann Finance Worklist',
  toEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-6647 Dispatched — IC Reconciliation — IC-INV-FRM-88421 / €15,500 Variance',
  time: 'just now',
  relatedInvoiceId: 'inv-12',
  body: `VIM Work Item WI-2026-6647 has been routed to Pieter Janssen's SAP VIM worklist.

Work Item Details:
  Work Item ID:   WI-2026-6647
  Task Type:      Intercompany Reconciliation
  Priority:       HIGH
  Assigned To:    Pieter Janssen — Intercompany Accounting, Bertelsmann Finance
  Also Notified:  Anja Krüger — AP Lead, Bertelsmann Finance Operations

IC Posting Details:
  IC Invoice (Fremantle Ltd UK):   IC-INV-FRM-88421   €214,000.00
  IC Clearing (RTL Deutschland):   IC-CLR-RTL-77120   €198,500.00
  Variance:                        €15,500.00
  ICE Reference:                   ICE-REC-2026-0619

Pieter Janssen will receive this work item in his SAP VIM inbox. He must reconcile both sides of the posting in ICE and complete the work item to release the invoice for payment.

AP Automation Engine — SAP OpenText VIM
Bertelsmann Finance Operations`,
}

export const icMismatchReplyEmail: ReplyEmail = {
  id: 'reply-ic-mismatch',
  senderName: 'SAP VIM — Automated Notification',
  senderEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-6647 Completed — ICE Reconciled by Pieter Janssen',
  time: 'just now',
  relatedInvoiceId: 'inv-12',
  isUnread: true,
  body: `VIM Work Item WI-2026-6647 has been completed.

Completion Details:
  Work Item ID:   WI-2026-6647
  Completed By:   Pieter Janssen — Intercompany Accounting, Bertelsmann Finance
  Action Taken:   ICE reconciliation completed and both entities balanced

Reconciliation Summary (auto-captured from ICE):
  IC Invoice (Fremantle UK):     IC-INV-FRM-88421   €214,000.00   ✓ Confirmed
  IC Clearing (RTL Deutschland): IC-CLR-RTL-77120   €198,500.00   ✓ Updated
  Format rights recharge posted: IC-ADJ-RTL-2026-09 €15,500.00    ✓ New entry
  Net Position:                  €214,000.00   BALANCED ✓
  ICE Reference:                 ICE-REC-2026-0619   Status: CLEARED

Invoice IC-INV-FRM-88421 has been cleared for payment posting.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
}

// PRT WBS coding — VIM work item dispatched to Fremantle Germany Worklist
export const prtGLSentEmail: SentEmail = {
  id: 'sent-prt-gl-approval',
  toName: 'SAP VIM — Fremantle Germany Worklist',
  toEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-5390 Dispatched — WBS Coding DOA Approval — PXM-2026-FRM-1142',
  time: 'just now',
  relatedInvoiceId: 'inv-11',
  body: `Also Notified: Marc Olivier-Leblanc <m.olivier-leblanc@rtlgroup.de> (VP Finance Content, RTL Group)

SAP VIM Work Item Dispatched — WI-2026-5390
Task Type:    WBS Coding — DOA Approval
Priority:     High
Assigned To:  Claudia Bauer — Production Finance Manager, Fremantle Germany
Due By:       24 hours

Invoice Details:
  Invoice Number:  PXM-2026-FRM-1142
  Supplier:        Pixomondo GmbH (PXM-0571)
  Invoice Date:    September 8, 2026
  Due Date:        October 8, 2026
  Amount:          €175,000.00 EUR
  Production:      "Rising Tides" — RTL+ Original Drama, S01, Episodes 7–10
  Contract Ref:    C-FRM-PXM-2026 (Milestone 3 — Post-Production Delivery)

Issue — Co-Production WBS Split Required:
  The Matching & GL Advisor has identified that Episodes 7–8 are 100% Fremantle-funded
  and Episodes 9–10 fall under the Canal+ International co-production agreement
  (Co-Prod Ref: CPRO-2026-RT-003). Both WBS elements have been generated but
  the cost split (%) cannot be confirmed without the signed Production Cost Allocation Schedule.

Proposed WBS Coding:
  WBS Element:     FRM.PROD.2026.RT-S01.VFX   (EP7–8, Fremantle — est. 50%)
  WBS Element:     FRM.COPRO.2026.RT-S01.VFX  (EP9–10, Co-production — est. 50%)
  Account No.:     6320-001  Content Production — VFX & Digital Post-Production
  Cost Centre:     CC-FRM-PROD-2026
  Production No.:  P-RT01-26
  Episode Range:   E07-10
  Coding String:   FRM.PROD.2026.RT-S01.VFX.P-RT01-26.E07-10.C-PXM2026

Per DOA policy for co-produced content, dual approval is required:
  1. Production Finance Manager (Claudia Bauer) — confirms episode cost split
  2. VP Finance Content, RTL Group (Marc Olivier-Leblanc) — authorises co-production allocation

Please complete this work item in your SAP VIM worklist to confirm the per-episode cost split and approve the coding string. Both approvals are required before the invoice can be released for payment.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
}

// Metro GL (internal) approval — VIM work item dispatched to Arvato Connect Worklist
export const metroGLSentEmail: SentEmail = {
  id: 'sent-metro-gl-approval',
  toName: 'SAP VIM — Arvato Connect Worklist',
  toEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-4561 Dispatched — GL Code Approval — DLT-2026-7741',
  time: 'just now',
  relatedInvoiceId: 'inv-4',
  body: `Also Notified: Anja Krüger <a.krueger@bertelsmann.de> (AP Lead, Bertelsmann Finance Operations)

SAP VIM Work Item Dispatched — WI-2026-4561
Task Type:    GL Code Approval
Priority:     Medium
Assigned To:  Markus Weber — Cost Centre Owner, Arvato Connect
Due By:       48 hours

Invoice Details:
  Invoice Number:  DLT-2026-7741
  Supplier:        Deloitte Consulting GmbH (DLT-4451)
  Invoice Date:    June 10, 2026
  Due Date:        June 25, 2026
  Net Amount:      €36,000.00
  VAT (19%):       €6,840.00
  Total:           €42,840.00
  Service Period:  May 1–31, 2026
  Description:     Operating-model design workshops, process diagnostics, and implementation roadmap (Arvato Connect engagement)

GL Account Options (AI confidence scores):
  6720-001 — Management Consulting      ambiguous
  6300-007 — Professional Services      ambiguous
  6810-002 — Project / Transformation   ambiguous

As cost centre owner for Arvato Connect, please complete this work item in your SAP VIM worklist to confirm the correct GL account for this engagement. Anja Krüger (AP Lead) has been notified and will provide authorisation once you complete your review.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
}

// Royalty mismatch reply — VIM completion notification: Claire Newton confirmed rate
export const royaltyMismatchReplyEmail: ReplyEmail = {
  id: 'reply-royalty-mismatch',
  senderName: 'SAP VIM — Automated Notification',
  senderEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-3312 Completed — Royalty Rate Confirmed by Claire Newton',
  time: 'just now',
  relatedInvoiceId: 'inv-13',
  isUnread: true,
  body: `SAP VIM Work Item Completed — WI-2026-3312
Task Type:    Royalty Rate Review
Completed By: Claire Newton — Royalties Manager, Penguin Random House LLC
Completed At: 2026-07-03 14:22 UTC

Determination captured from SAP VIM worklist:
  Contract Rate:     12.5% (correct)
  Invoiced Rate:     15.0% (overstated by 2.5%)
  Corrected Amount:  $27,000.00 USD
  Overpayment Risk:  $5,400.00 USD
  Basis:             Hardback net receipts H1 2026
  Contract Ref:      PRH-CTR-2023-4471

Claire Newton confirmed: The Wylie Agency has accepted the corrected amount of $27,000.00 USD. Invoice WYL-RY-2026-0312 may proceed to payment at the contract rate of 12.5%.

Next Step: Invoice cleared for payment posting at corrected amount.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
}

// Sent — VIM work item dispatched to PRH Royalties Worklist for royalty rate review
export const royaltyDeviationSentEmail: SentEmail = {
  id: 'sent-royalty-deviation',
  toName: 'SAP VIM — PRH Royalties Worklist',
  toEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-3312 Dispatched — Royalty Rate Review — WYL-RY-2026-0312',
  time: 'just now',
  relatedInvoiceId: 'inv-13',
  body: `SAP VIM Work Item Dispatched — WI-2026-3312
Task Type:    Royalty Rate Review
Priority:     Medium
Assigned To:  Claire Newton — Royalties Manager, Penguin Random House LLC
Due By:       48 hours

Invoice Details:
  Invoice Number:   WYL-RY-2026-0312
  Author:           Eleanor Vance
  Title:            The Long Horizon
  Contract Ref:     PRH-CTR-2023-4471
  Invoice Date:     15 June 2026

Rate Deviation Detected:
  Invoiced Rate:    15.0% on hardback net receipts
  Contract Rate:    12.5% on hardback net receipts (per SAP contract master)
  Amount at 15.0%:  $32,400.00
  Amount at 12.5%:  $27,000.00
  Variance:         $5,400.00 USD

The Royalty Rate Review Agent has cross-referenced invoice WYL-RY-2026-0312 against contract terms (PRH-CTR-2023-4471) and identified a rate deviation of $5,400.00. Please complete this work item in your SAP VIM worklist to confirm the correct rate and authorise payment at the appropriate amount.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
}

// Corrected invoice submitted by supplier after rejection
export const correctedTaxInvoice: Invoice = {
  id: 'inv-5-r1',
  invoiceNumber: 'LM-2026-04781-R1',
  supplier: 'Lehmanns Media GmbH',
  supplierId: 'LM-2241',
  amount: 53500,
  currency: 'EUR',
  category: 'PO',
  emailSubject: 'Corrected Invoice – LM-2026-04781-R1',
  emailPreview: 'Corrected invoice for printed educational books with updated VAT code (DE-VAT-RED 7%)',
  emailSender: 'Lehmanns Media GmbH',
  emailSenderEmail: 'rechnung@lehmanns.de',
  emailTime: 'just now',
  receivedAt: 'Jun 18, 2026',
  attachmentName: 'LM_2026_04781-R1.pdf',
  status: 'processing',
  extractedFields: {
    invoiceNumber: 'LM-2026-04781-R1',
    supplierName: 'Lehmanns Media GmbH',
    supplierId: 'LM-2241',
    poNumber: '4500301992',
    grNumber: 'SES-EDU-301992-001',
    invoiceDate: 'April 15, 2026',
    dueDate: 'May 15, 2026',
    paymentTerms: 'Net 30',
    currency: 'EUR',
    subtotal: 50000,
    tax: 3500,
    totalAmount: 53500,
    bankAccountStatus: 'Verified',
    duplicateCheck: 'No Duplicate Found',
    taxCode: 'DE-VAT-RED',
    matchStatus: '3-Way Match Passed',
    lineItems: [
      { description: 'Hardcover Textbook "Medizinische Grundlagen"', qty: 1000, unitPrice: 35 },
      { description: 'Paperback Study Guides', qty: 1500, unitPrice: 8 },
      { description: 'Reference Atlas (Hardcover)', qty: 200, unitPrice: 15 },
    ],
    fieldConfidences: { invoiceNumber: 100, supplierName: 100, poNumber: 100, grNumber: 100, invoiceDate: 99, totalAmount: 100 },
  },
  agentSteps: PO_STEPS,
  auditTrail: [],
}

export const glApprovalReplyEmail: ReplyEmail = {
  id: 'reply-gl-approval',
  senderName: 'SAP VIM — Automated Notification',
  senderEmail: 'vim-no-reply@sap.bertelsmann.de',
  subject: 'VIM WI-2026-7714 Completed — GL Code Confirmed by Caroline Hoffmann',
  time: 'just now',
  relatedInvoiceId: 'inv-6',
  isUnread: true,
  body: `SAP VIM Work Item Completed — WI-2026-7714
Task Type:    GL Code Confirmation
Completed By: Caroline Hoffmann — Marketing Director, Bertelsmann Marketing Services
Completed At: 2026-07-03 11:47 UTC

GL confirmation captured from SAP VIM worklist:
  GL Account:     6610-002  Marketing & Advertising
  Cost Centre:    CC-BMS-MKT-2026
  Business Unit:  Bertelsmann Marketing Services — Territory
  Tax Code:       DE-VAT-STD  (standard rate 19% — domestic German B2B service)

Delivery confirmed: all three deliverables received and accepted:
  — Creative Concept Development & Strategy: signed off June 12, 2026
  — Key Visual Design (3 formats, 2 revisions): final assets received June 14, 2026
  — Asset Production & Format Adaptation: approved and live as of June 16, 2026

Invoice amount of €21,896.00 (net €18,400.00 + VAT €3,496.00) confirmed correct. Invoice JVM-2026-0623 cleared for payment posting.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
}

export const metroGLReplyEmails: ReplyEmail[] = [
  {
    id: 'reply-metro-gl-1',
    senderName: 'SAP VIM — Automated Notification',
    senderEmail: 'vim-no-reply@sap.bertelsmann.de',
    subject: 'VIM WI-2026-4561 Part-Completed — GL Approved by Markus Weber',
    time: 'just now',
    relatedInvoiceId: 'inv-4',
    isUnread: true,
    body: `SAP VIM Work Item Part-Completed — WI-2026-4561
Task Type:    GL Code Approval
Actioned By:  Markus Weber — Cost Centre Owner, Arvato Connect
Actioned At:  2026-07-03 10:14 UTC

GL determination captured from SAP VIM worklist:
  GL Account:  6720-001 — Management Consulting (confirmed correct)

Markus Weber's note: This Arvato Connect engagement is advisory/consulting spend and should be coded to Management Consulting. Proceed with GL 6720-001.

Next Step: Awaiting AP Lead authorisation (Anja Krüger) to complete the work item.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
  },
  {
    id: 'reply-metro-gl-2',
    senderName: 'SAP VIM — Automated Notification',
    senderEmail: 'vim-no-reply@sap.bertelsmann.de',
    subject: 'VIM WI-2026-4561 Completed — AP Lead Authorisation by Anja Krüger',
    time: 'just now',
    relatedInvoiceId: 'inv-4',
    isUnread: true,
    body: `SAP VIM Work Item Completed — WI-2026-4561
Task Type:    GL Code Approval
Completed By: Anja Krüger — AP Lead, Bertelsmann Finance Operations
Completed At: 2026-07-03 10:31 UTC

AP Lead authorisation captured from SAP VIM worklist:
  GL Account:  6720-001 — Management Consulting (authorised)
  Invoice:     DLT-2026-7741 — Deloitte Consulting GmbH (€42,840.00)

GL code approved. Invoice DLT-2026-7741 cleared for payment processing.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
  },
]

export const prtGLReplyEmails: ReplyEmail[] = [
  {
    id: 'reply-prt-gl-1',
    senderName: 'SAP VIM — Automated Notification',
    senderEmail: 'vim-no-reply@sap.bertelsmann.de',
    subject: 'VIM WI-2026-5390 Part-Completed — WBS Coding Approved by Claudia Bauer',
    time: 'just now',
    relatedInvoiceId: 'inv-11',
    isUnread: true,
    body: `SAP VIM Work Item Part-Completed — WI-2026-5390
Task Type:    WBS Coding — DOA Approval
Actioned By:  Claudia Bauer — Production Finance Manager, Fremantle Germany
Actioned At:  2026-07-03 09:55 UTC

WBS approval captured from SAP VIM worklist:
  Episodes 7–8 (Fremantle-funded):      €87,500  →  FRM.PROD.2026.RT-S01.VFX
  Episodes 9–10 (Canal+ co-production):  €87,500  →  FRM.COPRO.2026.RT-S01.VFX
                                                      (50% to be cross-charged to Canal+ International under CPRO-2026-RT-003)

Full coding string confirmed:
  FRM.PROD.2026.RT-S01.VFX.P-RT01-26.E07-10.C-PXM2026

VFX deliverables for all four episodes signed off by the production team. Pixomondo met all contractual specifications per Milestone 3.

Claudia Bauer approved as Production Finance Manager.

Next Step: Awaiting VP Finance Content approval (Marc Olivier-Leblanc, RTL Group) to complete DOA.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
  },
  {
    id: 'reply-prt-gl-2',
    senderName: 'SAP VIM — Automated Notification',
    senderEmail: 'vim-no-reply@sap.bertelsmann.de',
    subject: 'VIM WI-2026-5390 Completed — DOA Approval by Marc Olivier-Leblanc',
    time: 'just now',
    relatedInvoiceId: 'inv-11',
    isUnread: true,
    body: `SAP VIM Work Item Completed — WI-2026-5390
Task Type:    WBS Coding — DOA Approval
Completed By: Marc Olivier-Leblanc — VP Finance Content, RTL Group
Completed At: 2026-07-03 10:08 UTC

DOA approval captured from SAP VIM worklist:
  Coding String:  FRM.PROD.2026.RT-S01.VFX.P-RT01-26.E07-10.C-PXM2026
  WBS Elements:   FRM.PROD.2026.RT-S01.VFX / FRM.COPRO.2026.RT-S01.VFX
  Cost Centre:    CC-FRM-PROD-2026
  Account:        6320-001  Content Production — VFX & Digital Post-Production

Canal+ International cross-charge for Episodes 9–10 (€43,750.00 — 50% co-produced episode costs) will be initiated through the IC billing run at month-end (CPRO-2026-RT-003).

All DOA approvals complete. Invoice PXM-2026-FRM-1142 (€175,000.00) cleared for payment posting.

SAP VIM — Automated Workflow Notification
Bertelsmann Finance Operations`,
  },
]

// ── Kobalt re-scan request — AP asks for native PDF (low OCR confidence) ──────
export const kobaltRescanSentEmail: SentEmail = {
  id: 'sent-kobalt-rescan',
  toName: 'Kobalt Music Group — Royalties',
  toEmail: 'royalties@kobaltmusic.com',
  subject: 'Re: Royalty Statement KOB-RY-2026-0831 — Document Quality Issue — High-Resolution PDF Required',
  time: 'just now',
  relatedInvoiceId: 'inv-9',
  body: `Dear Kobalt Royalties Team,

We have received your royalty statement KOB-RY-2026-0831 (€48,250.00 EUR, Q1 2026, Admin Agreement 10008). Thank you for the submission.

Our automated digitisation system (SAP DOX) has processed the attached document; however, the attachment appears to be a scanned photocopy rather than a native PDF export. As a result, several fields were extracted at moderate OCR confidence (average 84%), which falls below our 90% auto-approval threshold and has placed the invoice on manual review hold.

To enable straight-through processing and avoid payment delays, could you please resend statement KOB-RY-2026-0831 as a native PDF exported directly from your royalty administration platform? If the original is available only in paper form, a minimum 300 dpi scan with no skew or shadow artefacts would also be acceptable.

Statement details for reference:
  Statement No:  KOB-RY-2026-0831
  Amount:        €48,250.00 EUR
  Period:        Q1 2026
  Contract Ref:  Admin Agreement 10008, Exhibit B
  Due Date:      28 Dec 2026

We will reprocess the document immediately on receipt and expect to clear the payment well within terms.

Regards,
Lena Fischer
BMG / Bertelsmann — AP Operations
ap-operations@bertelsmann.de`,
}

export const kobaltRescanReplyEmail: ReplyEmail = {
  id: 'reply-kobalt-rescan',
  senderName: 'Kobalt Music Group',
  senderEmail: 'royalties@kobaltmusic.com',
  subject: 'Re: Royalty Statement KOB-RY-2026-0831 — Native PDF Attached',
  time: 'just now',
  relatedInvoiceId: 'inv-9',
  isUnread: true,
  attachmentName: 'KOB-RY-2026-0831-native.pdf',
  attachmentInvoiceId: 'inv-9',
  body: `Dear Lena,

Apologies for the inconvenience — our distribution system inadvertently attached a scanned copy rather than the native PDF export for this statement.

We have re-exported KOB-RY-2026-0831 directly from our royalty administration platform and attached the native PDF to this email. The figures are unchanged:

  Statement No:   KOB-RY-2026-0831
  Period:         Q1 2026
  Total Amount:   €48,250.00 EUR
  Contract Ref:   Admin Agreement 10008, Exhibit B
  Due Date:       28 Dec 2026

The native PDF should extract cleanly at full confidence. Please let us know if there is anything further required on our end.

Kind regards,
Kobalt Music Group — Royalty Administration
royalties@kobaltmusic.com`,
}
