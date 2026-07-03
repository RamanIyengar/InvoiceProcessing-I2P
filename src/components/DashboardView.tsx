import { useState } from 'react'
import { Invoice } from '../types'
import { mockInvoices } from '../data/mockData'

interface Props {
  onSelectInvoice: (invoice: Invoice) => void
}

// ─── Donut chart helper ───────────────────────────────────────────────────────
function DonutSegment({ cx, cy, r, pct, color, offsetPct }: { cx: number; cy: number; r: number; pct: number; color: string; offsetPct: number }) {
  const circ = 2 * Math.PI * r
  return (
    <circle
      cx={cx} cy={cy} r={r}
      fill="none"
      stroke={color}
      strokeWidth="22"
      strokeDasharray={`${pct * circ} ${circ}`}
      strokeDashoffset={-offsetPct * circ}
      transform={`rotate(-90 ${cx} ${cy})`}
    />
  )
}

function AgentSummaryDonut() {
  const segments = [
    { label: 'Approved',      pct: 0.50, color: '#16A34A' },
    { label: 'Call to Action', pct: 0.42, color: '#D97706' },
    { label: 'Rejected',      pct: 0.04, color: '#DC2626' },
    { label: 'Others',        pct: 0.04, color: '#94A3B8' },
  ]
  let offset = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="36" fill="none" stroke="#F1F5F9" strokeWidth="22" />
        {segments.map((s) => {
          const el = <DonutSegment key={s.label} cx={55} cy={55} r={36} pct={s.pct} color={s.color} offsetPct={offset} />
          offset += s.pct
          return el
        })}
        <text x="55" y="51" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1E293B" fontFamily="Cabin, sans-serif">2852</text>
        <text x="55" y="64" textAnchor="middle" fontSize="9" fill="#64748B" fontFamily="Lato, sans-serif">Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#475569', fontFamily: 'Lato, sans-serif' }}>
              {s.label} <span style={{ fontWeight: 600, color: '#1E293B' }}>{Math.round(s.pct * 2852)} | {Math.round(s.pct * 100)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MachineDonut() {
  const circ = 2 * Math.PI * 36
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="36" fill="none" stroke="#F1F5F9" strokeWidth="22" />
        <circle cx="55" cy="55" r="36" fill="none" stroke="#7C3AED" strokeWidth="22"
          strokeDasharray={`${0.54 * circ} ${circ}`} strokeDashoffset={0} transform="rotate(-90 55 55)" />
        <circle cx="55" cy="55" r="36" fill="none" stroke="#C4B5FD" strokeWidth="22"
          strokeDasharray={`${0.40 * circ} ${circ}`} strokeDashoffset={-0.54 * circ} transform="rotate(-90 55 55)" />
        <circle cx="55" cy="55" r="36" fill="none" stroke="#DC2626" strokeWidth="22"
          strokeDasharray={`${0.06 * circ} ${circ}`} strokeDashoffset={-0.94 * circ} transform="rotate(-90 55 55)" />
        <text x="55" y="51" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1E293B" fontFamily="Cabin, sans-serif">1534</text>
        <text x="55" y="64" textAnchor="middle" fontSize="9" fill="#64748B" fontFamily="Lato, sans-serif">Machine</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {[
          { label: 'Auto Approved', pct: '54%', count: '828', color: '#7C3AED' },
          { label: 'Auto Rejected', pct: '40%', count: '614', color: '#C4B5FD' },
          { label: 'Others', pct: '6%', count: '92', color: '#DC2626' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#475569', fontFamily: 'Lato, sans-serif' }}>
              {s.label} <span style={{ fontWeight: 600, color: '#1E293B' }}>{s.count} | {s.pct}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Invoice card for grid view ───────────────────────────────────────────────
function InvoiceCard({ invoice, onClick }: { invoice: Invoice; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency, maximumFractionDigits: 2 })
  const isClickable = invoice.agentSteps.length > 0

  const catColor = invoice.category === 'PO' ? '#7C3AED' : invoice.category === 'Non-PO' ? '#D97706' : '#16A34A'

  const statusColor = () => {
    switch (invoice.status) {
      case 'approved': return { bg: '#F0FDF4', text: '#16A34A', label: 'Approved' }
      case 'rejected': return { bg: '#FEF2F2', text: '#DC2626', label: 'Rejected' }
      case 'awaiting-approval': return { bg: '#FFFBEB', text: '#D97706', label: 'Ready to Approve' }
      case 'processing': return { bg: '#EDE9FE', text: '#7C3AED', label: 'Processing' }
      default: return { bg: '#F1F5F9', text: '#64748B', label: 'Detected' }
    }
  }
  const sc = statusColor()

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered && isClickable ? '#7C3AED' : '#E2E8F0'}`,
        borderRadius: '8px',
        padding: '18px',
        cursor: isClickable ? 'pointer' : 'default',
        boxShadow: hovered && isClickable ? '0 4px 16px rgba(124,58,237,0.1)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ fontSize: '14px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: '#1E293B', flex: 1, marginRight: '8px' }}>
          {invoice.supplier}
        </div>
        <span style={{ fontSize: '11px', background: sc.bg, color: sc.text, borderRadius: '10px', padding: '2px 8px', fontFamily: 'Lato, sans-serif', fontWeight: 600, flexShrink: 0 }}>
          {sc.label}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'Lato, sans-serif', marginBottom: '8px' }}>
        {invoice.invoiceNumber}
      </div>
      <div style={{ fontSize: '20px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: catColor, marginBottom: '10px' }}>
        {fmt.format(invoice.amount)}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', background: catColor + '18', color: catColor, border: `1px solid ${catColor}40`, borderRadius: '10px', padding: '2px 8px', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>
          {invoice.category}
        </span>
        {invoice.straightforward && (
          <span style={{ fontSize: '11px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #16A34A40', borderRadius: '10px', padding: '2px 8px', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>
            ✓ Auto-approved
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DashboardView({ onSelectInvoice }: Props) {
  const [activeTab, setActiveTab] = useState<'agentic' | 'assigned' | 'team'>('agentic')

  const tabs = [
    { id: 'agentic' as const,  label: 'Agentic Insights' },
    { id: 'assigned' as const, label: 'Assigned To Me' },
    { id: 'team' as const,     label: 'Team Lead Dashboard' },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F8FAFC', fontFamily: 'Lato, sans-serif' }}>
      {/* Sub-tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 28px', display: 'flex', gap: '0' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid #7C3AED' : '2px solid transparent',
              color: activeTab === t.id ? '#7C3AED' : '#64748B',
              fontSize: '13px',
              fontFamily: 'Lato, sans-serif',
              fontWeight: activeTab === t.id ? 700 : 400,
              cursor: 'pointer',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Agent Summary header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#94A3B8', fontFamily: 'Lato, sans-serif', marginBottom: '2px' }}>
              Agent summary <span style={{ color: '#CBD5E1' }}>· Last Updated: 2 mins ago</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Priority Index</span>
            <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: '#7C3AED', position: 'relative', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', right: '2px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff' }} />
            </div>
          </div>
        </div>

        {/* Top stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Total ingested donut */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Total Invoices Ingested</div>
            <div style={{ fontSize: '28px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>2,852</div>
            <AgentSummaryDonut />
          </div>

          {/* Machine processed donut */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Total 1534 Invoices processed</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED', marginBottom: '16px' }}>Machine</div>
            <MachineDonut />
          </div>

          {/* Priority queue stats */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* AI Goal Summary */}
            <div style={{ background: '#EDE9FE', borderRadius: '8px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 600 }}>AI Agent Goal Summary</span>
              </div>
              <button style={{ fontSize: '11px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'Cabin, sans-serif', fontWeight: 600 }}>
                Override
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Currently Processing', value: '4', sub: '↗ Avg 18 Days' },
                { label: 'Pending Queue', value: '6', sub: '↗ $1142 values', accent: true },
                { label: 'Critical Priority', value: '2/8', sub: '' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: s.accent ? '#DC2626' : '#1E293B' }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>{s.label}</div>
                  {s.sub && <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{s.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Human processing summary */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px' }}>Total 1213 invoices processed — <span style={{ color: '#7C3AED', fontWeight: 600 }}>Human +</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Ready To Approve (Semi-Automated)', value: 873, pct: 72, color: '#16A34A' },
              { label: 'Need Attention (Agent Assisted)', value: 125, pct: 10, color: '#D97706' },
              { label: 'Approved (Human)', value: 189, pct: 16, color: '#7C3AED' },
              { label: 'Rejected (Human)', value: 29, pct: 2, color: '#DC2626' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{s.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: s.color, marginLeft: '8px', flexShrink: 0 }}>{s.value} | {s.pct}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Documents */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
              All Documents ({mockInvoices.length})
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {mockInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onClick={() => onSelectInvoice(invoice)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
