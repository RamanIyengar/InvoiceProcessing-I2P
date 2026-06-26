import { useState } from 'react'

interface Props {
  onLogin: () => void
  onBack: () => void
}

export function OutlookLoginScreen({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState('l.fischer@bertelsmann.de')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = () => {
    if (!email.trim()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin()
    }, 900)
  }

  return (
    <div style={{ height: '100vh', background: '#f2f2f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: 'white', borderRadius: '4px', padding: '44px 40px', width: '400px', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
        {/* Microsoft logo */}
        <div style={{ marginBottom: '24px' }}>
          <svg width="108" height="24" viewBox="0 0 108 24" fill="none">
            <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022" />
            <rect x="12" y="0" width="10.5" height="10.5" fill="#7FBA00" />
            <rect x="0" y="12" width="10.5" height="10.5" fill="#00A4EF" />
            <rect x="12" y="12" width="10.5" height="10.5" fill="#FFB900" />
            <text x="28" y="17" fontSize="16" fontWeight="600" fill="#1d2f36" fontFamily="'Segoe UI', system-ui, sans-serif">Microsoft</text>
          </svg>
        </div>

        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: '0 0 16px', fontSize: '13px', color: '#0078d4', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>← Back</button>

        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1d2f36', margin: '0 0 6px', lineHeight: '1.25' }}>Sign in</h1>
        <p style={{ fontSize: '13px', color: '#6b767b', margin: '0 0 20px' }}>Use your Microsoft account to access Outlook</p>

        <div style={{ marginBottom: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email, phone, or Skype"
            style={{ width: '100%', padding: '9px 10px', border: '1px solid #c8cccf', borderRadius: '2px', fontSize: '15px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            onKeyDown={e => { if (e.key === 'Enter') handleSignIn() }}
            style={{ width: '100%', padding: '9px 10px', border: '1px solid #c8cccf', borderRadius: '2px', fontSize: '15px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#0078d4', color: 'white', border: 'none', borderRadius: '2px', fontSize: '15px', fontFamily: 'inherit', fontWeight: 600, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.75 : 1, transition: 'opacity 0.15s' }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', color: '#0078d4', cursor: 'pointer', fontFamily: 'inherit' }}>Forgot password?</button>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '20px' }}>
        {['Terms of use', 'Privacy & cookies'].map(link => (
          <span key={link} style={{ fontSize: '12px', color: '#6b767b', cursor: 'pointer' }}>{link}</span>
        ))}
      </div>
    </div>
  )
}
