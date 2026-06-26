import { Invoice } from '../types'

interface Props {
  onBack?: () => void
  currentInvoice: Invoice | null
  onLogout?: () => void
}

export function AppHeader({ onBack, currentInvoice, onLogout }: Props) {
  return (
    <header
      style={{
        background: '#1d2f36',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        zIndex: 100,
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        {/* Bertelsmann Shield */}
        <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14 0L0 5.5V18C0 25.2 6.4 30.7 14 32C21.6 30.7 28 25.2 28 18V5.5L14 0Z"
            fill="#351C15"
          />
          <path
            d="M14 2.5L2 7.3V18C2 24.2 7.4 29.1 14 30.2C20.6 29.1 26 24.2 26 18V7.3L14 2.5Z"
            fill="#4A2A1A"
          />
          <text
            x="14"
            y="22"
            textAnchor="middle"
            fill="#FFB500"
            fontSize="13"
            fontWeight="bold"
            fontFamily="Cabin, sans-serif"
          >
            BG
          </text>
        </svg>

        {/* App Title */}
        <span
          style={{
            fontFamily: 'Cabin, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '0.02em',
          }}
        >
          Bertelsmann Global Source-to-Pay
        </span>

        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px', margin: '0 2px' }}>|</span>

        <span
          style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          Invoice Processing Automation
        </span>

        {/* Breadcrumb */}
        {currentInvoice && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>›</span>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Lato, sans-serif',
                  fontSize: '13px',
                  color: '#FFB500',
                  fontWeight: 600,
                }}
              >
                {currentInvoice.invoiceNumber}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Right side – User persona + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.2' }}>
            Lena Fischer
          </div>
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.2' }}>
            AP Analyst
          </div>
        </div>

        {/* Avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#1a3a6b',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Cabin, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          LF
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '4px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '12px',
              fontFamily: 'Lato, sans-serif',
              padding: '5px 12px',
              cursor: 'pointer',
              marginLeft: '4px',
            }}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  )
}
