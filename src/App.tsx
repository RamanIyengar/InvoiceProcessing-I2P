import { useState } from 'react'
import { Invoice, ReplyEmail, SentEmail } from './types'
import { LoginScreen } from './components/LoginScreen'
import { OutlookLoginScreen } from './components/OutlookLoginScreen'
import { AppHeader } from './components/AppHeader'
import { Sidebar, SidebarTab } from './components/Sidebar'
import { DashboardView } from './components/DashboardView'
import { InvoiceWorkspace } from './components/InvoiceWorkspace'
import { AuditTrailPage } from './components/AuditTrailPage'
import { taxMismatchReplyEmails, glApprovalReplyEmail, metroGLReplyEmails, prtGLReplyEmails, missingGRReplyEmail, royaltyMismatchReplyEmail, royaltyDeviationSentEmail, mockInvoices } from './data/mockData'
import { LandingScreen } from './components/LandingScreen'
import { OutlookInbox } from './components/OutlookInbox'
import { TicketsView } from './components/TicketsView'

// ─── Analytics charts ────────────────────────────────────────────────────────

function BarChart() {
  const bars = [
    { label: 'PO', count: 6, color: '#1a3a6b' },
    { label: 'Non-PO', count: 6, color: '#b06b00' },
    { label: 'ECC Legacy', count: 2, color: '#1b823f' },
  ]
  const max = 8
  const barW = 52
  const gap = 36
  const svgW = bars.length * (barW + gap) + gap
  const svgH = 160
  const chartH = 110
  const baseY = svgH - 30

  return (
    <div style={{ background: '#fff', border: '1px solid #e4e6e7', borderRadius: '8px', padding: '20px' }}>
      <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1d2f36', marginBottom: '4px' }}>Invoice Volume by Category</div>
      <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginBottom: '16px' }}>Current batch · today</div>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
        {[0, 2, 4, 6, 8].map((v) => {
          const y = baseY - (v / max) * chartH
          return (
            <g key={v}>
              <line x1={gap / 2} x2={svgW - gap / 2} y1={y} y2={y} stroke="#f0f1f1" strokeWidth="1" />
              <text x={gap / 2 - 4} y={y + 4} fontSize="10" fill="#c8cccf" textAnchor="end">{v}</text>
            </g>
          )
        })}
        {bars.map((b, i) => {
          const x = gap + i * (barW + gap)
          const barH = (b.count / max) * chartH
          const y = baseY - barH
          return (
            <g key={b.label}>
              <rect x={x} y={y} width={barW} height={barH} fill={b.color} rx="4" opacity="0.9" />
              <text x={x + barW / 2} y={y - 6} fontSize="13" fontWeight="700" fill={b.color} textAnchor="middle">{b.count}</text>
              <text x={x + barW / 2} y={baseY + 14} fontSize="11" fill="#6b767b" textAnchor="middle">{b.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function DonutChart() {
  const r = 57
  const cx = 110
  const cy = 80
  const circ = 2 * Math.PI * r
  const agentPct = 0.84

  return (
    <div style={{ background: '#fff', border: '1px solid #e4e6e7', borderRadius: '8px', padding: '20px' }}>
      <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1d2f36', marginBottom: '4px' }}>Actions by Actor Type</div>
      <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginBottom: '12px' }}>Agent vs Human intervention</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <svg width="130" height="130" viewBox="0 0 220 160">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f1f1" strokeWidth="26" />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#1b823f"
            strokeWidth="26"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={0}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#1a3a6b"
            strokeWidth="26"
            strokeDasharray={`${agentPct * circ} ${circ}`}
            strokeDashoffset={0}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1d2f36">84%</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#6b767b">Agent</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Agent actions', pct: '84%', color: '#1a3a6b' },
            { label: 'Human actions', pct: '16%', color: '#1b823f' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#1d2f36', fontWeight: 600 }}>{item.pct}</div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#6b767b' }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LineChart() {
  const data = [
    { day: 'Mon', v: 3 },
    { day: 'Tue', v: 5 },
    { day: 'Wed', v: 4 },
    { day: 'Thu', v: 8 },
    { day: 'Fri', v: 6 },
    { day: 'Sat', v: 2 },
    { day: 'Sun', v: 7 },
  ]
  const svgW = 280
  const svgH = 160
  const padL = 28
  const padR = 12
  const padT = 16
  const padB = 28
  const chartW = svgW - padL - padR
  const chartH = svgH - padT - padB
  const maxV = 10
  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * chartW,
    y: padT + chartH - (d.v / maxV) * chartH,
  }))
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaD = `${lineD} L${pts[pts.length - 1].x},${padT + chartH} L${pts[0].x},${padT + chartH} Z`

  return (
    <div style={{ background: '#fff', border: '1px solid #e4e6e7', borderRadius: '8px', padding: '20px' }}>
      <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1d2f36', marginBottom: '4px' }}>Processing Volume</div>
      <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginBottom: '12px' }}>Last 7 days · invoices per day</div>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`}>
        {[0, 2, 4, 6, 8, 10].map((v) => {
          const y = padT + chartH - (v / maxV) * chartH
          return (
            <g key={v}>
              <line x1={padL} x2={padL + chartW} y1={y} y2={y} stroke="#f0f1f1" strokeWidth="1" />
              <text x={padL - 4} y={y + 4} fontSize="9" fill="#c8cccf" textAnchor="end">{v}</text>
            </g>
          )
        })}
        <path d={areaD} fill="#1a3a6b" opacity="0.1" />
        <path d={lineD} fill="none" stroke="#1a3a6b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#1a3a6b" />
            <circle cx={p.x} cy={p.y} r="2" fill="#fff" />
            <text x={p.x} y={padT + chartH + 14} fontSize="10" fill="#6b767b" textAnchor="middle">{data[i].day}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function AnalyticsPage() {
  const stats = [
    { label: 'Straight-Through Rate', value: '87.4%', trend: '+2.1% vs last month', color: '#1b823f' },
    { label: 'Avg. Processing Time', value: '4.2 min', trend: '−73% vs manual', color: '#1a3a6b' },
    { label: 'Auto-resolved Exceptions', value: '94.6%', trend: '+1.8% vs last month', color: '#1b823f' },
    { label: 'Supplier Queries Avoided', value: '1,240', trend: 'This month', color: '#1a3a6b' },
  ]
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff', padding: '32px' }}>
      <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '26px', fontWeight: 700, color: '#1d2f36', marginBottom: '8px' }}>
        Analytics
      </h1>
      <p style={{ fontSize: '15px', color: '#6b767b', marginBottom: '28px' }}>
        Invoice processing performance and agent metrics · Bertelsmann Global Source-to-Pay
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: '#fff',
              border: '1px solid #e4e6e7',
              borderTop: `3px solid ${stat.color}`,
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '32px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1d2f36', margin: '6px 0 4px', fontFamily: 'Lato, sans-serif' }}>{stat.label}</div>
            <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>{stat.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <BarChart />
        <DonutChart />
        <LineChart />
      </div>
    </div>
  )
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: on ? '#1a3a6b' : '#c8cccf', position: 'relative', flexShrink: 0, cursor: 'default' }}>
      <div style={{ position: 'absolute', top: '3px', left: on ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
    </div>
  )
}

function PercentBadge({ pct }: { pct: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0edfd', borderRadius: '20px', padding: '4px 10px' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.4"/>
        <path d="M7 4v3.5" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="7" cy="10" r="0.8" fill="#7c3aed"/>
      </svg>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed', fontFamily: 'Lato, sans-serif' }}>{pct}%</span>
    </div>
  )
}

interface RuleCard {
  title: string
  priority: number
  active: boolean
  expiring?: { label: string; remaining: string; expires: string }
  description: string[]
  triggered: number
  pct: number
}

const RULE_CARDS: RuleCard[] = [
  {
    title: 'SLA Rule',
    priority: 1,
    active: true,
    description: [
      'Process all invoices within SLA, regardless of volume.',
      'Standard: 2 days',
      'Urgent: 4 hours',
      'Month-end invoices to be processed prior to close day of the month',
    ],
    triggered: 3,
    pct: 80,
  },
  {
    title: 'Discount Capture And Maximisation',
    priority: 1,
    active: true,
    description: [
      'Ensure all discount-eligible invoices are accurately captured.',
      'Prioritize processing of discount invoices to ensure timely resolution, posting, and readiness for payment.',
    ],
    triggered: 5,
    pct: 74,
  },
  {
    title: 'Paid On Time / Ready To Pay',
    priority: 1,
    active: true,
    description: [
      'Ensure all invoices are posted before their due date and ready for payment.',
      'Use past payment data to identify and address supplier delays.',
    ],
    triggered: 1,
    pct: 100,
  },
  {
    title: 'Hold all Payments above $50k',
    priority: 1,
    active: true,
    expiring: { label: 'Expiring Soon', remaining: '-5524h remaining', expires: 'Expires: 10/31/2025 05:30:00' },
    description: ['Hold all Payments above $50k for review'],
    triggered: 0,
    pct: 62,
  },
]

function SettingsPage() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f6f7f7', padding: '32px' }}>
      <div style={{ maxWidth: '860px' }}>
        <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '26px', fontWeight: 700, color: '#1d2f36', marginBottom: '6px' }}>
          Settings
        </h1>
        <p style={{ fontSize: '15px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginBottom: '28px' }}>
          Manage automation rules, SLA policies, and processing priorities
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '17px', fontWeight: 700, color: '#1d2f36' }}>Automation Rules</span>
          <button style={{ padding: '8px 18px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer' }}>+ Add Rule</button>
        </div>

        {RULE_CARDS.map(rule => (
          <div key={rule.title} style={{ background: '#fff', border: '1px solid #e4e6e7', borderRadius: '10px', padding: '20px 24px', marginBottom: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '17px', fontWeight: 700, color: '#1d2f36', flex: 1 }}>{rule.title}</span>
              <button style={{ padding: '5px 14px', background: '#fff', border: '1px solid #c8cccf', borderRadius: '20px', fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', cursor: 'pointer' }}>Edit</button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: '#6b767b' }}>
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M1 4h14M6 4V2h4v2M2 4l1 12h10l1-12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: rule.expiring ? '10px' : '12px', flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 10px', borderRadius: '20px', border: '1px solid #c8cccf', fontSize: '12px', fontWeight: 600, color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>Priority {rule.priority}</span>
              <span style={{ padding: '3px 10px', borderRadius: '20px', border: '1px solid #1b823f', fontSize: '12px', fontWeight: 700, color: '#1b823f', fontFamily: 'Lato, sans-serif' }}>Active</span>
              {rule.expiring && (
                <span style={{ padding: '3px 10px', borderRadius: '20px', border: '1px solid #b91f1f', fontSize: '12px', fontWeight: 700, color: '#b91f1f', fontFamily: 'Lato, sans-serif' }}>{rule.expiring.label}</span>
              )}
              <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                <ToggleSwitch on={false} />
              </div>
            </div>

            {rule.expiring && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#6b767b" strokeWidth="1.3"/><path d="M7 4v3.5l2 1.5" stroke="#6b767b" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <span style={{ fontSize: '13px', color: '#b91f1f', fontFamily: 'Lato, sans-serif', fontWeight: 700 }}>{rule.expiring.remaining}</span>
                <span style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>{rule.expiring.expires}</span>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              {rule.description.map((line, i) => (
                <p key={i} style={{ fontSize: '14px', color: '#4a5568', fontFamily: 'Lato, sans-serif', lineHeight: '1.6', margin: '0 0 2px' }}>{line}</p>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>Triggered {rule.triggered} times</span>
              <PercentBadge pct={rule.pct} />
            </div>
          </div>
        ))}

        <div style={{ marginTop: '32px', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '17px', fontWeight: 700, color: '#1d2f36' }}>Configuration</span>
        </div>

        {[
          {
            title: 'Approval Thresholds',
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="18" height="18" rx="3" stroke="#1a3a6b" strokeWidth="1.5"/><path d="M5 10h10M5 6.5h10M5 13.5h6" stroke="#1a3a6b" strokeWidth="1.4" strokeLinecap="round"/></svg>
            ),
            description: 'Define monetary thresholds for auto-approval, manager review, and CFO sign-off. Configure per-category and per-supplier overrides.',
          },
          {
            title: 'Agent Configuration',
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#1a3a6b" strokeWidth="1.5"/><circle cx="10" cy="10" r="3.5" stroke="#1a3a6b" strokeWidth="1.4"/><path d="M10 1v3M10 16v3M1 10h3M16 10h3" stroke="#1a3a6b" strokeWidth="1.4" strokeLinecap="round"/></svg>
            ),
            description: 'Configure AI agent behavior, step durations, confidence thresholds, and fallback actions for each processing stage.',
          },
          {
            title: 'Notification Rules',
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 0 1 6 6v3l1.5 2.5H2.5L4 11V8a6 6 0 0 1 6-6Z" stroke="#1a3a6b" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 16.5a2 2 0 0 0 4 0" stroke="#1a3a6b" strokeWidth="1.4" strokeLinecap="round"/></svg>
            ),
            description: 'Set up email, Slack, and in-app notification rules for SLA breaches, exception queues, and approval requests.',
          },
          {
            title: 'Supplier Master',
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="#1a3a6b" strokeWidth="1.5"/><path d="M7 5V4a3 3 0 0 1 6 0v1" stroke="#1a3a6b" strokeWidth="1.4" strokeLinecap="round"/><circle cx="10" cy="11" r="2" stroke="#1a3a6b" strokeWidth="1.3"/></svg>
            ),
            description: 'Manage approved suppliers, payment terms, preferred GL codes, and tax classifications for automated matching.',
          },
        ].map(cfg => (
          <div key={cfg.title} style={{ background: '#fff', border: '1px solid #e4e6e7', borderRadius: '10px', padding: '20px 24px', marginBottom: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e7ecf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {cfg.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1d2f36', marginBottom: '4px' }}>{cfg.title}</div>
              <div style={{ fontSize: '14px', color: '#6b767b', fontFamily: 'Lato, sans-serif', lineHeight: '1.5' }}>{cfg.description}</div>
            </div>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #c8cccf', borderRadius: '6px', fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', cursor: 'pointer', flexShrink: 0 }}>Configure</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('inbox')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [processedInvoiceIds, setProcessedInvoiceIds] = useState<Set<string>>(new Set())
  const [replyEmails, setReplyEmails] = useState<ReplyEmail[]>([])
  const [taxMismatchEmailSent, setTaxMismatchEmailSent] = useState(false)
  const [taxMismatchRepliesReceived, setTaxMismatchRepliesReceived] = useState(false)
  const [missingGRSent, setMissingGRSent] = useState(false)
  const [missingGRReplyReceived, setMissingGRReplyReceived] = useState(false)
  const [glApprovedInvoiceIds, setGLApprovedInvoiceIds] = useState<Set<string>>(new Set())
  const [prtGLBothApproved, setPrtGLBothApproved] = useState(false)
  const [prtOutlookReturned, setPrtOutlookReturned] = useState(false)
  const [metroGLApprovalSent, setMetroGLApprovalSent] = useState(false)
  const [metroApprovedIds, setMetroApprovedIds] = useState<Set<string>>(new Set())
  const [royaltySent, setRoyaltySent] = useState(false)
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(null)
  const [appView, setAppView] = useState<'home' | 'outlook-login' | 'outlook' | 'servicenow-login' | 'servicenow'>('home')

  if (appView === 'servicenow-login') {
    return <LoginScreen onLogin={() => setAppView('servicenow')} />
  }

  if (appView === 'outlook-login') {
    return <OutlookLoginScreen onLogin={() => setAppView('outlook')} onBack={() => setAppView('home')} />
  }

  const inboxBadgeCount = replyEmails.filter((e) => e.isUnread).length

  const handleTaxMismatchSent = () => {
    if (taxMismatchEmailSent) return
    setReplyEmails(prev => {
      if (prev.some(e => e.id === taxMismatchReplyEmails[0].id)) return prev
      return [...taxMismatchReplyEmails, ...prev]
    })
    setTaxMismatchEmailSent(true)
    // First toast — rejection sent
    setToastMessage('Invoice rejection sent to rechnung@lehmanns.de · CC: a.krueger@bertelsmann.de')
    setToastAction(null)
    setToastVisible(true)
    const hideFirst = setTimeout(() => setToastVisible(false), 4000)
    // Second toast — supplier reply received (2s delay)
    setTimeout(() => {
      clearTimeout(hideFirst)
      setToastVisible(false)
      setTimeout(() => {
        setTaxMismatchRepliesReceived(true)
        setToastMessage('Corrected invoice received from Lehmanns Media · Anja Krüger acknowledged')
        setToastAction({ label: 'Go to Outlook', onClick: () => setAppView('outlook') })
        setToastVisible(true)
        setTimeout(() => { setToastVisible(false); setToastAction(null) }, 6000)
      }, 80)
    }, 2000)
  }

  const handleMissingGRSent = () => {
    if (missingGRSent) return
    setMissingGRSent(true)
    setToastMessage('SES confirmation request sent to Sophie Brandt · s.brandt@fremantle.com')
    setToastAction(null)
    setToastVisible(true)
    const hideFirst = setTimeout(() => setToastVisible(false), 4000)
    // Simulate Sophie Brandt's reply arriving ~2.5s later
    setTimeout(() => {
      clearTimeout(hideFirst)
      setToastVisible(false)
      setTimeout(() => {
        setMissingGRReplyReceived(true)
        setReplyEmails(prev => {
          if (prev.some(e => e.id === missingGRReplyEmail.id)) return prev
          return [missingGRReplyEmail, ...prev]
        })
        setToastMessage('Sophie Brandt confirmed SES-2026-88412 booked — invoice cleared to proceed')
        setToastAction({ label: 'View in Outlook', onClick: () => setAppView('outlook') })
        setToastVisible(true)
        setTimeout(() => { setToastVisible(false); setToastAction(null) }, 6000)
      }, 80)
    }, 2500)
  }

  const handleRoyaltySent = () => {
    if (royaltySent) return
    setRoyaltySent(true)
    setSentEmails(prev => prev.some(e => e.id === royaltyDeviationSentEmail.id) ? prev : [royaltyDeviationSentEmail, ...prev])
    setToastMessage('Royalty deviation routed to Claire Newton · c.newton@penguinrandomhouse.com')
    setToastAction(null)
    setToastVisible(true)
    const hideFirst = setTimeout(() => setToastVisible(false), 4000)
    // Simulate Claire Newton's reply arriving ~3s later
    setTimeout(() => {
      clearTimeout(hideFirst)
      setToastVisible(false)
      setTimeout(() => {
        setReplyEmails(prev => {
          if (prev.some(e => e.id === royaltyMismatchReplyEmail.id)) return prev
          return [royaltyMismatchReplyEmail, ...prev]
        })
        setToastMessage('Claire Newton confirmed contract rate 12.5% — deviation resolved')
        setToastAction({ label: 'View in Outlook', onClick: () => setAppView('outlook') })
        setToastVisible(true)
        setTimeout(() => { setToastVisible(false); setToastAction(null) }, 6000)
      }, 80)
    }, 3000)
  }

  const handleGLApprovalSent = () => {
    const isPRT = selectedInvoice?.glMissingVariant === 'prt-coding'

    if (isPRT) {
      setToastMessage('WBS coding approval email sent to Daniel Roth & Thomas Lindqvist')
      setToastAction(null)
      setToastVisible(true)
      const hideFirst = setTimeout(() => setToastVisible(false), 4000)
      // First reply — Alex Morgan after 2s
      setTimeout(() => {
        clearTimeout(hideFirst)
        setToastVisible(false)
        setReplyEmails(prev => {
          if (prev.some(e => e.id === 'reply-prt-gl-1')) return prev
          return [prtGLReplyEmails[0], ...prev]
        })
        if (selectedInvoice?.id) setGLApprovedInvoiceIds(prev => new Set([...prev, selectedInvoice.id]))
        setTimeout(() => {
          setToastMessage('Approval received from Daniel Roth (Requestor) — TSI-2026-IT-7714')
          setToastAction({ label: 'Go to Outlook', onClick: () => setAppView('outlook') })
          setToastVisible(true)
          setTimeout(() => { setToastVisible(false); setToastAction(null) }, 5000)
        }, 80)
      }, 2000)
      // Second reply — David Turner after 4s
      setTimeout(() => {
        setReplyEmails(prev => {
          if (prev.some(e => e.id === 'reply-prt-gl-2')) return prev
          return [prtGLReplyEmails[1], ...prev]
        })
        setPrtGLBothApproved(true)
        setTimeout(() => {
          setToastMessage('Approval received from Thomas Lindqvist (Head of Department) — TSI-2026-IT-7714')
          setToastAction({ label: 'Go to Outlook', onClick: () => setAppView('outlook') })
          setToastVisible(true)
          setTimeout(() => { setToastVisible(false); setToastAction(null) }, 5000)
        }, 80)
      }, 4000)
      return
    }

    // Standard GL flow
    const currentInvoiceId = selectedInvoice?.id ?? ''
    const currentInvoiceNum = selectedInvoice?.invoiceNumber ?? selectedInvoice?.id ?? 'invoice'
    setToastMessage(`GL code approval email sent for ${currentInvoiceNum}`)
    setToastAction(null)
    setToastVisible(true)
    const hideFirst = setTimeout(() => setToastVisible(false), 4000)
    setTimeout(() => {
      clearTimeout(hideFirst)
      setToastVisible(false)
      setReplyEmails(prev => {
        if (prev.some(e => e.id === 'reply-gl-approval')) return prev
        return [glApprovalReplyEmail, ...prev]
      })
      if (currentInvoiceId) setGLApprovedInvoiceIds(prev => new Set([...prev, currentInvoiceId]))
      setTimeout(() => {
        setToastMessage(`GL code approval received for ${currentInvoiceNum}`)
        setToastAction({ label: 'Go to Outlook', onClick: () => setAppView('outlook') })
        setToastVisible(true)
        setTimeout(() => { setToastVisible(false); setToastAction(null) }, 6000)
      }, 80)
    }, 2000)
  }

  const handleMetroGLApprovalSend = () => {
    if (metroGLApprovalSent) return
    setMetroGLApprovalSent(true)
    // First toast — approval request sent
    setToastMessage('GL approval request sent to m.weber@bertelsmann.de · CC: a.krueger@bertelsmann.de')
    setToastAction(null)
    setToastVisible(true)
    const hideFirst = setTimeout(() => setToastVisible(false), 4000)
    // 2s delay → add reply emails + second toast
    setTimeout(() => {
      clearTimeout(hideFirst)
      setToastVisible(false)
      setReplyEmails(prev => {
        if (prev.some(e => e.id === 'reply-metro-gl-1')) return prev
        return [...metroGLReplyEmails, ...prev]
      })
      setTimeout(() => {
        setToastMessage('GL code approval received for DLT-2026-7741 — Markus Weber & Anja Krüger responded')
        setToastAction({ label: 'Go to Outlook', onClick: () => setAppView('outlook') })
        setToastVisible(true)
        setTimeout(() => { setToastVisible(false); setToastAction(null) }, 6000)
      }, 80)
    }, 2000)
  }

  const handleMarkReplyRead = (id: string) => {
    setReplyEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isUnread: false } : e))
    )
  }

  if (appView === 'home') {
    return (
      <LandingScreen
        onSelectOutlook={() => setAppView('outlook-login')}
        onSelectServiceNow={() => setAppView('servicenow-login')}
      />
    )
  }

  if (appView === 'outlook') {
    return (
      <OutlookInbox
        invoices={mockInvoices}
        replyEmails={replyEmails}
        sentEmails={sentEmails}
        onMarkReplyRead={handleMarkReplyRead}
        onClose={() => {
          if (prtGLBothApproved && selectedInvoice?.glMissingVariant === 'prt-coding') {
            setPrtOutlookReturned(true)
          }
          setAppView(selectedInvoice ? 'servicenow' : 'home')
        }}
      />
    )
  }

  const handleSelectInvoice = (invoice: Invoice) => {
    if (invoice.agentSteps.length > 0) {
      setSelectedInvoice(invoice)
      if (activeTab === 'dashboard') {
        setActiveTab('inbox')
      }
    }
  }

  const handleBack = () => setSelectedInvoice(null)

  const handleTabChange = (tab: SidebarTab) => {
    setActiveTab(tab)
    setSelectedInvoice(null)
  }

  const metroApproved = metroGLApprovalSent && replyEmails.some(e => e.id === 'reply-metro-gl-1')
  const royaltyMismatchAutoResolved = royaltySent && replyEmails.some(e => e.id === 'reply-royalty-mismatch' && !e.isUnread)

  const glEmailsViewed = selectedInvoice?.glMissingVariant === 'prt-coding'
    ? prtOutlookReturned ||
      (replyEmails.filter(e => e.id === 'reply-prt-gl-1' || e.id === 'reply-prt-gl-2').length === 2 &&
      replyEmails.filter(e => e.id === 'reply-prt-gl-1' || e.id === 'reply-prt-gl-2').every(e => !e.isUnread))
    : replyEmails.some(e => e.id === 'reply-gl-approval' && !e.isUnread)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppHeader onBack={undefined} currentInvoice={selectedInvoice} onLogout={() => setAppView('home')} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          inboxBadge={inboxBadgeCount}
        />

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'inbox' && selectedInvoice ? (
            <InvoiceWorkspace
              invoice={selectedInvoice}
              onBack={handleBack}
              onTaxMismatchSent={handleTaxMismatchSent}
              taxMismatchAutoResolved={taxMismatchRepliesReceived && selectedInvoice?.failType === 'tax-mismatch'}
              onMissingGRSent={handleMissingGRSent}
              missingGRAutoResolved={missingGRReplyReceived && selectedInvoice?.failType === 'missing-gr'}
              onGLApprovalSent={handleGLApprovalSent}
              glApprovalReceived={selectedInvoice?.failType === 'gl-missing' && selectedInvoice?.glMissingVariant !== 'internal-approval' && (selectedInvoice?.glMissingVariant === 'prt-coding' ? prtGLBothApproved : glApprovedInvoiceIds.has(selectedInvoice?.id ?? ''))}
              onProcessingComplete={id => setProcessedInvoiceIds(prev => new Set([...prev, id]))}
              metroGLApprovalSent={metroGLApprovalSent && selectedInvoice?.id === 'inv-4'}
              onMetroGLApprovalSend={handleMetroGLApprovalSend}
              metroApproved={metroApproved && selectedInvoice?.id === 'inv-4'}
              onMetroApprove={() => setMetroApprovedIds(prev => new Set([...prev, 'inv-4']))}
              metroInvoiceApprovedIds={metroApprovedIds}
              glEmailsViewed={glEmailsViewed}
              onRoyaltySent={handleRoyaltySent}
              royaltyMismatchAutoResolved={royaltyMismatchAutoResolved && selectedInvoice?.failType === 'royalty-mismatch'}
            />
          ) : activeTab === 'inbox' ? (
            <TicketsView
              onSelectInvoice={handleSelectInvoice}
              replyEmails={replyEmails}
              onMarkReplyRead={handleMarkReplyRead}
              processedIds={processedInvoiceIds}
              rejectedInvoiceIds={taxMismatchEmailSent && !taxMismatchRepliesReceived ? new Set(['inv-5']) : undefined}
              straightPassInvoiceIds={taxMismatchRepliesReceived ? new Set(['inv-5']) : undefined}
              metroApprovedIds={metroApprovedIds}
            />
          ) : activeTab === 'dashboard' ? (
            <DashboardView onSelectInvoice={handleSelectInvoice} />
          ) : activeTab === 'audit' ? (
            <AuditTrailPage />
          ) : activeTab === 'analytics' ? (
            <AnalyticsPage />
          ) : (
            <SettingsPage />
          )}
        </div>
      </div>

      {toastVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 9999,
            background: '#fff',
            color: '#1d2f36',
            padding: '14px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
            fontSize: '14px',
            fontFamily: 'Lato, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #e4e6e7',
            maxWidth: '420px',
          }}
        >
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#1b823f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ flex: 1 }}>{toastMessage}</span>
          {toastAction && (
            <button
              onClick={() => { toastAction.onClick(); setToastVisible(false); setToastAction(null) }}
              style={{ padding: '6px 14px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="12" height="10" viewBox="0 0 14 12" fill="white"><rect x="0" y="0" width="14" height="12" rx="1.5" fill="none" stroke="white" strokeWidth="1.3"/><polyline points="0,0 7,7 14,0" fill="none" stroke="white" strokeWidth="1.3"/></svg>
              {toastAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
