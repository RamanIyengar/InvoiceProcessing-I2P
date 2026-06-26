import { useState } from 'react'
import { Invoice, InvoiceStatus } from '../types'
import { mockInvoices } from '../data/mockData'

interface Props {
  onSelectInvoice: (invoice: Invoice) => void
}

const metrics = [
  { value: '156', label: 'Total invoices ingested', color: '#1a3a6b' },
  { value: '129', label: 'Auto-processed invoices', color: '#1b823f' },
  { value: '11', label: 'Ready to approve', color: '#b06b00' },
  { value: '7', label: 'Need attention', color: '#b91f1f' },
]

const filterOptions = ['All', 'PO', 'Non-PO', 'ECC Legacy'] as const
type FilterOption = typeof filterOptions[number]

const catColors: Record<string, string> = {
  PO: '#1a3a6b',
  'Non-PO': '#b06b00',
  'ECC Legacy': '#1b823f',
}

function statusBadgeStyles(status: InvoiceStatus): { background: string; color: string } {
  switch (status) {
    case 'detected':          return { background: '#f0f1f1', color: '#6b767b' }
    case 'processing':        return { background: '#e7ecf5', color: '#1a3a6b' }
    case 'awaiting-approval': return { background: '#fff4e3', color: '#b06b00' }
    case 'approved':          return { background: '#e8f5ee', color: '#1b823f' }
    case 'rejected':          return { background: '#fdeaea', color: '#b91f1f' }
    case 'info-requested':    return { background: '#fdeaea', color: '#b91f1f' }
    default:                  return { background: '#f0f1f1', color: '#6b767b' }
  }
}

function statusLabel(status: InvoiceStatus): string {
  switch (status) {
    case 'detected':          return 'Detected'
    case 'processing':        return 'Processing'
    case 'awaiting-approval': return 'Awaiting Approval'
    case 'approved':          return 'Approved'
    case 'rejected':          return 'Rejected'
    case 'info-requested':    return 'Info Requested'
    default:                  return status
  }
}

function InvoiceCard({ invoice, onClick }: { invoice: Invoice; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency, maximumFractionDigits: 2 })
  const catColor = catColors[invoice.category] ?? '#6b767b'
  const badgeStyles = statusBadgeStyles(invoice.status)
  const initial = invoice.supplier.charAt(0).toUpperCase()
  const isClickable = invoice.agentSteps.length > 0

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered && isClickable ? '#1a3a6b' : '#e4e6e7'}`,
        borderRadius: '8px',
        padding: '20px',
        cursor: isClickable ? 'pointer' : 'default',
        boxShadow: hovered && isClickable ? '0 4px 12px rgba(26,58,107,0.12)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: catColor,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontFamily: 'Cabin, sans-serif',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {invoice.supplier}
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', flexShrink: 0 }}>
          {invoice.emailTime}
        </div>
      </div>

      <div style={{ fontSize: '12px', fontFamily: 'Lato, sans-serif', color: '#6b767b', marginBottom: '10px', fontVariantNumeric: 'tabular-nums' }}>
        {invoice.invoiceNumber}
      </div>

      <div style={{ fontSize: '22px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: catColor, marginBottom: '12px' }}>
        {fmt.format(invoice.amount)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'Lato, sans-serif',
            fontWeight: 700,
            color: catColor,
            background: catColor + '1a',
            border: `1px solid ${catColor}`,
            borderRadius: '12px',
            padding: '2px 8px',
          }}
        >
          {invoice.category}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'Lato, sans-serif',
            fontWeight: 700,
            color: badgeStyles.color,
            background: badgeStyles.background,
            borderRadius: '12px',
            padding: '2px 8px',
          }}
        >
          {statusLabel(invoice.status)}
        </span>
        {invoice.straightforward && (
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 700,
              color: '#1b823f',
              background: '#e8f5ee',
              border: '1px solid #1b823f',
              borderRadius: '12px',
              padding: '2px 8px',
            }}
          >
            ✓ Straight-forward
          </span>
        )}
      </div>
    </div>
  )
}

export function DashboardView({ onSelectInvoice }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All')

  const filteredInvoices = activeFilter === 'All'
    ? mockInvoices
    : mockInvoices.filter((inv) => inv.category === activeFilter)

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff', padding: '32px' }}>
      <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '26px', fontWeight: 700, color: '#1d2f36', marginBottom: '8px' }}>
        Dashboard
      </h1>
      <p style={{ fontSize: '15px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginBottom: '28px' }}>
        AI-powered invoice processing overview · Bertelsmann Global Source-to-Pay
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: '#fff',
              border: '1px solid #e4e6e7',
              borderTop: `3px solid ${m.color}`,
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '36px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: m.color }}>
              {m.value}
            </div>
            <div style={{ fontSize: '14px', fontFamily: 'Lato, sans-serif', color: '#6b767b', marginTop: '4px' }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: `1px solid ${activeFilter === f ? '#1a3a6b' : '#e4e6e7'}`,
              background: activeFilter === f ? '#1a3a6b' : '#fff',
              color: activeFilter === f ? '#fff' : '#6b767b',
              fontSize: '13px',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {filteredInvoices.map((invoice) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            onClick={() => onSelectInvoice(invoice)}
          />
        ))}
      </div>
    </div>
  )
}
