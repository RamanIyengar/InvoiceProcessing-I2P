import { useState } from 'react'

interface Props {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('LFISCHER')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    if (!email.trim()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin()
    }, 800)
  }

  return (
    <div
      style={{
        height: '100vh',
        background: 'linear-gradient(135deg, #1a2e40 0%, #0d2b4e 50%, #0a3d62 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '48px 48px 40px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}
      >
        {/* SAP S/4HANA branding */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '30px', background: '#0070B1', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: '15px', fontFamily: 'Arial, sans-serif', fontWeight: 700, letterSpacing: '1px' }}>SAP</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#32363a', lineHeight: 1.2 }}>S/4HANA Cloud</div>
            <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#89919a', lineHeight: 1.3 }}>Bertelsmann · BERT_PRD · Client 100</div>
          </div>
        </div>

        <h1
          style={{
            fontFamily: 'Cabin, sans-serif',
            fontSize: '24px',
            fontWeight: 700,
            color: '#1d2f36',
            marginBottom: '8px',
            lineHeight: '1.2',
          }}
        >
          Sign in to SAP S/4HANA
        </h1>

        <p style={{ fontSize: '14px', color: '#6b767b', marginBottom: '28px' }}>
          Use your SAP user ID and password to access the system.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            placeholder="SAP User ID"
            style={{
              width: '100%',
              padding: '12px 14px',
              fontSize: '16px',
              fontFamily: 'Lato, sans-serif',
              border: '1px solid #c8cccf',
              borderRadius: '6px',
              outline: 'none',
              color: '#1d2f36',
              background: '#f9fafb',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#1a3a6b'
              e.target.style.boxShadow = '0 0 0 3px rgba(26,58,107,0.12)'
              e.target.style.background = '#fff'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#c8cccf'
              e.target.style.boxShadow = 'none'
              e.target.style.background = '#f9fafb'
            }}
          />
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            color: '#1d2f36',
            marginBottom: '28px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#1a3a6b', cursor: 'pointer' }}
          />
          Remember Me
        </label>

        <button
          onClick={handleContinue}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px 24px',
            background: loading ? '#4a9fd4' : '#0070B1',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            fontSize: '16px',
            fontFamily: 'Cabin, sans-serif',
            fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            transition: 'background 0.15s, transform 0.1s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.background = '#005a91' }}
          onMouseLeave={(e) => { if (!loading) (e.target as HTMLElement).style.background = '#0070B1' }}
        >
          {loading ? 'Signing in…' : 'Continue'}
        </button>

        <div style={{ height: '1px', background: '#e4e6e7', margin: '28px 0 20px' }} />

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b767b' }}>
          <a href="#" style={{ color: '#0070B1', textDecoration: 'none' }}>
            Forgot password? Contact IT Helpdesk
          </a>
        </p>
      </div>

      <p style={{ marginTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
        SAP S/4HANA Cloud · Bertelsmann Global · BERT_PRD · Client 100
      </p>
    </div>
  )
}
