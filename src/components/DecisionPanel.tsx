import { Invoice } from '../types'

interface Props {
  onDecide: (d: 'approved' | 'rejected' | 'info-requested') => void
  decision: string | null
  invoice: Invoice
}

function getNow(): string {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function DecisionPanel({ onDecide, decision, invoice }: Props) {
  if (decision === 'approved') {
    return (
      <div
        style={{
          background: 'var(--now-success-bg)',
          border: '1px solid var(--now-success)',
          borderTop: '2px solid var(--now-success)',
          padding: '16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--now-success)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <div>
            <div
              style={{
                fontFamily: 'Cabin, sans-serif',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--now-success)',
                marginBottom: '4px',
              }}
            >
              Invoice has been approved.
            </div>
            <div
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '12px',
                color: 'var(--now-text-secondary)',
                marginBottom: '6px',
              }}
            >
              Invoice posted to SAP — AP open item created. Ready for payment on due date.
            </div>
            <div
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '11px',
                color: 'var(--now-text-disabled)',
              }}
            >
              {getNow()} · Approved by Lena Fischer · AP Analyst · {invoice.invoiceNumber}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (decision === 'rejected') {
    return (
      <div
        style={{
          background: 'var(--now-error-bg)',
          border: '1px solid var(--now-error)',
          borderTop: '2px solid var(--now-error)',
          padding: '16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--now-error)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            ✕
          </div>
          <div>
            <div
              style={{
                fontFamily: 'Cabin, sans-serif',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--now-error)',
                marginBottom: '4px',
              }}
            >
              Invoice has been rejected.
            </div>
            <div
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '12px',
                color: 'var(--now-text-secondary)',
              }}
            >
              Invoice Rejection Agent will notify the supplier.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (decision === 'info-requested') {
    return (
      <div
        style={{
          background: 'var(--now-warning-bg)',
          border: '1px solid var(--now-warning)',
          borderTop: '2px solid var(--now-warning)',
          padding: '16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--now-warning)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            ?
          </div>
          <div>
            <div
              style={{
                fontFamily: 'Cabin, sans-serif',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--now-warning)',
                marginBottom: '4px',
              }}
            >
              More information requested.
            </div>
            <div
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '12px',
                color: 'var(--now-text-secondary)',
              }}
            >
              Supplier has been notified via AI Chatbot Agent.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No decision yet
  return (
    <div
      style={{
        background: 'var(--now-surface)',
        borderTop: '2px solid var(--now-primary)',
        padding: '14px 16px',
        flexShrink: 0,
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <div
          style={{
            fontFamily: 'Cabin, sans-serif',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--now-warning)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '2px',
          }}
        >
          Human Decision Required
        </div>
        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: 'var(--now-text-secondary)' }}>
          Review the agent recommendation and take action.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onDecide('approved')}
          style={{
            background: '#1b823f',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'Cabin, sans-serif',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>✓</span> Approve
        </button>

        <button
          onClick={() => onDecide('rejected')}
          style={{
            background: 'white',
            color: '#b91f1f',
            border: '1px solid #b91f1f',
            borderRadius: 'var(--radius-md)',
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'Cabin, sans-serif',
            cursor: 'pointer',
          }}
        >
          Reject
        </button>

        <button
          onClick={() => onDecide('info-requested')}
          style={{
            background: 'white',
            color: 'var(--now-text-secondary)',
            border: '1px solid var(--now-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 20px',
            fontSize: '13px',
            fontFamily: 'Cabin, sans-serif',
            cursor: 'pointer',
          }}
        >
          Request More Info
        </button>
      </div>
    </div>
  )
}
