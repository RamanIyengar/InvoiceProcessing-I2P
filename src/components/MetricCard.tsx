interface Props {
  value: string
  label: string
  highlight?: boolean
}

export function MetricCard({ value, label, highlight = false }: Props) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e4e6e7',
        borderRadius: '8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      {/* Blue-to-green gradient bar — matches ServiceNow brand */}
      <div
        style={{
          height: '4px',
          background: 'linear-gradient(90deg, #1a3a6b 0%, #62D84E 100%)',
          flexShrink: 0,
        }}
      />

      <div style={{ padding: '16px 18px', flex: 1 }}>
        <div
          style={{
            fontFamily: 'Cabin, sans-serif',
            fontSize: '30px',
            fontWeight: 700,
            color: highlight ? '#1a3a6b' : '#1d2f36',
            lineHeight: '1.1',
            marginBottom: '5px',
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: '13px',
            color: '#6b767b',
            lineHeight: '1.4',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}
