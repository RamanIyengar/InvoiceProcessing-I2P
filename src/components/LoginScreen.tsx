import { useState } from 'react'

interface Props {
  onLogin: () => void
}

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
    title: 'View Invoice status and Remittance details',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
      </svg>
    ),
    title: 'Submit and Create Invoices',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.44-1.44a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
      </svg>
    ),
    title: 'Raise tickets to helpdesk team for query resolution',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'View visual insights for expected payments & subscribe to invoice status change notifications',
  },
]

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin()
    }, 800)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Lato, sans-serif' }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left panel */}
        <div style={{
          flex: 1,
          background: '#FFFFFF',
          padding: '64px 72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #E2E8F0',
        }}>
          <div>
            <p style={{ fontSize: '15px', color: '#475569', marginBottom: '6px', fontWeight: 400 }}>
              Welcome to
            </p>
            <h1 style={{
              fontFamily: 'Cabin, sans-serif',
              fontSize: '34px',
              fontWeight: 700,
              color: '#7C3AED',
              lineHeight: 1.2,
              marginBottom: '24px',
            }}>
              I2P – Invoice To Pay
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#64748B',
              lineHeight: '1.75',
              maxWidth: '540px',
            }}>
              Your one-stop-shop for invoice/document submission, processing and management activities.
              This tool provides you and your team with the features and functions necessary for a Supplier
              to submit invoices and view the status invoice flow with touchless data entry and upfront
              duplicate payment check.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '580px' }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: '#FAFAFF',
                border: '1px solid #EDE9FE',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {f.icon}
                <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.55' }}>{f.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — login form */}
        <div style={{
          width: '400px',
          flexShrink: 0,
          background: '#FFFFFF',
          padding: '64px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '-6px 0 24px rgba(0,0,0,0.06)',
        }}>
          {/* Accenture logo */}
          <div style={{ marginBottom: '28px' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="8" fill="#F0FDF4"/>
              <path d="M12 24 L24 12 L36 24 L24 36 Z" fill="none" stroke="#16A34A" strokeWidth="2.5"/>
              <path d="M18 24 L24 18 L30 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 style={{
            fontFamily: 'Cabin, sans-serif',
            fontSize: '22px',
            fontWeight: 700,
            color: '#1E293B',
            marginBottom: '28px',
          }}>
            Login
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Email ID or User name <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter email or username"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                outline: 'none',
                color: '#1E293B',
                background: '#F9FAFB',
                boxSizing: 'border-box',
                fontFamily: 'Lato, sans-serif',
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Password <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                outline: 'none',
                color: '#1E293B',
                background: '#F9FAFB',
                boxSizing: 'border-box',
                fontFamily: 'Lato, sans-serif',
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB' }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: loading ? '#475569' : '#1E293B',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontFamily: 'Cabin, sans-serif',
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              marginBottom: '16px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#0F172A' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#1E293B' }}
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: '13px', color: '#7C3AED', textDecoration: 'none' }}>
              Forgot Password?
            </a>
          </div>

          <div style={{ height: '1px', background: '#E2E8F0', marginBottom: '20px' }} />

          <button
            style={{
              width: '100%',
              padding: '11px 24px',
              background: 'transparent',
              color: '#1E293B',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'Cabin, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#7C3AED'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'}
          >
            Enterprise Login
          </button>

          <button
            style={{
              width: '100%',
              padding: '11px 24px',
              background: 'transparent',
              color: '#7C3AED',
              border: '1px solid #7C3AED',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'Cabin, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#7C3AED'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#7C3AED' }}
          >
            New Supplier Registration
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        height: '36px',
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontSize: '11px',
        color: '#94A3B8',
      }}>
        <span>I2P · © 2026 Accenture. All Rights Reserved.</span>
        <span>·</span>
        <a href="#" onClick={e => e.preventDefault()} style={{ color: '#94A3B8', textDecoration: 'none' }}>Privacy Statement</a>
        <span>·</span>
        <a href="#" onClick={e => e.preventDefault()} style={{ color: '#94A3B8', textDecoration: 'none' }}>Contact Support</a>
      </div>
    </div>
  )
}
