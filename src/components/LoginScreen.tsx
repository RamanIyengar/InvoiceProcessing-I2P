import { useState } from 'react'

interface Props {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('l.fischer@bertelsmann.de')
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
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2b4e 50%, #0a1e38 100%)',
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
        <div style={{ marginBottom: '32px', overflow: 'visible' }}>
          <svg width="747" height="158" viewBox="0 0 747 158" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '200px', height: 'auto', display: 'block', overflow: 'visible' }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M195.9 59.8008C189 59.8008 182.3 62.2008 177 66.6008V60.5008H159.8V127.601H177.7V84.7008C181.6 79.6008 187.6 76.6008 194 76.4008C196.4 76.3008 198.9 76.6008 201.2 77.5008V60.3008C199.4 60.0008 197.6 59.8008 195.9 59.8008Z" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M39.7 107.1C44.8 111.4 51.3 113.8 58 113.7C62.8 113.7 66.5 111.3 66.5 108C66.5 97.9996 34.1 101.6 34.1 79.9996C34.1 67.0996 46.5 59.0996 59.7 59.0996C67.7 59.0996 75.6 61.4996 82.3 65.8996L73.9 78.8996C70.2 76.0996 65.7 74.4996 61.1 74.2996C56.1 74.2996 52 76.1996 52 79.6996C52 88.3996 84.4 84.9996 84.4 108.2C84.4 121.1 71.8 128.9 57.8 128.9C48.2 128.9 38.8 125.7 31 120L39.7 107.1Z" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M152.1 93.3996C152.1 74.6996 139 59.0996 120.5 59.0996C100.7 59.0996 88 75.3996 88 94.0996C87.2 112.6 101.6 128.2 120 129C121 129 122 129 123 129C133.4 129.1 143.4 124.8 150.4 117L140.2 106.8C135.9 111.6 129.8 114.4 123.4 114.5C114.1 114.8 106.2 107.8 105.3 98.5996H151.6C152 96.8996 152.1 95.0996 152.1 93.3996ZM106.2 85.3996C107.5 78.4996 113.5 73.5996 120.5 73.5996C127.2 73.5996 132.9 78.6996 133.7 85.3996H106.2Z" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M243.8 101.4L262.1 60.5H280.7L250 127.6H237.6L206.9 60.5H225.5L243.8 101.4Z" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M295.8 29C302.2 29.1 307.2 34.4 307.1 40.7C307 47.1 301.7 52.1 295.4 52C289.1 51.9 284.1 46.8 284.1 40.5C284.1 34.1 289.2 29 295.6 29C295.6 29 295.7 29 295.8 29Z" fill="black"/>
            <path d="M304.7 60.5H286.8V127.6H304.7V60.5Z" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M378.8 113.901C371.9 123.801 360.5 129.401 348.5 129.001C329.2 129.501 313.2 114.201 312.7 95.0007C312.2 75.8007 327.5 59.7007 346.7 59.2007C347.3 59.2007 348 59.2007 348.6 59.2007C359.5 59.1007 369.9 64.1007 376.7 72.6007L364 83.7007C360.4 78.7007 354.7 75.8007 348.6 75.7007C338.7 75.7007 330.6 83.7007 330.6 93.6007C330.6 93.8007 330.6 93.9007 330.6 94.1007C330.3 103.901 337.9 112.001 347.7 112.401C348.2 112.401 348.6 112.401 349.1 112.401C355.6 112.301 361.5 109.001 365.1 103.601L378.8 113.901Z" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M443.8 116.9C436.8 124.7 426.8 129.1 416.4 128.9C397.9 129.8 382.3 115.5 381.4 97C381.4 96 381.4 95 381.4 94C381.4 75.3 394.1 59 413.9 59C432.4 59 445.5 74.6 445.5 93.3C445.5 95 445.4 96.7 445.1 98.4H398.8C399.7 107.6 407.6 114.6 416.9 114.3C423.3 114.1 429.4 111.3 433.7 106.6L443.8 116.9ZM427.2 85.4C426.4 78.7 420.7 73.7 414 73.6C407 73.6 401 78.5 399.7 85.4H427.2Z" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M452.6 127.6V60.4996H469.8V65.8996C475.1 61.4996 481.8 59.0996 488.7 59.0996C497.6 59.0996 506.1 62.9996 511.9 69.8996C517.1 76.5996 519.5 84.9996 518.8 93.3996V127.5H500.9V91.9996C501.4 87.3996 500 82.8996 496.9 79.3996C494.2 76.8996 490.6 75.4996 486.8 75.6996C480.4 75.8996 474.4 78.8996 470.5 83.9996V127.6H452.6Z" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M564.9 59.0996C543.2 59.0996 525.6 76.5996 525.6 98.1996C525.6 109 530 119.4 537.9 126.8C540.7 129.4 544.9 129.7 548 127.3C557.9 119.9 571.5 119.9 581.4 127.3C584.5 129.6 588.8 129.4 591.5 126.7C607.2 111.8 607.9 86.9996 593 71.1996C585.6 63.5996 575.5 59.1996 564.9 59.0996ZM564.7 117.9C554.2 118.2 545.5 109.9 545.2 99.3996C545.2 99.0996 545.2 98.6996 545.2 98.3996C545.2 87.5996 553.9 78.8996 564.7 78.8996C575.5 78.8996 584.2 87.5996 584.2 98.3996C584.5 108.9 576.2 117.6 565.7 117.9C565.3 117.9 565 117.9 564.7 117.9Z" fill="#62D84E"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M639.2 127.6H625.8L599.2 60.5H617.1L631.7 98.8L646 60.5H660.9L675.1 98.8L689.8 60.5H707.7L681.1 127.6H667.8L653.5 89.4L639.2 127.6Z" fill="black"/>
            <path d="M707.9 120H706.4V122.8H705.1V115H708.2C709.6 115 710.7 116.1 710.7 117.5C710.7 118.5 710.1 119.4 709.2 119.8L711 122.8H709.6L707.9 120ZM706.4 118.9H708.3C709 118.9 709.6 118.3 709.6 117.6C709.6 116.9 709 116.3 708.3 116.3H706.5L706.4 118.9Z" fill="black"/>
            <path d="M707.7 111.899C711.7 111.899 714.9 115.099 714.9 119.099C714.9 123.099 711.7 126.299 707.7 126.299C703.7 126.299 700.5 123.099 700.5 119.099C700.5 115.099 703.7 111.899 707.7 111.899ZM707.7 110.699C703.1 110.699 699.3 114.399 699.3 119.099C699.3 123.799 703 127.499 707.7 127.499C712.3 127.499 716.1 123.799 716.1 119.099C716.1 114.499 712.3 110.699 707.7 110.699Z" fill="black"/>
          </svg>
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
          Sign in with your ServiceNow ID
        </h1>

        <p style={{ fontSize: '15px', color: '#6b767b', marginBottom: '28px' }}>
          New user?{' '}
          <a href="#" style={{ color: '#1a3a6b', textDecoration: 'none', fontWeight: 600 }}>
            Create an account
          </a>
        </p>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            placeholder="Business E-mail"
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
            background: loading ? '#a8e89e' : '#62D84E',
            color: '#1a2e0f',
            border: 'none',
            borderRadius: '24px',
            fontSize: '16px',
            fontFamily: 'Cabin, sans-serif',
            fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            transition: 'background 0.15s, transform 0.1s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.background = '#50c83c' }}
          onMouseLeave={(e) => { if (!loading) (e.target as HTMLElement).style.background = '#62D84E' }}
        >
          {loading ? 'Signing in…' : 'Continue'}
        </button>

        <div style={{ height: '1px', background: '#e4e6e7', margin: '28px 0 20px' }} />

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b767b' }}>
          <a href="#" style={{ color: '#1a3a6b', textDecoration: 'none' }}>
            Can't sign in? Our FAQ can help
          </a>
        </p>
      </div>

      <p style={{ marginTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
        Bertelsmann · Global Source-to-Pay · Invoice Processing Automation
      </p>
    </div>
  )
}
