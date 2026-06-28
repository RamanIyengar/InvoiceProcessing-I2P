import { useState } from 'react'

// ─── Toggle & Badge ───────────────────────────────────────────────────────────

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
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.4"/><path d="M7 4v3.5" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.8" fill="#7c3aed"/></svg>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed', fontFamily: 'Lato, sans-serif' }}>{pct}%</span>
    </div>
  )
}

// ─── Value Outcomes Section ───────────────────────────────────────────────────

const OUTCOME_KPIS = [
  { value: '€3.2M', label: 'Annual Savings Potential', sub: 'FTE reallocation + discount capture + error prevention', color: '#1b823f', bg: '#e8f5ee' },
  { value: '87.4%', label: 'Straight-Through Rate', sub: 'vs. 45% industry average for manual AP', color: '#1a3a6b', bg: '#e7ecf5' },
  { value: '4.2 min', label: 'Avg. Processing Cycle', sub: 'vs. 12.6 calendar days manual (−99.7%)', color: '#0070B1', bg: '#e8f0fa' },
  { value: '18 FTE', label: 'Hours Freed Daily', sub: 'AP staff redeployed to vendor strategy & analytics', color: '#7c3aed', bg: '#f0edfd' },
]

const DIVISION_OUTCOMES = [
  {
    division: 'Penguin Random House',
    flag: '📚',
    color: '#1a3a6b',
    bg: '#e7ecf5',
    headline: 'Royalty Invoice Accuracy',
    detail: 'Predictive IC & Royalty Agent validates author contract rates in real-time against the royalty management system — 100% rate deviation detection. Prevents €280K+ in annual over/underpayments across the PRH catalog.',
    metric: '100%', metricLabel: 'rate deviation catch rate',
  },
  {
    division: 'Arvato / T-Systems',
    flag: '⚙️',
    color: '#b06b00',
    bg: '#fef3e2',
    headline: 'WBS & Cost Centre Auto-Coding',
    detail: 'GL Coding Workbench auto-assigns WBS elements and cost centres for IT service invoices with dual-approver routing. Parallel approval orchestration reduces T-Systems settlement time by 2.8 days.',
    metric: '91%', metricLabel: 'GL auto-coding accuracy',
  },
  {
    division: 'Fremantle / RTL Group',
    flag: '🎬',
    color: '#1b823f',
    bg: '#e8f5ee',
    headline: 'Service Receipt Automation',
    detail: 'Matching agent detects missing GR/SES for content production invoices and auto-triggers confirmation requests. Eliminates manual chasing and ensures 3-way match before payment release.',
    metric: '−6 days', metricLabel: 'avg. GR resolution cycle',
  },
  {
    division: 'Bertelsmann Corporate',
    flag: '🏢',
    color: '#0070B1',
    bg: '#e8f0fa',
    headline: 'Early Payment Discount Capture',
    detail: 'Discount Capture rule prioritizes discount-eligible invoices for same-day processing. Agents flag 2% 10-day windows and escalate to treasury. Improvement of +23% in discount capture vs. prior year.',
    metric: '+23%', metricLabel: 'early discount capture YoY',
  },
]

const CHALLENGES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2L2 19h18L11 2z" stroke="#b91f1f" strokeWidth="1.6" strokeLinejoin="round"/><path d="M11 9v4" stroke="#b91f1f" strokeWidth="1.6" strokeLinecap="round"/><circle cx="11" cy="16" r="1" fill="#b91f1f"/></svg>
    ),
    challenge: 'Royalty & IP contract complexity',
    industry: 'Publishing / Media',
    how: 'Predictive IC & Royalty Agent cross-references invoice rates against author/rights contracts at time of processing — not at audit. Deviations flagged with contract reference and routed to Royalties Management within seconds.',
    tag: 'Penguin Random House · Wylie Agency',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="18" height="18" rx="2" stroke="#b06b00" strokeWidth="1.6"/><path d="M2 8h18M8 8v12" stroke="#b06b00" strokeWidth="1.4"/></svg>
    ),
    challenge: 'Multi-divisional GL & cost allocation',
    industry: 'Conglomerate / Shared Services',
    how: 'Matching & GL Advisor auto-selects account, cost centre, and WBS from the SAP chart of accounts. Confidence scoring determines straight-through vs. human review. PRT/WBS dual-approver workflows triggered automatically.',
    tag: 'Arvato · T-Systems · Bertelsmann Corporate',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#1a3a6b" strokeWidth="1.6"/><path d="M11 6v5.5l3.5 2" stroke="#1a3a6b" strokeWidth="1.5" strokeLinecap="round"/></svg>
    ),
    challenge: 'SLA pressure & month-end spikes',
    industry: 'High-volume AP / Global Finance',
    how: 'SLA Rule continuously monitors due-date proximity and dynamically re-prioritizes the VIM queue. Month-end volume predicted using historical patterns — agent capacity pre-scaled. No manual triaging by AP analysts.',
    tag: 'All divisions · Month-end close cycle',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="5" width="16" height="14" rx="2" stroke="#7c3aed" strokeWidth="1.6"/><path d="M7 5V3.5a2 2 0 0 1 4 0V5M11 5V3.5a2 2 0 0 1 4 0V5" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round"/><path d="M7 12h8M7 15h5" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round"/></svg>
    ),
    challenge: 'EU VAT & cross-border tax compliance',
    industry: 'Multinational / European operations',
    how: 'Tax & DRC Agent validates VAT codes against SAP DRC tables and EU tax schedules at time of extraction — not post-payment. Reduced/standard rate misclassifications (e.g., Lehmanns 19%→7%) caught before posting.',
    tag: 'Lehmanns · Germany · EU operations',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke="#1b823f" strokeWidth="1.6"/><path d="M3 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#1b823f" strokeWidth="1.5" strokeLinecap="round"/><path d="M17 14l2 2-4 4" stroke="#1b823f" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
    challenge: 'Supplier duplicate & fraud risk',
    industry: 'Large supplier base / Global sourcing',
    how: 'Duplicate Detection Agent matches on invoice number, amount, supplier, and date window using fuzzy logic — catches same-invoice resubmissions even with modified reference numbers. SAP posting blocked pending resolution.',
    tag: 'Maersk · All vendors · 3,000+ supplier base',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11h14M4 6h14M4 16h8" stroke="#b06b00" strokeWidth="1.6" strokeLinecap="round"/><circle cx="18" cy="16" r="3" fill="white" stroke="#b06b00" strokeWidth="1.4"/><path d="M17 16l.8.8L19.5 15" stroke="#b06b00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
    challenge: 'Approval bottlenecks & communication lag',
    industry: 'Decentralised organisations',
    how: 'CommunicationPreviewModal auto-drafts structured approval requests, GR confirmations, and supplier queries using invoice context. Approvers receive pre-populated, actionable emails — reducing response time from days to hours.',
    tag: 'Deloitte · Internal GL approvals · Supplier queries',
  },
]

const AI_INSIGHTS = [
  {
    type: 'opportunity',
    icon: '💡',
    iconBg: '#e8f5ee',
    title: 'Early Payment Discount Window — Act Now',
    body: 'Invoice SPP-2026-0461 (Sunset Post Production · €124,800) and TSI-2026-IT-7714 (T-Systems · €238,400) are within the 2% 10-day early payment window. Approving today captures an estimated €7,265 in discounts. AP agents are prioritising both in the VIM queue.',
    badge: '€7.3K opportunity',
    badgeColor: '#1b823f',
    badgeBg: '#e8f5ee',
  },
  {
    type: 'pattern',
    icon: '🔍',
    iconBg: '#e7ecf5',
    title: 'Supplier Pattern — Lehmanns VAT Corrections (3 in 90 days)',
    body: 'Lehmanns Media GmbH has submitted 3 invoices with incorrect VAT codes (DE-VAT-STD vs. DE-VAT-RED) in the past quarter. The correction cycle adds an average 4.2 days per invoice. Recommend a supplier onboarding session to align on reduced-rate book category (§ 12 Abs. 2 UStG).',
    badge: 'Supplier advisory',
    badgeColor: '#1a3a6b',
    badgeBg: '#e7ecf5',
  },
  {
    type: 'risk',
    icon: '⚠️',
    iconBg: '#fde8e8',
    title: 'Royalty Rate Deviations — €280K Annual Exposure',
    body: 'Predictive IC & Royalty Agent detected 3 invoiced rate deviations from Wylie Literary Agency this session. If undetected at scale, similar deviations across the Penguin Random House catalog (est. 4,200 royalty invoices/year) would represent a €280K+ annual over-payment risk. Current AI catch rate: 100%.',
    badge: 'Risk mitigated',
    badgeColor: '#b91f1f',
    badgeBg: '#fde8e8',
  },
  {
    type: 'forecast',
    icon: '📈',
    iconBg: '#f0edfd',
    title: 'Month-End Volume Spike — Next 5 Business Days',
    body: 'Historical patterns show a 2.4× invoice volume increase in the final 5 days of each month (primarily Arvato group intercompany and T-Systems IT service invoices). AI agents will auto-scale processing priority. No manual triaging required — SLA Rule will ensure all invoices are posted before close date.',
    badge: 'Auto-managed',
    badgeColor: '#7c3aed',
    badgeBg: '#f0edfd',
  },
  {
    type: 'opportunity',
    icon: '🔄',
    iconBg: '#e8f0fa',
    title: 'Fremantle GR Automation Opportunity',
    body: 'SES confirmation requests for Fremantle / Sunset Post Production service invoices take an average 3.1 days to receive. Integrating a GR auto-trigger via SAP Project System (PS module) when the production milestone is completed would eliminate this cycle entirely for 68% of Fremantle invoices.',
    badge: 'Process improvement',
    badgeColor: '#0070B1',
    badgeBg: '#e8f0fa',
  },
  {
    type: 'benchmark',
    icon: '🏆',
    iconBg: '#fff3e0',
    title: 'Bertelsmann vs. Media Industry Benchmarks',
    body: 'With AI agentic automation, Bertelsmann\'s AP function is tracking at the top quartile of media & publishing AP benchmarks: STP rate 87.4% (industry top quartile: 80%+), cost per invoice €2.80 (industry avg: €8.40), and exception rate 12.6% (industry avg: 28%). On track for Gartner AP Excellence recognition.',
    badge: 'Top quartile',
    badgeColor: '#b06b00',
    badgeBg: '#fef3e2',
  },
]

const TIMELINE_STEPS = [
  { phase: 'Months 1–3', label: 'Foundation', desc: 'Email Capture → VIM integration live · Baseline STP 60%', pct: 60, done: true },
  { phase: 'Months 4–6', label: 'Optimisation', desc: 'GL auto-coding tuned · Exception rules refined · STP 78%', pct: 78, done: true },
  { phase: 'Months 7–9', label: 'Intelligence', desc: 'Royalty & IC agents active · Discount capture rule live · STP 87%', pct: 87, done: true },
  { phase: 'Months 10–12', label: 'Scale & Expand', desc: 'All divisions onboarded · Benchmarking · STP 92%+ target', pct: 92, done: false },
]

// ─── Rule Cards ───────────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<'outcomes' | 'rules'>('outcomes')

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f6f7f7' }}>

      {/* Page header */}
      <div style={{ background: 'white', padding: '20px 32px', borderBottom: '1px solid #e4e6e7', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1d2f36', margin: 0 }}>
            Settings &amp; Business Value
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', margin: 0 }}>
          Automation rules, priorities, and value outcomes of agentic AP processing for Bertelsmann
        </p>

        {/* Tab selector */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '16px', borderBottom: '2px solid #e4e6e7', marginBottom: '-2px' }}>
          {[
            { id: 'outcomes' as const, label: 'Value Outcomes  —  "So What?"' },
            { id: 'rules' as const, label: 'Automation Rules & Configuration' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeSection === tab.id ? '2px solid #1a3a6b' : '2px solid transparent',
                padding: '8px 16px',
                fontSize: '13px',
                fontFamily: 'Cabin, sans-serif',
                fontWeight: activeSection === tab.id ? 700 : 600,
                color: activeSection === tab.id ? '#1a3a6b' : '#6b767b',
                cursor: 'pointer',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  TAB 1 — VALUE OUTCOMES                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {activeSection === 'outcomes' && (
        <div style={{ padding: '28px 32px 48px', maxWidth: '1100px' }}>

          {/* ── Hero banner ── */}
          <div style={{
            background: 'linear-gradient(135deg, #1a3a6b 0%, #0d2b4e 60%, #1b3a2b 100%)',
            borderRadius: '12px',
            padding: '28px 32px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                Agentic AP Automation · Bertelsmann Global Source-to-Pay
              </div>
              <h2 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '24px', fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
                What does this mean for Bertelsmann?
              </h2>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 20px', lineHeight: '1.6', maxWidth: '640px' }}>
                14 invoices processed this session across 6 business divisions — €1.2M in payables managed by AI agents with zero manual touch for 87% of documents. Below is the projected annual impact at full Bertelsmann scale.
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  { n: '320K', l: 'invoices/year (est.)' },
                  { n: '€3.2M', l: 'annual savings potential' },
                  { n: '6', l: 'business divisions' },
                  { n: '24/7', l: 'agent availability' },
                ].map(item => (
                  <div key={item.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '22px', fontWeight: 700, color: '#FFB500', lineHeight: 1 }}>{item.n}</div>
                    <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '3px' }}>{item.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px 18px', textAlign: 'center', minWidth: '120px' }}>
                <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '28px', fontWeight: 700, color: '#1b823f', lineHeight: 1 }}>87.4%</div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>Straight-Through Rate</div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>vs. 45% industry avg</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '20px', fontWeight: 700, color: '#FFB500', lineHeight: 1 }}>Top Quartile</div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Media &amp; Publishing benchmark</div>
              </div>
            </div>
          </div>

          {/* ── KPI metrics ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
            {OUTCOME_KPIS.map(kpi => (
              <div key={kpi.label} style={{ background: 'white', border: '1px solid #e4e6e7', borderTop: `3px solid ${kpi.color}`, borderRadius: '8px', padding: '20px' }}>
                <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '30px', fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1d2f36', margin: '8px 0 4px' }}>{kpi.label}</div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#6b767b', lineHeight: '1.4' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Division outcomes ── */}
          <div style={{ marginBottom: '8px' }}>
            <SectionHeader label="Bertelsmann Division Outcomes" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
            {DIVISION_OUTCOMES.map(d => (
              <div key={d.division} style={{ background: 'white', border: '1px solid #e4e6e7', borderRadius: '10px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{d.flag}</span>
                  <div>
                    <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 700, color: d.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.division}</div>
                    <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1d2f36' }}>{d.headline}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', background: d.bg, borderRadius: '8px', padding: '8px 12px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: d.color, lineHeight: 1 }}>{d.metric}</div>
                    <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '10px', color: '#6b767b', marginTop: '2px', whiteSpace: 'nowrap' }}>{d.metricLabel}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: '#4a5568', lineHeight: '1.6' }}>{d.detail}</div>
              </div>
            ))}
          </div>

          {/* ── Industry challenges ── */}
          <div style={{ marginBottom: '8px' }}>
            <SectionHeader label="Industry Challenges Solved" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {CHALLENGES.map((c, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e4e6e7', borderRadius: '10px', padding: '18px 22px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f6f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  {c.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1d2f36' }}>{c.challenge}</div>
                    <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 700, color: '#89919a', background: '#f0f1f1', borderRadius: '4px', padding: '2px 7px' }}>{c.industry}</div>
                  </div>
                  <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: '#4a5568', lineHeight: '1.6', marginBottom: '8px' }}>{c.how}</div>
                  <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#89919a', fontStyle: 'italic' }}>{c.tag}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── AI Insights ── */}
          <div style={{ marginBottom: '8px' }}>
            <SectionHeader label="Intelligent Insights from Your Data" sub="Live patterns and recommendations surfaced by AI agents" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
            {AI_INSIGHTS.map((insight, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e4e6e7', borderRadius: '10px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: insight.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    {insight.icon}
                  </div>
                  <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1d2f36', flex: 1 }}>{insight.title}</div>
                  <div style={{ background: insight.badgeBg, color: insight.badgeColor, fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {insight.badge}
                  </div>
                </div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#4a5568', lineHeight: '1.65' }}>{insight.body}</div>
              </div>
            ))}
          </div>

          {/* ── Value realization timeline ── */}
          <div style={{ marginBottom: '8px' }}>
            <SectionHeader label="Value Realization Roadmap" sub="From go-live to full AP excellence — Bertelsmann deployment" />
          </div>
          <div style={{ background: 'white', border: '1px solid #e4e6e7', borderRadius: '10px', padding: '24px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', position: 'relative' }}>
              {/* connecting line */}
              <div style={{ position: 'absolute', top: '18px', left: '12.5%', right: '12.5%', height: '2px', background: '#e4e6e7', zIndex: 0 }} />
              {TIMELINE_STEPS.map((step, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1, padding: '0 12px' }}>
                  {/* node */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: step.done ? '#1a3a6b' : 'white',
                    border: `2px solid ${step.done ? '#1a3a6b' : '#c8cccf'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {step.done ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFB500' }} />
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '10px', fontWeight: 700, color: '#89919a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{step.phase}</div>
                    <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: step.done ? '#1a3a6b' : '#b06b00', marginBottom: '4px' }}>{step.label}</div>
                    <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#6b767b', lineHeight: '1.5', marginBottom: '8px' }}>{step.desc}</div>
                    {/* STP bar */}
                    <div style={{ width: '100%', height: '4px', background: '#f0f1f1', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${step.pct}%`, background: step.done ? '#1a3a6b' : '#FFB500', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 700, color: step.done ? '#1a3a6b' : '#b06b00', marginTop: '4px' }}>{step.pct}% STP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom note ── */}
          <div style={{ marginTop: '20px', background: '#f6f7f7', border: '1px solid #e4e6e7', borderRadius: '8px', padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="8" cy="8" r="7" stroke="#89919a" strokeWidth="1.3"/><path d="M8 7v4" stroke="#89919a" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="5" r="0.8" fill="#89919a"/></svg>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#6b767b', margin: 0, lineHeight: '1.6' }}>
              <strong style={{ color: '#1d2f36' }}>Methodology note:</strong> Savings estimates are based on Accenture benchmark data for global media &amp; publishing AP functions (320K invoices/year), industry-standard cost-per-invoice of €8.40 (manual) vs. €2.80 (AI-automated), and Bertelsmann's projected discount capture rates. FTE reallocation figures represent hours freed from manual processing, not headcount reduction. All metrics subject to validation during implementation.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  TAB 2 — AUTOMATION RULES & CONFIGURATION                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {activeSection === 'rules' && (
        <div style={{ padding: '28px 32px 48px', maxWidth: '900px' }}>

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
              icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="18" height="18" rx="3" stroke="#1a3a6b" strokeWidth="1.5"/><path d="M5 10h10M5 6.5h10M5 13.5h6" stroke="#1a3a6b" strokeWidth="1.4" strokeLinecap="round"/></svg>,
              description: 'Define monetary thresholds for auto-approval, manager review, and CFO sign-off. Configure per-category and per-supplier overrides.',
            },
            {
              title: 'Agent Configuration',
              icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#1a3a6b" strokeWidth="1.5"/><circle cx="10" cy="10" r="3.5" stroke="#1a3a6b" strokeWidth="1.4"/><path d="M10 1v3M10 16v3M1 10h3M16 10h3" stroke="#1a3a6b" strokeWidth="1.4" strokeLinecap="round"/></svg>,
              description: 'Configure AI agent behavior, step durations, confidence thresholds, and fallback actions for each processing stage.',
            },
            {
              title: 'Notification Rules',
              icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 0 1 6 6v3l1.5 2.5H2.5L4 11V8a6 6 0 0 1 6-6Z" stroke="#1a3a6b" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 16.5a2 2 0 0 0 4 0" stroke="#1a3a6b" strokeWidth="1.4" strokeLinecap="round"/></svg>,
              description: 'Set up email, Microsoft Teams, and in-app notification rules for SLA breaches, exception queues, and approval requests.',
            },
            {
              title: 'Supplier Master',
              icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="#1a3a6b" strokeWidth="1.5"/><path d="M7 5V4a3 3 0 0 1 6 0v1" stroke="#1a3a6b" strokeWidth="1.4" strokeLinecap="round"/><circle cx="10" cy="11" r="2" stroke="#1a3a6b" strokeWidth="1.3"/></svg>,
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
      )}
    </div>
  )
}

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1d2f36' }}>{label}</span>
        <div style={{ flex: 1, height: '1px', background: '#e4e6e7' }} />
      </div>
      {sub && <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#89919a', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  )
}
