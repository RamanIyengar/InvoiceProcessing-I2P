import { Invoice, InvoiceStatus } from '../types'

interface Props {
  invoice: Invoice
  onSelect: (invoice: Invoice) => void
}


function getStatusStyle(status: InvoiceStatus): { bg: string; text: string; label: string } {
  switch (status) {
    case 'detected':
      return { bg: '#f0f1f1', text: '#6b767b', label: 'Detected' }
    case 'processing':
      return { bg: '#e7ecf5', text: '#1a3a6b', label: 'Processing' }
    case 'awaiting-approval':
      return { bg: '#fff3d6', text: '#b06b00', label: 'Awaiting Approval' }
    case 'approved':
      return { bg: '#e8f5ee', text: '#1b823f', label: 'Approved' }
    case 'rejected':
      return { bg: '#fdecea', text: '#b91f1f', label: 'Rejected' }
    case 'info-requested':
      return { bg: '#fff3d6', text: '#b06b00', label: 'Info Requested' }
  }
}

export function InvoiceCard({ invoice, onSelect }: Props) {
  const statusStyle = getStatusStyle(invoice.status)
  const hasWorkflow = invoice.agentSteps.length > 0

  return (
    <div
      onClick={() => onSelect(invoice)}
      style={{
        background: 'var(--now-surface)',
        border: '1px solid var(--now-border)',
        borderLeft: '4px solid #e4e6e7',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, transform 0.1s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-md)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-sm)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'Cabin, sans-serif',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--now-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {invoice.invoiceNumber}
        </span>
      </div>

      {/* Supplier */}
      <div
        style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: '15px',
          color: 'var(--now-text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {invoice.supplier}
      </div>

      {/* Amount */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
        <span
          style={{
            fontFamily: 'Cabin, sans-serif',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--now-text)',
          }}
        >
          {invoice.currency === 'USD' ? '$' : ''}{invoice.amount.toLocaleString()}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--now-text-secondary)' }}>{invoice.currency}</span>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: 'var(--now-text-secondary)' }}>{invoice.receivedAt}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: statusStyle.bg,
              color: statusStyle.text,
              fontSize: '12px',
              fontWeight: 600,
              padding: '3px 9px',
              borderRadius: '4px',
            }}
          >
            {invoice.status === 'processing' && (
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  border: '1.5px solid currentColor',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                  flexShrink: 0,
                }}
              />
            )}
            {statusStyle.label}
          </div>

          {invoice.attachmentName && (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="var(--now-text-secondary)">
              <path d="M8 0H1.5C0.67 0 0 0.67 0 1.5v11C0 13.33.67 14 1.5 14h9c.83 0 1.5-.67 1.5-1.5V4L8 0zm0 1.5L10.5 4H8V1.5zM2 5.5h8v1H2v-1zm0 2.5h8v1H2V8zm0 2.5h5v1H2v-1z"/>
            </svg>
          )}
        </div>
      </div>

      {/* Email preview / CTA */}
      <div
        style={{
          borderTop: '1px solid var(--now-border)',
          paddingTop: '8px',
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: '13px',
            color: 'var(--now-text-disabled)',
            fontStyle: 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {invoice.emailPreview}
        </span>
        {hasWorkflow && (
          <span
            style={{
              flexShrink: 0,
              marginLeft: '8px',
              fontSize: '13px',
              color: '#1a3a6b',
              fontWeight: 600,
              fontFamily: 'Lato, sans-serif',
            }}
          >
            Process →
          </span>
        )}
      </div>
    </div>
  )
}
