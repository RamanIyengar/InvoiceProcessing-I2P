import { useState } from 'react'

function ProcessFlowModal({ onClose }: { onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', maxWidth: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        {/* Toolbar */}
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
        {/* Image area */}
        <div style={{ overflow: 'auto', flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: '16px' }}>
          <img
            src="/reimagined-ap.png"
            alt="Reimagined AP with AI"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', display: 'block', maxWidth: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}

interface Props {
  onSelectOutlook: () => void
  onSelectServiceNow: () => void
}

function ServiceNowCardIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="32" fill="#1b823f" />
      <path d="M20 32 C20 25.4 25.4 20 32 20 C38.6 20 44 25.4 44 32" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M44 32 C44 38.6 38.6 44 32 44 C25.4 44 20 38.6 20 32" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
      <circle cx="32" cy="32" r="5" fill="white" />
    </svg>
  )
}

export function LandingScreen({ onSelectOutlook, onSelectServiceNow }: Props) {
  const [outlookHovered, setOutlookHovered] = useState(false)
  const [snHovered, setSnHovered] = useState(false)
  const [showFlowModal, setShowFlowModal] = useState(false)

  const cardBase: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    width: '340px',
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px',
    userSelect: 'none',
  }

  const cardHovered: React.CSSProperties = {
    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
    transform: 'translateY(-6px)',
  }

  return (
    <>
    {showFlowModal && <ProcessFlowModal onClose={() => setShowFlowModal(false)} />}
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#1d2f36',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0px',
        position: 'relative',
      }}
    >
      {/* Doc icon — top right */}
      <button
        onClick={() => setShowFlowModal(true)}
        title="Reimagined with AI"
        style={{ position: 'absolute', top: '20px', right: '24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', color: 'rgba(255,255,255,0.8)', fontFamily: 'Lato, sans-serif', fontSize: '13px', fontWeight: 600, transition: 'all 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="1" width="10" height="13" rx="1.5" />
          <path d="M5 5h6M5 8h6M5 11h4" strokeLinecap="round" />
          <path d="M10 1v3.5H14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Reimagined with AI
      </button>
      {/* Top section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
        <img src="/bertelsmann-logo.svg" alt="Bertelsmann" style={{ height: '46px', width: 'auto', objectFit: 'contain' }} />
        <h1
          style={{
            fontFamily: 'Cabin, sans-serif',
            fontSize: '32px',
            fontWeight: 700,
            color: 'white',
            margin: 0,
            marginTop: '4px',
            letterSpacing: '-0.5px',
          }}
        >
          Invoice Processing Automation
        </h1>
        <p
          style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: '15px',
            color: 'rgba(255,255,255,0.55)',
            margin: 0,
          }}
        >
          Bertelsmann Invoice Processing Demo
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
        {/* Outlook Card */}
        <div
          style={{ ...cardBase, ...(outlookHovered ? cardHovered : {}) }}
          onClick={onSelectOutlook}
          onMouseEnter={() => setOutlookHovered(true)}
          onMouseLeave={() => setOutlookHovered(false)}
        >
          <img src="/Outlook.png" alt="Microsoft Outlook" style={{ height: '64px', width: '64px', objectFit: 'contain' }} />
          <div>
            <div
              style={{
                fontFamily: 'Cabin, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1d2f36',
                marginBottom: '4px',
              }}
            >
              Microsoft Outlook
            </div>
            <div
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '13px',
                color: '#0078d4',
                fontWeight: 600,
                marginBottom: '10px',
              }}
            >
              AP Invoice Email Inbox
            </div>
            <div
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '14px',
                color: '#6b767b',
                lineHeight: '1.55',
              }}
            >
              Review incoming supplier invoice emails in the AP mailbox. Preview attachments and source details before processing.
            </div>
          </div>
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontFamily: 'Lato, sans-serif',
              color: '#0078d4',
              fontWeight: 600,
            }}
          >
            Open Inbox
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 7h8M8 4l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* ServiceNow Card */}
        <div
          style={{ ...cardBase, ...(snHovered ? cardHovered : {}) }}
          onClick={onSelectServiceNow}
          onMouseEnter={() => setSnHovered(true)}
          onMouseLeave={() => setSnHovered(false)}
        >
          <ServiceNowCardIcon />
          <div>
            <div
              style={{
                fontFamily: 'Cabin, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1d2f36',
                marginBottom: '4px',
              }}
            >
              ServiceNow
            </div>
            <div
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '13px',
                color: '#1b823f',
                fontWeight: 600,
                marginBottom: '10px',
              }}
            >
              AP Processing Tickets
            </div>
            <div
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '14px',
                color: '#6b767b',
                lineHeight: '1.55',
              }}
            >
              Process invoice emails as structured AP workflow tickets. Run agentic validation, GL coding, and route for approval.
            </div>
          </div>
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontFamily: 'Lato, sans-serif',
              color: '#1b823f',
              fontWeight: 600,
            }}
          >
            Open ServiceNow
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 7h8M8 4l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '52px',
          fontFamily: 'Lato, sans-serif',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.03em',
        }}
      >
        Bertelsmann Accounts Payable Automation
      </div>
    </div>
    </>
  )
}
