import { useEffect, useRef, useState } from 'react'
import { Invoice, LineItem } from '../types'
import { AuditModal } from './AuditModal'
import { ScannedInvoice } from './ScannedInvoice'
import { correctedTaxInvoice } from '../data/mockData'

interface Props {
  invoice: Invoice
  onBack: () => void
  onTaxMismatchSent?: () => void
  taxMismatchAutoResolved?: boolean
  onMissingGRSent?: () => void
  missingGRAutoResolved?: boolean
  onGLApprovalSent?: () => void
  glApprovalReceived?: boolean
  onProcessingComplete?: (invoiceId: string) => void
  metroGLApprovalSent?: boolean
  onMetroGLApprovalSend?: () => void
  metroApproved?: boolean
  onMetroApprove?: () => void
  metroInvoiceApprovedIds?: Set<string>
  glEmailsViewed?: boolean
  onRoyaltySent?: () => void
  royaltyMismatchAutoResolved?: boolean
}

const STEP_DURATION_MS = 4000
const TICK_MS = 60

// Persists GL code state across remounts — only for gl-missing invoices
const glCodeCache = new Map<string, { appliedCode: string | null; glApprovalEmailSent: boolean; glApprovalEmailReceived: boolean; invoiceApproved: boolean; manualGLCode: string; prtCodingConfirmed: boolean; prtInvoiceApproved: boolean }>()

// Persists tax mismatch approval state across remounts
const taxMismatchCache = new Map<string, { invoiceApproved: boolean }>()

// ─── SVG icons ────────────────────────────────────────────────────────────────

const CheckIcon = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 -960 960 960" width={size} fill={color} style={{ display: 'block' }}>
    <path d="M382-267.69 183.23-466.46 211.77-495 382-324.77 748.23-691l28.54 28.54L382-267.69Z"/>
  </svg>
)

const CloseIcon = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 -960 960 960" width={size} fill={color} style={{ display: 'block' }}>
    <path d="m322.15-293.08-29.07-29.07L450.92-480 293.08-636.85l29.07-29.07L480-508.08l156.85-157.84 29.07 29.07L508.08-480l157.84 157.85-29.07 29.07L480-450.92 322.15-293.08Z"/>
  </svg>
)

// ─── Agent profile icons ──────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, { initials: string; gradient: string }> = {
  'VIM Mailbox Adapter':            { initials: 'VM', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' },
  'Document Status Agent':          { initials: 'DS', gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' },
  'Invoice Classification (Ic)':    { initials: 'Ic', gradient: 'linear-gradient(135deg, #3730a3 0%, #818cf8 100%)' },
  'SAP DOX Digitization Agent':     { initials: 'Id', gradient: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)' },
  'Invoice Extractor (Id)':         { initials: 'Ex', gradient: 'linear-gradient(135deg, #0c4a6e 0%, #38bdf8 100%)' },
  'Formatter Agent':                { initials: 'Fm', gradient: 'linear-gradient(135deg, #4a044e 0%, #d946ef 100%)' },
  'Field Validation Agent':         { initials: 'Fv', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #6d28d9 100%)' },
  'Invoice Validation (Iv)':        { initials: 'Iv', gradient: 'linear-gradient(135deg, #5b21b6 0%, #a78bfa 100%)' },
  'Matching & GL Advisor (Ma)':     { initials: 'Ma', gradient: 'linear-gradient(135deg, #064e3b 0%, #34d399 100%)' },
  'S/4 Data Hub':                   { initials: 'S4', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)' },
  '3-Way Match Agent':              { initials: '3W', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)' },
  'Payment Validator (Pv)':         { initials: 'Pv', gradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)' },
  'Anomaly Sensor (As)':            { initials: 'As', gradient: 'linear-gradient(135deg, #1f2937 0%, #6b7280 100%)' },
  'Tax & DRC Agent (Tx)':           { initials: 'Tx', gradient: 'linear-gradient(135deg, #042f2e 0%, #0d9488 100%)' },
  'NPO Exception Orchestrator (Eg)':{ initials: 'NP', gradient: 'linear-gradient(135deg, #831843 0%, #ec4899 100%)' },
  'Exception Gatekeeper (Eg)':      { initials: 'Eg', gradient: 'linear-gradient(135deg, #831843 0%, #f472b6 100%)' },
  'Predictive IC & Royalty Agent':  { initials: 'IC', gradient: 'linear-gradient(135deg, #134e4a 0%, #2dd4bf 100%)' },
  'GenAI Milestone Interpreter':    { initials: 'AI', gradient: 'linear-gradient(135deg, #4a044e 0%, #c026d3 100%)' },
}

function AgentAvatar({ name, size = 28 }: { name: string; size?: number }) {
  const icon = AGENT_ICONS[name] ?? { initials: name.slice(0, 2), gradient: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: icon.gradient, color: '#fff', fontSize: `${size * 0.38}px`, fontWeight: 700, fontFamily: 'Cabin, sans-serif', flexShrink: 0, letterSpacing: '-0.3px' }}>
      {icon.initials}
    </span>
  )
}

// ─── Agent tier classification ────────────────────────────────────────────────

const SUPER_AGENTS = new Set([
  'SAP DOX Digitization Agent',
  'Invoice Validation (Iv)',
])

// ─── Stage metadata ────────────────────────────────────────────────────────────

const AGENT_HUDDLE_MESSAGES: Record<string, string[]> = {
  'VIM Mailbox Adapter': [
    'Monitoring AP mailbox via OpenText VIM — new email received, parsing MIME headers',
    'Attachment extracted: PDF document — initiating antivirus scan',
    'AV scan passed — no threats detected, attachment safe to process',
    'Email metadata archived — message-id and timestamps logged to audit trail',
    'Sender domain validated against approved vendor registry',
    'Forwarding attachment and metadata to document intake pipeline',
  ],
  'Document Status Agent': [
    'Generating unique invoice record UUID in the S/4 Data Hub',
    'Intake timestamp recorded in UTC — SLA clock started (48-hr window)',
    'Document status initialised: IN_PROGRESS — downstream agents notified',
    'Sender email domain cross-checked against master vendor list',
    'Invoice record created and enqueued for classification',
  ],
  'Invoice Classification (Ic)': [
    'Loading PDF binary — initiating document structure and layout analysis',
    'Detecting invoice type: PO / Non-PO, service, freight, royalty or intercompany',
    'Scanning for PO reference patterns across header, body, and footer',
    'Scanning for contract or framework agreement reference numbers',
    'Checking for recurring invoice markers and statement indicators',
    'Category determined — confidence score computed and thresholded',
  ],
  'SAP DOX Digitization Agent': [
    'Opening PDF attachment — parsing binary structure',
    'Running SAP DOX AI-powered OCR — segmenting text blocks and table regions',
    'Document sections identified: Header, Remit-to, Line Items, Totals',
    'Table structure mapped — column headers, row boundaries, merged cells resolved',
    'All text blocks and structured data forwarded to extraction agent',
  ],
  'Invoice Extractor (Id)': [
    'Extracting supplier identification: name, vendor ID, registered address',
    'Extracting invoice header fields: invoice number, invoice date, due date',
    'Extracting payment details: terms, currency, remittance instructions',
    'Extracting line items: description, quantity, unit price, line total',
    'Extracting financial summary: net amount, VAT, invoice total',
    'Cross-checking totals — net + VAT must equal invoice total',
    'Extraction complete — all fields populated, confidence scores computed',
  ],
  'Formatter Agent': [
    'Normalising currency values to ISO 4217 standard (e.g. EUR, USD)',
    'Reformatting all dates to ISO 8601 (YYYY-MM-DD)',
    'Standardising payment terms to canonical form (e.g. Net 15, Net 30)',
    'Validating supplier ID format against SAP vendor ID pattern rules',
    'Reformatting PO and SES/GR reference numbers to SAP S/4HANA format',
    'All 12 extracted fields normalised and ready for validation stage',
  ],
  'Field Validation Agent': [
    'Checking mandatory field presence: invoice number, supplier, date, total amount',
    'Validating invoice number format against the vendor reference pattern',
    'Verifying supplier ID against the SAP Vendor / Business Partner master',
    'Cross-referencing bank account against registered vendor payment details',
    'Running sanctions-list screening against supplier legal name',
    'Checking VAT ID format and cross-referencing against the tax registry',
    'All field validations passed — invoice cleared for business rule evaluation',
  ],
  'Invoice Validation (Iv)': [
    'Loading business rule set — active validation rules applied',
    'Payment terms compliance: validating against the approved vendor terms matrix',
    'Tax rate plausibility check: applied rate validated against service category',
    'Invoice date vs received date delta: checking within acceptable SLA window',
    'Due date arithmetic check: verifying Net terms correctly calculate from issue date',
    'Line item description completeness: checking against minimum requirements',
    'All business rules evaluated — issuing validation clearance report',
  ],
  'Matching & GL Advisor (Ma)': [
    'Querying the SAP S/4HANA PO registry using the extracted PO reference',
    'PO header retrieved — comparing supplier, amount, and line items',
    'Querying SAP MM for the Service Entry Sheet / goods receipt against this PO',
    'SES/GR record located — confirming quantity matches the invoiced quantity',
    'For Non-PO: proposing GL code via AI-powered touchless coding',
    'Calculating invoice-to-PO variance — applying ±0.5% tolerance threshold',
    'Match / coding result determined — exception raised if outside threshold',
  ],
  'S/4 Data Hub': [
    'Writing invoice state transition to the S/4 Data Hub immutable audit log',
    'UTC timestamp and agent signature appended to audit entry',
    'SHA-256 transaction hash generated for chain-of-custody verification',
    'State change broadcast to downstream compliance monitoring systems',
  ],
  '3-Way Match Agent': [
    'Initiating 3-way match: comparing invoice against PO and Service Entry Sheet',
    'Line-by-line comparison of invoice items vs PO line items',
    'Quantity check: invoiced quantity vs SES/GR confirmed quantity',
    'Amount variance calculation: invoice total vs PO value',
    'Applying configured tolerance rules for this supplier tier',
    '3-way match complete — pass/fail result recorded to audit log',
  ],
  'Payment Validator (Pv)': [
    'Running pre-payment controls including advanced duplicate detection',
    'Exact match scan: searching for identical invoice numbers',
    'Fuzzy match scan: checking for near-duplicate amounts within ±2%',
    'Same-day resubmission check: looking for suspicious timing patterns',
    'Cross-referencing against SAP payment history for prior settlements',
    'Duplicate / pre-payment control complete — result recorded',
  ],
  'Anomaly Sensor (As)': [
    'Loading 12-month historical invoice data for this supplier',
    'Statistical range check: comparing invoice amount to historical mean and std dev',
    'Line item count check: comparing to supplier average line item count',
    'Unit price anomaly check: detecting unusual per-unit pricing vs historical',
    'Running ML-based anomaly classifier on extracted invoice features',
    'Anomaly scan complete — risk score computed and recorded',
  ],
  'Tax & DRC Agent (Tx)': [
    'Identifying billing entity and applicable tax jurisdiction from the invoice',
    'Querying SAP DRC tax matrix: service/goods type × jurisdiction → applicable code',
    'Validating supplier-applied VAT rate against the registered jurisdiction rate',
    'Checking reduced-rate eligibility (e.g. printed books at 7% in Germany)',
    'Tax code and rate validation complete — discrepancies flagged for review',
  ],
  'NPO Exception Orchestrator (Eg)': [
    'Invoice category confirmed: Non-PO service invoice — PO path not applicable',
    'Checking approval authority matrix for invoice amount and category',
    'Identifying required approver tier based on invoice value thresholds',
    'Selecting approval workflow template from the Non-PO workflow catalogue',
    'Routing instructions set — invoice queued for GL code assignment stage',
  ],
  'Predictive IC & Royalty Agent': [
    'Loading intercompany trading-partner map and abstracted royalty contract terms',
    'For IC: matching both sides of the posting against the ICE clearing accounts',
    'For royalty: GenAI comparing invoice line vs abstracted contract rate and basis',
    'Calculating variance between posted/invoiced value and the expected value',
    'Real-time detection complete — genuine deviation flagged for reconciliation',
  ],
  'GenAI Milestone Interpreter': [
    'Milestone not structured in SAP — retrieving the linked production contract',
    'Locating the payment-milestone clause referenced on the invoice',
    'Reading the clause with GenAI and interpreting the completion condition',
    'Cross-checking delivery/acceptance evidence against the clause',
    'Milestone condition assessed — booking the Service Entry Sheet if met',
  ],
}

const AGENT_IN_PROGRESS: Record<string, string> = {
  'VIM Mailbox Adapter':            'Monitoring AP inbox (OpenText VIM) for new invoices...',
  'Document Status Agent':          'Creating invoice record in the S/4 Data Hub...',
  'Invoice Classification (Ic)':    'Analysing document structure and content...',
  'SAP DOX Digitization Agent':     'Running SAP DOX OCR scan on PDF attachment...',
  'Invoice Extractor (Id)':         'Extracting invoice fields from document...',
  'Formatter Agent':                'Normalising extracted field values...',
  'Field Validation Agent':         'Validating field completeness and formats...',
  'Invoice Validation (Iv)':        'Running business rule validations...',
  'Matching & GL Advisor (Ma)':     'Querying SAP S/4HANA for PO, SES/GR and GL records...',
  'S/4 Data Hub':                   'Writing transaction to the financial data hub...',
  '3-Way Match Agent':              'Running 3-way match analysis...',
  'Payment Validator (Pv)':         'Running pre-payment duplicate controls...',
  'Anomaly Sensor (As)':            'Running anomaly detection algorithms...',
  'Tax & DRC Agent (Tx)':           'Identifying and validating applicable VAT/tax codes...',
  'NPO Exception Orchestrator (Eg)':'Determining approval workflow for non-PO invoice...',
  'Predictive IC & Royalty Agent':  'Reconciling intercompany / royalty terms in real time...',
  'GenAI Milestone Interpreter':    'Reading the milestone clause from the production contract...',
}

const AGENT_COMPLETION: Record<string, string> = {
  'VIM Mailbox Adapter':            'Email and attachment forwarded to intake pipeline',
  'Document Status Agent':          'Invoice record created — status set to IN_PROGRESS',
  'Invoice Classification (Ic)':    'Classified — routing to the appropriate processing pipeline',
  'SAP DOX Digitization Agent':     'PDF parsed via SAP DOX — 4 sections identified',
  'Invoice Extractor (Id)':         '12 invoice fields extracted successfully',
  'Formatter Agent':                'Fields normalised — dates, currency, and references formatted',
  'Field Validation Agent':         'All fields validated — supplier confirmed in SAP Vendor master',
  'Invoice Validation (Iv)':        'Business rules passed — payment terms compliant',
  'Matching & GL Advisor (Ma)':     'PO and SES/GR records verified in SAP S/4HANA',
  'S/4 Data Hub':                   'Transaction logged to immutable audit trail',
  '3-Way Match Agent':              '3-way match confirmed — within ±0.5% tolerance',
  'Payment Validator (Pv)':         'Pre-payment controls clear — no duplicate found',
  'Anomaly Sensor (As)':            'Anomaly scan clear — amount within expected band',
  'Tax & DRC Agent (Tx)':           'VAT code verified against SAP DRC for the goods/service type',
  'NPO Exception Orchestrator (Eg)':'Invoice routed to standard Non-PO approval workflow',
  'Predictive IC & Royalty Agent':  'Real-time IC / royalty reconciliation complete',
  'GenAI Milestone Interpreter':    'Milestone confirmed from contract — Service Entry Sheet booked',
}

// ─── SAP document number & IBAN lookup ────────────────────────────────────────

const SAP_DOC_NUMBERS: Record<string, string> = {
  'inv-1': '5100019847', 'inv-2': '5100019921', 'inv-4': '5100019958',
  'inv-5': '5100019963', 'inv-6': '5100019979', 'inv-7': '5100019985',
  'inv-8': '5100019991', 'inv-9': '5100020007', 'inv-10': '5100020014',
  'inv-11': '5100020021',
}

const VENDOR_IBANS: Record<string, string> = {
  'inv-1': 'DE89 3704 0044 0532 0130 00', 'inv-2': 'DE27 2004 1155 0543 1234 00',
  'inv-4': 'DE91 5004 0000 0616 9230 01', 'inv-5': 'DE75 7002 0270 0012 3456 78',
  'inv-6': 'DE41 3001 0010 0123 4567 89', 'inv-7': 'DE57 2004 1155 0234 5678 90',
  'inv-8': 'DE10 5004 0000 0789 0123 45', 'inv-9': 'DE82 7002 0270 0456 7890 12',
  'inv-10': 'DE47 2004 1155 0890 1234 56', 'inv-11': 'DE93 5004 0000 0321 9876 54',
}

// ─── Agent Tool Screens ────────────────────────────────────────────────────────

function AgentToolScreen({ agentName, invoice }: { agentName: string; invoice: Invoice }) {
  const f = invoice.extractedFields
  const currency = f.currency || 'EUR'
  const fmt = (n: number) => new Intl.NumberFormat('en-DE', { style: 'currency', currency }).format(n)

  const SapHeader = ({ title, badge, badgeOk = true }: { title: string; badge: string; badgeOk?: boolean }) => (
    <div style={{ background: '#003d6b', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width="30" height="16" viewBox="0 0 30 16" fill="none"><rect width="30" height="16" rx="2.5" fill="white" fillOpacity="0.15"/><text x="3" y="12" fill="white" fontSize="11" fontWeight="900" fontFamily="'Arial', sans-serif">SAP</text></svg>
      <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: '10px', fontFamily: "'Segoe UI', sans-serif", flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      <span style={{ background: badgeOk ? '#00a759' : '#b91f1f', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 7px', borderRadius: '3px', flexShrink: 0 }}>{badge}</span>
    </div>
  )

  // ── SAP DOX Digitization Agent → Serrala SmartEye OCR output ──────────────
  if (agentName === 'SAP DOX Digitization Agent') {
    return (
      <div style={{ marginTop: '8px', border: '1px solid #001B3A', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ background: '#001B3A', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#00A3D9', fontWeight: 900, fontFamily: "'Arial Black', sans-serif", fontSize: '13px', letterSpacing: '-0.5px' }}>serrala</span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px', fontFamily: 'Lato, sans-serif', flex: 1 }}>SmartEye · Document Intelligence</span>
          <span style={{ background: '#00A3D9', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 7px', borderRadius: '3px' }}>OCR COMPLETE</span>
        </div>
        <div style={{ background: '#f8f9fa', padding: '9px 10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', marginBottom: '8px' }}>
            {[
              { label: 'Document Type', value: 'AP Invoice — PDF' },
              { label: 'Pages', value: '1 of 1' },
              { label: 'OCR Engine', value: 'SAP DOX AI' },
              { label: 'Text Blocks', value: '47 detected' },
              { label: 'Tables Found', value: '2 structures' },
              { label: 'OCR Confidence', value: '97.4%' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#fff', border: '1px solid #dde', borderRadius: '3px', padding: '4px 6px' }}>
                <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1px' }}>{label}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#001B3A', fontFamily: 'monospace' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#001B3A', borderRadius: '4px', padding: '6px 8px' }}>
            <div style={{ fontSize: '9px', color: '#00A3D9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Extracted Sections</div>
            {['Document Header (Invoice #, Date, Vendor ID)', 'Remit-To Address & Bank Details', 'Line Item Table (desc · qty · unit price · total)', 'Summary Footer (Net · VAT · Invoice Total)'].map((s, i) => (
              <div key={i} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                <span style={{ color: '#00A3D9', fontWeight: 700 }}>✓</span> {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Invoice Extractor → Azure AI Document Intelligence ─────────────────────
  if (agentName === 'Invoice Extractor (Id)') {
    const confs = f.fieldConfidences
    const overall = Math.round(Object.values(confs).reduce((a, b) => a + b, 0) / Math.max(1, Object.values(confs).length))
    const color = overall >= 90 ? '#107c10' : overall >= 70 ? '#797600' : '#a4262c'
    return (
      <div style={{ marginTop: '8px', border: '1px solid #0078d4', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ background: '#0078d4', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect width="6" height="6" fill="white" opacity="0.9"/><rect x="8" width="6" height="6" fill="white" opacity="0.7"/><rect y="8" width="6" height="6" fill="white" opacity="0.7"/><rect x="8" y="8" width="6" height="6" fill="white" opacity="0.5"/></svg>
          <span style={{ color: '#fff', fontSize: '10px', fontFamily: "'Segoe UI', sans-serif", fontWeight: 600, flex: 1 }}>Azure AI Document Intelligence</span>
          <span style={{ background: '#fff', color: '#0078d4', fontSize: '9px', fontWeight: 700, padding: '1px 7px', borderRadius: '3px' }}>Analyze Complete</span>
        </div>
        <div style={{ background: '#fff', padding: '8px 10px' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '10px', color: '#555', fontFamily: 'Lato, sans-serif' }}>Overall extraction confidence</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color }}>{overall}%</span>
            </div>
            <div style={{ height: '4px', background: '#e0e0e0', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: `${overall}%`, background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: '#f3f2f1', padding: '4px 8px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', borderBottom: '1px solid #e0e0e0' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#323130', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Field</span>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#323130', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</span>
            </div>
            {Object.entries(confs).slice(0, 6).map(([key, val]) => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
              const fc = val >= 90 ? '#107c10' : val >= 70 ? '#797600' : '#a4262c'
              return (
                <div key={key} style={{ padding: '3px 8px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', borderBottom: '1px solid #f3f2f1', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#323130', fontFamily: 'Lato, sans-serif' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '36px', height: '3px', background: '#e0e0e0', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${val}%`, background: fc, borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: fc, minWidth: '30px', textAlign: 'right' }}>{val}%</span>
                  </div>
                </div>
              )
            })}
          </div>
          {Object.keys(confs).length > 6 && (
            <div style={{ fontSize: '10px', color: '#767676', paddingTop: '4px', fontFamily: 'Lato, sans-serif' }}>+{Object.keys(confs).length - 6} more fields extracted</div>
          )}
        </div>
      </div>
    )
  }

  // ── Matching & GL Advisor → SAP Fiori MM — PO/SES Detail ──────────────────
  if (agentName === 'Matching & GL Advisor (Ma)') {
    const isPO = !!f.poNumber
    return (
      <div style={{ marginTop: '8px', border: '1px solid #003d6b', borderRadius: '6px', overflow: 'hidden' }}>
        <SapHeader title={isPO ? 'S/4HANA · Purchase Order Detail (MM.PO.DISP)' : 'S/4HANA · GL Account Assignment (FB03)'} badge={isPO ? 'SES CONFIRMED' : 'GL ASSIGNED'} />
        <div style={{ background: '#fafafa', padding: '8px 10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '6px' }}>
            {(isPO ? [
              { label: 'PO Number', value: f.poNumber! },
              { label: 'Vendor', value: f.supplierName.split(' ').slice(0, 2).join(' ') },
              { label: 'PO Amount', value: fmt(f.totalAmount) },
              { label: 'SES/GR Number', value: f.sesNumber || f.grNumber || 'GR50000128' },
              { label: 'Company Code', value: 'BERT' },
              { label: 'Plant', value: 'DE01' },
            ] : [
              { label: 'GL Account', value: f.glAccount || '6150-008' },
              { label: 'Cost Center', value: f.costCenter || 'CC-4410' },
              { label: 'Net Amount', value: fmt(f.totalAmount - f.tax) },
              { label: 'Tax Code', value: f.taxCode || 'DE-VAT-STD' },
              { label: 'Coding Confidence', value: `${f.codingConfidence ?? 88}%` },
              { label: 'Company Code', value: 'BERT' },
            ]).map(({ label, value }) => (
              <div key={label} style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: '3px', padding: '4px 6px' }}>
                <div style={{ fontSize: '9px', color: '#767676', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#003d6b', fontFamily: 'monospace' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#e8f3ff', border: '1px solid #b3d7f5', borderRadius: '4px', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#0070c1', fontWeight: 700 }}>✓</span>
            <span style={{ fontSize: '10px', color: '#0070c1', fontWeight: 600 }}>
              {isPO ? 'SES booked · 3-Way Match calculation initiated · Amount within ±0.5% tolerance' : 'GL code assigned via AI touchless coding · Routed for AP approval workflow'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── 3-Way Match Agent → SAP MIRO 3-way match comparison ───────────────────
  if (agentName === '3-Way Match Agent') {
    const isException = ['duplicate', 'missing-gr', 'tax-mismatch'].includes(invoice.failType || '')
    return (
      <div style={{ marginTop: '8px', border: '1px solid #003d6b', borderRadius: '6px', overflow: 'hidden' }}>
        <SapHeader title="S/4HANA · 3-Way Match Result (MIRO)" badge={isException ? 'EXCEPTION' : 'MATCH PASSED'} badgeOk={!isException} />
        <div style={{ background: '#fff', padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#f3f2f1' }}>
                {['', 'Invoice', 'Purchase Order', 'GR / SES', 'Variance'].map(h => (
                  <th key={h} style={{ padding: '5px 8px', fontSize: '9px', fontWeight: 700, color: '#555', textAlign: h === '' ? 'left' : 'right', textTransform: 'uppercase', borderBottom: '1px solid #d9d9d9', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Amount', inv: fmt(f.totalAmount), po: fmt(f.totalAmount), gr: fmt(f.totalAmount), variance: isException ? fmt(Math.abs(f.totalAmount * 0.01)) : fmt(0), ok: !isException },
                { label: 'Quantity', inv: '1.000 PC', po: '1.000 PC', gr: '1.000 PC', variance: '0.000', ok: true },
                { label: 'Tolerance', inv: '±0.5%', po: '—', gr: '—', variance: isException ? 'Exceeded' : 'Within', ok: !isException },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f2f1', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '4px 8px', fontSize: '10px', color: '#555', fontWeight: 600 }}>{row.label}</td>
                  <td style={{ padding: '4px 8px', fontSize: '10px', color: '#003d6b', textAlign: 'right', fontFamily: 'monospace' }}>{row.inv}</td>
                  <td style={{ padding: '4px 8px', fontSize: '10px', color: '#003d6b', textAlign: 'right', fontFamily: 'monospace' }}>{row.po}</td>
                  <td style={{ padding: '4px 8px', fontSize: '10px', color: '#003d6b', textAlign: 'right', fontFamily: 'monospace' }}>{row.gr}</td>
                  <td style={{ padding: '4px 8px', fontSize: '10px', textAlign: 'right', fontWeight: 700, color: row.ok ? '#107c10' : '#a4262c' }}>{row.variance}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '5px 8px', background: isException ? '#fde7e9' : '#dff6dd', display: 'flex', alignItems: 'center', gap: '5px', borderTop: '1px solid #e0e0e0' }}>
            <span style={{ fontWeight: 700, fontSize: '10px', color: isException ? '#a4262c' : '#107c10' }}>
              {isException ? '✗ Match exception detected — escalated for manual review' : '✓ All checks passed — invoice cleared for AP posting'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── Tax & DRC Agent → SAP DRC tax compliance output ───────────────────────
  if (agentName === 'Tax & DRC Agent (Tx)') {
    const taxOk = invoice.failType !== 'tax-mismatch'
    const rate = f.taxCode?.includes('RED') ? '7%' : f.taxCode?.includes('IE') ? '23%' : '19%'
    return (
      <div style={{ marginTop: '8px', border: `1px solid ${taxOk ? '#003d6b' : '#b91f1f'}`, borderRadius: '6px', overflow: 'hidden' }}>
        <SapHeader title="SAP DRC · Tax Compliance Engine (TAXDE)" badge={taxOk ? 'VALIDATED' : 'MISMATCH'} badgeOk={taxOk} />
        <div style={{ background: '#fafafa', padding: '8px 10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '6px' }}>
            {[
              { label: 'Tax Code (Invoice)', value: f.taxCode || 'DE-VAT-STD' },
              { label: 'Tax Jurisdiction', value: 'Germany · Federal' },
              { label: 'Rate Applied', value: invoice.failType === 'tax-mismatch' ? '19% (incorrect)' : rate },
              { label: 'Expected Rate', value: rate },
              { label: 'Tax Amount', value: fmt(f.tax) },
              { label: 'DRC Check ID', value: 'DRC-2026-0' + (invoice.id.replace('inv-','')) },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: '3px', padding: '4px 6px' }}>
                <div style={{ fontSize: '9px', color: '#767676', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: label === 'Rate Applied' && !taxOk ? '#a4262c' : '#003d6b', fontFamily: 'monospace' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: taxOk ? '#dff6dd' : '#fde7e9', border: `1px solid ${taxOk ? '#00a759' : '#b91f1f'}`, borderRadius: '4px', padding: '5px 8px' }}>
            <span style={{ fontSize: '10px', color: taxOk ? '#107c10' : '#a4262c', fontWeight: 600 }}>
              {taxOk ? `✓ Tax code ${f.taxCode || 'DE-VAT-STD'} validated — rate compliant for service/goods category` : '✗ Tax jurisdiction mismatch — manual correction required before posting'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ─── SAP Posting Modal (FB60 / MIRO) ──────────────────────────────────────────

function SAPPostingModal({ invoice, onClose, onViewPayment }: { invoice: Invoice; onClose: () => void; onViewPayment: () => void }) {
  const f = invoice.extractedFields
  const currency = f.currency || 'EUR'
  const fmt = (n: number) => new Intl.NumberFormat('en-DE', { style: 'currency', currency }).format(n)
  const sapDoc = SAP_DOC_NUMBERS[invoice.id] || '5100020000'
  const isPO = invoice.category === 'PO'
  const net = f.totalAmount - f.tax
  const today = new Date().toLocaleDateString('de-DE')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '700px', boxShadow: '0 24px 64px rgba(0,0,0,0.38)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

        {/* SAP Fiori chrome */}
        <div style={{ background: '#003d6b', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <svg width="36" height="20" viewBox="0 0 36 20"><rect width="36" height="20" rx="3" fill="white" fillOpacity="0.15"/><text x="3" y="14" fill="white" fontSize="12" fontWeight="900" fontFamily="Arial, sans-serif">SAP</text></svg>
            <span style={{ marginLeft: '12px', color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontFamily: "'Segoe UI', sans-serif" }}>S/4HANA  ·  Manage Incoming Invoices (MIRO)</span>
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ background: '#00a759', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckIcon size={14} color="#00a759" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', fontFamily: "'Segoe UI', sans-serif" }}>FI Document {sapDoc} Posted Successfully</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontFamily: 'Lato, sans-serif' }}>{invoice.invoiceNumber} · {invoice.supplier} · Posted {today}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* Document header */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#767676', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'Lato, sans-serif' }}>Document Header</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
              {[
                { label: 'Document Type', value: isPO ? 'RE — Invoice Receipt' : 'KR — Vendor Invoice' },
                { label: 'Company Code', value: 'BERT' },
                { label: 'Fiscal Year', value: '2026' },
                { label: 'Posting Date', value: today },
                { label: 'Document Date', value: f.invoiceDate },
                { label: 'Reference', value: invoice.invoiceNumber },
                { label: 'Currency', value: currency },
                { label: 'Payment Terms', value: f.paymentTerms },
                { label: 'Posting Period', value: '6 / 2026' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f3f2f1', borderRadius: '4px', padding: '6px 8px' }}>
                  <div style={{ fontSize: '9px', color: '#767676', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#003d6b', fontFamily: 'monospace' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Line items table */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#767676', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'Lato, sans-serif' }}>Document Line Items</div>
            <div style={{ border: '1px solid #d9d9d9', borderRadius: '5px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#003d6b' }}>
                    {['Ln', 'PK', 'Account', 'Description', 'Tax Cd', 'Amount'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', color: '#fff', textAlign: h === 'Amount' ? 'right' : 'left', fontSize: '10px', fontFamily: 'Lato, sans-serif', fontWeight: 700, letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#fff5f5', borderBottom: '1px solid #e8d0d0' }}>
                    <td style={{ padding: '5px 8px', color: '#555', fontFamily: 'monospace', fontSize: '11px' }}>001</td>
                    <td style={{ padding: '5px 8px', color: '#555', fontFamily: 'monospace', fontSize: '11px' }}>31</td>
                    <td style={{ padding: '5px 8px', color: '#003d6b', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>{f.supplierId || 'VEND-100'}</td>
                    <td style={{ padding: '5px 8px', color: '#323130', fontFamily: 'Lato, sans-serif', fontSize: '11px' }}>{f.supplierName.split(' ').slice(0, 3).join(' ')}</td>
                    <td style={{ padding: '5px 8px', color: '#555', fontFamily: 'monospace', fontSize: '11px' }}>{f.taxCode?.slice(0, 6) || 'V1'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#a4262c', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>{fmt(-f.totalAmount)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f2f1', background: '#fff' }}>
                    <td style={{ padding: '5px 8px', color: '#555', fontFamily: 'monospace', fontSize: '11px' }}>002</td>
                    <td style={{ padding: '5px 8px', color: '#555', fontFamily: 'monospace', fontSize: '11px' }}>{isPO ? '86' : '40'}</td>
                    <td style={{ padding: '5px 8px', color: '#003d6b', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>{isPO ? 'GR/IR-CLRG' : (f.glAccount || '6150-008')}</td>
                    <td style={{ padding: '5px 8px', color: '#323130', fontFamily: 'Lato, sans-serif', fontSize: '11px' }}>{isPO ? 'GR/IR Clearing Account' : (f.glAccount ? `GL: ${f.glAccount}` : 'Facilities & Services')}</td>
                    <td style={{ padding: '5px 8px', color: '#555', fontFamily: 'monospace', fontSize: '11px' }}>{f.taxCode?.slice(0, 6) || 'V1'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#107c10', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>{fmt(net)}</td>
                  </tr>
                  <tr style={{ background: '#f9f9f9' }}>
                    <td style={{ padding: '5px 8px', color: '#555', fontFamily: 'monospace', fontSize: '11px' }}>003</td>
                    <td style={{ padding: '5px 8px', color: '#555', fontFamily: 'monospace', fontSize: '11px' }}>40</td>
                    <td style={{ padding: '5px 8px', color: '#003d6b', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>175300</td>
                    <td style={{ padding: '5px 8px', color: '#323130', fontFamily: 'Lato, sans-serif', fontSize: '11px' }}>Input Tax ({f.taxCode?.slice(0, 6) || 'V1'})</td>
                    <td style={{ padding: '5px 8px', color: '#555', fontFamily: 'monospace', fontSize: '11px' }}>{f.taxCode?.slice(0, 6) || 'V1'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#107c10', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>{fmt(f.tax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Balance / status */}
          <div style={{ background: '#dff6dd', border: '1px solid #00a759', borderRadius: '6px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckIcon size={18} color="#107c10" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#107c10', fontFamily: 'Cabin, sans-serif' }}>Document Balance: 0.00 · Document Posted Successfully</div>
              <div style={{ fontSize: '11px', color: '#0a6e2a', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>AP Open Item created · Payment due {f.dueDate} · Terms: {f.paymentTerms}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '11px 20px', borderTop: '1px solid #e0e0e0', background: '#f3f2f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: '#767676', fontFamily: 'Lato, sans-serif' }}>Doc. {sapDoc} · {invoice.invoiceNumber} · Posted by Bertelsmann AP Automation</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', background: '#fff', border: '1px solid #c8cccf', borderRadius: '4px', fontSize: '13px', color: '#555', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>Close</button>
            <button onClick={onViewPayment} style={{ padding: '7px 18px', background: '#003d6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Lato, sans-serif', fontWeight: 700 }}>View Payment Run (F110) →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SAP Payment Run Modal (F110) ─────────────────────────────────────────────

function SAPPaymentRunModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const f = invoice.extractedFields
  const currency = f.currency || 'EUR'
  const fmt = (n: number) => new Intl.NumberFormat('en-DE', { style: 'currency', currency }).format(n)
  const sapDoc = SAP_DOC_NUMBERS[invoice.id] || '5100020000'
  const iban = VENDOR_IBANS[invoice.id] || 'DE89 3704 0044 0532 0130 00'
  const today = new Date().toLocaleDateString('de-DE')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 3001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '660px', boxShadow: '0 24px 64px rgba(0,0,0,0.38)', overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

        <div style={{ background: '#003d6b', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <svg width="36" height="20" viewBox="0 0 36 20"><rect width="36" height="20" rx="3" fill="white" fillOpacity="0.15"/><text x="3" y="14" fill="white" fontSize="12" fontWeight="900" fontFamily="Arial, sans-serif">SAP</text></svg>
            <span style={{ marginLeft: '12px', color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontFamily: "'Segoe UI', sans-serif" }}>S/4HANA  ·  Automatic Payment Run (F110)</span>
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ background: '#00a759', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckIcon size={14} color="#00a759" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', fontFamily: "'Segoe UI', sans-serif" }}>Payment Transfer Order Created — {today}</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontFamily: 'Lato, sans-serif' }}>Run ID: F110-{today.replace(/\./g, '')}-001 · Method T (Bank Transfer)</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Run parameters */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#767676', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'Lato, sans-serif' }}>Payment Run Parameters</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
              {[
                { label: 'Run Date', value: today },
                { label: 'Run ID', value: 'AP2026-001' },
                { label: 'Company Codes', value: 'BERT' },
                { label: 'Payment Method', value: 'T — Bank Transfer' },
                { label: 'Value Date', value: f.dueDate },
                { label: 'House Bank', value: 'DTBK-BERT' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f3f2f1', borderRadius: '4px', padding: '6px 8px' }}>
                  <div style={{ fontSize: '9px', color: '#767676', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#003d6b', fontFamily: 'monospace' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment list */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#767676', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'Lato, sans-serif' }}>Payment List</div>
            <div style={{ border: '1px solid #d9d9d9', borderRadius: '5px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#003d6b' }}>
                    {['Vendor', 'Name', 'FI Doc.', 'Due Date', 'Amount', 'Status'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', color: '#fff', textAlign: h === 'Amount' ? 'right' : 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#dff6dd' }}>
                    <td style={{ padding: '6px 8px', color: '#003d6b', fontFamily: 'monospace', fontWeight: 700 }}>{f.supplierId || 'VEND-100'}</td>
                    <td style={{ padding: '6px 8px', color: '#323130', fontFamily: 'Lato, sans-serif' }}>{f.supplierName.split(' ').slice(0, 3).join(' ')}</td>
                    <td style={{ padding: '6px 8px', color: '#003d6b', fontFamily: 'monospace' }}>{sapDoc}</td>
                    <td style={{ padding: '6px 8px', color: '#323130', fontFamily: 'monospace' }}>{f.dueDate}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#003d6b', fontFamily: 'monospace', fontWeight: 700 }}>{fmt(f.totalAmount)}</td>
                    <td style={{ padding: '6px 8px' }}><span style={{ background: '#107c10', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px' }}>PAID</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bank transfer details */}
          <div style={{ border: '1px solid #003d6b', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ background: '#003d6b', padding: '7px 12px' }}>
              <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, fontFamily: 'Lato, sans-serif' }}>Bank Transfer Details</span>
            </div>
            <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
              {[
                { label: 'Beneficiary', value: f.supplierName.split(' ').slice(0, 3).join(' ') },
                { label: 'Transfer Amount', value: fmt(f.totalAmount) },
                { label: 'IBAN', value: iban },
                { label: 'BIC / SWIFT', value: 'DEUTDEDB370' },
                { label: 'Value Date', value: f.dueDate },
                { label: 'Payment Reference', value: invoice.invoiceNumber },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f3f2f1', borderRadius: '4px', padding: '6px 8px' }}>
                  <div style={{ fontSize: '9px', color: '#767676', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#003d6b', fontFamily: 'monospace', wordBreak: 'break-all' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Final completion status */}
          <div style={{ background: '#dff6dd', border: '1px solid #00a759', borderRadius: '6px', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#107c10', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckIcon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#107c10', fontFamily: 'Cabin, sans-serif' }}>Invoice Processing Complete — End-to-End</div>
              <div style={{ fontSize: '12px', color: '#0a6e2a', fontFamily: 'Lato, sans-serif', marginTop: '3px' }}>{invoice.invoiceNumber} · {fmt(f.totalAmount)} · Posted in SAP S/4HANA · Transfer order raised · Processing closed</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '11px 20px', borderTop: '1px solid #e0e0e0', background: '#f3f2f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: '#767676', fontFamily: 'Lato, sans-serif' }}>F110 · Run {today} · Bertelsmann GBS AP Automation</span>
          <button onClick={onClose} style={{ padding: '7px 18px', background: '#003d6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Lato, sans-serif', fontWeight: 700 }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── SLA countdown ─────────────────────────────────────────────────────────────

function useSlaCountdown(totalMinutes: number, started: boolean) {
  const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60)
  useEffect(() => {
    if (!started) return
    const id = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [started])
  const h = Math.floor(secondsLeft / 3600)
  const m = Math.floor((secondsLeft % 3600) / 60)
  const s = secondsLeft % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function SlaBadge({ slaMinutes, started }: { slaMinutes: number; started: boolean }) {
  const timeStr = useSlaCountdown(slaMinutes, started)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#fff3d6', border: '1px solid #e0a829', borderRadius: '6px', padding: '6px 12px' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#b06b00" strokeWidth="1.5"/><path d="M7 4v3.5l2 1.5" stroke="#b06b00" strokeWidth="1.5" strokeLinecap="round"/></svg>
      <span style={{ fontSize: '12px', color: '#b06b00', fontFamily: 'Lato, sans-serif' }}>SLA:</span>
      <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', color: '#7a4a00' }}>{timeStr}</span>
      <span style={{ fontSize: '11px', color: '#b06b00', fontFamily: 'Lato, sans-serif' }}>remaining</span>
    </div>
  )
}

// ─── Outlook modal ─────────────────────────────────────────────────────────────

function OutlookModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '10px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: '#0F3C78', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="18" viewBox="0 0 22 18" fill="white"><rect x="1" y="1" width="20" height="16" rx="2" fill="none" stroke="white" strokeWidth="1.5"/><polyline points="1,1 11,10 21,1" fill="none" stroke="white" strokeWidth="1.5"/></svg>
          <span style={{ color: '#fff', fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '16px' }}>Microsoft Outlook</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '16px', color: '#1d2f36', marginBottom: '20px', lineHeight: '1.5', fontFamily: 'Lato, sans-serif' }}>
            Clicking <strong>Launch Outlook</strong> will open Microsoft Outlook with a pre-drafted email.
          </p>
          <div style={{ background: '#f6f7f7', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '16px', marginBottom: '20px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            <div style={{ fontSize: '13px', color: '#6b767b', marginBottom: '8px', display: 'grid', gridTemplateColumns: '60px 1fr', gap: '4px 8px' }}>
              <span>To:</span><span style={{ color: '#0078d4', fontWeight: 600 }}>{invoice.emailSenderEmail}</span>
              <span>Subject:</span><span style={{ color: '#000' }}>Re: {invoice.emailSubject} – Clarification Required</span>
              <span>Ref:</span><span>{invoice.invoiceNumber}</span>
            </div>
            <div style={{ height: '1px', background: '#e5e5e5', margin: '8px 0' }} />
            <p style={{ fontSize: '13px', color: '#333', lineHeight: '1.6' }}>
              Dear {invoice.supplier} Finance Team,<br /><br />
              We are processing invoice <strong>{invoice.invoiceNumber}</strong> and require clarification before we can proceed.<br /><br />
              <em style={{ color: '#6b767b' }}>— Sent via Bertelsmann AP Automation · ServiceNow S2P</em>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #c8cccf', borderRadius: '6px', fontSize: '15px', color: '#6b767b', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>Cancel</button>
            <button onClick={onClose} style={{ padding: '10px 20px', background: '#0F3C78', border: 'none', borderRadius: '6px', fontSize: '15px', color: '#fff', cursor: 'pointer', fontFamily: 'Lato, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="12" viewBox="0 0 14 12" fill="white"><rect x="0" y="0" width="14" height="12" rx="1.5" fill="none" stroke="white" strokeWidth="1.2"/><polyline points="0,0 7,7 14,0" fill="none" stroke="white" strokeWidth="1.2"/></svg>
              Launch Outlook
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Audit Drawer ──────────────────────────────────────────────────────────────

function AuditDrawer({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '560px', background: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e6e7', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1d2f36' }}>Audit Trail</div>
            <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>{invoice.invoiceNumber} · {invoice.auditTrail.length} entries</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <CloseIcon size={20} color="#6b767b" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            <div style={{ position: 'absolute', left: '6px', top: '8px', bottom: '8px', width: '2px', background: '#e4e6e7', borderRadius: '1px' }} />
            {invoice.auditTrail.map((entry, idx) => (
              <div key={entry.id} style={{ position: 'relative', marginBottom: idx < invoice.auditTrail.length - 1 ? '20px' : '8px' }}>
                <div style={{ position: 'absolute', left: '-20px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: entry.actorType === 'Agent' ? '#1a3a6b' : '#1b823f', border: '2px solid #fff', boxShadow: `0 0 0 1px ${entry.actorType === 'Agent' ? '#1a3a6b' : '#1b823f'}` }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>{entry.timestamp}</span>
                  <span style={{ background: entry.actorType === 'Agent' ? '#e7ecf5' : '#e8f5ee', color: entry.actorType === 'Agent' ? '#1a3a6b' : '#1b823f', fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', fontFamily: 'Lato, sans-serif' }}>{entry.actorType}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{entry.actorName}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{entry.action}</div>
                <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>{entry.result}</div>
                {entry.evidence && <div style={{ fontSize: '12px', color: '#c8cccf', fontStyle: 'italic', marginTop: '2px' }}>{entry.evidence}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ steps, currentStep, completed, failed }: { steps: Invoice['agentSteps']; currentStep: number; completed: Set<number>; failed: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '10px 20px 8px', background: '#fff', borderBottom: '1px solid #e4e6e7', flexShrink: 0 }}>
      {steps.map((step, idx) => {
        const done = completed.has(idx)
        const active = currentStep === idx && !done
        const isFailed = active && failed
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: done ? '#1b823f' : isFailed ? '#b91f1f' : active ? '#1a3a6b' : '#f0f1f1', border: `2px solid ${done ? '#1b823f' : isFailed ? '#b91f1f' : active ? '#1a3a6b' : '#c8cccf'}`, color: done || active ? '#fff' : '#6b767b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, fontFamily: 'Cabin, sans-serif', flexShrink: 0, animation: active && !failed ? 'pulse-ring 1.5s ease-out infinite' : 'none', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
                {done ? <CheckIcon size={12} /> : isFailed ? <CloseIcon size={12} /> : idx + 1}
              </div>
              <div style={{ marginTop: '3px', fontSize: '9px', fontFamily: 'Lato, sans-serif', color: done ? '#1b823f' : isFailed ? '#b91f1f' : active ? '#1a3a6b' : '#6b767b', textAlign: 'center', fontWeight: done || active ? 600 : 400, maxWidth: '64px', lineHeight: '1.3' }}>
                {step.name}
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', marginTop: '10px', background: completed.has(idx) ? '#1b823f' : '#e4e6e7', transition: 'background 0.4s ease', minWidth: '12px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Agent Status Bar ─────────────────────────────────────────────────────────

function AgentStatusBar({ step, progress, agentIdx, stepNum, total, failed, isPaused, onTogglePause }: { step: Invoice['agentSteps'][0] | undefined; progress: number; agentIdx: number; stepNum: number; total: number; failed: boolean; isPaused: boolean; onTogglePause: () => void }) {
  if (!step) return null
  const currentAgent = step.agents[agentIdx] ?? step.agents[0]
  return (
    <div style={{ padding: '12px 28px', background: failed ? '#fdecea' : '#f6f7f7', borderBottom: '1px solid #e4e6e7', flexShrink: 0, transition: 'background 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          {failed ? (
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#b91f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CloseIcon size={12} /></div>
          ) : (
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #e4e6e7', borderTopColor: '#1a3a6b', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          )}
          <div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: failed ? '#b91f1f' : '#1d2f36', fontFamily: 'Cabin, sans-serif' }}>{step.name}</span>
            {!failed && <span style={{ fontSize: '13px', color: '#6b767b', marginLeft: '8px', fontFamily: 'Lato, sans-serif' }}>Agent: <span style={{ color: '#1a3a6b', fontWeight: 600 }}>{currentAgent}</span></span>}
            {failed && <span style={{ fontSize: '13px', color: '#b91f1f', marginLeft: '8px', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>Processing halted</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={onTogglePause} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: isPaused ? '#fff3d6' : '#fff', border: `1px solid ${isPaused ? '#b06b00' : '#c8cccf'}`, borderRadius: '6px', color: isPaused ? '#b06b00' : '#6b767b', fontSize: '12px', fontFamily: 'Lato, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <div style={{ fontSize: '13px', color: failed ? '#b91f1f' : '#6b767b', fontFamily: 'Lato, sans-serif' }}>
            Step <strong style={{ color: failed ? '#b91f1f' : '#1d2f36' }}>{stepNum + 1}</strong> / {total}&nbsp;·&nbsp;<strong style={{ color: failed ? '#b91f1f' : '#1a3a6b' }}>{Math.round(progress)}%</strong>
          </div>
        </div>
      </div>
      <div style={{ width: '100%', height: '5px', background: '#e4e6e7', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: failed ? '#b91f1f' : 'linear-gradient(90deg, #1a3a6b 0%, #62D84E 100%)', borderRadius: '3px', transition: 'width 0.06s linear' }} />
      </div>
    </div>
  )
}

// ─── Agent Huddle ──────────────────────────────────────────────────────────────

function AgentHuddle({ steps, currentStep, progress, completed, isFailed, isDone, isCollapsed, onToggle, invoice }: { steps: Invoice['agentSteps']; currentStep: number; progress: number; completed: Set<number>; isFailed: boolean; isDone: boolean; isCollapsed?: boolean; onToggle?: () => void; invoice?: Invoice }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())

  const toggleAgent = (key: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const entries: Array<{
    agentName: string
    isCurrentEntry: boolean
    isEntryFailed: boolean
    isEntryComplete: boolean
    stepIdx: number
  }> = []

  for (let si = 0; si < steps.length; si++) {
    if (!completed.has(si) && si !== currentStep) continue
    const step = steps[si]
    const stepCompleted = completed.has(si)
    const stepFailed = si === currentStep && isFailed && !stepCompleted
    const stepCurrent = si === currentStep && !stepCompleted && !stepFailed

    const visibleAgents = stepCurrent
      ? step.agents.filter((_, i) => {
          const pctPerAgent = 100 / step.agents.length
          return progress >= i * pctPerAgent + 2
        })
      : step.agents

    for (let ai = 0; ai < visibleAgents.length; ai++) {
      const agentName = visibleAgents[ai]
      const isLastInStep = ai === step.agents.length - 1
      const isCurrentEntry = stepCurrent && ai === visibleAgents.length - 1
      const isEntryFailed = stepFailed && isLastInStep
      const isEntryComplete = stepCompleted || (!isCurrentEntry && !isEntryFailed)

      entries.push({ agentName, isCurrentEntry, isEntryFailed, isEntryComplete, stepIdx: si })
    }
  }

  // Group entries by stepIdx for stage-level headers
  const groups: Array<{ stepIdx: number; entries: typeof entries }> = []
  let currentGroup: (typeof groups)[0] | null = null
  for (const entry of entries) {
    if (!currentGroup || currentGroup.stepIdx !== entry.stepIdx) {
      currentGroup = { stepIdx: entry.stepIdx, entries: [] }
      groups.push(currentGroup)
    }
    currentGroup.entries.push(entry)
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* Header bar */}
      <div onClick={onToggle} style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, cursor: onToggle ? 'pointer' : 'default', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #f0f1f1' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isDone ? '#1b823f' : isFailed ? '#b91f1f' : '#1a3a6b', flexShrink: 0, animation: (!isDone && !isFailed) ? 'pulse-ring 1.5s infinite' : 'none' }} />
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '11px', fontWeight: 700, color: '#6b767b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Agent Activity</span>
        <span style={{ fontSize: '11px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>{completed.size} / {steps.length} stages</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', transition: 'transform 0.25s ease', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4.5L6 8L10 4.5" stroke="#6b767b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </div>

      {/* Scrollable trace content */}
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto' }}>
        {groups.map(group => {
          const step = steps[group.stepIdx]
          const isDoneGroup = completed.has(group.stepIdx)
          const isRunningGroup = group.stepIdx === currentStep && !isDoneGroup && !isFailed
          const isFailedGroup = group.stepIdx === currentStep && isFailed && !isDoneGroup

          return (
            <div key={group.stepIdx}>
              {/* Stage header */}
              <div style={{ padding: '6px 16px', background: '#f8f9fa', borderTop: group.stepIdx > 0 ? '1px solid #f0f1f1' : 'none', borderBottom: '1px solid #f0f1f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: isDoneGroup ? '#1b823f' : isFailedGroup ? '#b91f1f' : '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isDoneGroup ? <CheckIcon size={10} /> : isFailedGroup ? <CloseIcon size={10} /> : <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', fontFamily: 'Cabin, sans-serif' }}>{group.stepIdx + 1}</span>}
                </div>
                <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '12px', fontWeight: 700, color: '#1d2f36', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {isRunningGroup && <span style={{ fontSize: '11px', color: '#1a3a6b', fontWeight: 600, fontFamily: 'Lato, sans-serif', display: 'flex', alignItems: 'center', gap: '3px' }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1a3a6b', animation: 'pulse-ring 1.5s infinite' }} />Running</span>}
                  {isDoneGroup && <span style={{ fontSize: '11px', color: '#1b823f', fontWeight: 600, fontFamily: 'Lato, sans-serif' }}>✓ Done</span>}
                  {isFailedGroup && <span style={{ fontSize: '11px', color: '#b91f1f', fontWeight: 600, fontFamily: 'Lato, sans-serif' }}>✗ Failed</span>}
                  <span style={{ fontSize: '11px', color: '#c8cccf', fontFamily: 'Lato, sans-serif' }}>·</span>
                  <span style={{ fontSize: '11px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>{step.agents.length} agents</span>
                </div>
              </div>

              {/* Agent entries for this stage */}
              <div style={{ padding: '10px 16px 6px', position: 'relative' }}>
                {group.entries.length > 0 && (
                  <div style={{ position: 'absolute', left: '29px', top: 0, bottom: 0, borderLeft: '2px dashed #e4e6e7', pointerEvents: 'none', zIndex: 0 }} />
                )}
                {group.entries.map((entry, i) => {
                  const entryKey = `${group.stepIdx}-${entry.agentName}`
                  const isExpanded = expandedAgents.has(entryKey)
                  const isNonPO = invoice && !invoice.extractedFields.poNumber
                  const isInternalApproval = invoice?.glMissingVariant === 'internal-approval'
                  const detailMsgs = (() => {
                    if (entry.agentName === 'Matching & GL Advisor (Ma)' && isNonPO) {
                      return [
                        'Invoice confirmed as Non-PO — no purchase order reference detected',
                        'Querying SAP S/4HANA vendor master for supplier spend history and GL coding patterns',
                        'Retrieving cost-centre data and advisory services supplier category context',
                        'Analysing invoice description against Bertelsmann GL account taxonomy',
                        isInternalApproval
                          ? 'Scoring 3 candidate GL accounts — none exceeds the 60% auto-coding confidence threshold'
                          : 'Scoring candidate GL accounts against the 60% auto-coding confidence threshold',
                        isInternalApproval
                          ? 'GL ambiguity confirmed — escalating to Cost Centre Owner for determination'
                          : 'GL coding candidate identified — proceeding to NPO approval workflow',
                      ]
                    }
                    if (entry.agentName === 'NPO Exception Orchestrator (Eg)' && isInternalApproval) {
                      return [
                        'Invoice category confirmed: Non-PO service invoice — PO path not applicable',
                        'GL coding result received: 3 conflicting accounts, no single code above 60% threshold',
                        'Checking Decision of Authority matrix for invoice amount €42,840 and advisory category',
                        'Dual cost-centre approval required — identifying Cost Centre Owner and AP Lead',
                        'Approval request generated — routing to Cost Centre Owner and AP Lead for GL determination',
                      ]
                    }
                    return AGENT_HUDDLE_MESSAGES[entry.agentName] ?? []
                  })()
                  const inProgressText = (entry.agentName === 'Matching & GL Advisor (Ma)' && isNonPO)
                    ? 'Querying SAP S/4HANA vendor master, spend history, and GL coding patterns...'
                    : (AGENT_IN_PROGRESS[entry.agentName] ?? 'Processing...')
                  const completionText = (() => {
                    if (entry.agentName === 'Matching & GL Advisor (Ma)' && isNonPO) {
                      return isInternalApproval
                        ? 'GL ambiguity detected — 3 competing accounts, none above 60% confidence threshold'
                        : 'Vendor spend history and GL patterns queried — coding candidate determined'
                    }
                    if (entry.agentName === 'NPO Exception Orchestrator (Eg)' && isInternalApproval) {
                      return 'GL ambiguity confirmed — dual cost-centre approval workflow initiated'
                    }
                    return AGENT_COMPLETION[entry.agentName] ?? (entry.isEntryFailed ? 'Error — manual intervention required' : 'Task complete')
                  })()

                  return (
                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < group.entries.length - 1 ? '14px' : '10px', position: 'relative', zIndex: 1, animation: 'fadeInUp 0.3s ease-out', marginLeft: SUPER_AGENTS.has(entry.agentName) ? '8px' : '48px' }}>
                      {!SUPER_AGENTS.has(entry.agentName) && (
                        <div style={{ position: 'absolute', left: '-28px', top: '14px', width: '24px', height: '1px', borderTop: '1.5px dashed #c8cccf', pointerEvents: 'none', zIndex: 0 }} />
                      )}
                      <AgentAvatar name={entry.agentName} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Name + chevron beside name, status icons at right */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Cabin, sans-serif', color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{entry.agentName}</span>
                            {detailMsgs.length > 0 && (entry.isEntryComplete || entry.isEntryFailed) && (
                              <button onClick={(e) => { e.stopPropagation(); toggleAgent(entryKey) }} style={{ background: 'none', border: 'none', padding: '2px 3px', margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, borderRadius: '3px', lineHeight: 1 }}>
                                <span style={{ display: 'inline-flex', transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 3.5L5 6.5L8.5 3.5" stroke="#b0b7bc" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </span>
                              </button>
                            )}
                          </div>
                          {entry.isCurrentEntry && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1a3a6b', animation: 'pulse-ring 1.5s infinite', flexShrink: 0 }} />}
                          {entry.isEntryComplete && !entry.isEntryFailed && <CheckIcon size={11} color="#1b823f" />}
                          {entry.isEntryFailed && <CloseIcon size={11} color="#b91f1f" />}
                        </div>
                        {/* Contextual status phrase */}
                        {entry.isCurrentEntry && (
                          <div style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', lineHeight: '1.4', fontStyle: 'italic' }}>{inProgressText}</div>
                        )}
                        {(entry.isEntryComplete || entry.isEntryFailed) && (
                          <div style={{ fontSize: '12px', color: entry.isEntryFailed ? '#b91f1f' : '#1b823f', fontFamily: 'Lato, sans-serif', lineHeight: '1.4', fontWeight: 500 }}>
                            {completionText}
                          </div>
                        )}
                        {/* Expanded detail trace */}
                        {isExpanded && (
                          <div style={{ marginTop: '5px', paddingLeft: '8px' }}>
                            {detailMsgs.slice(0, 5).map((msg, mi) => (
                              <div key={mi} style={{ fontSize: '11px', color: '#6b767b', fontFamily: 'Lato, sans-serif', lineHeight: '1.6', display: 'flex', gap: '6px' }}>
                                <span style={{ color: '#c8cccf', flexShrink: 0, fontWeight: 700 }}>·</span>
                                <span>{msg}</span>
                              </div>
                            ))}
                            {detailMsgs.length > 5 && (
                              <div style={{ fontSize: '10px', color: '#a8b0b5', fontFamily: 'Lato, sans-serif', paddingLeft: '12px', marginTop: '1px' }}>+{detailMsgs.length - 5} more checks</div>
                            )}
                          </div>
                        )}
                        {isExpanded && invoice && (entry.isEntryComplete || entry.isEntryFailed) && (
                          <AgentToolScreen agentName={entry.agentName} invoice={invoice} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Terminal completion / failure entry */}
        {isDone && (
          <div style={{ display: 'flex', gap: '10px', padding: '8px 16px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckIcon size={14} />
            </div>
            <div style={{ flex: 1, paddingTop: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1b823f', fontFamily: 'Cabin, sans-serif' }}>All stages complete — invoice routed for approval</span>
            </div>
          </div>
        )}
        {isFailed && !isDone && (
          <div style={{ display: 'flex', gap: '10px', padding: '8px 16px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#b91f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CloseIcon size={14} />
            </div>
            <div style={{ flex: 1, paddingTop: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#b91f1f', fontFamily: 'Cabin, sans-serif' }}>Exception detected — manual intervention required</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── InfoCard / FieldRow ────────────────────────────────────────────────────────

function InfoCard({ title, children, status = 'complete' }: { title: string; children: React.ReactNode; status?: 'complete' | 'pending' }) {
  const isPending = status === 'pending'
  return (
    <div style={{ background: '#fff', border: `1px solid ${isPending ? '#b06b00' : '#e4e6e7'}`, borderRadius: '8px', marginBottom: '16px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{ padding: '11px 20px', background: isPending ? '#fff8ee' : '#f6f7f7', borderBottom: `1px solid ${isPending ? '#e0c080' : '#e4e6e7'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPending ? '#b06b00' : '#1b823f', display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1d2f36' }}>{title}</span>
        {isPending
          ? <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#b06b00', fontWeight: 600 }}>Pending Approval</span>
          : <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#1b823f', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckIcon size={13} color="#1b823f" /> Complete</span>
        }
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

function ConfidenceRagRow({ label, score }: { label: string; score: number }) {
  const level = score >= 90 ? 'Strong' : score >= 70 ? 'Moderate' : 'Low'
  const style =
    level === 'Strong'
      ? { bg: '#e8f5ee', color: '#1b823f' }
      : level === 'Moderate'
      ? { bg: '#fff3d6', color: '#b06b00' }
      : { bg: '#fdecea', color: '#b91f1f' }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #f0f1f1', gap: '12px' }}>
      <span style={{ width: '200px', flexShrink: 0, fontSize: '14px', color: '#6b767b', fontFamily: 'Lato, sans-serif', paddingTop: '1px' }}>{label}</span>
      <span style={{ display: 'inline-block', background: style.bg, color: style.color, fontSize: '13px', fontWeight: 700, padding: '2px 10px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>{level}</span>
    </div>
  )
}

function FieldRow({ label, value, status, mono }: { label: string; value: string | number; status?: 'ok' | 'warn' | 'error'; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #f0f1f1', gap: '12px' }}>
      <span style={{ width: '200px', flexShrink: 0, fontSize: '14px', color: '#6b767b', fontFamily: 'Lato, sans-serif', paddingTop: '1px' }}>{label}</span>
      <span style={{ flex: 1, fontSize: '15px', fontFamily: mono ? 'monospace' : 'Lato, sans-serif', color: status === 'ok' ? '#1b823f' : status === 'error' ? '#b91f1f' : '#1d2f36', fontWeight: (status === 'ok' || status === 'error') ? 600 : 400 }}>
        {status === 'ok' && <span style={{ display: 'inline-flex', marginRight: '6px', verticalAlign: 'middle' }}><CheckIcon size={15} color="#1b823f" /></span>}
        {status === 'error' && <span style={{ display: 'inline-flex', marginRight: '6px', verticalAlign: 'middle' }}><CloseIcon size={15} color="#b91f1f" /></span>}
        {value}
      </span>
    </div>
  )
}

// ─── Line Items Accordion ──────────────────────────────────────────────────────

function LineItemsAccordion({ items, showStatus }: { items: LineItem[]; showStatus?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: '14px', border: '1px solid #e4e6e7', borderRadius: '6px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', background: '#f6f7f7', border: 'none', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'Cabin, sans-serif' }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Line Items ({items.length})</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="2,4 6,8 10,4" stroke="#6b767b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>
      {open && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'Lato, sans-serif' }}>
          <thead>
            <tr style={{ background: '#f6f7f7' }}>
              <th style={{ textAlign: 'left', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e4e6e7' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e4e6e7' }}>QTY</th>
              <th style={{ textAlign: 'right', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e4e6e7' }}>Unit Price</th>
              {showStatus && <th style={{ textAlign: 'right', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e4e6e7' }}>Status</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f1f1' }}>
                <td style={{ padding: '7px 12px', color: '#1d2f36' }}>{item.description}</td>
                <td style={{ padding: '7px 12px', textAlign: 'right', color: '#1d2f36' }}>{item.qty}</td>
                <td style={{ padding: '7px 12px', textAlign: 'right', color: '#1d2f36' }}>${item.unitPrice.toFixed(2)}</td>
                {showStatus && <td style={{ padding: '7px 12px', textAlign: 'right' }}><span style={{ background: '#e8f5ee', color: '#1b823f', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px' }}>✓ Matched</span></td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Completion Cards ─────────────────────────────────────────────────────────

function CompletionCards({ invoice, completed }: { invoice: Invoice; completed: Set<number> }) {
  const f = invoice.extractedFields
  const isPO = invoice.category === 'PO'
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: f.currency }).format(n)
  return (
    <>
      {completed.has(0) && (
        <InfoCard title="Document Information">
          <FieldRow label="Document" value={invoice.attachmentName} mono />
          <FieldRow label="Received from" value={invoice.emailSenderEmail} />
          <FieldRow label="Email subject" value={invoice.emailSubject} />
          <FieldRow label="Detected at" value={`${invoice.emailTime} · ${invoice.receivedAt}`} />
          <FieldRow label="Classification" value={isPO ? 'Purchase Invoice (PO-backed)' : 'Service Invoice (Non-PO)'} status="ok" />
          <ConfidenceRagRow label="Confidence" score={Math.min(Math.round(Object.values(invoice.extractedFields.fieldConfidences).reduce((a, b) => a + b, 0) / Object.values(invoice.extractedFields.fieldConfidences).length), (invoice.id === 'inv-9' || invoice.id === 'inv-10' || invoice.id === 'inv-11') ? 89 : 100)} />
          {f.lineItems && f.lineItems.length > 0 && <LineItemsAccordion items={f.lineItems} />}
        </InfoCard>
      )}
      {completed.has(2) && (
        <InfoCard title="Validation Results">
          <FieldRow label="Field Completeness" value="All mandatory fields present" status="ok" />
          <FieldRow label="Format Check" value="All fields correctly formatted" status="ok" />
          <FieldRow label="Supplier Verification" value={`${f.supplierId} verified in SAP`} status="ok" />
          <FieldRow label="Bank Account" value={f.bankAccountStatus} status="ok" />
          <FieldRow label="OFAC Screening" value="Clear — no sanctions match" status="ok" />
          <FieldRow label="Duplicate Check" value={f.duplicateCheck} status={f.duplicateCheck === 'DUPLICATE DETECTED' ? 'error' : 'ok'} />
        </InfoCard>
      )}
      {completed.has(3) && (
        <>
          {(() => {
            const isGLMissing = !isPO && invoice.failType === 'gl-missing' && (f.conflictingGLCodes?.length ?? 0) > 0
            const conflictCodes = f.conflictingGLCodes ?? []
            const highestConf = conflictCodes.length > 0 ? Math.max(...conflictCodes.map(c => c.percentage)) : 0
            return (
              <InfoCard title={isPO ? 'PO & Service Entry' : 'GL Coding & Cost Assignment'} status={isGLMissing ? 'pending' : 'complete'}>
                {isPO ? (
                  <>
                    <FieldRow label="PO Number" value={f.poNumber ?? '—'} mono />
                    <FieldRow label="PO Amount" value={fmt(f.totalAmount)} />
                    <FieldRow label="SES / GR Number" value={f.sesNumber ?? f.grNumber ?? '—'} mono />
                    <FieldRow label="SES Status" value="Booked in SAP" status="ok" />
                    <FieldRow label="Tolerance Rule" value="± 0.5% of PO value" />
                  </>
                ) : isGLMissing ? (
                  <>
                    <FieldRow label="GL Account" value="Undetermined — 3 conflicting candidates" status="error" />
                    <FieldRow label="Cost Center" value={f.costCenter ?? 'Pending GL determination'} />
                    <FieldRow label="Tax Code" value={f.taxCode ?? 'DE-VAT-STD'} mono />
                    <FieldRow label="Highest AI Confidence" value={`${highestConf}% — below 60% auto-coding threshold`} status="warn" />
                    <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontFamily: 'Cabin, sans-serif' }}>Conflicting GL Candidates</div>
                    {conflictCodes.map(c => (
                      <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f0f1f1', fontSize: '13px', fontFamily: 'Lato, sans-serif' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#b91f1f' }}>{c.code}</span>
                        <span style={{ color: '#5a6a7a' }}>{c.label}</span>
                        <span style={{ color: '#b06b00', fontWeight: 600 }}>{c.percentage}%</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <FieldRow label="GL Account" value={f.glAccount ?? '—'} />
                    <FieldRow label="Cost Center" value={f.costCenter ?? '—'} />
                    {f.accountNumber && <FieldRow label="Account Number" value={f.accountNumber} mono />}
                    {f.appropriationNumber && <FieldRow label="Appropriation Number" value={f.appropriationNumber} mono />}
                    {f.parNumber && <FieldRow label="PAR Number" value={f.parNumber} mono />}
                    <FieldRow label="Business Unit" value={f.businessUnit ?? '—'} />
                    <FieldRow label="Tax Code" value={f.taxCode ?? '—'} mono />
                    {!f.appropriationNumber && <FieldRow label="Coding Confidence" value={`${f.codingConfidence ?? 0}% — AI model above threshold`} status="ok" />}
                  </>
                )}
              </InfoCard>
            )
          })()}
          <SupplierDetailsCard invoice={invoice} />
        </>
      )}
      {completed.has(4) && (
        <InfoCard title={isPO ? '3-Way Match Results' : 'Compliance & GL Validation'}>
          {isPO ? (
            <>
              <FieldRow label="Invoice Amount" value={fmt(f.totalAmount)} />
              <FieldRow label="PO Amount" value={fmt(f.totalAmount)} />
              <FieldRow label="Variance" value={`${fmt(0)} (within ±0.5% tolerance)`} status="ok" />
              <FieldRow label="SES / GR Confirmation" value="Confirmed" status="ok" />
              <FieldRow label="Duplicate Detection" value={f.duplicateCheck} status={f.duplicateCheck === 'DUPLICATE DETECTED' ? 'error' : 'ok'} />
              <FieldRow label="Anomaly Scan" value="Clear — no anomalies detected" status="ok" />
              <FieldRow label="Match Status" value={f.matchStatus ?? 'Passed'} status="ok" />
              {f.lineItems && f.lineItems.length > 0 && <LineItemsAccordion items={f.lineItems} showStatus />}
            </>
          ) : (
            <>
              <FieldRow label="Tax Validation" value="VAT code validated via SAP DRC" status="ok" />
              <FieldRow label="Coding Confidence" value={`${f.codingConfidence ?? 0}% — above 85% threshold`} status="ok" />
              <FieldRow label="Duplicate Check" value={f.duplicateCheck} status="ok" />
              <FieldRow label="Compliance Status" value={f.complianceStatus ?? 'Compliant'} status="ok" />
              <FieldRow label="AP Route" value="Standard non-PO approval workflow (SLA: 48 hrs)" status="ok" />
            </>
          )}
        </InfoCard>
      )}
    </>
  )
}

// ─── Live fields card (typing animation) ────────────────────────────────────

function LiveFieldsCard({ invoice, isExtractionActive, isExtractionDone, extractionAgentIdx }: {
  invoice: Invoice
  isExtractionActive: boolean
  isExtractionDone: boolean
  extractionAgentIdx: number
}) {
  const f = invoice.extractedFields
  const fmtCur = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: f.currency }).format(n)
  const fields = [
    { label: 'Invoice No.', value: f.invoiceNumber },
    { label: 'Supplier', value: f.supplierName },
    { label: 'Invoice Date', value: f.invoiceDate },
    { label: 'Due Date', value: f.dueDate },
    { label: 'Total Amount', value: fmtCur(f.totalAmount) },
    { label: 'Tax', value: fmtCur(f.tax) },
    { label: 'Payment Terms', value: f.paymentTerms },
    { label: 'Currency', value: f.currency },
    ...(f.poNumber ? [{ label: 'PO Number', value: f.poNumber }] : []),
    ...(f.grNumber ? [{ label: 'GR Number', value: f.grNumber }] : []),
    ...(f.glAccount ? [{ label: 'GL Account', value: f.glAccount }] : []),
  ]

  const [typedState, setTypedState] = useState<{ fieldIdx: number; charIdx: number }>({ fieldIdx: 0, charIdx: 0 })
  const startedRef = useRef(false)
  const tidRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const posRef = useRef({ fi: 0, ci: 0 })

  // Agent 0 (Digitization) = scanning phase, just show shimmer
  // Agent 1 (Extraction)   = start populating fields
  // Agent 2 (Formatter)    = keep going (already running)
  useEffect(() => {
    if (!isExtractionActive || extractionAgentIdx < 1 || startedRef.current) return
    startedRef.current = true

    function tick() {
      const { fi, ci } = posRef.current
      if (fi >= fields.length) return
      const val = fields[fi].value
      const nextCi = ci + 1
      if (nextCi >= val.length) {
        posRef.current = { fi: fi + 1, ci: 0 }
        setTypedState({ fieldIdx: fi, charIdx: val.length })
        tidRef.current = setTimeout(tick, 34)
      } else {
        posRef.current = { fi, ci: nextCi }
        setTypedState({ fieldIdx: fi, charIdx: nextCi })
        tidRef.current = setTimeout(tick, 8)
      }
    }

    tidRef.current = setTimeout(tick, 250)
    // No cleanup return here — timer must survive dep changes (agentIdx 1→2)
  }, [extractionAgentIdx, isExtractionActive]) // eslint-disable-line react-hooks/exhaustive-deps

  // Safety: if extraction is already done when this mounts (e.g. returning after fast animation),
  // skip the typing animation and show all fields immediately.
  useEffect(() => {
    if (isExtractionDone && !startedRef.current) {
      startedRef.current = true
      setTypedState({ fieldIdx: fields.length, charIdx: 0 })
    }
  }, [isExtractionDone]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cancel timer only on unmount
  useEffect(() => {
    return () => { if (tidRef.current) clearTimeout(tidRef.current) }
  }, [])

  const statusLabel = isExtractionDone
    ? '✓ Complete'
    : isExtractionActive && extractionAgentIdx === 0
    ? 'Scanning document...'
    : isExtractionActive
    ? 'Extracting fields...'
    : 'Awaiting extraction'

  const statusColor = isExtractionDone ? '#1b823f' : '#1a3a6b'
  const dotColor = isExtractionDone ? '#1b823f' : '#1a3a6b'

  return (
    <div style={{ background: '#fff', border: '1px solid #e4e6e7', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '11px 20px', background: '#f6f7f7', borderBottom: '1px solid #e4e6e7', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1d2f36' }}>Extracted Invoice Fields</span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', fontFamily: 'Lato, sans-serif', fontWeight: 600, color: statusColor }}>
          {statusLabel}
        </span>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          {fields.map((field, idx) => {
            const isCurrent = idx === typedState.fieldIdx
            const isTyped = idx < typedState.fieldIdx
            const displayValue = isTyped
              ? field.value
              : isCurrent
              ? field.value.slice(0, typedState.charIdx)
              : null
            return (
              <div key={field.label} style={{ display: 'flex', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid #f0f1f1', gap: '10px' }}>
                <span style={{ width: '110px', flexShrink: 0, fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', paddingTop: '2px' }}>{field.label}</span>
                {displayValue === null ? (
                  <div style={{ height: '14px', flex: 1, background: 'linear-gradient(90deg, #e8e9ea 25%, #f0f1f1 50%, #e8e9ea 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '3px' }} />
                ) : (
                  <span style={{ flex: 1, fontSize: '13px', fontFamily: 'Lato, sans-serif', color: '#1d2f36', lineHeight: '1.4' }}>
                    {displayValue}
                    {isCurrent && displayValue.length < field.value.length && (
                      <span style={{ display: 'inline-block', width: '2px', height: '13px', background: '#1a3a6b', marginLeft: '1px', animation: 'blink 0.7s step-end infinite', verticalAlign: 'middle' }} />
                    )}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── GL Missing failure card ───────────────────────────────────────────────────

const GL_CODE_REPO = [
  { code: '6610-002', name: 'Marketing & Advertising', category: 'Operating Expenses', dept: 'Marketing', taxCode: 'DE-VAT-STD', desc: 'Media buying, digital advertising (SEM, display, social), print media placements, event sponsorships, and campaign media spend across the division. Includes agency media-buying fees billed separately from creative production.', usageNotes: 'Requires Marketing Director sign-off. Campaign code must be referenced in invoice notes.' },
  { code: '6620-001', name: 'Creative / Production Services', category: 'Operating Expenses', dept: 'Marketing', taxCode: 'DE-VAT-STD', desc: 'Creative-agency services including concept development, key-visual and brand design, copywriting, and asset production for campaigns. Covers studio production costs and creative retainers for the Territory / Campaign agencies.', usageNotes: 'Primary code for creative-agency vendors (e.g. Jung von Matt). Distinguish from media buying (6610-002).' },
  { code: '6630-005', name: 'Brand & Campaign', category: 'Operating Expenses', dept: 'Marketing', taxCode: 'DE-VAT-STD', desc: 'Brand and seasonal-campaign costs that span creative and media — integrated campaign programmes, brand refresh projects, and cross-channel rollouts where spend is not cleanly split between creative and media buying.', usageNotes: 'Use when an invoice mixes creative and media. Marketing Director to confirm split.' },
  { code: '6180-002', name: 'IT Managed Services', category: 'Operating Expenses', dept: 'Technology', taxCode: 'DE-VAT-STD', desc: 'Managed service provider (MSP) fees, SLA-based helpdesk and infrastructure operations, and ongoing managed IT under a master services agreement. Applies to Arvato Systems / Group IT operational run spend.', usageNotes: 'Requires Technology approval for spend > €5,000. Distinguish from Cloud & Hosting (6185-004) and Professional Services (6300-007).' },
  { code: '6185-004', name: 'Cloud & Hosting', category: 'Operating Expenses', dept: 'Technology', taxCode: 'DE-VAT-STD', desc: 'Cloud infrastructure consumption, hosting, platform subscriptions, and SaaS licences billed on usage or subscription. Covers public-cloud and private-hosting recurring costs.', usageNotes: 'Reference the cost centre and environment. Distinguish from one-off project services.' },
  { code: '6300-007', name: 'Professional Services', category: 'Operating Expenses', dept: 'Finance & Legal', taxCode: 'DE-VAT-STD', desc: 'External professional advisory fees including audit and assurance, tax advisory, and specialist project-based consulting engagements where the output is advice, analysis, or a deliverable rather than a product.', usageNotes: 'High-value invoices (> €10,000) require CFO or VP Finance approval. Distinguish from Management Consulting (6720-001).' },
  { code: '6720-001', name: 'Management Consulting', category: 'Operating Expenses', dept: 'Corporate', taxCode: 'DE-VAT-STD', desc: 'Strategy and operating-model consulting, transformation advisory, and process diagnostics from the major consulting firms (e.g. Deloitte). Applies where the engagement is advisory rather than legal or pure IT.', usageNotes: 'Requires sponsor sign-off. Reference the engagement letter. Distinguish from Project / Transformation (6810-002).' },
  { code: '6740-003', name: 'Legal & Professional Fees', category: 'Operating Expenses', dept: 'Finance & Legal', taxCode: 'DE-VAT-STD', desc: 'External legal counsel, regulatory and compliance advice, and notary/registration fees. Applies where the deliverable is legal advice or representation.', usageNotes: 'Legal department approval required. Reference the matter number.' },
  { code: '6810-002', name: 'Project / Transformation', category: 'Operating Expenses', dept: 'Corporate', taxCode: 'DE-VAT-STD', desc: 'Implementation and transformation programme costs — roadmap delivery, programme management, and change enablement linked to a defined initiative or WBS element.', usageNotes: 'Must reference the project / WBS element. Distinguish from advisory-only consulting (6720-001).' },
]

function GLCodeRepositoryDrawer({ onApplyCode, onClose }: { onApplyCode: (code: string) => void; onClose: () => void }) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null)
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '620px', background: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e6e7', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1d2f36' }}>GL Code Repository</div>
            <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Select a GL account to apply to this invoice. Expand each entry to read the full description before finalising.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}><CloseIcon size={20} color="#6b767b" /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {GL_CODE_REPO.map((gl) => {
              const isSelected = selectedCode === gl.code
              const isExpanded = expandedDesc === gl.code
              return (
                <div key={gl.code} style={{ background: isSelected ? '#e7ecf5' : '#fff', border: `1.5px solid ${isSelected ? '#1a3a6b' : '#e4e6e7'}`, borderRadius: '8px', overflow: 'hidden', transition: 'border-color 0.15s ease' }}>
                  {/* Header row — click to select */}
                  <div onClick={() => setSelectedCode(isSelected ? null : gl.code)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: isSelected ? '#1a3a6b' : '#1d2f36' }}>{gl.code}</span>
                        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1d2f36' }}>{gl.name}</span>
                        {isSelected && <span style={{ marginLeft: 'auto', background: '#1a3a6b', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={14} /></span>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[gl.category, gl.dept, gl.taxCode].map(tag => (
                          <span key={tag} style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Lato, sans-serif', background: '#f6f7f7', border: '1px solid #e4e6e7', borderRadius: '3px', padding: '2px 7px', color: '#6b767b' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Accordion toggle for description */}
                  <div
                    onClick={(e) => { e.stopPropagation(); setExpandedDesc(isExpanded ? null : gl.code) }}
                    style={{ padding: '8px 16px', borderTop: '1px solid #f0f1f1', background: isExpanded ? '#f8fafc' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', userSelect: 'none' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}><path d="M2 4l4 4 4-4" stroke="#6b767b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>{isExpanded ? 'Collapse description' : 'Read full description & usage notes'}</span>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f0f1f1', background: '#f8fafc' }}>
                      <div style={{ fontSize: '13px', color: '#3a4a50', fontFamily: 'Lato, sans-serif', lineHeight: '1.65', marginBottom: '12px' }}>{gl.desc}</div>
                      <div style={{ background: '#fff3d6', border: '1px solid #e0c080', borderRadius: '6px', padding: '10px 14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a4a00', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontFamily: 'Cabin, sans-serif' }}>Usage Notes</div>
                        <div style={{ fontSize: '13px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', lineHeight: '1.55' }}>{gl.usageNotes}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        {selectedCode && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e4e6e7', background: '#f6f7f7', flexShrink: 0 }}>
            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>
              Selected: <strong style={{ fontFamily: 'monospace', color: '#1a3a6b' }}>{selectedCode}</strong> — {GL_CODE_REPO.find(g => g.code === selectedCode)?.name}
            </div>
            <button onClick={() => { onApplyCode(selectedCode); onClose() }} style={{ width: '100%', padding: '12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Use This Code</button>
          </div>
        )}
      </div>
    </>
  )
}

function GLMissingCard({ invoice, appliedCode, manualGLCode, onManualChange, onShowRepo, glApprovalEmailSent, glApprovalEmailReceived }: { invoice: Invoice; appliedCode: string | null; manualGLCode: string; onManualChange: (v: string) => void; onShowRepo: () => void; glApprovalEmailSent?: boolean; glApprovalEmailReceived?: boolean }) {
  // State 4: GL approval received → green card
  if (glApprovalEmailReceived) {
    return (
      <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#e8f5ee', padding: '14px 20px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>GL Code Approved</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#e8f5ee', border: '1px solid #1b823f', color: '#1b823f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>APPROVED</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#e8f5ee', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckIcon size={18} color="#1b823f" />
            <span style={{ fontSize: '14px', color: '#1b823f', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>GL Code <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{appliedCode}</span> approved and ready for invoice approval</span>
          </div>
        </div>
      </div>
    )
  }

  // States 1–3: exception card with evolving status notices
  return (
    <div style={{ background: '#fff', border: '2px solid #b91f1f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
      <div style={{ background: '#fdecea', padding: '14px 20px', borderBottom: '1px solid #f5c0be', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#b91f1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>!</div>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#b91f1f' }}>Agent Exception — Manual Intervention Required</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#fdecea', border: '1px solid #b91f1f', color: '#b91f1f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>HIGH</span>
      </div>
      <div style={{ padding: '20px' }}>
        {/* State 3: email sent, waiting for reply */}
        {glApprovalEmailSent && (
          <div style={{ background: '#fff3d6', border: '1px solid #b06b00', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #b06b00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#b06b00' }}>GL Approval Email Sent — Awaiting Response</div>
              <div style={{ fontSize: '13px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Approval request sent. Check your Outlook inbox for a reply.</div>
            </div>
          </div>
        )}
        {/* State 2: code applied, approval email not yet sent */}
        {appliedCode && !glApprovalEmailSent && (
          <div style={{ background: '#fff3d6', border: '1px solid #b06b00', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#b06b00" strokeWidth="1.5"/><path d="M8 5v4" stroke="#b06b00" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.8" fill="#b06b00"/></svg>
            <div>
              <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#b06b00' }}>GL Code Applied — Approval Required</div>
              <div style={{ fontSize: '13px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Code <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{appliedCode}</span> applied. Send a GL approval email to proceed.</div>
            </div>
          </div>
        )}

        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1d2f36', marginBottom: '10px' }}>GL Code Not Found</div>
        <p style={{ fontSize: '15px', color: '#5a2020', lineHeight: '1.6', fontFamily: 'Lato, sans-serif', marginBottom: '16px', background: '#fdecea', padding: '12px 16px', borderRadius: '6px', borderLeft: '3px solid #b91f1f' }}>{invoice.failMessage}</p>
        <div style={{ border: '1px solid #e4e6e7', borderRadius: '6px', padding: '12px 16px', marginBottom: '12px', background: '#f9fafb' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px', fontFamily: 'Cabin, sans-serif' }}>Notification — Decision of Authority Matrix</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '8px 12px', minWidth: '160px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, fontFamily: 'Cabin, sans-serif', flexShrink: 0 }}>MW</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d2f36', fontFamily: 'Cabin, sans-serif' }}>Markus Weber</div>
                <div style={{ fontSize: '11px', background: '#e7ecf5', color: '#1a3a6b', borderRadius: '3px', padding: '1px 6px', display: 'inline-block', fontWeight: 600, fontFamily: 'Lato, sans-serif' }}>Cost Centre Owner</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '8px 12px', minWidth: '160px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #831843 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, fontFamily: 'Cabin, sans-serif', flexShrink: 0 }}>AK</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d2f36', fontFamily: 'Cabin, sans-serif' }}>Anja Krüger</div>
                <div style={{ fontSize: '11px', background: '#e8f5ee', color: '#1b823f', borderRadius: '3px', padding: '1px 6px', display: 'inline-block', fontWeight: 600, fontFamily: 'Lato, sans-serif' }}>Head of Department</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: '#fff3d6', border: '1px solid #b06b00', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#b06b00', marginBottom: '4px', fontFamily: 'Cabin, sans-serif' }}>Recommended Action</div>
          <p style={{ fontSize: '15px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>Select or enter a GL code below and apply it. Then send a GL approval email to get authorization before the invoice can be processed.</p>
        </div>

        {/* State 1: no code applied — show selection UI */}
        {!appliedCode && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', fontFamily: 'Cabin, sans-serif' }}>AI-Recommended GL Codes</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {(invoice.id === 'inv-10'
                ? [{ code: '6180-002', label: 'IT Services', conf: '74%' }, { code: '6300-007', label: 'Professional Services', conf: '68%' }, { code: '6250-004', label: 'Training & Development', conf: '61%' }]
                : [{ code: '6200-001', label: 'Office Equipment', conf: '74%' }, { code: '6210-005', label: 'Stationery & Supplies', conf: '68%' }, { code: '6150-008', label: 'Facilities & Services', conf: '61%' }]
              ).map(item => (
                <button key={item.code} onClick={() => onManualChange(item.code)} style={{ background: manualGLCode === item.code ? '#e7ecf5' : '#f6f7f7', border: `1.5px solid ${manualGLCode === item.code ? '#1a3a6b' : '#e4e6e7'}`, borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: manualGLCode === item.code ? '#1a3a6b' : '#b91f1f' }}>{item.code}</div>
                  <div style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#b06b00', fontWeight: 600, marginTop: '2px' }}>AI: {item.conf}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={manualGLCode}
                onChange={e => onManualChange(e.target.value)}
                placeholder="Enter GL code manually (e.g. 6200-001)"
                style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #c8cccf', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace', outline: 'none', background: '#fff', color: '#1d2f36' }}
              />
              <button onClick={onShowRepo} style={{ padding: '9px 14px', background: '#fff', border: '1px solid #c8cccf', borderRadius: '6px', fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>View GL Repository</button>
            </div>
          </div>
        )}

        {/* States 2 & 3: applied code confirmation row */}
        {appliedCode && (
          <div style={{ background: '#e8f5ee', border: '1px solid #1b823f', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckIcon size={18} color="#1b823f" />
            <span style={{ fontSize: '14px', color: '#1b823f', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>GL Code applied: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{appliedCode}</span></span>
          </div>
        )}
      </div>
    </div>
  )
}

function MetroGLMissingCard({ invoice, metroGLApprovalSent, metroApproved, metroInvoiceApproved }: { invoice: Invoice; metroGLApprovalSent?: boolean; metroApproved?: boolean; metroInvoiceApproved?: boolean }) {
  const conflictingCodes = invoice.extractedFields.conflictingGLCodes ?? []

  // Terminal: invoice approved
  if (metroInvoiceApproved) {
    return (
      <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#e8f5ee', padding: '14px 20px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>Invoice Approved — Sent to SAP Payment Run</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#e8f5ee', border: '1px solid #1b823f', color: '#1b823f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>APPROVED</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#e8f5ee', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckIcon size={18} color="#1b823f" />
            <span style={{ fontSize: '14px', color: '#1b823f', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>GL code <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>6720-001 (Management Consulting)</span> approved by Markus Weber & Anja Krüger. Invoice routed for payment processing.</span>
          </div>
        </div>
      </div>
    )
  }

  // State: approval granted — show green card
  if (metroApproved) {
    return (
      <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#e8f5ee', padding: '14px 20px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>GL Code Approved — Ready for Invoice Approval</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#e8f5ee', border: '1px solid #1b823f', color: '#1b823f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>APPROVED</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#e8f5ee', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckIcon size={18} color="#1b823f" />
            <span style={{ fontSize: '14px', color: '#1b823f', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>GL code <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>6720-001 (Management Consulting)</span> confirmed by Markus Weber (Cost Centre Owner) and authorised by Anja Krüger (AP Lead). Invoice is ready for approval.</span>
          </div>
        </div>
      </div>
    )
  }

  // State: approval sent — show amber waiting card
  if (metroGLApprovalSent) {
    return (
      <div style={{ background: '#fff', border: '2px solid #b06b00', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#fff3d6', padding: '14px 20px', borderBottom: '1px solid #e0c080', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2.5px solid #b06b00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#b06b00' }}>GL Code — Internal Approval Required</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#fff3d6', border: '1px solid #b06b00', color: '#b06b00', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>AWAITING RESPONSE</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#fff3d6', border: '1px solid #b06b00', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #b06b00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#b06b00' }}>GL Code Approval Sent — Awaiting Response from Markus Weber & Anja Krüger</div>
              <div style={{ fontSize: '13px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Approval request sent to m.weber@bertelsmann.de · CC: a.krueger@bertelsmann.de. Check your Outlook inbox for a reply.</div>
            </div>
          </div>
          {conflictingCodes.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {conflictingCodes.map(item => (
                <div key={item.code} style={{ background: '#f6f7f7', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '8px 12px', minWidth: '140px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#b91f1f' }}>{item.code}</div>
                  <div style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#b06b00', fontWeight: 600, marginTop: '2px' }}>AI: {item.percentage}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default state: show conflicting codes, no action taken yet
  return (
    <div style={{ background: '#fff', border: '2px solid #b91f1f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
      <div style={{ background: '#fdecea', padding: '14px 20px', borderBottom: '1px solid #f5c0be', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#b91f1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>!</div>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#b91f1f' }}>GL Code — Internal Approval Required</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#fdecea', border: '1px solid #b91f1f', color: '#b91f1f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>HIGH</span>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1d2f36', marginBottom: '10px' }}>GL Code Not Found — 3 Conflicting Accounts</div>
        <p style={{ fontSize: '15px', color: '#5a2020', lineHeight: '1.6', fontFamily: 'Lato, sans-serif', marginBottom: '16px', background: '#fdecea', padding: '12px 16px', borderRadius: '6px', borderLeft: '3px solid #b91f1f' }}>
          The GL Coding Agent identified 3 conflicting GL accounts. This invoice requires GL code confirmation from the Cost Centre Owner and AP Lead before payment can proceed.
        </p>
        {conflictingCodes.length > 0 && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', fontFamily: 'Cabin, sans-serif' }}>Conflicting GL Accounts</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {conflictingCodes.map(item => (
                <div key={item.code} style={{ background: '#f6f7f7', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '8px 12px', minWidth: '140px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#b91f1f' }}>{item.code}</div>
                  <div style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#b06b00', fontWeight: 600, marginTop: '2px' }}>AI: {item.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ border: '1px solid #e4e6e7', borderRadius: '6px', padding: '12px 16px', marginBottom: '12px', background: '#f9fafb' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px', fontFamily: 'Cabin, sans-serif' }}>Notification — Decision of Authority Matrix</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '8px 12px', minWidth: '160px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, fontFamily: 'Cabin, sans-serif', flexShrink: 0 }}>MW</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d2f36', fontFamily: 'Cabin, sans-serif' }}>Markus Weber</div>
                <div style={{ fontSize: '11px', background: '#e7ecf5', color: '#1a3a6b', borderRadius: '3px', padding: '1px 6px', display: 'inline-block', fontWeight: 600, fontFamily: 'Lato, sans-serif' }}>Cost Centre Owner</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '8px 12px', minWidth: '160px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #831843 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, fontFamily: 'Cabin, sans-serif', flexShrink: 0 }}>AK</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d2f36', fontFamily: 'Cabin, sans-serif' }}>Anja Krüger</div>
                <div style={{ fontSize: '11px', background: '#fef3c7', color: '#92600a', borderRadius: '3px', padding: '1px 6px', display: 'inline-block', fontWeight: 600, fontFamily: 'Lato, sans-serif' }}>AP Lead</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: '#fff3d6', border: '1px solid #b06b00', borderRadius: '6px', padding: '14px 16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#b06b00', marginBottom: '4px', fontFamily: 'Cabin, sans-serif' }}>Recommended Action</div>
          <p style={{ fontSize: '15px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>Send an internal approval request to the Cost Centre Owner and AP Lead to confirm the correct GL account before this invoice can proceed to payment.</p>
        </div>
      </div>
    </div>
  )
}

// ─── PRT Coding Card (Software & Services GL coding via PRT) ──────────────────

function PRTCodingCard({ invoice, prtApproved, glApproved, onApprove, invoiceApproved }: { invoice: Invoice; prtApproved: boolean; onConfirm: () => void; glApproved?: boolean; onApprove?: () => void; invoiceApproved?: boolean }) {
  const [step, setStep] = useState(0)

  const f = invoice.extractedFields
  const costCenter = f.costCenter ?? 'CC-ASYS-IT-0042'
  const accountNo = f.accountNumber ?? '6180-002'
  const wbsEl = f.wbsElement ?? 'D-2029.IT.805089'
  const parNo = f.parNumber ?? 'P42529'
  const approNo = f.appropriationNumber ?? '2029240740'
  const contractNo = '82580'
  const amount = '12090'
  const itemNo = 'Item#'
  const codingString = `${wbsEl}.${parNo}.${approNo}.CON${contractNo}.EUR${amount}.${itemNo}`

  const prtSteps = [
    { label: 'Navigating to SAP Project System (PS)', detail: 'Agent authenticated into SAP PS via SSO — session initiated', status: 'done' },
    { label: 'Looking up Cost Centre & Account No. in SAP', detail: `Fetched Cost Centre as ${costCenter} & Account No. as ${accountNo} from SAP. Cost Centre and Account No. matched — Appropriation No. ${approNo} · PAR No. ${parNo}`, status: 'done' },
    { label: 'Retrieving WBS element / cost object', detail: `WBS element: ${wbsEl}`, status: 'done' },
    { label: 'Retrieving Item# from the coding workbook based on Account No.', detail: `Account No. ${accountNo} → ${itemNo} (to be confirmed by reviewer)`, status: 'done' },
    { label: 'Generating WBS coding string based on cost-object rules', detail: codingString, status: 'warn' },
  ]

  useEffect(() => {
    if (prtApproved) { setStep(prtSteps.length); return }
    let i = 0
    const run = () => {
      if (i < prtSteps.length) { setStep(i + 1); i++; setTimeout(run, 900) }
    }
    setTimeout(run, 400)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (invoiceApproved) {
    return (
      <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#1b823f', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#fff' }}>Invoice Approved — Routed for Payment</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>COMPLETE</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '14px 16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1b823f', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontFamily: 'Lato, sans-serif' }}>Applied Coding String</div>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#1d2f36', wordBreak: 'break-all' }}>{codingString}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            {[
              { name: 'Daniel Roth', role: 'Requestor' },
              { name: 'Thomas Lindqvist', role: 'Head of Department' },
            ].map(a => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '8px 12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={12} /></div>
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1d2f36' }}>{a.name}</span>
                <span style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>({a.role})</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#1b823f', fontWeight: 700, fontFamily: 'Lato, sans-serif' }}>Approved</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e8f5ee', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '12px 16px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={13} /></div>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1b823f' }}>Invoice approved and routed to the SAP Payment Run for processing.</span>
          </div>
        </div>
      </div>
    )
  }

  if (glApproved) {
    return (
      <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#e8f5ee', padding: '14px 20px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>GL Code Applied &amp; Approved</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#e8f5ee', border: '1px solid #1b823f', color: '#1b823f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>APPROVED</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '14px 16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1b823f', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontFamily: 'Lato, sans-serif' }}>Applied Coding String</div>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#1d2f36', wordBreak: 'break-all' }}>{codingString}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            {[
              { name: 'Daniel Roth', role: 'Requestor', time: 'Approved' },
              { name: 'Thomas Lindqvist', role: 'Head of Department', time: 'Approved' },
            ].map(a => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '8px 12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={12} /></div>
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1d2f36' }}>{a.name}</span>
                <span style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>({a.role})</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#1b823f', fontWeight: 700, fontFamily: 'Lato, sans-serif' }}>{a.time}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onApprove}
            style={{ width: '100%', padding: '12px 0', background: '#1b823f', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <CheckIcon size={16} />
            Approve Invoice
          </button>
        </div>
      </div>
    )
  }

  if (prtApproved) {
    return (
      <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#e8f5ee', padding: '14px 20px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>WBS Coding String Confirmed — Ready for Approval</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#e8f5ee', border: '1px solid #1b823f', color: '#1b823f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>CONFIRMED</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1b823f', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontFamily: 'Lato, sans-serif' }}>Generated Coding String</div>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#1d2f36', wordBreak: 'break-all' }}>{codingString}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: '2px solid #b91f1f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
      <div style={{ background: '#fdecea', padding: '14px 20px', borderBottom: '1px solid #f5c0be', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#b91f1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>!</div>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#b91f1f' }}>Agent Exception — SAP WBS Coding Required</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#fdecea', border: '1px solid #b91f1f', color: '#b91f1f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>HIGH</span>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1d2f36', marginBottom: '10px' }}>WBS Coding — IT Services Invoice</div>
        <p style={{ fontSize: '14px', color: '#5a2020', lineHeight: '1.6', fontFamily: 'Lato, sans-serif', marginBottom: '16px', background: '#fdecea', padding: '12px 16px', borderRadius: '6px', borderLeft: '3px solid #b91f1f' }}>{invoice.failMessage}</p>

        {/* PRT Agent Trace */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#92600a', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'Lato, sans-serif', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '4px', padding: '2px 8px' }}>Agent Action</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Cabin, sans-serif' }}>WBS Coding Agent Trace</span>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          {prtSteps.map((s, idx) => {
            const done = idx < step
            const current = idx === step - 1 && step < prtSteps.length
            const isLast = idx === prtSteps.length - 1
            return (
              <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: idx < prtSteps.length - 1 ? '14px' : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: done ? (isLast ? '#b06b00' : '#1b823f') : '#e4e6e7', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                    {done ? (isLast
                      ? <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 2v4l3 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c8cccf' }} />}
                  </div>
                  {idx < prtSteps.length - 1 && <div style={{ width: '2px', flex: 1, background: done ? '#1b823f' : '#e4e6e7', marginTop: '3px', minHeight: '14px', transition: 'background 0.3s' }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: idx < prtSteps.length - 1 ? '4px' : 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: done ? '#1d2f36' : '#c8cccf', fontFamily: 'Lato, sans-serif', marginBottom: done ? '3px' : 0, transition: 'color 0.3s' }}>{s.label}</div>
                  {done && (
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: isLast ? '#7a4a00' : '#1b823f', background: isLast ? '#fff3d6' : '#f0faf5', border: `1px solid ${isLast ? '#b06b00' : '#c8e6c9'}`, borderRadius: '4px', padding: '4px 8px', wordBreak: 'break-all', marginTop: '2px' }}>{s.detail}</div>
                  )}
                  {current && !done && (
                    <div style={{ fontSize: '12px', color: '#6b767b', fontStyle: 'italic', fontFamily: 'Lato, sans-serif' }}>Processing...</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Formula reference */}
        {step >= prtSteps.length && (
          <div style={{ background: '#f0f7ff', border: '1px solid #b3d4f5', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', fontFamily: 'Cabin, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Coding String Formula — SAP WBS / Cost Object
              <span style={{ position: 'relative', display: 'inline-flex' }} className="prt-formula-tooltip-wrap">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <circle cx="7" cy="7" r="6.5" stroke="#1a3a6b" strokeWidth="1.2"/>
                  <text x="7" y="11" textAnchor="middle" fontSize="9" fill="#1a3a6b" fontFamily="Lato, sans-serif" fontWeight="700">i</text>
                </svg>
                <span className="prt-formula-tooltip" style={{ display: 'none', position: 'absolute', left: '18px', top: '-4px', background: '#1d2f36', color: '#fff', fontFamily: 'monospace', fontSize: '11px', padding: '6px 10px', borderRadius: '5px', whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  WBS.PAR.Appro#."CON"+Contract No.Currency+Amount.Item#
                </span>
              </span>
            </div>
            <style>{`.prt-formula-tooltip-wrap:hover .prt-formula-tooltip { display: block !important; }`}</style>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              {[
                { label: 'WBS Element', value: wbsEl },
                { label: 'Account No.', value: accountNo },
                { label: 'PAR No.', value: parNo },
                { label: 'Appropriation No.', value: approNo },
                { label: 'Contract No.', value: contractNo },
                { label: 'Amount', value: `€${amount}` },
                { label: 'Item# (from coding workbook)', value: itemNo },
                { label: 'Cost Centre', value: costCenter },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f6f7f7', borderRadius: '4px', padding: '6px 10px' }}>
                  <div style={{ fontSize: '10px', color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Lato, sans-serif' }}>{label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#1d2f36' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontFamily: 'Lato, sans-serif' }}>Generated Coding String</div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#b06b00', background: '#fff3d6', border: '1px solid #b06b00', borderRadius: '4px', padding: '8px 12px', wordBreak: 'break-all' }}>{codingString}</div>
          </div>
        )}

        {step >= prtSteps.length && (
          <>
            <div style={{ border: '1px solid #e4e6e7', borderRadius: '6px', padding: '12px 16px', marginBottom: '12px', background: '#f9fafb' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px', fontFamily: 'Cabin, sans-serif' }}>Notification — Decision of Authority Matrix</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '8px 12px', minWidth: '160px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, fontFamily: 'Cabin, sans-serif', flexShrink: 0 }}>AM</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d2f36', fontFamily: 'Cabin, sans-serif' }}>Daniel Roth</div>
                    <div style={{ fontSize: '11px', fontFamily: 'Lato, sans-serif', background: '#e7ecf5', color: '#1a3a6b', borderRadius: '3px', padding: '1px 6px', display: 'inline-block', fontWeight: 600 }}>Requestor</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '8px 12px', minWidth: '160px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, fontFamily: 'Cabin, sans-serif', flexShrink: 0 }}>DT</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d2f36', fontFamily: 'Cabin, sans-serif' }}>Thomas Lindqvist</div>
                    <div style={{ fontSize: '11px', fontFamily: 'Lato, sans-serif', background: '#e8f5ee', color: '#1b823f', borderRadius: '3px', padding: '1px 6px', display: 'inline-block', fontWeight: 600 }}>Head of Department</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background: '#fff3d6', border: '1px solid #b06b00', borderRadius: '6px', padding: '14px 16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#b06b00', marginBottom: '4px', fontFamily: 'Cabin, sans-serif' }}>Recommended Action</div>
              <p style={{ fontSize: '14px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>Review the coding string generated by the agent above. If correct, click <strong>Confirm &amp; Apply Coding String</strong> below to proceed to invoice approval.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Missing GR failure card ───────────────────────────────────────────────────

function MissingGRCard({ invoice, missingGRAutoResolved }: { invoice: Invoice; missingGRAutoResolved?: boolean }) {
  const info = invoice.missingGRInfo!
  if (missingGRAutoResolved) {
    return (
      <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#e8f5ee', padding: '14px 20px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>Service Entry Sheet Confirmed — 3-Way Match Resolved</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#e8f5ee', border: '1px solid #1b823f', color: '#1b823f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>RESOLVED</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#e8f5ee', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '14px 16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1b823f', fontFamily: 'Cabin, sans-serif', marginBottom: '6px' }}>Resolution Confirmed</div>
            <p style={{ fontSize: '14px', color: '#1a5c30', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>Milestone Service Entry Sheet booked by production owner <strong>{info.poOwnerName}</strong> for PO <strong>{info.poNumber}</strong>. 3-way match complete — invoice proceeds to payment processing.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[{ label: 'PO Number', value: info.poNumber }, { label: 'Confirmed by', value: info.poOwnerName }, { label: 'SES Status', value: 'Booked in SAP' }, { label: 'Match Status', value: '3-Way Match Complete' }].map(({ label, value }) => (
              <div key={label} style={{ background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: '#1b823f', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ background: '#fff', border: '2px solid #b06b00', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
      <div style={{ background: '#fff3d6', padding: '14px 20px', borderBottom: '1px solid #e0c080', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#b06b00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>!</div>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#b06b00' }}>3-Way Match Blocked — Service Entry Sheet Missing</span>
        <span style={{ marginLeft: 'auto', flexShrink: 0 }}><SlaBadge slaMinutes={info.slaMinutes} started={true} /></span>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1d2f36', marginBottom: '12px' }}>Missing Service Entry Sheet — Milestone Not Booked</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[{ label: 'PO Number', value: info.poNumber }, { label: 'Production Owner', value: info.poOwnerName }, { label: 'Owner Email', value: info.poOwnerEmail }, { label: 'Issue', value: 'No Service Entry Sheet booked in SAP for the milestone' }].map(({ label, value }) => (
            <div key={label} style={{ background: '#f6f7f7', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '10px 14px' }}>
              <div style={{ fontSize: '11px', color: '#6b767b', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff3d6', border: '1px solid #b06b00', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#b06b00', fontFamily: 'Cabin, sans-serif', marginBottom: '4px' }}>AI Recommendation</div>
          <p style={{ fontSize: '14px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>Contact production owner <strong>{info.poOwnerName}</strong> ({info.poOwnerEmail}) to confirm the milestone and book the Service Entry Sheet in SAP. Return the invoice to validation pending SES confirmation.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Duplicate failure card ────────────────────────────────────────────────────

function DuplicateCard({ invoice }: { invoice: Invoice }) {
  const info = invoice.duplicateInfo!
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  return (
    <div style={{ background: '#fff', border: '2px solid #b91f1f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
      <div style={{ background: '#fdecea', padding: '14px 20px', borderBottom: '1px solid #f5c0be', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#b91f1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>✗</div>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#b91f1f' }}>Invoice Rejected — Duplicate Detected</span>
        <span style={{ marginLeft: 'auto', flexShrink: 0 }}><SlaBadge slaMinutes={info.slaMinutes} started={true} /></span>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1d2f36', marginBottom: '12px' }}>Duplicate Invoice Detected — Rejected</div>
        <p style={{ fontSize: '14px', color: '#5a2020', lineHeight: '1.5', fontFamily: 'Lato, sans-serif', marginBottom: '16px', background: '#fdecea', padding: '12px 16px', borderRadius: '6px', borderLeft: '3px solid #b91f1f' }}>
          This invoice ({info.originalInvoiceNumber}) was already processed on <strong>{info.processedDate}</strong> as AP document <strong>{info.apDocNumber}</strong>. Payment of <strong>{fmt(info.paymentAmount)}</strong> was made via {info.paymentMethod} on {info.paymentDate}.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[{ label: 'Original Invoice', value: info.originalInvoiceNumber }, { label: 'Processed Date', value: info.processedDate }, { label: 'AP Document', value: info.apDocNumber }, { label: 'Payment Amount', value: fmt(info.paymentAmount) }, { label: 'Payment Date', value: info.paymentDate }, { label: 'Payment Method', value: info.paymentMethod }].map(({ label, value }) => (
            <div key={label} style={{ background: '#f6f7f7', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '10px 14px' }}>
              <div style={{ fontSize: '11px', color: '#6b767b', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tax Mismatch failure card ─────────────────────────────────────────────────

function TaxMismatchCard({ invoice, notificationSent, taxMismatchAutoResolved }: { invoice: Invoice; notificationSent: boolean; taxMismatchAutoResolved?: boolean }) {
  const info = invoice.taxMismatchInfo!
  if (taxMismatchAutoResolved) {
    return (
      <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#e8f5ee', padding: '14px 20px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>Tax Code Mismatch — Resolved</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#e8f5ee', border: '1px solid #1b823f', color: '#1b823f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>RESOLVED</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#e8f5ee', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '14px 16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1b823f', fontFamily: 'Cabin, sans-serif', marginBottom: '6px' }}>Resolution Confirmed</div>
            <p style={{ fontSize: '14px', color: '#1a5c30', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>Tax code corrected to <strong>{info.expectedCode}</strong> ({info.expectedRate}), confirmed by <strong>{info.buyerName}</strong> (Buyer) and <strong>{info.apLeadName}</strong> (AP Lead). Invoice proceeds with corrected tax amount.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[{ label: 'Corrected Tax Code', value: info.expectedCode }, { label: 'Corrected Rate', value: info.expectedRate }, { label: 'Confirmed by Buyer', value: info.buyerName }, { label: 'Confirmed by AP Lead', value: info.apLeadName }].map(({ label, value }) => (
              <div key={label} style={{ background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: '#1b823f', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ background: '#fff', border: '2px solid #b06b00', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
      <div style={{ background: '#fff3d6', padding: '14px 20px', borderBottom: '1px solid #e0c080', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#b06b00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>!</div>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#b06b00' }}>Tax Rate Mismatch — Tax Review Queue</span>
        <span style={{ marginLeft: 'auto', flexShrink: 0 }}><SlaBadge slaMinutes={info.slaMinutes} started={true} /></span>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1d2f36', marginBottom: '12px' }}>Tax Rate Mismatch Detected</div>
        {(() => {
          const cur = invoice.currency === 'EUR' ? '€' : '$'
          const subtotal = invoice.extractedFields.subtotal
          const detFrac = parseFloat(info.detectedRate) / 100
          const expFrac = parseFloat(info.expectedRate) / 100
          const taxDetected = subtotal * detFrac
          const taxExpected = subtotal * expFrac
          const row1 = [
            { label: 'Rate Detected from Invoice', value: info.detectedRate, warn: true },
            { label: 'Statutory Rate (SAP DRC)', value: info.expectedRate, warn: false },
            { label: 'Rate Suggested by Agent', value: info.expectedRate, warn: false },
          ]
          const row2 = [
            { label: `VAT Value (${info.detectedRate})`, value: `${cur}${taxDetected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, warn: true },
            { label: `VAT Value (${info.expectedRate})`, value: `${cur}${taxExpected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, warn: false },
            { label: 'VAT Value (by Agent)', value: `${cur}${taxExpected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, warn: false },
            { label: 'VAT Variance', value: `${cur}${info.taxDifference.toFixed(2)}`, warn: true },
          ]
          const boxStyle = (warn: boolean): React.CSSProperties => ({ background: warn ? '#fdecea' : '#f6f7f7', border: `1px solid ${warn ? '#f5c0be' : '#e4e6e7'}`, borderRadius: '6px', padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '72px' })
          const labelStyle = (warn: boolean): React.CSSProperties => ({ fontSize: '11px', color: warn ? '#b91f1f' : '#6b767b', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', lineHeight: '1.35' })
          const valueStyle = (warn: boolean): React.CSSProperties => ({ fontSize: '15px', fontWeight: 700, color: warn ? '#b91f1f' : '#1d2f36', fontFamily: 'monospace', marginTop: 'auto' })
          return (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                {row1.map(({ label, value, warn }) => (
                  <div key={label} style={boxStyle(warn)}>
                    <div style={labelStyle(warn)}>{label}</div>
                    <div style={valueStyle(warn)}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {row2.map(({ label, value, warn }) => (
                  <div key={label} style={boxStyle(warn)}>
                    <div style={labelStyle(warn)}>{label}</div>
                    <div style={valueStyle(warn)}>{value}</div>
                  </div>
                ))}
              </div>
            </>
          )
        })()}
        <div style={{ background: '#f6f7f7', border: '1px solid #e4e6e7', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#6b767b', fontFamily: 'Cabin, sans-serif', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notifications Pending</div>
          {[{ name: info.apLeadName, role: 'AP Lead', email: info.apLeadEmail }].map(person => (
            <div key={person.email} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a3a6b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, fontFamily: 'Cabin, sans-serif', flexShrink: 0 }}>{person.name.split(' ').map(w => w[0]).join('')}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{person.name} <span style={{ fontSize: '11px', color: '#6b767b', fontWeight: 400 }}>— {person.role}</span></div>
                <div style={{ fontSize: '12px', color: '#1a3a6b', fontFamily: 'Lato, sans-serif' }}>{person.email}</div>
              </div>
              {notificationSent && <span style={{ marginLeft: 'auto', background: '#e8f5ee', border: '1px solid #1b823f', color: '#1b823f', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px', fontFamily: 'Lato, sans-serif', flexShrink: 0 }}>✓ Sent</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Intercompany Mismatch card (NEW) ──────────────────────────────────────────

function ICMismatchCard({ invoice, resolved }: { invoice: Invoice; resolved?: boolean }) {
  const info = invoice.icMismatchInfo!
  const fmt = (n: number) => `€${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  if (resolved) {
    return (
      <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#e8f5ee', padding: '14px 20px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>Intercompany Reconciled via ICE</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#e8f5ee', border: '1px solid #1b823f', color: '#1b823f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>RESOLVED</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#e8f5ee', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '14px 16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1b823f', fontFamily: 'Cabin, sans-serif', marginBottom: '6px' }}>Resolution Confirmed</div>
            <p style={{ fontSize: '14px', color: '#1a5c30', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>The Predictive IC &amp; Royalty agent reconciled both sides of the posting against the ICE system (<strong>{info.iceRef}</strong>). Variance of {fmt(info.variance)} cleared between <strong>{info.entityA}</strong> and <strong>{info.entityB}</strong>. Invoice proceeds for posting.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[{ label: 'ICE Reference', value: info.iceRef }, { label: 'Reconciled by', value: info.contactName }, { label: 'Status', value: 'Cleared in ICE' }, { label: 'Both Entities', value: 'Balanced' }].map(({ label, value }) => (
              <div key={label} style={{ background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: '#1b823f', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ background: '#fff', border: '2px solid #b06b00', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
      <div style={{ background: '#fff3d6', padding: '14px 20px', borderBottom: '1px solid #e0c080', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#b06b00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>!</div>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#b06b00' }}>Intercompany Mismatch — ICE Reconciliation Required</span>
        <span style={{ marginLeft: 'auto', flexShrink: 0 }}><SlaBadge slaMinutes={info.slaMinutes} started={true} /></span>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1d2f36', marginBottom: '12px' }}>Intercompany Posting Mismatch Detected</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: `IC Invoice — ${info.entityA}`, value: fmt(info.amountA), warn: false },
            { label: `IC Clearing — ${info.entityB}`, value: fmt(info.amountB), warn: false },
            { label: 'Variance', value: fmt(info.variance), warn: true },
            { label: 'IC Invoice Doc', value: info.docA, warn: false },
            { label: 'IC Clearing Doc', value: info.docB, warn: false },
            { label: 'ICE Reference', value: info.iceRef, warn: false },
          ].map(({ label, value, warn }) => (
            <div key={label} style={{ background: warn ? '#fdecea' : '#f6f7f7', border: `1px solid ${warn ? '#f5c0be' : '#e4e6e7'}`, borderRadius: '6px', padding: '10px 14px' }}>
              <div style={{ fontSize: '11px', color: warn ? '#b91f1f' : '#6b767b', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: warn ? '#b91f1f' : '#1d2f36', fontFamily: 'monospace' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff3d6', border: '1px solid #b06b00', borderRadius: '6px', padding: '14px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#b06b00', fontFamily: 'Cabin, sans-serif', marginBottom: '4px' }}>AI Recommendation</div>
          <p style={{ fontSize: '14px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>The Predictive IC &amp; Royalty agent detected a {fmt(info.variance)} mismatch between the two sides of this posting. Trigger ICE reconciliation across the affiliated entities; IC accounting ({info.contactName}, {info.contactEmail}) will be notified.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Royalty Mismatch card (NEW) ───────────────────────────────────────────────

function RoyaltyMismatchCard({ invoice, resolved }: { invoice: Invoice; resolved?: boolean }) {
  const info = invoice.royaltyMismatchInfo!
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  if (resolved) {
    return (
      <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
        <div style={{ background: '#e8f5ee', padding: '14px 20px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>Royalty Deviation Resolved</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#e8f5ee', border: '1px solid #1b823f', color: '#1b823f', padding: '2px 7px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>RESOLVED</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#e8f5ee', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '14px 16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1b823f', fontFamily: 'Cabin, sans-serif', marginBottom: '6px' }}>Resolution Confirmed</div>
            <p style={{ fontSize: '14px', color: '#1a5c30', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>Royalties Management (<strong>{info.royaltyManagerName}</strong>) reviewed the deviation against contract <strong>{info.contractRef}</strong> and confirmed the correct rate of <strong>{info.contractRate}</strong>. Invoice corrected to the contract rate and approved for payment.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[{ label: 'Confirmed Rate', value: info.contractRate }, { label: 'Contract Ref', value: info.contractRef }, { label: 'Reviewed by', value: info.royaltyManagerName }, { label: 'Variance Cleared', value: fmt(info.variance) }].map(({ label, value }) => (
              <div key={label} style={{ background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: '#1b823f', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ background: '#fff', border: '2px solid #b06b00', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
      <div style={{ background: '#fff3d6', padding: '14px 20px', borderBottom: '1px solid #e0c080', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#b06b00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>!</div>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#b06b00' }}>Royalty vs Contract Deviation — Review Required</span>
        <span style={{ marginLeft: 'auto', flexShrink: 0 }}><SlaBadge slaMinutes={info.slaMinutes} started={true} /></span>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1d2f36', marginBottom: '12px' }}>Royalty Invoice Deviates from Contract Terms</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Author', value: info.author, warn: false },
            { label: 'Title', value: info.title, warn: false },
            { label: 'Basis', value: info.basis, warn: false },
            { label: 'Rate Invoiced', value: info.invoicedRate, warn: true },
            { label: 'Contract Rate', value: info.contractRate, warn: false },
            { label: 'Variance', value: fmt(info.variance), warn: true },
          ].map(({ label, value, warn }) => (
            <div key={label} style={{ background: warn ? '#fdecea' : '#f6f7f7', border: `1px solid ${warn ? '#f5c0be' : '#e4e6e7'}`, borderRadius: '6px', padding: '10px 14px' }}>
              <div style={{ fontSize: '11px', color: warn ? '#b91f1f' : '#6b767b', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: warn ? '#b91f1f' : '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff3d6', border: '1px solid #b06b00', borderRadius: '6px', padding: '14px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#b06b00', fontFamily: 'Cabin, sans-serif', marginBottom: '4px' }}>AI Recommendation</div>
          <p style={{ fontSize: '14px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>GenAI compared the invoice line against the abstracted contract terms ({info.contractRef}) and flagged a {fmt(info.variance)} deviation ({info.invoicedRate} invoiced vs {info.contractRate} contracted). Route to Royalties Management ({info.royaltyManagerName}, {info.royaltyManagerEmail}) for confirmation.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Sticky panels ─────────────────────────────────────────────────────────────

function StickyResolvePanel({ title, subtitle, buttonLabel, onResolve }: { title: string; subtitle: string; buttonLabel: string; onResolve: () => void }) {
  return (
    <div style={{ flexShrink: 0, borderTop: '2px solid #b06b00', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b06b00' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>{subtitle}</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={onResolve} style={{ padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}

function AutoApprovePanel({ invoice, variant = 'auto', onViewPosting }: { invoice: Invoice; variant?: 'auto' | 'gl-resolved' | 'royalty-resolved'; onViewPosting?: () => void }) {
  const title = variant === 'gl-resolved'
    ? 'GL Code Approved — Sent to SAP Payment Run'
    : variant === 'royalty-resolved'
      ? 'Approved at Contract Rate — Sent to SAP Payment Run'
      : 'Auto-Approved · Sent to SAP Payment Run'
  const subtitle = variant === 'gl-resolved'
    ? `${invoice.invoiceNumber} — GL code approved by all required parties, invoice routed for payment`
    : variant === 'royalty-resolved'
      ? `${invoice.invoiceNumber} — payment authorised at contract rate 12.5% ($27,000.00 USD). No corrected invoice required — Royalties Management confirmation on file.`
      : `${invoice.invoiceNumber} — all validations passed, no manual approval required`
  return (
    <div style={{ flexShrink: 0, borderTop: '2px solid #1b823f', background: '#e8f5ee', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={22} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>{title}</div>
        <div style={{ fontSize: '14px', color: '#1a5c30', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>{subtitle}</div>
      </div>
      {onViewPosting && (
        <button onClick={onViewPosting} style={{ flexShrink: 0, padding: '9px 20px', background: '#003d6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="9" height="11" rx="1" stroke="white" strokeWidth="1.4"/><path d="M4 2V1a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.4"/><path d="M3.5 6h5M3.5 8.5h5M3.5 11h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/><circle cx="11.5" cy="10.5" r="2" fill="#00a759"/><path d="M10.5 10.5l.8.8 1.2-1.2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
          View SAP Posting
        </button>
      )}
    </div>
  )
}

function ManualApprovalCard({ invoice }: { invoice: Invoice }) {
  const confs = invoice.extractedFields.fieldConfidences
  const avg = Math.round(Object.values(confs).reduce((a, b) => a + b, 0) / Object.values(confs).length)
  return (
    <div style={{ background: '#fff', border: '1px solid #f0c060', borderLeft: '4px solid #b06b00', borderRadius: '6px', marginBottom: '16px', overflow: 'hidden' }}>
      <div style={{ background: '#fffbf0', borderBottom: '1px solid #f0e0a0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#b06b00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M7 1L13 13H1L7 1z" fill="none" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/><line x1="7" y1="5.5" x2="7" y2="8.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7" cy="10.5" r="0.7" fill="white"/></svg>
        </div>
        <div>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#b06b00' }}>Manual Approval Required — Moderate Confidence</div>
          <div style={{ fontSize: '12px', color: '#8a5500', fontFamily: 'Lato, sans-serif', marginTop: '1px' }}>Agent paused at 3-Way Match — average field confidence {avg}% (below 90% threshold for auto-approval)</div>
        </div>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '8px', fontFamily: 'Lato, sans-serif' }}>Confidence by field</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
          {Object.entries(confs).map(([key, val]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
            const color = val >= 90 ? '#1b823f' : val >= 70 ? '#b06b00' : '#b91f1f'
            return (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', border: '1px solid #eee', borderRadius: '4px', padding: '4px 8px' }}>
                <span style={{ fontSize: '11px', color: '#555', fontFamily: 'Lato, sans-serif' }}>{label}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color, fontFamily: 'Cabin, sans-serif' }}>{val}%</span>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: '10px', fontSize: '11px', color: '#888', fontFamily: 'Lato, sans-serif', lineHeight: '1.5' }}>
          Review the extracted fields above and approve if correct. Fields marked in amber or red may require manual verification before proceeding.
        </div>
      </div>
    </div>
  )
}

function StickyManualApprovalPanel({ onApprove, approved, onViewPosting }: { onApprove: () => void; approved: boolean; onViewPosting?: () => void }) {
  if (approved) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #1b823f', background: '#e8f5ee', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={22} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>Manually Approved · Sent to SAP Payment Run</div>
          <div style={{ fontSize: '14px', color: '#1a5c30', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Invoice approved by reviewer — routed for payment processing</div>
        </div>
        {onViewPosting && (
          <button onClick={onViewPosting} style={{ flexShrink: 0, padding: '9px 20px', background: '#003d6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="9" height="11" rx="1" stroke="white" strokeWidth="1.4"/><path d="M4 2V1a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.4"/><path d="M3.5 6h5M3.5 8.5h5M3.5 11h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/><circle cx="11.5" cy="10.5" r="2" fill="#00a759"/><path d="M10.5 10.5l.8.8 1.2-1.2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            View SAP Posting
          </button>
        )}
      </div>
    )
  }
  return (
    <div style={{ flexShrink: 0, borderTop: '2px solid #b06b00', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b06b00' }}>Moderate Confidence — Manual Approval Required</div>
        <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Agent stopped at 3-Way Match · Review extracted fields and approve to proceed</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={onApprove} style={{ padding: '9px 22px', background: '#1b823f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Approve Invoice</button>
        <button style={{ padding: '9px 16px', background: '#fff', color: '#6b767b', border: '1.5px solid #c8cccf', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 600, cursor: 'pointer' }}>Request Re-scan</button>
      </div>
    </div>
  )
}

function StickyGLPanel({ onDraftEmail, appliedCode, manualGLCode, onApply, glApprovalEmailSent, glApprovalEmailReceived, invoiceApproved, onInvoiceApprove, onViewPosting }: { onDraftEmail: () => void; appliedCode: string | null; manualGLCode: string; onApply: (code: string) => void; glApprovalEmailSent: boolean; glApprovalEmailReceived: boolean; invoiceApproved: boolean; onInvoiceApprove: () => void; onViewPosting?: () => void }) {
  // State 5: Invoice fully approved — terminal
  if (invoiceApproved) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #1b823f', background: '#e8f5ee', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={22} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>Invoice Approved — Sent to SAP Payment Run</div>
          <div style={{ fontSize: '14px', color: '#1a5c30', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>GL code {appliedCode} assigned — invoice routed for payment processing</div>
        </div>
        {onViewPosting && (
          <button onClick={onViewPosting} style={{ flexShrink: 0, padding: '9px 20px', background: '#003d6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="9" height="11" rx="1" stroke="white" strokeWidth="1.4"/><path d="M4 2V1a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.4"/><path d="M3.5 6h5M3.5 8.5h5M3.5 11h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/><circle cx="11.5" cy="10.5" r="2" fill="#00a759"/><path d="M10.5 10.5l.8.8 1.2-1.2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            View SAP Posting
          </button>
        )}
      </div>
    )
  }

  // State 4: GL approval received — show Approve Invoice
  if (glApprovalEmailReceived) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #1b823f', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1b823f' }}>GL Code Approved — Ready for Invoice Approval</div>
          <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Code <strong>{appliedCode}</strong> approved. Approve the invoice to route for payment.</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onInvoiceApprove} style={{ padding: '10px 28px', background: '#1b823f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckIcon size={16} />
            Approve Invoice
          </button>
          <button style={{ padding: '9px 18px', background: '#fff', color: '#b91f1f', border: '1.5px solid #b91f1f', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
        </div>
      </div>
    )
  }

  // State 3: Email sent, awaiting response
  if (glApprovalEmailSent) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #b06b00', background: '#fff3d6', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2.5px solid #b06b00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b06b00' }}>GL Approval Email Sent — Awaiting Response</div>
          <div style={{ fontSize: '13px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Waiting for GL approval reply. Check Outlook for an incoming response.</div>
        </div>
      </div>
    )
  }

  // State 2: Code applied, approval email not yet sent
  if (appliedCode) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #b06b00', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b06b00' }}>GL Code Applied — Send Approval Email to Proceed</div>
          <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Code <strong>{appliedCode}</strong> applied. A GL approval email is required before the invoice can be approved.</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onDraftEmail} style={{ padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><rect x="0" y="0" width="14" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.3"/><polyline points="0,0 7,7 14,0" fill="none" stroke="white" strokeWidth="1.3"/></svg>
            Send GL Approval Email
          </button>
          <button style={{ padding: '9px 18px', background: '#fff', color: '#b91f1f', border: '1.5px solid #b91f1f', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
        </div>
      </div>
    )
  }

  // State 1: No code selected/applied yet
  return (
    <div style={{ flexShrink: 0, borderTop: '2px solid #b91f1f', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b91f1f' }}>GL Code Not Found — Select and Apply a GL Code</div>
        <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Choose or enter a GL code above, then apply it to continue the approval workflow.</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
        {manualGLCode && (
          <button onClick={() => onApply(manualGLCode)} style={{ padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Apply GL Code</button>
        )}
        <button style={{ padding: '9px 18px', background: '#fff', color: '#b91f1f', border: '1.5px solid #b91f1f', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
      </div>
    </div>
  )
}

function StickyMissingGRPanel({ notificationSent, onOpenComms }: { notificationSent: boolean; onOpenComms: () => void }) {
  if (notificationSent) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #1b823f', background: '#e8f5ee', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={18} /></div>
        <div>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1b823f' }}>Communication Sent — Awaiting GR Confirmation</div>
          <div style={{ fontSize: '13px', color: '#1a5c30', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Production owner Sophie Brandt has been notified. Invoice on hold pending Service Entry Sheet confirmation.</div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ flexShrink: 0, borderTop: '2px solid #b06b00', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b06b00' }}>Missing Service Entry Sheet — Milestone Not Booked</div>
        <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Contact the production owner to book the Service Entry Sheet in SAP before processing can continue</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={onOpenComms} style={{ padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <svg width="14" height="12" viewBox="0 0 14 12" fill="white"><rect x="0" y="0" width="14" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.3"/><polyline points="0,0 7,7 14,0" fill="none" stroke="white" strokeWidth="1.3"/></svg>
          Generate Communication
        </button>
        <button style={{ padding: '9px 18px', background: '#b91f1f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
      </div>
    </div>
  )
}

function StickyDuplicatePanel({ notificationSent, onDraftEmail }: { notificationSent: boolean; onDraftEmail: () => void }) {
  if (notificationSent) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #b91f1f', background: '#fdecea', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#b91f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CloseIcon size={18} /></div>
        <div>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b91f1f' }}>Invoice Rejected — Vendor Notified</div>
          <div style={{ fontSize: '13px', color: '#8a1a1a', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Rejection notice sent to Maersk Line. No further action required — this invoice will not be processed.</div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ flexShrink: 0, borderTop: '2px solid #b91f1f', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b91f1f' }}>Duplicate Invoice Detected — Rejected</div>
        <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>This invoice has already been paid. Notify the vendor not to resubmit.</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={onDraftEmail} style={{ padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <svg width="14" height="12" viewBox="0 0 14 12" fill="white"><rect x="0" y="0" width="14" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.3"/><polyline points="0,0 7,7 14,0" fill="none" stroke="white" strokeWidth="1.3"/></svg>
          Generate Communication
        </button>
      </div>
    </div>
  )
}

function CommunicationPreviewModal({ to, cc, subject, body, bodyHtml, subtitle, onSend, onClose }: {
  to: string; cc: string; subject: string; body?: string; bodyHtml?: string; subtitle: string;
  onSend: () => void; onClose: () => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '10px', width: '100%', maxWidth: '540px', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e6e7', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e7ecf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none"><rect x="1" y="1" width="20" height="16" rx="2" stroke="#1a3a6b" strokeWidth="1.5"/><polyline points="1,1 11,9 21,1" fill="none" stroke="#1a3a6b" strokeWidth="1.5"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1d2f36' }}>Communication Preview</div>
            <div style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>{subtitle}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f6f7f7', border: '1px solid #e4e6e7', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <CloseIcon size={16} color="#6b767b" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {[
            { label: 'To', value: to },
            { label: 'Cc', value: cc },
            { label: 'Subject', value: subject },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', padding: '10px 20px', borderBottom: '1px solid #f0f1f1', gap: '12px' }}>
              <span style={{ width: '60px', flexShrink: 0, fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', paddingTop: '1px' }}>{label}</span>
              <span style={{ flex: 1, fontSize: '13px', color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{value}</span>
            </div>
          ))}
          <div style={{ padding: '16px 20px' }}>
            {bodyHtml
              ? <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: '#1d2f36', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              : <pre style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: '#1d2f36', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>{body}</pre>
            }
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e4e6e7', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #c8cccf', borderRadius: '6px', fontSize: '14px', color: '#6b767b', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>Cancel</button>
          <button onClick={() => { onSend(); onClose() }} style={{ padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="12" viewBox="0 0 14 12" fill="white"><rect x="0" y="0" width="14" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.3"/><polyline points="0,0 7,7 14,0" fill="none" stroke="white" strokeWidth="1.3"/></svg>
            Send Communication
          </button>
        </div>
      </div>
    </div>
  )
}

function DuplicateModal({ invoice, onClose, onSent }: { invoice: Invoice; onClose: () => void; onSent: () => void }) {
  const info = invoice.duplicateInfo!
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const subject = `Duplicate Invoice Notification — ${info.originalInvoiceNumber} — ${invoice.supplier}`
  const body = `Dear ${invoice.supplier} Finance Team,

We are writing to inform you that invoice ${info.originalInvoiceNumber} submitted to Bertelsmann Accounts Payable has been identified as a duplicate and has been automatically rejected.

Our records show this invoice was already processed on ${info.processedDate} as AP document ${info.apDocNumber}. Payment of ${fmt(info.paymentAmount)} was issued via ${info.paymentMethod} on ${info.paymentDate}.

Please verify your records and do not resubmit this invoice for payment. If you believe this notification has been issued in error, please contact our AP team with supporting documentation referencing the invoice number above.

No further action is required on your part unless you believe there has been an error.

Regards,
Bertelsmann Accounts Payable Operations — AP Automation`

  return (
    <CommunicationPreviewModal
      to={info.senderEmail}
      cc="ap-operations@bertelsmann.de"
      subject={subject}
      body={body}
      subtitle="Auto-generated by Invoice Duplicate Detection Agent"
      onSend={onSent}
      onClose={onClose}
    />
  )
}

function TaxMismatchModal({ invoice, onSend, onClose }: { invoice: Invoice; onSend: () => void; onClose: () => void }) {
  const info = invoice.taxMismatchInfo!
  const cur = invoice.currency === 'EUR' ? '€' : '$'
  const subtotal = invoice.extractedFields.subtotal
  const detFrac = parseFloat(info.detectedRate) / 100
  const expFrac = parseFloat(info.expectedRate) / 100
  const detTax = (subtotal * detFrac).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const correctTax = (subtotal * expFrac).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const correctTotal = (subtotal * (1 + expFrac)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const subject = `Invoice Rejected — VAT Rate Error — Please Resubmit — ${invoice.invoiceNumber}`
  const body = `Dear ${invoice.supplier} Finance Team,

We are writing to inform you that invoice ${invoice.invoiceNumber} has been rejected due to an incorrect VAT rate applied on your submission.

Our automated AP system (SAP DRC) identified that the VAT rate used (${info.detectedRate}, ${info.detectedCode}) does not match the applicable rate for this transaction. Printed books qualify for the reduced German VAT rate of ${info.expectedRate} (${info.expectedCode}), as referenced on Purchase Order ${invoice.extractedFields.poNumber ?? 'on file'}.

Incorrect Invoice Details:
  Invoice Number:     ${invoice.invoiceNumber}
  Net Amount:         ${cur}${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
  VAT Applied (${info.detectedRate}): ${cur}${detTax}
  Invoice Total:      ${cur}${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}

Please resubmit a corrected (XRechnung-compliant) invoice with the following values:
  Net Amount:         ${cur}${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
  VAT (${info.expectedRate}):         ${cur}${correctTax}
  Corrected Total:    ${cur}${correctTotal}

The invoice will remain rejected until a corrected version is received. Please reference the original invoice number on your resubmission.

Regards,
Lena Fischer
Bertelsmann Accounts Payable Operations`

  return (
    <CommunicationPreviewModal
      to={invoice.emailSenderEmail}
      cc={info.apLeadEmail}
      subject={subject}
      body={body}
      subtitle="Auto-generated by Tax Rate Mismatch / Notification Agent"
      onSend={onSend}
      onClose={onClose}
    />
  )
}

function MissingGRModal({ invoice, onSend, onClose }: { invoice: Invoice; onSend: () => void; onClose: () => void }) {
  const info = invoice.missingGRInfo!
  const cur = invoice.currency === 'EUR' ? '€' : '$'
  const subject = `Service Entry Sheet Confirmation Required — ${invoice.invoiceNumber} — ${invoice.supplier}`
  const body = `Dear ${info.poOwnerName},

We are writing to notify you that invoice ${invoice.invoiceNumber} from ${invoice.supplier} (${cur}${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) has been placed on hold as no corresponding Service Entry Sheet was found in SAP for the milestone against Purchase Order ${info.poNumber}.

Details:
  Invoice Number:   ${invoice.invoiceNumber}
  Supplier:         ${invoice.supplier}
  Invoice Amount:   ${cur}${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
  PO Number:        ${info.poNumber}
  Issue:            No Service Entry Sheet booked in SAP for the milestone

Please confirm the milestone has been delivered and book the Service Entry Sheet in SAP at your earliest convenience so payment processing can continue. If the milestone is not yet complete, please advise on the expected date.

This invoice will remain on hold pending SES confirmation.

Regards,
Bertelsmann Accounts Payable Operations — AP Automation`

  return (
    <CommunicationPreviewModal
      to={info.poOwnerEmail}
      cc="ap-operations@bertelsmann.de"
      subject={subject}
      body={body}
      subtitle="Auto-generated by Service Entry / 3-Way Match Agent"
      onSend={onSend}
      onClose={onClose}
    />
  )
}

function MetroGLApprovalModal({ invoice, onSend, onClose }: { invoice: Invoice; onSend: () => void; onClose: () => void }) {
  const cur = invoice.currency === 'EUR' ? '€' : '$'
  const conflicts = invoice.extractedFields.conflictingGLCodes ?? []
  const subject = `GL Code Approval Required — ${invoice.invoiceNumber} — ${invoice.supplier}`
  const body = `Dear Markus,

Invoice ${invoice.invoiceNumber} from ${invoice.supplier} (${cur}${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) has been placed on hold as the Matching & GL Advisor (Ma) identified 3 conflicting GL accounts with no single account exceeding the 60% confidence threshold required for auto-assignment.

Conflicting GL Accounts Identified:
${conflicts.map(c => `  ${c.code} – ${c.label}  (${c.percentage}%)`).join('\n')}

Invoice Details:
  Invoice Number:   ${invoice.invoiceNumber}
  Supplier:         ${invoice.supplier}
  Invoice Amount:   ${cur}${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
  Invoice Date:     ${invoice.extractedFields.invoiceDate}
  Service:          ${invoice.extractedFields.expenseDescription ?? 'Advisory services'}

Please confirm the correct GL account so that invoice processing can continue. Once you reply with the approved GL code, Anja Krüger (AP Lead) will provide final authorisation.

Regards,
Lena Fischer
Bertelsmann Accounts Payable Operations`

  return (
    <CommunicationPreviewModal
      to="m.weber@bertelsmann.de"
      cc="a.krueger@bertelsmann.de"
      subject={subject}
      body={body}
      subtitle="Auto-generated by GL Coding Agent — Internal Approval Required"
      onSend={onSend}
      onClose={onClose}
    />
  )
}

function GLModal({ invoice, appliedCode, onSend, onClose }: { invoice: Invoice; appliedCode?: string; onSend: () => void; onClose: () => void }) {
  const isPRT = invoice.glMissingVariant === 'prt-coding'
  const prtCodingString = 'D-2029.IT.805089.P42529.2029240740.CON82580.EUR12090.Item#'
  const snUrl = 'https://bertelsmann.service-now.com/nav_to.do?uri=ap_invoice.do'
  const amt = `${invoice.currency === 'EUR' ? '€' : '$'}${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

  const subject = isPRT
    ? `SAP WBS Coding String — DOA Approval Required — ${invoice.invoiceNumber} — ${invoice.supplier}`
    : `GL Code Applied — Approval Required Before Processing — ${invoice.invoiceNumber} — ${invoice.supplier}`

  const prtBodyHtml = `
<p style="margin:0 0 14px">Dear Daniel &amp; Thomas,</p>
<p style="margin:0 0 14px">The <strong>WBS Coding Agent</strong> has generated a SAP cost-object coding string for the invoice below, as per the <strong>Decision of Authority (DOA) matrix</strong>. Your approval is required before this invoice can proceed to payment processing.</p>
<table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:13px">
  <tr style="background:#f6f7f7"><td style="padding:6px 10px;font-weight:600;width:40%;border:1px solid #e4e6e7">Invoice Number</td><td style="padding:6px 10px;border:1px solid #e4e6e7;font-family:monospace">${invoice.invoiceNumber}</td></tr>
  <tr><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Supplier</td><td style="padding:6px 10px;border:1px solid #e4e6e7">${invoice.supplier}</td></tr>
  <tr style="background:#f6f7f7"><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Invoice Amount</td><td style="padding:6px 10px;border:1px solid #e4e6e7">${amt}</td></tr>
  <tr><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Category</td><td style="padding:6px 10px;border:1px solid #e4e6e7">${invoice.category}</td></tr>
  <tr style="background:#f6f7f7"><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Cost Centre</td><td style="padding:6px 10px;border:1px solid #e4e6e7;font-family:monospace">CC-ASYS-IT-0042</td></tr>
  <tr><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Account No.</td><td style="padding:6px 10px;border:1px solid #e4e6e7;font-family:monospace">6180-002</td></tr>
  <tr style="background:#f6f7f7"><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Appropriation No.</td><td style="padding:6px 10px;border:1px solid #e4e6e7;font-family:monospace">2029240740</td></tr>
  <tr><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">PAR No.</td><td style="padding:6px 10px;border:1px solid #e4e6e7;font-family:monospace">P42529</td></tr>
  <tr style="background:#f6f7f7"><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Contract No.</td><td style="padding:6px 10px;border:1px solid #e4e6e7;font-family:monospace">82580</td></tr>
</table>
<div style="background:#fff3d6;border:1px solid #f59e0b;border-radius:6px;padding:12px 14px;margin-bottom:14px">
  <div style="font-size:11px;font-weight:700;color:#92600a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Generated Coding String</div>
  <div style="font-family:monospace;font-size:13px;font-weight:700;color:#b06b00;word-break:break-all">${prtCodingString}</div>
</div>
<p style="margin:0 0 10px"><strong>Action Required:</strong><br>Both the <strong>Requestor (Daniel Roth)</strong> and <strong>Head of Department (Thomas Lindqvist)</strong> must confirm approval before the invoice is released for payment. Please review the coding string above and reply with your approval.</p>
<p style="margin:0 0 14px">→ <a href="${snUrl}" style="color:#1a3a6b;text-decoration:none;font-weight:600">Open Invoice in ServiceNow ↗</a> &nbsp;|&nbsp; <a href="mailto:ap-operations@bertelsmann.de" style="color:#1a3a6b;text-decoration:none;font-weight:600">Contact AP Operations</a></p>
<p style="margin:0;color:#6b767b;font-size:12px">Regards,<br><strong style="color:#1d2f36">Bertelsmann Accounts Payable Operations</strong> — AP Automation<br>ap-automation@bertelsmann.de</p>`

  const stdBodyHtml = `
<p style="margin:0 0 14px">Dear Finance Team,</p>
<p style="margin:0 0 14px">The <strong>Matching &amp; GL Advisor (Ma)</strong> has reviewed invoice <strong>${invoice.invoiceNumber}</strong> from <strong>${invoice.supplier}</strong> and has applied a GL code assignment. As automated confidence was below the straight-through processing threshold, your approval is required before payment can continue.</p>
<table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:13px">
  <tr style="background:#f6f7f7"><td style="padding:6px 10px;font-weight:600;width:40%;border:1px solid #e4e6e7">Invoice Number</td><td style="padding:6px 10px;border:1px solid #e4e6e7;font-family:monospace">${invoice.invoiceNumber}</td></tr>
  <tr><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Supplier</td><td style="padding:6px 10px;border:1px solid #e4e6e7">${invoice.supplier}</td></tr>
  <tr style="background:#f6f7f7"><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Invoice Amount</td><td style="padding:6px 10px;border:1px solid #e4e6e7">${amt}</td></tr>
  <tr><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Category</td><td style="padding:6px 10px;border:1px solid #e4e6e7">${invoice.category}</td></tr>
  <tr style="background:#f6f7f7"><td style="padding:6px 10px;font-weight:600;border:1px solid #e4e6e7">Applied GL Code</td><td style="padding:6px 10px;border:1px solid #e4e6e7;font-family:monospace;font-weight:700;color:#1b823f">${appliedCode ?? 'Please review in ServiceNow'}</td></tr>
</table>
<p style="margin:0 0 10px"><strong>Action Required:</strong><br>Please log in to ServiceNow and approve the GL code applied to this invoice. Once approved by all required parties, the invoice will be released for payment processing.</p>
<p style="margin:0 0 14px">→ <a href="${snUrl}" style="color:#1a3a6b;text-decoration:none;font-weight:600">Open Invoice in ServiceNow ↗</a> &nbsp;|&nbsp; <a href="mailto:ap-operations@bertelsmann.de" style="color:#1a3a6b;text-decoration:none;font-weight:600">Contact AP Operations</a></p>
<p style="margin:0 0 10px;font-size:12px;color:#6b767b">If the GL code is incorrect, please reassign the appropriate account code directly in ServiceNow, or reply to this email with an alternative code and supporting justification.</p>
<p style="margin:0;color:#6b767b;font-size:12px">Regards,<br><strong style="color:#1d2f36">Bertelsmann Accounts Payable Operations</strong> — AP Automation<br>ap-automation@bertelsmann.de</p>`

  return (
    <CommunicationPreviewModal
      to={isPRT ? 'd.roth@arvato-systems.de' : invoice.emailSenderEmail}
      cc={isPRT ? 't.lindqvist@arvato-systems.de' : 'ap-operations@bertelsmann.de'}
      subject={subject}
      bodyHtml={isPRT ? prtBodyHtml : stdBodyHtml}
      subtitle={isPRT ? 'Auto-generated by WBS Coding Agent — DOA Approval Required' : 'Auto-generated by Matching & GL Advisor (Ma)'}
      onSend={onSend}
      onClose={onClose}
    />
  )
}

function StickyTaxMismatchPanel({ notificationSent, onOpenComms, supplierName }: { notificationSent: boolean; onOpenComms: () => void; supplierName?: string }) {
  if (notificationSent) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #b91f1f', background: '#fdecea', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#b91f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CloseIcon size={18} /></div>
        <div>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b91f1f' }}>Invoice Rejected — Supplier Notified to Resubmit</div>
          <div style={{ fontSize: '13px', color: '#8a1a1a', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Rejection notice sent to {supplierName ?? 'supplier'} by Lena Fischer. Anja Krüger (AP Lead) copied. Awaiting corrected invoice.</div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ flexShrink: 0, borderTop: '2px solid #b06b00', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b06b00' }}>Tax Rate Mismatch — Tax Review Queue</div>
        <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Inform supplier / vendor and AP lead to confirm the correct tax rate before processing continues</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={onOpenComms} style={{ padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <svg width="14" height="12" viewBox="0 0 14 12" fill="white"><rect x="0" y="0" width="14" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.3"/><polyline points="0,0 7,7 14,0" fill="none" stroke="white" strokeWidth="1.3"/></svg>
          Generate Communication
        </button>
        <button style={{ padding: '9px 18px', background: '#b91f1f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
      </div>
    </div>
  )
}


function StickyMetroGLPanel({ metroGLApprovalSent, onSendApproval, metroApproved, onInvoiceApprove, metroInvoiceApproved, onViewPosting }: { metroGLApprovalSent?: boolean; onSendApproval: () => void; metroApproved?: boolean; onInvoiceApprove: () => void; metroInvoiceApproved?: boolean; onViewPosting?: () => void }) {
  // Terminal: invoice approved
  if (metroInvoiceApproved) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #1b823f', background: '#e8f5ee', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={22} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>Invoice Approved — Sent to SAP Payment Run</div>
          <div style={{ fontSize: '14px', color: '#1a5c30', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>GL code 6720-001 (Management Consulting) confirmed — invoice routed for payment processing</div>
        </div>
        {onViewPosting && (
          <button onClick={onViewPosting} style={{ flexShrink: 0, padding: '9px 20px', background: '#003d6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="9" height="11" rx="1" stroke="white" strokeWidth="1.4"/><path d="M4 2V1a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.4"/><path d="M3.5 6h5M3.5 8.5h5M3.5 11h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/><circle cx="11.5" cy="10.5" r="2" fill="#00a759"/><path d="M10.5 10.5l.8.8 1.2-1.2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            View SAP Posting
          </button>
        )}
      </div>
    )
  }

  // State: both replies received — show Approve Invoice
  if (metroApproved) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #1b823f', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1b823f' }}>GL Code Approved — Ready for Invoice Approval</div>
          <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Approval confirmed by Markus Weber & Anja Krüger. Approve the invoice to route for payment.</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onInvoiceApprove} style={{ padding: '10px 28px', background: '#1b823f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckIcon size={16} />
            Approve Invoice
          </button>
          <button style={{ padding: '9px 18px', background: '#fff', color: '#b91f1f', border: '1.5px solid #b91f1f', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
        </div>
      </div>
    )
  }

  // State: approval sent, waiting
  if (metroGLApprovalSent) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #b06b00', background: '#fff3d6', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2.5px solid #b06b00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b06b00' }}>GL Code Approval Sent — Awaiting Response from Markus Weber & Anja Krüger</div>
          <div style={{ fontSize: '13px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Waiting for GL approval reply. Check Outlook for an incoming response.</div>
        </div>
      </div>
    )
  }

  // Default: not yet sent — show Send Approval + Reject buttons
  return (
    <div style={{ flexShrink: 0, borderTop: '2px solid #b91f1f', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b91f1f' }}>GL Code — Internal Approval Required</div>
        <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Send GL code approval request to the Cost Centre Owner and AP Lead to confirm the correct GL account.</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={onSendApproval} style={{ padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><rect x="0" y="0" width="14" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.3"/><polyline points="0,0 7,7 14,0" fill="none" stroke="white" strokeWidth="1.3"/></svg>
          Send Approval
        </button>
        <button style={{ padding: '9px 18px', background: '#fff', color: '#b91f1f', border: '1.5px solid #b91f1f', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
      </div>
    </div>
  )
}

// ─── Sticky PRT Panel ─────────────────────────────────────────────────────────

function StickyPRTPanel({ prtCodingConfirmed, onConfirm, onSendEmail, glApprovalEmailSent, glApprovalEmailReceived, onApprove, prtInvoiceApproved }: { prtCodingConfirmed: boolean; onConfirm: () => void; onSendEmail: () => void; glApprovalEmailSent: boolean; glApprovalEmailReceived: boolean; onApprove: () => void; prtInvoiceApproved: boolean }) {
  if (prtInvoiceApproved) return null

  // State 3: GL approval email received → show Approve Invoice
  if (prtCodingConfirmed && glApprovalEmailReceived) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #1b823f', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1b823f' }}>GL Code Approved — Ready for Invoice Approval</div>
          <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Coding string approved. Approve the invoice to route for payment processing.</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onApprove} style={{ padding: '10px 28px', background: '#1b823f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckIcon size={16} />
            Approve Invoice
          </button>
          <button style={{ padding: '9px 18px', background: '#fff', color: '#b91f1f', border: '1.5px solid #b91f1f', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
        </div>
      </div>
    )
  }

  // State 2: email sent, awaiting approval
  if (prtCodingConfirmed && glApprovalEmailSent) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #b06b00', background: '#fff3d6', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2.5px solid #b06b00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b06b00' }}>GL Approval Email Sent — Awaiting Response</div>
          <div style={{ fontSize: '13px', color: '#7a4a00', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Waiting for GL approval reply. Check Outlook for an incoming response.</div>
        </div>
      </div>
    )
  }

  // State 1: GL code applied, show Send Mail for Approval
  if (prtCodingConfirmed) {
    return (
      <div style={{ flexShrink: 0, borderTop: '2px solid #1a3a6b', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1a3a6b' }}>GL Code Applied — Send for Approval</div>
          <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>GL code has been applied. Send the approval mail to authorised approvers before this invoice can be processed.</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onSendEmail} style={{ padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><rect x="0" y="0" width="14" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.3"/><polyline points="0,0 7,7 14,0" fill="none" stroke="white" strokeWidth="1.3"/></svg>
            Send Mail for Approval
          </button>
          <button style={{ padding: '9px 18px', background: '#fff', color: '#b91f1f', border: '1.5px solid #b91f1f', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
        </div>
      </div>
    )
  }

  // Default: show Apply GL Code
  return (
    <div style={{ flexShrink: 0, borderTop: '2px solid #b91f1f', background: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#b91f1f' }}>GL Coding String Generated — Apply to Proceed</div>
        <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>Agent has generated the coding string via SAP Project System. Review the trace above and apply the GL code.</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={onConfirm} style={{ padding: '9px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
          Apply GL Code
        </button>
        <button style={{ padding: '9px 18px', background: '#fff', color: '#b91f1f', border: '1.5px solid #b91f1f', borderRadius: '6px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
      </div>
    </div>
  )
}

// ─── Supplier Details card ─────────────────────────────────────────────────────

function SupplierDetailsCard({ invoice }: { invoice: Invoice }) {
  const f = invoice.extractedFields
  const [showHistory, setShowHistory] = useState(false)

  const supplierStatus = f.bankAccountStatus === 'Verified' ? 'Verified' : 'Pending'
  const statusColor = supplierStatus === 'Verified' ? '#1b823f' : '#b06b00'
  const statusBg = supplierStatus === 'Verified' ? '#e8f5ee' : '#fff3d6'

  const isNonPO = invoice.category === 'Non-PO'
  const isFacilities = invoice.id === 'inv-4'
  const isPO = invoice.category === 'PO'

  type BadgeType = 'green' | 'amber' | 'red' | 'neutral'
  const badge = (text: string, type: BadgeType = 'neutral') => {
    const colors: Record<BadgeType, { bg: string; color: string; border: string }> = {
      green:   { bg: '#e8f5ee', color: '#1b823f', border: '#c8e6c9' },
      amber:   { bg: '#fff3d6', color: '#7a4a00', border: '#e0c080' },
      red:     { bg: '#fdecea', color: '#b91f1f', border: '#f5c0be' },
      neutral: { bg: '#f6f7f7', color: '#4a5568', border: '#e4e6e7' },
    }
    const c = colors[type]
    return <span style={{ display: 'inline-block', background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, fontFamily: 'Lato, sans-serif' }}>{text}</span>
  }

  const historyRows: { label: string; value: React.ReactNode; note?: string }[] = [
    { label: 'KYC Status', value: badge('Completed — 2025', 'green'), note: 'Last reviewed Jan 2025. Next due Jan 2026.' },
    { label: 'Bank Details', value: badge(f.bankAccountStatus === 'Verified' ? 'Available & Active' : 'Pending Verification', f.bankAccountStatus === 'Verified' ? 'green' : 'amber'), note: f.bankAccountStatus === 'Verified' ? 'Account verified via bank cross-reference. IBAN/SWIFT on file.' : 'Bank account verification in progress.' },
    { label: 'Exception History', value: badge(isNonPO && !isPO ? '1 prior exception' : isPO ? 'No prior exceptions' : '1 prior exception', isNonPO && !isPO ? 'amber' : 'green'), note: isNonPO ? 'Jun 2025 — GL code ambiguity on Non-PO invoice INV-2025-04412. Resolved manually by AP analyst.' : 'No rejections, holds, or disputes in the last 24 months.' },
    { label: 'Credit Given', value: badge('Nil', 'neutral'), note: 'No credit terms extended. Standard payment terms apply.' },
    { label: 'Pending Approvals', value: badge('None', 'green'), note: 'No approvals outstanding in this supplier account.' },
    { label: 'Payment Terms', value: <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: '#1d2f36', fontWeight: 600 }}>{f.paymentTerms ?? 'Net 30'}</span>, note: isFacilities ? 'Net 15 per service agreement dated Feb 2026.' : isPO ? 'Standard Net 30 as per master supplier agreement.' : 'As per contract terms.' },
    { label: 'Tax History', value: badge('Compliant', 'green'), note: isNonPO ? 'Correct VAT codes applied consistently via SAP DRC. No prior tax disputes.' : 'All prior invoices processed with the correct VAT code via SAP DRC. No mismatches on record.' },
    { label: 'Non-PO History', value: badge(isNonPO ? '6 prior Non-PO invoices' : 'N/A — PO supplier', isNonPO ? 'neutral' : 'neutral'), note: isNonPO ? 'Supplier regularly invoices as Non-PO. Last 6 invoices processed Jun 2024 – May 2026. All resolved within SLA.' : 'This supplier is PO-backed. All prior invoices matched against active POs.' },
    { label: 'Payment Performance', value: badge(isFacilities ? 'Usually On Time' : isPO ? 'Consistently On Time' : 'Avg. 2 days late', isFacilities ? 'green' : isPO ? 'green' : 'amber'), note: isFacilities ? 'Avg. payment delay: 0.8 days. 5 of last 6 invoices paid on or before due date.' : isPO ? 'All 12 prior invoices paid within terms. No late payment penalty events.' : 'Minor average delay of ~2 days. No penalty clauses triggered. Within acceptable range.' },
  ]

  return (
    <div style={{ background: '#fff', border: '1px solid #e4e6e7', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{ padding: '11px 20px', background: '#f6f7f7', borderBottom: '1px solid #e4e6e7', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1d2f36' }}>Supplier Details</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowHistory(v => !v)}
            aria-expanded={showHistory}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', padding: '2px 6px', cursor: 'pointer', fontSize: '12px', color: '#1a3a6b', fontFamily: 'Lato, sans-serif', fontWeight: 600, borderRadius: '4px' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {showHistory ? 'Hide Supplier Information' : 'View Supplier Information'}
          </button>
          <span style={{ background: statusBg, color: statusColor, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>
            {supplierStatus === 'Verified' ? '✓ ' : ''}{supplierStatus}
          </span>
        </span>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          {[
            { label: 'Supplier Name', value: f.supplierName },
            { label: 'Supplier ID', value: f.supplierId },
            { label: 'Supplier Status', value: 'Active' },
            { label: 'Bank Status', value: f.bankAccountStatus },
            { label: 'Payment Terms', value: f.paymentTerms },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid #f0f1f1', gap: '10px' }}>
              <span style={{ width: '120px', flexShrink: 0, fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', paddingTop: '2px' }}>{label}</span>
              <span style={{ flex: 1, fontSize: '13px', fontFamily: 'Lato, sans-serif', color: '#1d2f36', lineHeight: '1.4' }}>{value}</span>
            </div>
          ))}
        </div>

        {showHistory && (
          <div style={{ marginTop: '14px', borderTop: '1px solid #e4e6e7', paddingTop: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontFamily: 'Cabin, sans-serif' }}>Supplier History & Compliance</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'Lato, sans-serif' }}>
              <thead>
                <tr style={{ background: '#f6f7f7' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e4e6e7', width: '160px' }}>Category</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e4e6e7', width: '160px' }}>Status</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e4e6e7' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: '#3a4a50', borderBottom: '1px solid #f0f1f1', verticalAlign: 'top' }}>{row.label}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f0f1f1', verticalAlign: 'top' }}>{row.value}</td>
                    <td style={{ padding: '9px 12px', color: '#6b767b', lineHeight: '1.5', borderBottom: '1px solid #f0f1f1', verticalAlign: 'top' }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Final summary ─────────────────────────────────────────────────────────────

function FinalSummary({ invoice, onShowAudit }: { invoice: Invoice; onShowAudit: () => void }) {
  if (!invoice.recommendation) return null
  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      <div style={{ background: '#e8f5ee', border: '1px solid #1b823f', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckIcon size={18} color="#1b823f" /> Agent Recommendation</div>
          <div style={{ fontSize: '15px', color: '#1a5c30', lineHeight: '1.5', fontFamily: 'Lato, sans-serif' }}>{invoice.recommendation}</div>
        </div>
        <button onClick={onShowAudit} style={{ flexShrink: 0, background: 'none', border: '1px solid #1b823f', borderRadius: '6px', padding: '8px 14px', fontSize: '14px', color: '#1b823f', cursor: 'pointer', fontFamily: 'Lato, sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>View Audit Trail</button>
      </div>
    </div>
  )
}

// ─── Document Panel (accordion wrapper for scroll content) ────────────────────

function DocumentPanel({ children, scrollRef, onScroll, hasContent }: {
  children: React.ReactNode
  scrollRef: React.RefObject<HTMLDivElement>
  onScroll: () => void
  hasContent: boolean
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  return (
    <div style={{ flex: isCollapsed ? '0 0 auto' : 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div onClick={() => setIsCollapsed(v => !v)} style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #f0f1f1', background: '#fff', borderTop: '1px solid #e4e6e7' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: hasContent ? '#1b823f' : '#c8cccf', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '11px', fontWeight: 700, color: '#6b767b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Document Details</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', transition: 'transform 0.25s ease', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4.5L6 8L10 4.5" stroke="#6b767b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </div>
      {!isCollapsed && (
        <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#f6f7f7' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main ProcessingView ───────────────────────────────────────────────────────

export function ProcessingView({ invoice, onBack, onTaxMismatchSent, taxMismatchAutoResolved = false, onMissingGRSent, missingGRAutoResolved = false, onGLApprovalSent, glApprovalReceived = false, onProcessingComplete, metroGLApprovalSent = false, onMetroGLApprovalSend, metroApproved = false, onMetroApprove, metroInvoiceApprovedIds, glEmailsViewed = false, onRoyaltySent, royaltyMismatchAutoResolved = false }: Props) {
  // Compute before any state — GL approval already granted means we skip animation
  const cachedGL = invoice.failType === 'gl-missing' ? (glCodeCache.get(invoice.id) ?? null) : null
  const skipGLAnimation = invoice.failType === 'gl-missing' && !!(cachedGL?.glApprovalEmailSent || cachedGL?.glApprovalEmailReceived)
  const skipRoyaltyAnimation = invoice.failType === 'royalty-mismatch' && royaltyMismatchAutoResolved
  void (invoice.failType === 'tax-mismatch' ? taxMismatchCache.get(invoice.id) : null)
  const _stepsForInit = invoice.agentSteps
  const _failStepForInit = invoice.failAtStep ?? Math.max(0, _stepsForInit.length - 1)

  const [currentStep, setCurrentStep] = useState((skipGLAnimation || skipRoyaltyAnimation) ? _failStepForInit : 0)
  const [progress, setProgress] = useState((skipGLAnimation || skipRoyaltyAnimation) ? 100 : 0)
  const [agentIdx, setAgentIdx] = useState(skipGLAnimation ? Math.max(0, (_stepsForInit[_failStepForInit]?.agents.length ?? 1) - 1) : 0)
  const [completed, setCompleted] = useState<Set<number>>(() =>
    skipGLAnimation ? new Set(Array.from({ length: _failStepForInit }, (_, i) => i)) : new Set()
  )
  const [isDone, setIsDone] = useState(false)
  const [isFailed, setIsFailed] = useState(skipGLAnimation)
  const [showAudit, setShowAudit] = useState(false)
  const [showOutlookModal, setShowOutlookModal] = useState(false)
  const [showInvoice, setShowInvoice] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [showAuditDrawer, setShowAuditDrawer] = useState(false)
  const [showGLRepo, setShowGLRepo] = useState(false)
  const [appliedGLCode, setAppliedGLCode] = useState<string | null>(cachedGL?.appliedCode ?? null)
  const [manualGLCode, setManualGLCode] = useState(cachedGL?.manualGLCode ?? '')
  const [glApprovalEmailSent, setGlApprovalEmailSent] = useState(cachedGL?.glApprovalEmailSent ?? false)
  const [glApprovalEmailReceived, setGlApprovalEmailReceived] = useState(false)
  const [glInvoiceApproved, setGlInvoiceApproved] = useState(cachedGL?.invoiceApproved ?? false)
  const [manuallyApproved, setManuallyApproved] = useState(false)
  // Restore prt states from cache only if email was already sent (mid-flow navigation, e.g. to Outlook)
  const [prtCodingConfirmed, setPrtCodingConfirmed] = useState((cachedGL?.glApprovalEmailSent && cachedGL?.prtCodingConfirmed) ?? false)
  const [prtInvoiceApproved, setPrtInvoiceApproved] = useState(cachedGL?.prtInvoiceApproved ?? false)
  const [taxNotificationSent, setTaxNotificationSent] = useState(false)
  const [missingGRNotificationSent, setMissingGRNotificationSent] = useState(false)
  const [showCommsModal, setShowCommsModal] = useState(false)
  const [showMissingGRCommsModal, setShowMissingGRCommsModal] = useState(false)
  const [showGLCommsModal, setShowGLCommsModal] = useState(false)
  const [showDuplicateCommsModal, setShowDuplicateCommsModal] = useState(false)
  const [duplicateNotificationSent, setDuplicateNotificationSent] = useState(false)
  const [showMetroGLCommsModal, setShowMetroGLCommsModal] = useState(false)
  const [metroInvoiceApproved, setMetroInvoiceApproved] = useState(metroInvoiceApprovedIds?.has(invoice.id) ?? false)
  const [agentActivityCollapsed, setAgentActivityCollapsed] = useState(skipGLAnimation)
  const [icResolved, setIcResolved] = useState(false)
  const [royaltySent, setRoyaltySent] = useState(false)
  const [showSAPPosting, setShowSAPPosting] = useState(false)
  const [showSAPPayment, setShowSAPPayment] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPausedRef = useRef(false)
  const elapsedRef = useRef(0)
  const contentScrollRef = useRef<HTMLDivElement>(null)
  const [contentScrolled, setContentScrolled] = useState(false)
  const steps = invoice.agentSteps

  useEffect(() => {
    if (isDone) onProcessingComplete?.(invoice.id)
  }, [isDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePause = () => {
    isPausedRef.current = !isPausedRef.current
    setIsPaused(isPausedRef.current)
  }

  const handleManualApprove = () => {
    setManuallyApproved(true)
    setIsFailed(false)
    setCompleted(prev => new Set([...prev, invoice.failAtStep ?? 4]))
    setIsDone(true)
  }

  const handleSendTaxNotification = () => {
    setTaxNotificationSent(true)
    onTaxMismatchSent?.()
  }

  const handleSendMissingGRNotification = () => {
    setMissingGRNotificationSent(true)
    onMissingGRSent?.()
  }

  const taxMismatchAutoResolvedRef = useRef(taxMismatchAutoResolved)
  useEffect(() => {
    taxMismatchAutoResolvedRef.current = taxMismatchAutoResolved
  }, [taxMismatchAutoResolved])

  const missingGRAutoResolvedRef = useRef(missingGRAutoResolved)
  useEffect(() => {
    missingGRAutoResolvedRef.current = missingGRAutoResolved
  }, [missingGRAutoResolved])

  // Resume & complete animation when missing-GR is resolved while component is already mounted
  useEffect(() => {
    if (!missingGRAutoResolved || invoice.failType !== 'missing-gr') return
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsFailed(false)
    setCompleted(new Set(steps.map((_, i) => i)))
    setCurrentStep(steps.length - 1)
    setProgress(100)
    setIsDone(true)
  }, [missingGRAutoResolved]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync GL code state to module-level cache whenever it changes
  useEffect(() => {
    if (invoice.failType === 'gl-missing') {
      glCodeCache.set(invoice.id, { appliedCode: appliedGLCode, glApprovalEmailSent, glApprovalEmailReceived, invoiceApproved: glInvoiceApproved, manualGLCode, prtCodingConfirmed, prtInvoiceApproved })
    }
  }, [invoice.id, invoice.failType, appliedGLCode, glApprovalEmailSent, glApprovalEmailReceived, glInvoiceApproved, manualGLCode, prtCodingConfirmed, prtInvoiceApproved])

  // Sync glApprovalReceived prop → local state (fires when App.tsx receives the GL reply email)
  useEffect(() => {
    if (glApprovalReceived && !glApprovalEmailReceived) {
      setGlApprovalEmailReceived(true)
    }
  }, [glApprovalReceived]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync metroInvoiceApprovedIds prop → local state
  useEffect(() => {
    if (metroInvoiceApprovedIds?.has(invoice.id) && !metroInvoiceApproved) {
      setMetroInvoiceApproved(true)
    }
  }, [metroInvoiceApprovedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tax mismatch approval state to module-level cache
  useEffect(() => {
    if (invoice.failType === 'tax-mismatch') {
      taxMismatchCache.set(invoice.id, { invoiceApproved: false })
    }
  }, [invoice.id, invoice.failType])

  useEffect(() => {
    if (steps.length === 0) return
    if (skipGLAnimation) return
    const clearAll = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    const isAutoResolved =
      (taxMismatchAutoResolvedRef.current && invoice.failType === 'tax-mismatch') ||
      (missingGRAutoResolvedRef.current && invoice.failType === 'missing-gr')
    if (isAutoResolved) {
      setCompleted(new Set(steps.map((_, i) => i)))
      setCurrentStep(steps.length - 1)
      setIsDone(true)
      return
    }

    const startStep = (idx: number) => {
      clearAll()
      elapsedRef.current = 0
      const agentCount = steps[idx].agents.length
      const isFailStep = invoice.failAtStep === idx
      const skipFail = isFailStep && (
        (taxMismatchAutoResolvedRef.current && invoice.failType === 'tax-mismatch') ||
        (missingGRAutoResolvedRef.current && invoice.failType === 'missing-gr')
      )
      setCurrentStep(idx)
      setProgress(0)
      setAgentIdx(0)
      setIsFailed(false)

      intervalRef.current = setInterval(() => {
        if (isPausedRef.current) return
        elapsedRef.current += TICK_MS
        const duration = (isFailStep && !skipFail) ? STEP_DURATION_MS * 0.72 : STEP_DURATION_MS
        const pct = Math.min(100, (elapsedRef.current / duration) * 100)
        const ai = Math.min(agentCount - 1, Math.floor((pct / 100) * agentCount))
        setProgress(pct)
        setAgentIdx(ai)
        if (pct >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          if (isFailStep && !skipFail) {
            setIsFailed(true)
            return
          }
          setCompleted((prev) => new Set([...prev, idx]))
          timeoutRef.current = setTimeout(() => {
            const next = idx + 1
            if (next < steps.length) startStep(next)
            else setIsDone(true)
          }, 600)
        }
      }, TICK_MS)
    }
    timeoutRef.current = setTimeout(() => startStep(0), 400)
    return clearAll
  }, [steps, invoice.failAtStep]) // eslint-disable-line react-hooks/exhaustive-deps

  const catColors: Record<string, { bg: string; text: string }> = {
    PO: { bg: '#e7ecf5', text: '#1a3a6b' },
    'Non-PO': { bg: '#fff3d6', text: '#b06b00' },
    'ECC Legacy': { bg: '#e8f5ee', text: '#1b823f' },
  }
  const cc = catColors[invoice.category] ?? { bg: '#f0f1f1', text: '#6b767b' }

  const isGLResolved = ((glApprovalEmailReceived || glInvoiceApproved) && invoice.failType === 'gl-missing' && invoice.glMissingVariant !== 'internal-approval' && invoice.glMissingVariant !== 'prt-coding') || (metroInvoiceApproved && invoice.failType === 'gl-missing' && invoice.glMissingVariant === 'internal-approval') || (prtInvoiceApproved && invoice.failType === 'gl-missing' && invoice.glMissingVariant === 'prt-coding')
  const effectiveFailed = isFailed && !isGLResolved

  const scrollContent = steps.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '60px', color: '#6b767b', fontSize: '16px', fontStyle: 'italic' }}>This invoice is queued for processing. Check back shortly.</div>
  ) : (
    <>
      {isFailed && invoice.failType === 'tax-mismatch' && !taxMismatchAutoResolved && (
        <TaxMismatchCard invoice={invoice} notificationSent={taxNotificationSent} />
      )}
      {isDone && invoice.failType === 'tax-mismatch' && taxMismatchAutoResolved && (
        <div style={{ background: '#fff', border: '2px solid #1b823f', borderRadius: '8px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out', marginBottom: '16px' }}>
          <div style={{ background: '#e8f5ee', padding: '14px 20px', borderBottom: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1b823f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={16} /></div>
            <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1b823f' }}>Corrected Invoice Received — Approved for Payment</span>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ background: '#e8f5ee', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '14px 16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1b823f', fontFamily: 'Cabin, sans-serif', marginBottom: '6px' }}>Invoice Resubmitted with Corrected VAT Rate</div>
              <p style={{ fontSize: '14px', color: '#1a5c30', fontFamily: 'Lato, sans-serif', margin: 0, lineHeight: '1.5' }}>Corrected invoice <strong>LM-2026-04781-R1</strong> received from Lehmanns Media GmbH with updated VAT code <strong>DE-VAT-RED (7%)</strong>. Invoice passed all validations and has been auto-approved for payment.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[{ label: 'Corrected Invoice', value: 'LM-2026-04781-R1' }, { label: 'Corrected VAT Code', value: 'DE-VAT-RED' }, { label: 'Corrected VAT (7%)', value: '€3,500.00' }, { label: 'Corrected Total', value: '€53,500.00' }, { label: 'Validation Status', value: '3-Way Match Passed' }, { label: 'Processed By', value: 'AP Automation' }].map(({ label, value }) => (
                <div key={label} style={{ background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#1b823f', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <LiveFieldsCard
        invoice={invoice}
        isExtractionActive={currentStep === 1}
        isExtractionDone={completed.has(1)}
        extractionAgentIdx={currentStep === 1 ? agentIdx : -1}
      />
      {isFailed && !isGLResolved && invoice.failType === 'gl-missing' && invoice.glMissingVariant === 'internal-approval' && (
        <MetroGLMissingCard invoice={invoice} metroGLApprovalSent={metroGLApprovalSent} metroApproved={metroApproved} metroInvoiceApproved={metroInvoiceApproved} />
      )}
      {isFailed && invoice.failType === 'gl-missing' && invoice.glMissingVariant === 'prt-coding' && (!isGLResolved || prtInvoiceApproved) && (
        <PRTCodingCard invoice={invoice} prtApproved={prtCodingConfirmed} onConfirm={() => setPrtCodingConfirmed(true)} glApproved={prtCodingConfirmed && glApprovalEmailReceived && glEmailsViewed} onApprove={() => setPrtInvoiceApproved(true)} invoiceApproved={prtInvoiceApproved} />
      )}
      {isFailed && invoice.failType === 'gl-missing' && invoice.glMissingVariant !== 'internal-approval' && invoice.glMissingVariant !== 'prt-coding' && (
        <GLMissingCard invoice={invoice} appliedCode={appliedGLCode} manualGLCode={manualGLCode} onManualChange={setManualGLCode} onShowRepo={() => setShowGLRepo(true)} glApprovalEmailSent={glApprovalEmailSent} glApprovalEmailReceived={glApprovalEmailReceived} />
      )}
      {isFailed && invoice.failType === 'missing-gr' && !missingGRAutoResolved && <MissingGRCard invoice={invoice} />}
      {isDone && invoice.failType === 'missing-gr' && missingGRAutoResolved && (
        <MissingGRCard invoice={invoice} missingGRAutoResolved={true} />
      )}
      {isFailed && invoice.failType === 'duplicate' && <DuplicateCard invoice={invoice} />}
      {isFailed && invoice.failType === 'ic-mismatch' && <ICMismatchCard invoice={invoice} resolved={icResolved} />}
      {isFailed && invoice.failType === 'royalty-mismatch' && <RoyaltyMismatchCard invoice={invoice} resolved={royaltyMismatchAutoResolved} />}
      {isFailed && invoice.failType === 'manual-approval' && !manuallyApproved && (
        <ManualApprovalCard invoice={invoice} />
      )}
      <CompletionCards invoice={invoice} completed={completed} />
      {(isDone || (isGLResolved && glEmailsViewed)) && <FinalSummary invoice={invoice} onShowAudit={() => setShowAudit(true)} />}
    </>
  )

  const stickyPanels = (
    <>
      {isDone && !isGLResolved && !taxMismatchAutoResolved && !missingGRAutoResolved && <AutoApprovePanel invoice={invoice} onViewPosting={() => setShowSAPPosting(true)} />}
      {isGLResolved && glEmailsViewed && !taxMismatchAutoResolved && !missingGRAutoResolved && <AutoApprovePanel invoice={invoice} variant="gl-resolved" onViewPosting={() => setShowSAPPosting(true)} />}
      {isDone && taxMismatchAutoResolved && <AutoApprovePanel invoice={invoice} onViewPosting={() => setShowSAPPosting(true)} />}
      {isDone && missingGRAutoResolved && <AutoApprovePanel invoice={invoice} onViewPosting={() => setShowSAPPosting(true)} />}
      {isFailed && !isGLResolved && invoice.failType === 'gl-missing' && invoice.glMissingVariant === 'internal-approval' && (
        <StickyMetroGLPanel metroGLApprovalSent={metroGLApprovalSent} onSendApproval={() => setShowMetroGLCommsModal(true)} metroApproved={metroApproved} onInvoiceApprove={() => { setMetroInvoiceApproved(true); onMetroApprove?.() }} metroInvoiceApproved={metroInvoiceApproved} onViewPosting={metroInvoiceApproved ? () => setShowSAPPosting(true) : undefined} />
      )}
      {isFailed && !isGLResolved && invoice.failType === 'gl-missing' && invoice.glMissingVariant === 'prt-coding' && (
        <StickyPRTPanel prtCodingConfirmed={prtCodingConfirmed} onConfirm={() => setPrtCodingConfirmed(true)} onSendEmail={() => setShowGLCommsModal(true)} glApprovalEmailSent={glApprovalEmailSent} glApprovalEmailReceived={glApprovalEmailReceived} onApprove={() => setPrtInvoiceApproved(true)} prtInvoiceApproved={prtInvoiceApproved} />
      )}
      {isFailed && !isGLResolved && invoice.failType === 'gl-missing' && invoice.glMissingVariant !== 'internal-approval' && invoice.glMissingVariant !== 'prt-coding' && (
        <StickyGLPanel onDraftEmail={() => setShowGLCommsModal(true)} appliedCode={appliedGLCode} manualGLCode={manualGLCode} onApply={setAppliedGLCode} glApprovalEmailSent={glApprovalEmailSent} glApprovalEmailReceived={glApprovalEmailReceived} invoiceApproved={glInvoiceApproved} onInvoiceApprove={() => setGlInvoiceApproved(true)} onViewPosting={glInvoiceApproved ? () => setShowSAPPosting(true) : undefined} />
      )}
      {isFailed && invoice.failType === 'missing-gr' && !missingGRAutoResolved && (
        <StickyMissingGRPanel notificationSent={missingGRNotificationSent} onOpenComms={() => setShowMissingGRCommsModal(true)} />
      )}
      {isFailed && invoice.failType === 'duplicate' && <StickyDuplicatePanel notificationSent={duplicateNotificationSent} onDraftEmail={() => setShowDuplicateCommsModal(true)} />}
      {isFailed && invoice.failType === 'ic-mismatch' && !icResolved && (
        <StickyResolvePanel title="Intercompany Mismatch — ICE Reconciliation Required" subtitle="Trigger ICE reconciliation across the affiliated entities to clear the variance" buttonLabel="Trigger ICE Reconciliation" onResolve={() => setIcResolved(true)} />
      )}
      {isFailed && invoice.failType === 'ic-mismatch' && icResolved && <AutoApprovePanel invoice={invoice} onViewPosting={() => setShowSAPPosting(true)} />}
      {isFailed && invoice.failType === 'royalty-mismatch' && !royaltySent && !royaltyMismatchAutoResolved && (
        <StickyResolvePanel title="Royalty vs Contract Deviation — Review Required" subtitle="Route to Royalties Management to confirm the contract rate and resolve" buttonLabel="Send to Royalties Management" onResolve={() => { setRoyaltySent(true); onRoyaltySent?.() }} />
      )}
      {isFailed && invoice.failType === 'royalty-mismatch' && royaltySent && !royaltyMismatchAutoResolved && (
        <div style={{ flexShrink: 0, borderTop: '2px solid #1a3a6b', background: '#f0f4fa', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="#fff" style={{ display: 'block' }}><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1a3a6b' }}>Notification Sent to Royalties Management</div>
            <div style={{ fontSize: '13px', color: '#3a4a6b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>
              Deviation routed to <strong>Claire Newton</strong> (c.newton@penguinrandomhouse.com) — awaiting confirmation of the applicable contract rate
            </div>
          </div>
        </div>
      )}
      {isFailed && invoice.failType === 'royalty-mismatch' && royaltyMismatchAutoResolved && <AutoApprovePanel invoice={invoice} variant="royalty-resolved" onViewPosting={() => setShowSAPPosting(true)} />}
      {isFailed && invoice.failType === 'tax-mismatch' && !taxMismatchAutoResolved && (
        <StickyTaxMismatchPanel notificationSent={taxNotificationSent} onOpenComms={() => setShowCommsModal(true)} supplierName={invoice.supplier} />
      )}
      {isFailed && invoice.failType === 'manual-approval' && (
        <StickyManualApprovalPanel onApprove={handleManualApprove} approved={manuallyApproved} onViewPosting={manuallyApproved ? () => setShowSAPPosting(true) : undefined} />
      )}
    </>
  )

  const processingPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {steps.length > 0 && <Stepper steps={steps} currentStep={currentStep} completed={isGLResolved ? new Set(steps.map((_, i) => i)) : completed} failed={effectiveFailed} />}
      {steps.length > 0 && !isDone && !isGLResolved && (
        <AgentStatusBar step={steps[currentStep]} progress={progress} agentIdx={agentIdx} stepNum={currentStep} total={steps.length} failed={effectiveFailed} isPaused={isPaused} onTogglePause={togglePause} />
      )}
      <div style={{ height: agentActivityCollapsed ? '40px' : contentScrolled ? '128px' : '290px', flexShrink: 0, overflow: 'hidden', transition: 'height 0.25s ease' }}>
        <AgentHuddle steps={steps} currentStep={currentStep} progress={progress} completed={isGLResolved ? new Set(steps.map((_, i) => i)) : completed} isFailed={effectiveFailed} isDone={isDone || isGLResolved} isCollapsed={agentActivityCollapsed} onToggle={() => { setAgentActivityCollapsed(v => !v); setContentScrolled(false) }} invoice={invoice} />
      </div>
      <DocumentPanel scrollRef={contentScrollRef} onScroll={() => setContentScrolled((contentScrollRef.current?.scrollTop ?? 0) > 40)} hasContent={completed.size > 0 || isFailed}>
        {scrollContent}
      </DocumentPanel>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f6f7f7' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e4e6e7', padding: '10px 28px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#1a3a6b', fontSize: '14px', fontFamily: 'Lato, sans-serif', cursor: 'pointer', padding: 0 }}>← Inbox</button>
        <span style={{ color: '#c8cccf', fontSize: '15px' }}>/</span>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1d2f36' }}>{invoice.invoiceNumber}</span>
        <span style={{ background: cc.bg, color: cc.text, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>{invoice.category}</span>
        {invoice.straightforward && (
          <span style={{ background: '#e8f5ee', color: '#1b823f', border: '1px solid #c8e6c9', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', fontFamily: 'Lato, sans-serif' }}>✓ Straight-forward</span>
        )}
        <button onClick={() => setShowAuditDrawer(true)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fff', border: '1px solid #c8cccf', borderRadius: '6px', color: '#6b767b', fontSize: '13px', fontFamily: 'Lato, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><line x1="4" y1="4.5" x2="10" y2="4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="4" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="4" y1="9.5" x2="7.5" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
          Audit Trail
        </button>
        <div onClick={() => setShowInvoice(!showInvoice)} style={{ marginLeft: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
          <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: showInvoice ? '#1a3a6b' : '#c8cccf', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: '3px', left: showInvoice ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </div>
          <span style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>Show Invoice</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {showInvoice && (
          <div style={{ width: '50%', borderRight: '1px solid #e4e6e7', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <ScannedInvoice
              invoice={taxMismatchAutoResolved && invoice.id === 'inv-5' ? correctedTaxInvoice : invoice}
              isExtractionActive={currentStep === 1}
              isExtractionDone={completed.has(1)}
              extractionAgentIdx={currentStep === 1 ? agentIdx : -1}
            />
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {processingPanel}
        </div>
      </div>
      {stickyPanels}

      {showAudit && <AuditModal invoice={invoice} onClose={() => setShowAudit(false)} decision={null} />}
      {showOutlookModal && <OutlookModal invoice={invoice} onClose={() => setShowOutlookModal(false)} />}
      {showDuplicateCommsModal && invoice.duplicateInfo && (
        <DuplicateModal invoice={invoice} onClose={() => setShowDuplicateCommsModal(false)} onSent={() => { setDuplicateNotificationSent(true); setShowDuplicateCommsModal(false) }} />
      )}
      {showAuditDrawer && <AuditDrawer invoice={invoice} onClose={() => setShowAuditDrawer(false)} />}
      {showGLRepo && <GLCodeRepositoryDrawer onApplyCode={setAppliedGLCode} onClose={() => setShowGLRepo(false)} />}
      {showCommsModal && (
        <TaxMismatchModal
          invoice={invoice}
          onSend={handleSendTaxNotification}
          onClose={() => setShowCommsModal(false)}
        />
      )}
      {showMissingGRCommsModal && (
        <MissingGRModal
          invoice={invoice}
          onSend={handleSendMissingGRNotification}
          onClose={() => setShowMissingGRCommsModal(false)}
        />
      )}
      {showGLCommsModal && (
        <GLModal
          invoice={invoice}
          appliedCode={appliedGLCode || undefined}
          onSend={() => { setGlApprovalEmailSent(true); onGLApprovalSent?.() }}
          onClose={() => setShowGLCommsModal(false)}
        />
      )}
      {showMetroGLCommsModal && (
        <MetroGLApprovalModal
          invoice={invoice}
          onSend={() => { onMetroGLApprovalSend?.() }}
          onClose={() => setShowMetroGLCommsModal(false)}
        />
      )}
      {showSAPPosting && (
        <SAPPostingModal
          invoice={invoice}
          onClose={() => setShowSAPPosting(false)}
          onViewPayment={() => { setShowSAPPosting(false); setShowSAPPayment(true) }}
        />
      )}
      {showSAPPayment && (
        <SAPPaymentRunModal invoice={invoice} onClose={() => setShowSAPPayment(false)} />
      )}
    </div>
  )
}
