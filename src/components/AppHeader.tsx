import { Invoice } from '../types'

export type NavSection = 'cases' | 'insights' | 'submission' | 'audit' | 'configuration' | 'usecases'

interface Props {
  activeSection: NavSection
  onSectionChange: (section: NavSection) => void
  currentInvoice: Invoice | null
  onLogout: () => void
  inboxBadge?: number
}

const NAV_ITEMS: { id: NavSection; label: string; highlight?: boolean }[] = [
  { id: 'cases',         label: 'Cases' },
  { id: 'insights',      label: 'Insights' },
  { id: 'submission',    label: 'Submission' },
  { id: 'audit',         label: 'Audit Trail' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'usecases',      label: 'Use Cases', highlight: true },
]

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  )
}

export function AppHeader({ activeSection, onSectionChange, currentInvoice, onLogout, inboxBadge }: Props) {
  return (
    <header style={{
      background: '#0F1934',
      flexShrink: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
      zIndex: 100,
      fontFamily: 'Lato, sans-serif',
    }}>
      {/* Main nav bar */}
      <div style={{
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '0',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: 'Cabin, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '0.04em',
          marginRight: '32px',
          flexShrink: 0,
        }}>
          I2P
        </div>

        {/* Nav items */}
        <nav style={{ display: 'flex', gap: '2px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id
            const isHighlight = item.highlight
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                style={{
                  background: isActive ? (isHighlight ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.2)') : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #A78BFA' : '2px solid transparent',
                  color: isActive ? '#FFFFFF' : isHighlight ? '#C4B5FD' : 'rgba(255,255,255,0.65)',
                  fontSize: '13px',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: isActive || isHighlight ? 600 : 400,
                  padding: '0 16px',
                  height: '52px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'color 0.15s, background 0.15s',
                  position: 'relative',
                  top: '1px',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = isHighlight ? '#C4B5FD' : 'rgba(255,255,255,0.65)'; (e.currentTarget as HTMLElement).style.background = 'transparent' } }}
              >
                {item.label}
                {item.id === 'submission' && inboxBadge != null && inboxBadge > 0 && (
                  <span style={{
                    background: '#DC2626',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontFamily: 'Cabin, sans-serif',
                  }}>
                    {inboxBadge}
                  </span>
                )}
                {!isHighlight && (
                  <svg width="10" height="10" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.5, marginLeft: '2px' }}>
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )
          })}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {/* Language */}
          <button style={{
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.65)', fontSize: '13px',
            fontFamily: 'Lato, sans-serif', cursor: 'pointer', padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            EN
            <svg width="10" height="10" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Search */}
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
            <SearchIcon />
          </button>

          {/* Bell */}
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
            <BellIcon />
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)', margin: '0 8px' }} />

          {/* User */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={onLogout}
            title="Click to sign out"
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#7C3AED',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Cabin, sans-serif',
              fontSize: '11px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              RI
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontFamily: 'Lato, sans-serif' }}>
              r.thothadri.iyengar
            </span>
          </div>
        </div>
      </div>

      {/* Sub-breadcrumb bar (only when an invoice is open) */}
      {currentInvoice && (
        <div style={{
          height: '36px',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '8px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.55)',
          fontFamily: 'Lato, sans-serif',
        }}>
          <span>I2P</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span>Cases</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: '#A78BFA', fontWeight: 600 }}>
            URN {currentInvoice.invoiceNumber}
          </span>
        </div>
      )}
    </header>
  )
}
