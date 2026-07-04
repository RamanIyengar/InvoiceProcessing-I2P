import { useState } from 'react'
import { Invoice, ReplyEmail, SentEmail } from './types'
import { LoginScreen } from './components/LoginScreen'
import { AppHeader, NavSection } from './components/AppHeader'
import { DashboardView } from './components/DashboardView'
import { InvoiceWorkspace } from './components/InvoiceWorkspace'
import { AuditTrailPage } from './components/AuditTrailPage'
import { SubmissionInbox } from './components/SubmissionInbox'
import {
  taxMismatchReplyEmails, glApprovalReplyEmail, metroGLReplyEmails, prtGLReplyEmails,
  missingGRReplyEmail, royaltyMismatchReplyEmail, royaltyDeviationSentEmail,
  taxMismatchSentEmail, missingGRSentEmail, glApprovalSentEmail, prtGLSentEmail,
  metroGLSentEmail, icMismatchSentEmail, icMismatchReplyEmail, rrdDisputeSentEmail,
  rrdDisputeReplyEmail, kobaltRescanSentEmail, kobaltRescanReplyEmail,
} from './data/mockData'
import { TicketsView } from './components/TicketsView'
import { SettingsPage } from './components/SettingsPage'
import { UseCasesPanel } from './components/LandingScreen'

// ─── Analytics charts ────────────────────────────────────────────────────────

const I2P_PURPLE = '#7C3AED'
const I2P_SUCCESS = '#16A34A'

function BarChart() {
  const bars = [
    { label: 'PO', count: 6, color: I2P_PURPLE },
    { label: 'Non-PO', count: 6, color: '#D97706' },
    { label: 'ECC Legacy', count: 2, color: I2P_SUCCESS },
  ]
  const max = 8
  const barW = 52
  const gap = 36
  const svgW = bars.length * (barW + gap) + gap
  const svgH = 160
  const chartH = 110
  const baseY = svgH - 30

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
      <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>Invoice Volume by Category</div>
      <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Lato, sans-serif', marginBottom: '16px' }}>Current batch · today</div>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
        {[0, 2, 4, 6, 8].map((v) => {
          const y = baseY - (v / max) * chartH
          return (
            <g key={v}>
              <line x1={gap / 2} x2={svgW - gap / 2} y1={y} y2={y} stroke="#F1F5F9" strokeWidth="1" />
              <text x={gap / 2 - 4} y={y + 4} fontSize="10" fill="#CBD5E1" textAnchor="end">{v}</text>
            </g>
          )
        })}
        {bars.map((b, i) => {
          const x = gap + i * (barW + gap)
          const barH = (b.count / max) * chartH
          const y = baseY - barH
          return (
            <g key={b.label}>
              <rect x={x} y={y} width={barW} height={barH} fill={b.color} rx="4" opacity="0.85" />
              <text x={x + barW / 2} y={y - 6} fontSize="13" fontWeight="700" fill={b.color} textAnchor="middle">{b.count}</text>
              <text x={x + barW / 2} y={baseY + 14} fontSize="11" fill="#64748B" textAnchor="middle">{b.label}</text>
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
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
      <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>Actions by Actor Type</div>
      <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Lato, sans-serif', marginBottom: '12px' }}>Agent vs Human intervention</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <svg width="130" height="130" viewBox="0 0 220 160">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="26" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={I2P_SUCCESS} strokeWidth="26" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={0} transform={`rotate(-90 ${cx} ${cy})`} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={I2P_PURPLE} strokeWidth="26" strokeDasharray={`${agentPct * circ} ${circ}`} strokeDashoffset={0} transform={`rotate(-90 ${cx} ${cy})`} />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1E293B">84%</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#64748B">Agent</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Agent actions', pct: '84%', color: I2P_PURPLE },
            { label: 'Human actions', pct: '16%', color: I2P_SUCCESS },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#1E293B', fontWeight: 600 }}>{item.pct}</div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#64748B' }}>{item.label}</div>
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
    { day: 'Mon', v: 3 }, { day: 'Tue', v: 5 }, { day: 'Wed', v: 4 },
    { day: 'Thu', v: 8 }, { day: 'Fri', v: 6 }, { day: 'Sat', v: 2 }, { day: 'Sun', v: 7 },
  ]
  const svgW = 280, svgH = 160, padL = 28, padR = 12, padT = 16, padB = 28
  const chartW = svgW - padL - padR, chartH = svgH - padT - padB, maxV = 10
  const pts = data.map((d, i) => ({ x: padL + (i / (data.length - 1)) * chartW, y: padT + chartH - (d.v / maxV) * chartH }))
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaD = `${lineD} L${pts[pts.length - 1].x},${padT + chartH} L${pts[0].x},${padT + chartH} Z`

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
      <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>Processing Volume</div>
      <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Lato, sans-serif', marginBottom: '12px' }}>Last 7 days · invoices per day</div>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`}>
        {[0, 2, 4, 6, 8, 10].map((v) => {
          const y = padT + chartH - (v / maxV) * chartH
          return (
            <g key={v}>
              <line x1={padL} x2={padL + chartW} y1={y} y2={y} stroke="#F1F5F9" strokeWidth="1" />
              <text x={padL - 4} y={y + 4} fontSize="9" fill="#CBD5E1" textAnchor="end">{v}</text>
            </g>
          )
        })}
        <path d={areaD} fill={I2P_PURPLE} opacity="0.08" />
        <path d={lineD} fill="none" stroke={I2P_PURPLE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={I2P_PURPLE} />
            <circle cx={p.x} cy={p.y} r="2" fill="#fff" />
            <text x={p.x} y={padT + chartH + 14} fontSize="10" fill="#64748B" textAnchor="middle">{data[i].day}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}


export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('cases')
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
  const [icSent, setIcSent] = useState(false)
  const [icReplyReceived, setIcReplyReceived] = useState(false)
  const [rescanSent, setRescanSent] = useState(false)
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(null)
  const [appView, setAppView] = useState<'login' | 'app'>('login')

  if (appView === 'login') {
    return <LoginScreen onLogin={() => setAppView('app')} />
  }

  const inboxBadgeCount = replyEmails.filter((e) => e.isUnread).length

  const showToast = (message: string, action?: { label: string; onClick: () => void }) => {
    setToastMessage(message)
    setToastAction(action ?? null)
    setToastVisible(true)
  }

  const hideToast = (delay = 0) => setTimeout(() => setToastVisible(false), delay)

  const handleTaxMismatchSent = () => {
    if (taxMismatchEmailSent) return
    setSentEmails(prev => prev.some(e => e.id === taxMismatchSentEmail.id) ? prev : [taxMismatchSentEmail, ...prev])
    setReplyEmails(prev => {
      if (prev.some(e => e.id === taxMismatchReplyEmails[0].id)) return prev
      return [...taxMismatchReplyEmails, ...prev]
    })
    setTaxMismatchEmailSent(true)
    showToast('Invoice rejection sent to rechnung@lehmanns.de · CC: a.krueger@i2p.accenture.com')
    const t1 = hideToast(4000)
    setTimeout(() => {
      clearTimeout(t1)
      setToastVisible(false)
      setTimeout(() => {
        setTaxMismatchRepliesReceived(true)
        showToast('Corrected invoice received from Lehmanns Media · Anja Krüger acknowledged', {
          label: 'View in Submission',
          onClick: () => setActiveSection('submission'),
        })
        hideToast(6000)
      }, 80)
    }, 2000)
  }

  const handleMissingGRSent = () => {
    if (missingGRSent) return
    setMissingGRSent(true)
    setSentEmails(prev => prev.some(e => e.id === missingGRSentEmail.id) ? prev : [missingGRSentEmail, ...prev])
    showToast('I2P WF-2026-8823 submitted to I2P Workflow — Fremantle Germany Queue')
    const t1 = hideToast(4000)
    setTimeout(() => {
      clearTimeout(t1)
      setToastVisible(false)
      setTimeout(() => {
        setMissingGRReplyReceived(true)
        setReplyEmails(prev => {
          if (prev.some(e => e.id === missingGRReplyEmail.id)) return prev
          return [missingGRReplyEmail, ...prev]
        })
        showToast('I2P WF-2026-8823 completed — Sophie Brandt confirmed SES-2026-88412 booked', {
          label: 'View in Submission',
          onClick: () => setActiveSection('submission'),
        })
        hideToast(6000)
      }, 80)
    }, 2500)
  }

  const handleRoyaltySent = () => {
    if (royaltySent) return
    setRoyaltySent(true)
    setSentEmails(prev => prev.some(e => e.id === royaltyDeviationSentEmail.id) ? prev : [royaltyDeviationSentEmail, ...prev])
    showToast('I2P WF-2026-3312 submitted to I2P Workflow — PRH Royalties Queue')
    const t1 = hideToast(4000)
    setTimeout(() => {
      clearTimeout(t1)
      setToastVisible(false)
      setTimeout(() => {
        setReplyEmails(prev => {
          if (prev.some(e => e.id === royaltyMismatchReplyEmail.id)) return prev
          return [royaltyMismatchReplyEmail, ...prev]
        })
        showToast('I2P WF-2026-3312 completed — Claire Newton confirmed contract rate 12.5%', {
          label: 'View in Submission',
          onClick: () => setActiveSection('submission'),
        })
        hideToast(6000)
      }, 80)
    }, 3000)
  }

  const handleICMismatchSend = () => {
    if (icSent) return
    setIcSent(true)
    setSentEmails(prev => prev.some(e => e.id === icMismatchSentEmail.id) ? prev : [icMismatchSentEmail, ...prev])
    showToast('I2P WF-2026-6647 submitted to I2P Workflow — Bertelsmann Finance Queue')
    const t1 = hideToast(4000)
    setTimeout(() => {
      clearTimeout(t1)
      setToastVisible(false)
      setTimeout(() => {
        setIcReplyReceived(true)
        setReplyEmails(prev => {
          if (prev.some(e => e.id === icMismatchReplyEmail.id)) return prev
          return [icMismatchReplyEmail, ...prev]
        })
        showToast('I2P WF-2026-6647 completed — Pieter Janssen confirmed ICE-REC-2026-0619 cleared', {
          label: 'View in Submission',
          onClick: () => setActiveSection('submission'),
        })
        hideToast(6000)
      }, 80)
    }, 3000)
  }

  const handleRescanSent = () => {
    if (rescanSent) return
    setRescanSent(true)
    setSentEmails(prev => prev.some(e => e.id === kobaltRescanSentEmail.id) ? prev : [kobaltRescanSentEmail, ...prev])
    showToast('Re-scan request sent to Kobalt Music Group · royalties@kobaltmusic.com')
    const t1 = hideToast(4000)
    setTimeout(() => {
      clearTimeout(t1)
      setToastVisible(false)
      setTimeout(() => {
        setReplyEmails(prev => {
          if (prev.some(e => e.id === kobaltRescanReplyEmail.id)) return prev
          return [kobaltRescanReplyEmail, ...prev]
        })
        showToast('Kobalt resent KOB-RY-2026-0831 as native PDF — reprocessing at 97% confidence', {
          label: 'View in Submission',
          onClick: () => setActiveSection('submission'),
        })
        hideToast(6000)
      }, 80)
    }, 2500)
  }

  const handleGLApprovalSent = () => {
    const isPRT = selectedInvoice?.glMissingVariant === 'prt-coding'
    if (isPRT) {
      setSentEmails(prev => prev.some(e => e.id === prtGLSentEmail.id) ? prev : [prtGLSentEmail, ...prev])
      showToast('I2P WF-2026-5390 submitted to I2P Workflow — Fremantle Germany Queue')
      const t1 = hideToast(4000)
      setTimeout(() => {
        clearTimeout(t1)
        setToastVisible(false)
        setReplyEmails(prev => prev.some(e => e.id === 'reply-prt-gl-1') ? prev : [prtGLReplyEmails[0], ...prev])
        if (selectedInvoice?.id) setGLApprovedInvoiceIds(prev => new Set([...prev, selectedInvoice.id]))
        setTimeout(() => {
          showToast('I2P WF-2026-5390 part-completed — Claudia Bauer approved WBS coding', {
            label: 'View in Submission',
            onClick: () => setActiveSection('submission'),
          })
          hideToast(5000)
        }, 80)
      }, 2000)
      setTimeout(() => {
        setReplyEmails(prev => prev.some(e => e.id === 'reply-prt-gl-2') ? prev : [prtGLReplyEmails[1], ...prev])
        setPrtGLBothApproved(true)
        setTimeout(() => {
          showToast('I2P WF-2026-5390 completed — Marc Olivier-Leblanc approved DOA — PXM-2026-FRM-1142 cleared', {
            label: 'View in Submission',
            onClick: () => setActiveSection('submission'),
          })
          hideToast(5000)
        }, 80)
      }, 4000)
      return
    }

    const currentInvoiceId = selectedInvoice?.id ?? ''
    const isRRDDispute = currentInvoiceId === 'inv-7'
    const sentEmailObj = isRRDDispute ? rrdDisputeSentEmail : glApprovalSentEmail
    const replyEmailObj = isRRDDispute ? rrdDisputeReplyEmail : glApprovalReplyEmail
    const replyEmailId = isRRDDispute ? 'reply-rrd-dispute' : 'reply-gl-approval'
    setSentEmails(prev => prev.some(e => e.id === sentEmailObj.id) ? prev : [sentEmailObj, ...prev])
    showToast(isRRDDispute ? 'I2P WF-2026-2281 submitted to I2P Workflow — PRH Procurement Queue' : 'I2P WF-2026-7714 submitted to I2P Workflow — BMS Marketing Queue')
    const t1 = hideToast(4000)
    setTimeout(() => {
      clearTimeout(t1)
      setToastVisible(false)
      setReplyEmails(prev => prev.some(e => e.id === replyEmailId) ? prev : [replyEmailObj, ...prev])
      if (currentInvoiceId) setGLApprovedInvoiceIds(prev => new Set([...prev, currentInvoiceId]))
      setTimeout(() => {
        showToast(
          isRRDDispute ? 'I2P WF-2026-2281 completed — Julia Hartmann confirmed surcharge approved' : 'I2P WF-2026-7714 completed — Caroline Hoffmann confirmed GL code',
          { label: 'View in Submission', onClick: () => setActiveSection('submission') }
        )
        hideToast(6000)
      }, 80)
    }, 2000)
  }

  const handleMetroGLApprovalSend = () => {
    if (metroGLApprovalSent) return
    setMetroGLApprovalSent(true)
    setSentEmails(prev => prev.some(e => e.id === metroGLSentEmail.id) ? prev : [metroGLSentEmail, ...prev])
    showToast('I2P WF-2026-4561 submitted to I2P Workflow — Arvato Connect Queue')
    const t1 = hideToast(4000)
    setTimeout(() => {
      clearTimeout(t1)
      setToastVisible(false)
      setReplyEmails(prev => prev.some(e => e.id === 'reply-metro-gl-1') ? prev : [...metroGLReplyEmails, ...prev])
      setTimeout(() => {
        showToast('I2P WF-2026-4561 completed — Markus Weber & Anja Krüger confirmed GL 6720-001', {
          label: 'View in Submission',
          onClick: () => setActiveSection('submission'),
        })
        hideToast(6000)
      }, 80)
    }, 2000)
  }

  const handleMarkReplyRead = (id: string) => {
    setReplyEmails((prev) => prev.map((e) => (e.id === id ? { ...e, isUnread: false } : e)))
  }

  const handleSelectInvoice = (invoice: Invoice) => {
    if (invoice.agentSteps.length > 0) {
      setSelectedInvoice(invoice)
      if (activeSection !== 'cases') setActiveSection('cases')
    }
  }

  const handleBack = () => setSelectedInvoice(null)

  const handleSectionChange = (section: NavSection) => {
    setActiveSection(section)
    setSelectedInvoice(null)
  }

  const metroApproved = metroGLApprovalSent && replyEmails.some(e => e.id === 'reply-metro-gl-1')
  const royaltyMismatchAutoResolved = royaltySent && replyEmails.some(e => e.id === 'reply-royalty-mismatch' && !e.isUnread)
  const icMismatchAutoResolved = icSent && icReplyReceived
  const rescanReplyReceived = rescanSent && replyEmails.some(e => e.id === 'reply-kobalt-rescan')

  const glEmailsViewed = selectedInvoice?.glMissingVariant === 'prt-coding'
    ? prtOutlookReturned ||
      (replyEmails.filter(e => e.id === 'reply-prt-gl-1' || e.id === 'reply-prt-gl-2').length === 2 &&
       replyEmails.filter(e => e.id === 'reply-prt-gl-1' || e.id === 'reply-prt-gl-2').every(e => !e.isUnread))
    : selectedInvoice?.id === 'inv-7'
      ? replyEmails.some(e => e.id === 'reply-rrd-dispute' && !e.isUnread)
      : replyEmails.some(e => e.id === 'reply-gl-approval' && !e.isUnread)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFC' }}>
      <AppHeader
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        currentInvoice={selectedInvoice}
        onLogout={() => setAppView('login')}
        inboxBadge={inboxBadgeCount}
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeSection === 'cases' && selectedInvoice ? (
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
            onICMismatchSend={handleICMismatchSend}
            icMismatchAutoResolved={icMismatchAutoResolved && selectedInvoice?.failType === 'ic-mismatch'}
            onRescanSent={handleRescanSent}
            rescanReplyReceived={rescanReplyReceived && selectedInvoice?.id === 'inv-9'}
          />
        ) : activeSection === 'cases' ? (
          <TicketsView
            onSelectInvoice={handleSelectInvoice}
            replyEmails={replyEmails}
            onMarkReplyRead={handleMarkReplyRead}
            processedIds={processedInvoiceIds}
            rejectedInvoiceIds={taxMismatchEmailSent && !taxMismatchRepliesReceived ? new Set(['inv-5']) : undefined}
            straightPassInvoiceIds={taxMismatchRepliesReceived ? new Set(['inv-5']) : undefined}
            metroApprovedIds={metroApprovedIds}
          />
        ) : activeSection === 'insights' ? (
          <DashboardView onSelectInvoice={handleSelectInvoice} />
        ) : activeSection === 'submission' ? (
          <SubmissionInbox
            replyEmails={replyEmails}
            sentEmails={sentEmails}
            onMarkReplyRead={handleMarkReplyRead}
            onClose={() => {
              if (prtGLBothApproved && selectedInvoice?.glMissingVariant === 'prt-coding') {
                setPrtOutlookReturned(true)
              }
              setActiveSection('cases')
            }}
          />
        ) : activeSection === 'audit' ? (
          <AuditTrailPage />
        ) : activeSection === 'configuration' ? (
          <SettingsPage />
        ) : activeSection === 'usecases' ? (
          <UseCasesPanel />
        ) : null}
      </div>

      {toastVisible && (
        <div style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 9999,
          background: '#fff',
          color: '#1E293B',
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
          fontSize: '14px',
          fontFamily: 'Lato, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid #E2E8F0',
          maxWidth: '440px',
        }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ flex: 1 }}>{toastMessage}</span>
          {toastAction && (
            <button
              onClick={() => { toastAction.onClick(); setToastVisible(false); setToastAction(null) }}
              style={{ padding: '6px 14px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
            >
              {toastAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
