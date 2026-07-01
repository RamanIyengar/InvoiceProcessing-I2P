import { useState } from 'react'

const USE_CASES = [
  { no: 1,  supplier: 'ARRI Rental Deutschland GmbH', invoiceId: 'ARRI-2026-148750',  amount: '€187,420.00', cat: 'PO',       div: 'Fremantle (RTL Group)',        theme: 'PO 3-way match · VAT §12 standard rate' },
  { no: 2,  supplier: 'Sunset Post Production',        invoiceId: 'SPP-2026-0461',     amount: '€94,300.00',  cat: 'PO',       div: 'Fremantle (RTL Group)',        theme: 'Duplicate invoice detection' },
  { no: 3,  supplier: 'Maersk Line',                   invoiceId: 'MAEU-2026-58900',   amount: '$12,480.00',  cat: 'PO',       div: 'Penguin Random House',         theme: 'Freight surcharge tolerance breach' },
  { no: 4,  supplier: 'Deloitte Consulting GmbH',      invoiceId: 'DLT-2026-7741',     amount: '€142,000.00', cat: 'Non-PO',   div: 'Arvato Connect',               theme: 'GL coding recommendation + email request' },
  { no: 5,  supplier: 'Lehmanns Media GmbH',           invoiceId: 'LM-2026-04781',     amount: '€28,560.00',  cat: 'Non-PO',   div: 'Bertelsmann Education',        theme: 'VAT reduced rate §12 (books) mismatch' },
  { no: 6,  supplier: 'Jung von Matt AG',               invoiceId: 'JVM-2026-3047',     amount: '€215,750.00', cat: 'Non-PO',   div: 'Bertelsmann Marketing Services', theme: 'Non-PO GL coding · marketing spend' },
  { no: 7,  supplier: 'RR Donnelley',                  invoiceId: 'RRD-2026-660219',   amount: '$31,600.00',  cat: 'Non-PO',   div: 'DK Publishing (PRH)',          theme: 'Framework surcharge pre-approval check' },
  { no: 8,  supplier: 'Ingram Content Group',          invoiceId: 'ING-2026-541097',   amount: '$84,210.00',  cat: 'PO',       div: 'Penguin Random House',         theme: 'Straight-through auto-approval' },
  { no: 9,  supplier: 'Kobalt Music Group',            invoiceId: 'KOB-RY-2026-0831',  amount: '£318,750.00', cat: 'Royalty',  div: 'BMG Rights Management',        theme: 'Royalty withholding tax §50a EStG' },
  { no: 10, supplier: 'T-Systems International GmbH', invoiceId: 'TSI-2026-884412',   amount: '€410,200.00', cat: 'Non-PO',   div: 'Arvato Systems',               theme: 'Ambiguous GL — 3 competing codes' },
  { no: 11, supplier: 'Pixomondo GmbH',               invoiceId: 'PXM-2026-1047',     amount: '€560,000.00', cat: 'Non-PO',   div: 'Fremantle (RTL Group)',        theme: 'WBS project cost split · VFX production' },
  { no: 12, supplier: 'Bertelsmann Intercompany',     invoiceId: 'IC-2026-BTV-0341',  amount: '€3,240,000.00', cat: 'IC',    div: 'Bertelsmann TV Germany',       theme: 'Intercompany reconciliation · transfer pricing' },
  { no: 13, supplier: 'The Wylie Agency LLC',         invoiceId: 'WYL-RY-2026-0312',  amount: '$84,375.00',  cat: 'Royalty',  div: 'Penguin Random House',         theme: 'Royalty dispute resolution · DRC clearance' },
  { no: 14, supplier: 'Stellify Media Ltd',           invoiceId: 'STL-2026-0094',     amount: '€196,800.00', cat: 'PO',       div: 'Fremantle (RTL Group)',        theme: 'Cross-border VAT reverse charge §13b UStG' },
]

function UseCasesModal({ onClose }: { onClose: () => void }) {
  const catColor = (cat: string) => {
    if (cat === 'PO')     return { bg: '#e7ecf5', fg: '#1a3a6b' }
    if (cat === 'Non-PO') return { bg: '#fef3e2', fg: '#b06b00' }
    if (cat === 'Royalty') return { bg: '#f0ecf8', fg: '#6b35a8' }
    return { bg: '#e8f5ee', fg: '#1b823f' }
  }
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', width: '900px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e4e6e7', background: '#1d2f36', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#fff' }}>Bertelsmann Use Cases</div>
            <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>AI-Powered Invoice Processing · 14 Use Cases</div>
          </div>
          <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>×</button>
        </div>
        {/* Table */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Lato, sans-serif' }}>
            <thead>
              <tr style={{ background: '#f6f7f7', position: 'sticky', top: 0 }}>
                {['#', 'Supplier', 'Invoice No.', 'Amount', 'Type', 'Division / BU', 'AI Use Case'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid #e4e6e7', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USE_CASES.map((uc, i) => {
                const c = catColor(uc.cat)
                return (
                  <tr key={uc.no} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f1f1' }}>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b767b', fontWeight: 700, width: '30px' }}>{uc.no}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: '#1d2f36', maxWidth: '180px' }}>{uc.supplier}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b767b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{uc.invoiceId}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: '#1d2f36', textAlign: 'right', whiteSpace: 'nowrap' }}>{uc.amount}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: c.bg, color: c.fg, borderRadius: '10px', padding: '2px 8px', whiteSpace: 'nowrap' }}>{uc.cat}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#4a555c', maxWidth: '160px' }}>{uc.div}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#4a555c' }}>{uc.theme}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #e4e6e7', background: '#f6f7f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#89919a' }}>Bertelsmann Invoice Processing Automation · Demo Scope · Accenture</span>
          <button onClick={onClose} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #c8cccf', background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Lato, sans-serif', color: '#4a555c', fontWeight: 600 }}>Close</button>
        </div>
      </div>
    </div>
  )
}

function ProcessFlowModal({ onClose }: { onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', maxWidth: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e4e6e7', background: '#f6f7f7' }}>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1d2f36' }}>Reimagined Accounts Payable with AI</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #c8cccf', background: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d2f36', fontWeight: 700 }}>−</button>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: '#6b767b', minWidth: '44px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #c8cccf', background: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d2f36', fontWeight: 700 }}>+</button>
            <button onClick={() => setZoom(1)} style={{ padding: '0 10px', height: '32px', borderRadius: '6px', border: '1px solid #c8cccf', background: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'Lato, sans-serif', color: '#6b767b', fontWeight: 600 }}>Reset</button>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #c8cccf', background: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b767b', fontWeight: 700, marginLeft: '4px' }}>×</button>
          </div>
        </div>
        <div style={{ overflow: 'auto', flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: '16px' }}>
          <img src="/reimagined-ap.png" alt="Reimagined AP with AI" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', display: 'block', maxWidth: 'none' }} />
        </div>
      </div>
    </div>
  )
}

interface Props {
  onSelectOutlook: () => void
  onSelectSAP: () => void
}

function VIMIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="3" width="20" height="3" rx="1" fill="#0070B1" />
      <rect x="1" y="8" width="20" height="3" rx="1" fill="#0070B1" opacity="0.7" />
      <rect x="1" y="13" width="14" height="3" rx="1" fill="#0070B1" opacity="0.5" />
      <rect x="1" y="18" width="10" height="2" rx="1" fill="#0070B1" opacity="0.3" />
    </svg>
  )
}

function WorkflowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="4" cy="5" r="3" stroke="#5a6872" strokeWidth="1.5" />
      <circle cx="18" cy="5" r="3" stroke="#5a6872" strokeWidth="1.5" />
      <circle cx="11" cy="17" r="3" stroke="#5a6872" strokeWidth="1.5" />
      <path d="M7 5h8M6.5 7.5l3 7M15.5 7.5l-3 7" stroke="#5a6872" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function GLIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="2" width="18" height="18" rx="2" stroke="#5a6872" strokeWidth="1.5" />
      <path d="M2 8h18M8 8v12" stroke="#5a6872" strokeWidth="1.3" />
      <path d="M12 12h4M12 15.5h3" stroke="#5a6872" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ExceptionIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2L2 19h18L11 2z" stroke="#5a6872" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 9v4" stroke="#5a6872" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11" cy="16" r="1" fill="#5a6872" />
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="12" width="4" height="8" rx="1" fill="#5a6872" opacity="0.5" />
      <rect x="9" y="7" width="4" height="13" rx="1" fill="#5a6872" opacity="0.65" />
      <rect x="16" y="3" width="4" height="17" rx="1" fill="#5a6872" opacity="0.8" />
    </svg>
  )
}

function VendorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="8" r="4" stroke="#5a6872" strokeWidth="1.5" />
      <path d="M3 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#5a6872" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function AuditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="1" width="13" height="17" rx="1.5" stroke="#5a6872" strokeWidth="1.5" />
      <path d="M6 6h7M6 9.5h7M6 13h4" stroke="#5a6872" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="17" cy="17" r="4" fill="white" stroke="#5a6872" strokeWidth="1.5" />
      <path d="M15.5 17l1 1 2-2" stroke="#5a6872" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InactiveTile({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div
      style={{
        width: '164px',
        height: '160px',
        background: 'white',
        borderRadius: '4px',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.10)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        opacity: 0.72,
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ width: '38px', height: '38px', background: '#f0f4f8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: '#32363a', lineHeight: '1.3' }}>{title}</div>
        <div style={{ fontSize: '11px', color: '#89919a', fontFamily: 'Lato, sans-serif', lineHeight: '1.4' }}>{subtitle}</div>
      </div>
    </div>
  )
}

export function LandingScreen({ onSelectOutlook, onSelectSAP }: Props) {
  const [showFlowModal, setShowFlowModal] = useState(false)
  const [showUseCasesModal, setShowUseCasesModal] = useState(false)
  const [vimHovered, setVimHovered] = useState(false)
  const [outlookHovered, setOutlookHovered] = useState(false)

  return (
    <>
      {showFlowModal && <ProcessFlowModal onClose={() => setShowFlowModal(false)} />}
      {showUseCasesModal && <UseCasesModal onClose={() => setShowUseCasesModal(false)} />}
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f0f0', overflow: 'hidden' }}>

        {/* SAP Fiori Shell Bar */}
        <div style={{ height: '44px', background: '#354a5e', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '0', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
          {/* SAP Logo + App Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingRight: '20px', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ width: '34px', height: '21px', background: '#0070B1', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: '11px', fontFamily: 'Arial, sans-serif', fontWeight: 700, letterSpacing: '0.8px' }}>SAP</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Lato, sans-serif', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>SAP S/4HANA Cloud</span>
          </div>

          {/* System info */}
          <div style={{ flex: 1, padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Lato, sans-serif', fontSize: '12px' }}>Bertelsmann · BERT_PRD · Client 100 · EN</span>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowFlowModal(true)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)', fontFamily: 'Lato, sans-serif', fontSize: '12px', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="1" width="10" height="13" rx="1.5" /><path d="M5 5h6M5 8h6M5 11h4" strokeLinecap="round" /><path d="M10 1v3.5H14" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Reimagined with AI
            </button>

            <button
              onClick={() => setShowUseCasesModal(true)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)', fontFamily: 'Lato, sans-serif', fontSize: '12px', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="14" height="12" rx="1.5" /><path d="M4 6h8M4 9h6" strokeLinecap="round" /></svg>
              Bertelsmann Use Cases
            </button>

            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />

            {/* User avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.2 }}>Lena Fischer</div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.2 }}>AP Analyst · LFISCHER</div>
              </div>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#0070B1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabin, sans-serif', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>LF</div>
            </div>
          </div>
        </div>

        {/* Launchpad body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 44px 40px' }}>

          {/* Breadcrumb + title */}
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#89919a', fontFamily: 'Lato, sans-serif', fontSize: '12px' }}>SAP Fiori Launchpad / </span>
            <span style={{ color: '#32363a', fontFamily: 'Lato, sans-serif', fontSize: '12px', fontWeight: 600 }}>Accounts Payable</span>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '26px', fontWeight: 700, color: '#32363a', margin: '0 0 4px' }}>Invoice Processing</h1>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: '#89919a', margin: 0 }}>SAP S/4HANA · OpenText VIM · AP Workflow · AI-Powered Automation</p>
          </div>

          {/* ─── Group: VIM & AP Processing ─── */}
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 700, color: '#89919a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>VIM &amp; AP Processing</span>
            <div style={{ flex: 1, height: '1px', background: '#d9d9d9' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '36px' }}>

            {/* Primary tile — VIM Invoice Worklist */}
            <div
              onClick={onSelectSAP}
              onMouseEnter={() => setVimHovered(true)}
              onMouseLeave={() => setVimHovered(false)}
              style={{
                width: '210px',
                height: '172px',
                background: 'white',
                borderRadius: '4px',
                boxShadow: vimHovered ? '0 4px 20px rgba(0,112,177,0.28)' : '0 0 0 1px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'all 0.15s',
                transform: vimHovered ? 'translateY(-2px)' : 'none',
                borderTop: '4px solid #0070B1',
                userSelect: 'none',
              }}
            >
              <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '40px', height: '40px', background: '#e8f0fa', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VIMIcon />
                </div>
                <div style={{ fontSize: '14px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: '#32363a', lineHeight: '1.3' }}>VIM Invoice Worklist</div>
                <div style={{ fontSize: '11px', color: '#89919a', fontFamily: 'Lato, sans-serif' }}>OpenText VIM · Cockpit</div>
              </div>
              <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '6px', background: vimHovered ? '#f5f9ff' : 'white', transition: 'background 0.15s' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#0070B1', fontFamily: 'Lato, sans-serif', lineHeight: 1 }}>14</span>
                <div>
                  <div style={{ fontSize: '10px', color: '#89919a', fontFamily: 'Lato, sans-serif', lineHeight: 1.2 }}>documents</div>
                  <div style={{ fontSize: '9px', color: '#b91f1f', fontFamily: 'Lato, sans-serif', lineHeight: 1.2, fontWeight: 600 }}>6 exceptions</div>
                </div>
              </div>
            </div>

            <InactiveTile icon={<WorkflowIcon />} title="AP Workflow Monitor" subtitle="Approval Tracking · FI Workflow" />
            <InactiveTile icon={<GLIcon />} title="GL Coding Workbench" subtitle="Account Assignment · BSEG" />
            <InactiveTile icon={<ExceptionIcon />} title="Exception Monitor" subtitle="Invoice Exceptions · VIM" />
          </div>

          {/* ─── Group: Analytics & Reporting ─── */}
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 700, color: '#89919a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Analytics &amp; Reporting</span>
            <div style={{ flex: 1, height: '1px', background: '#d9d9d9' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '44px', flexWrap: 'wrap' }}>
            <InactiveTile icon={<AnalyticsIcon />} title="Processing Analytics" subtitle="KPI Dashboard · AP Analytics" />
            <InactiveTile icon={<VendorIcon />} title="Vendor Management" subtitle="Vendor Master · BP Cockpit" />
            <InactiveTile icon={<AuditIcon />} title="Audit &amp; Compliance" subtitle="Document Audit Trail · GRC" />
          </div>

          {/* ─── Microsoft 365 Integration ─── */}
          <div style={{ borderTop: '1px solid #d9d9d9', paddingTop: '28px' }}>
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 700, color: '#89919a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Microsoft 365 Integration</span>
              <div style={{ flex: 1, height: '1px', background: '#d9d9d9' }} />
            </div>

            <div
              onClick={onSelectOutlook}
              onMouseEnter={() => setOutlookHovered(true)}
              onMouseLeave={() => setOutlookHovered(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'white',
                borderRadius: '4px',
                boxShadow: outlookHovered ? '0 4px 14px rgba(0,120,212,0.18)' : '0 0 0 1px rgba(0,0,0,0.10)',
                cursor: 'pointer',
                padding: '12px 20px',
                transition: 'all 0.15s',
                transform: outlookHovered ? 'translateY(-1px)' : 'none',
                userSelect: 'none',
              }}
            >
              <img src="/Outlook.png" alt="Outlook" style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: '#32363a' }}>Microsoft Outlook</div>
                <div style={{ fontSize: '11px', color: '#0078d4', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>AP Invoice Email Inbox · BERT_AP@bertelsmann.de</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#0078d4" strokeWidth="1.8" style={{ marginLeft: '8px' }}><path d="M3 7h8M8 4l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>

            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#b0b8c0', marginTop: '10px' }}>
              AP vendor emails captured from Outlook and ingested into SAP VIM via Email Capture integration.
            </p>
          </div>
        </div>

        {/* SAP Footer bar */}
        <div style={{ height: '30px', background: '#354a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.03em' }}>
            SAP S/4HANA Cloud · Bertelsmann Global · BERT_PRD · Client 100 · © 2026 SAP SE
          </span>
        </div>
      </div>
    </>
  )
}
