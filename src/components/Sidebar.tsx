export type SidebarTab = 'inbox' | 'dashboard' | 'audit' | 'analytics' | 'settings'

interface Props {
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
  inboxBadge?: number
}

interface NavItem {
  id: SidebarTab
  label: string
  icon: React.ReactNode
}

function TicketsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="1" y="2" width="18" height="16" rx="2"/>
      <line x1="1" y1="7" x2="19" y2="7"/>
      <line x1="5" y1="11" x2="15" y2="11" strokeLinecap="round"/>
      <line x1="5" y1="14" x2="11" y2="14" strokeLinecap="round"/>
    </svg>
  )
}


function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="1" y="1" width="7" height="8" rx="1.5"/>
      <rect x="12" y="1" width="7" height="5" rx="1.5"/>
      <rect x="1" y="12" width="7" height="7" rx="1.5"/>
      <rect x="12" y="9" width="7" height="10" rx="1.5"/>
    </svg>
  )
}

function AuditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7l-5-5H4zm8 0v4h4M7 9h6M7 12h6M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M4 2h8l4 5v9a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" fill="currentColor" opacity="0.15"/>
      <line x1="6" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="6" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="6" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="10" width="3" height="8" rx="1"/>
      <rect x="7" y="6" width="3" height="12" rx="1"/>
      <rect x="12" y="3" width="3" height="15" rx="1"/>
      <rect x="17" y="8" width="3" height="10" rx="1"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="3"/>
      <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42"/>
    </svg>
  )
}

const navItems: NavItem[] = [
  { id: 'inbox',     label: 'VIM Worklist', icon: <TicketsIcon /> },
  { id: 'dashboard', label: 'Dashboard',   icon: <DashboardIcon /> },
  { id: 'audit',     label: 'Audit Trail', icon: <AuditIcon /> },
  { id: 'analytics', label: 'Analytics',   icon: <AnalyticsIcon /> },
  { id: 'settings',  label: 'Settings',    icon: <SettingsIcon /> },
]

export function Sidebar({ activeTab, onTabChange, inboxBadge }: Props) {
  return (
    <div
      style={{
        width: '220px',
        flexShrink: 0,
        background: '#1d2f36',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontFamily: 'Lato, sans-serif',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}
        >
          Bertelsmann Source-to-Pay
        </div>
        <div
          style={{
            fontSize: '14px',
            fontFamily: 'Cabin, sans-serif',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            lineHeight: '1.3',
          }}
        >
          Invoice Processing
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 0' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                background: isActive ? 'rgba(26, 58, 107, 0.18)' : 'transparent',
                borderLeft: isActive ? '3px solid #1a3a6b' : '3px solid transparent',
                border: 'none',
                borderRight: 'none',
                borderTop: 'none',
                borderBottom: 'none',
                borderLeftStyle: 'solid',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
                fontFamily: 'Lato, sans-serif',
                fontSize: '15px',
                fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'
                  ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'
                }
              }}
            >
              <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === 'inbox' && inboxBadge != null && inboxBadge > 0 && (
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#b91f1f',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'Cabin, sans-serif',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {inboxBadge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#1a3a6b',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Cabin, sans-serif',
            fontSize: '13px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          LF
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontFamily: 'Lato, sans-serif' }}>
            Lena Fischer
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Lato, sans-serif' }}>
            AP Analyst
          </div>
        </div>
      </div>
    </div>
  )
}
