import { useState, useEffect, useRef } from 'react'
import { Invoice, ReplyEmail } from '../types'
import { mockInvoices } from '../data/mockData'
import { ScannedInvoice } from './ScannedInvoice'

interface Props {
  onSelectInvoice: (invoice: Invoice) => void
  replyEmails: ReplyEmail[]
  onMarkReplyRead: (id: string) => void
}

type SelectedItem =
  | { type: 'invoice'; data: Invoice }
  | { type: 'reply'; data: ReplyEmail }
  | null

function getExtractionMessages(inv: Invoice): string[] {
  return [
    `VIM Mailbox Adapter: Email detected from ${inv.emailSenderEmail}`,
    `Document Status Agent: Attachment found — ${inv.attachmentName}`,
    `SAP DOX Digitization Agent: Opening PDF — initiating OCR scan`,
    `Invoice Extractor (Id): Scanning document layout`,
    `Invoice Extractor (Id): Extracting invoice header fields`,
    `Formatter Agent: Normalizing currency, dates, and references`,
    `Invoice Classification (Ic): Invoice classified as ${inv.category}`,
  ]
}

function SupplierAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase()
  const colors = ['#1a3a6b', '#1b823f', '#b06b00', '#7c3aed', '#0891b2', '#be185d']
  const colorIndex = name.charCodeAt(0) % colors.length
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: colors[colorIndex],
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size === 32 ? '13px' : '18px',
      fontFamily: 'Cabin, sans-serif', fontWeight: 700,
      flexShrink: 0,
    }}>
      {initial}
    </div>
  )
}

function EmailCard({ invoice, isSelected, onClick }: { invoice: Invoice; isSelected: boolean; onClick: () => void }) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency, maximumFractionDigits: 2 })

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', border: 'none',
        background: isSelected ? '#e7ecf5' : '#fff',
        borderBottom: '1px solid #f0f1f1',
        borderLeft: isSelected ? '3px solid #1a3a6b' : '3px solid transparent',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <SupplierAvatar name={invoice.supplier} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {invoice.supplier}
            </span>
            <span style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', flexShrink: 0, marginLeft: '8px' }}>
              {invoice.emailTime}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginBottom: '4px' }}>
            {invoice.emailSenderEmail}
          </div>
          <div style={{ fontSize: '13px', color: '#1d2f36', fontFamily: 'Lato, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '8px' }}>
            {invoice.emailSubject}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#6b767b', fontFamily: 'Lato, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📎 {invoice.attachmentName}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1d2f36', fontFamily: 'Lato, sans-serif', background: isSelected ? '#fff' : '#f6f7f7', padding: '2px 8px', borderRadius: '12px', flexShrink: 0, marginLeft: '8px' }}>
              {fmt.format(invoice.amount)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function ReplyEmailCard({ replyEmail, isSelected, onClick }: { replyEmail: ReplyEmail; isSelected: boolean; onClick: () => void }) {
  const initials = replyEmail.senderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', border: 'none',
        background: replyEmail.isUnread ? '#fff9f0' : '#fff',
        borderBottom: '1px solid #f0f1f1',
        borderLeft: isSelected ? '3px solid #1a3a6b' : replyEmail.isUnread ? '3px solid #b06b00' : '3px solid transparent',
        padding: '14px 16px',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {replyEmail.isUnread && (
        <div style={{
          position: 'absolute', top: '14px', right: '16px',
          width: '7px', height: '7px', borderRadius: '50%', background: '#1a3a6b',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', background: '#b06b00',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyEmail.senderName}
            </span>
            <span style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', flexShrink: 0, marginLeft: '24px' }}>
              {replyEmail.time}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#1d2f36', fontFamily: 'Lato, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>
            {replyEmail.subject}
          </div>
          <div>
            <span style={{
              background: '#fff9f0', border: '1px solid #e0c080', color: '#b06b00',
              fontSize: '10px', fontFamily: 'Lato, sans-serif', fontWeight: 600,
              padding: '1px 6px', borderRadius: '3px',
            }}>
              ↩ Reply
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function PdfModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [zoom, setZoom] = useState(0.75)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '90vw', maxWidth: '90vw', height: '90vh', maxHeight: '90vh',
          background: '#fff', borderRadius: '10px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          background: '#1d2f36', padding: '14px 20px',
          display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontSize: '14px', fontFamily: 'Lato, sans-serif', flex: 1 }}>
            {invoice.attachmentName}
          </span>
          <button
            onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(1)))}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            -
          </button>
          <span style={{ color: '#fff', fontSize: '13px', fontFamily: 'Lato, sans-serif', minWidth: '36px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1)))}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            +
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer',
              fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, background: '#f6f7f7', padding: '24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <ScannedInvoice invoice={invoice} showLegend={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

function InvoiceEmailViewer({ invoice, onSelectInvoice }: { invoice: Invoice; onSelectInvoice: (inv: Invoice) => void }) {
  const [isStarted, setIsStarted] = useState(false)
  const [showAgentView, setShowAgentView] = useState(false)
  const [visibleCount, setVisibleCount] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [showPdf, setShowPdf] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messages = getExtractionMessages(invoice)

  useEffect(() => {
    setIsStarted(false)
    setShowAgentView(false)
    setVisibleCount(0)
    setIsDone(false)
    setShowPdf(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [invoice.id])

  function handleStart() {
    setIsStarted(true)
    setShowAgentView(true)
    setVisibleCount(0)
    setIsDone(false)
    let count = 0
    timerRef.current = setInterval(() => {
      count++
      setVisibleCount(count)
      if (count >= messages.length) {
        clearInterval(timerRef.current!)
        setTimeout(() => setIsDone(true), 400)
      }
    }, 480)
  }

  const hasAgentSteps = invoice.agentSteps.length > 0

  const emailHeader = (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e6e7', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <SupplierAvatar name={invoice.supplier} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1d2f36' }}>
              {invoice.emailSender}
            </span>
            <span style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>
              {invoice.emailSenderEmail}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', background: '#f6f7f7', padding: '3px 8px', borderRadius: '4px', flexShrink: 0 }}>
              {invoice.emailTime}
            </span>
          </div>
        </div>
      </div>
      <div style={{ fontSize: '15px', color: '#1d2f36', fontFamily: 'Lato, sans-serif', marginTop: '10px' }}>
        {invoice.emailSubject}
      </div>
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => setShowPdf(true)}
          style={{
            background: '#e7ecf5', border: '1px solid #1a3a6b', color: '#1a3a6b',
            fontSize: '12px', fontFamily: 'Lato, sans-serif', fontWeight: 600,
            padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
          }}
        >
          📎 {invoice.attachmentName}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {emailHeader}

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* Email body: show when not started OR when started but viewing email */}
        {(!isStarted || !showAgentView) && (
          <pre style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#1d2f36', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
            {invoice.emailBody || invoice.emailPreview}
          </pre>
        )}

        {/* Agent activity view */}
        {isStarted && showAgentView && (
          <div>
            {messages.slice(0, visibleCount).map((msg, i) => {
              const colonIdx = msg.indexOf(':')
              const agentName = colonIdx > -1 ? msg.substring(0, colonIdx) : ''
              const text = colonIdx > -1 ? msg.substring(colonIdx + 1).trim() : msg
              return (
                <div key={i} style={{ padding: '4px 0', display: 'flex', gap: '8px', animation: 'fadeInUp 0.25s ease-out' }}>
                  <span style={{ color: '#c8cccf', fontSize: '13px', flexShrink: 0 }}>›</span>
                  <span style={{ fontSize: '13px', fontFamily: 'Lato, sans-serif', color: '#1d2f36', lineHeight: '1.45' }}>
                    <span style={{ color: '#1a3a6b', fontWeight: 700 }}>{agentName}:</span>
                    {' '}{text}
                  </span>
                </div>
              )
            })}
            {isDone && (
              <>
                <div style={{ padding: '4px 0', display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#1b823f', fontSize: '14px', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '13px', fontFamily: 'Lato, sans-serif', color: '#1b823f', fontWeight: 700 }}>
                    Extraction complete — invoice data ready
                  </span>
                </div>
                <div style={{ background: '#f6f7f7', border: '1px solid #e4e6e7', borderRadius: '8px', padding: '16px', marginTop: '16px', animation: 'fadeInUp 0.4s ease-out' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: '#1b823f', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Extracted Invoice Data
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                    {[
                      { label: 'Invoice No.', value: invoice.invoiceNumber },
                      { label: 'Supplier', value: invoice.supplier.split(' ').slice(0, 2).join(' ') },
                      { label: 'Amount', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.amount) },
                      { label: 'Category', value: invoice.category },
                      { label: 'Received', value: invoice.emailTime },
                      { label: 'Attachment', value: invoice.attachmentName },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: '10px', color: '#6b767b', fontFamily: 'Lato, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                        <div style={{ fontSize: '13px', color: '#1d2f36', fontFamily: 'Lato, sans-serif', fontWeight: 600, marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sticky bar */}
      <div style={{ flexShrink: 0, borderTop: '1px solid #e4e6e7', padding: '14px 24px' }}>
        {/* State 1: not started */}
        {!isStarted && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '14px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>
              AI agents will extract and validate invoice data automatically
            </div>
            <button onClick={handleStart} style={{
              padding: '11px 28px', background: '#1a3a6b', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '15px',
              fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              Start Processing
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* State 2: started, in email view → show "See Agent Activity" */}
        {isStarted && !showAgentView && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>
              {isDone ? 'Extraction complete' : 'Processing in background...'}
            </span>
            <button onClick={() => setShowAgentView(true)} style={{
              padding: '9px 20px', background: '#fff', color: '#1a3a6b',
              border: '1.5px solid #1a3a6b', borderRadius: '8px', fontSize: '14px',
              fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              See Agent Activity
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2.5l4.5 4.5-4.5 4.5" stroke="#1a3a6b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* State 3: started, in agent view, processing */}
        {isStarted && showAgentView && !isDone && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1a3a6b', animation: 'pulse-ring 1.5s infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>Processing...</span>
            </div>
            <button onClick={() => setShowAgentView(false)} style={{
              padding: '8px 16px', background: '#fff', color: '#6b767b',
              border: '1px solid #c8cccf', borderRadius: '6px', fontSize: '13px',
              fontFamily: 'Lato, sans-serif', fontWeight: 600, cursor: 'pointer',
            }}>
              ← Back to Email
            </button>
          </div>
        )}

        {/* State 4: started, in agent view, done */}
        {isStarted && showAgentView && isDone && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => setShowAgentView(false)} style={{
              padding: '8px 16px', background: '#fff', color: '#6b767b',
              border: '1px solid #c8cccf', borderRadius: '6px', fontSize: '13px',
              fontFamily: 'Lato, sans-serif', fontWeight: 600, cursor: 'pointer',
            }}>
              ← Back to Email
            </button>
            {hasAgentSteps ? (
              <button onClick={() => onSelectInvoice(invoice)} style={{
                padding: '12px 28px', background: '#1b823f', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '15px',
                fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                Proceed to Validation
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <div style={{ fontSize: '14px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>
                This invoice type is queued for manual review.
              </div>
            )}
          </div>
        )}
      </div>

      {showPdf && <PdfModal invoice={invoice} onClose={() => setShowPdf(false)} />}
    </div>
  )
}

function ReplyEmailViewer({ replyEmail, onSelectInvoice }: { replyEmail: ReplyEmail; onSelectInvoice: (inv: Invoice) => void }) {
  const initials = replyEmail.senderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  function handleGoToInvoice() {
    const inv = mockInvoices.find(i => i.id === replyEmail.relatedInvoiceId)
    if (inv && inv.agentSteps.length > 0) {
      onSelectInvoice(inv)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e6e7', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', background: '#b06b00',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '17px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1d2f36' }}>
                {replyEmail.senderName}
              </span>
              <span style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>
                {replyEmail.senderEmail}
              </span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: '15px', color: '#1d2f36', fontFamily: 'Lato, sans-serif', marginTop: '10px' }}>
          {replyEmail.subject}
        </div>
        <div style={{ marginTop: '8px' }}>
          <span style={{
            background: '#fff9f0', border: '1px solid #e0c080', color: '#b06b00',
            fontSize: '11px', fontFamily: 'Lato, sans-serif', fontWeight: 600,
            padding: '2px 8px', borderRadius: '4px',
          }}>
            ↩ Re:
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <pre style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#1d2f36', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
          {replyEmail.body}
        </pre>
      </div>

      <div style={{ flexShrink: 0, borderTop: '2px solid #1a3a6b', padding: '16px 24px', background: '#e7ecf5', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '14px', color: '#1d2f36', fontFamily: 'Lato, sans-serif', flex: 1 }}>
          This reply is related to invoice {replyEmail.relatedInvoiceId}
        </span>
        <button
          onClick={handleGoToInvoice}
          style={{
            padding: '10px 20px', background: '#1a3a6b', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '15px',
            fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: 'pointer',
          }}
        >
          Go to Invoice →
        </button>
      </div>
    </div>
  )
}

export function Dashboard({ onSelectInvoice, replyEmails, onMarkReplyRead }: Props) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null)

  const categoryOrder: Record<string, number> = { 'PO': 0, 'Non-PO': 1, 'ECC Legacy': 2 }
  const sortedInvoices = [...mockInvoices].sort((a, b) => (categoryOrder[a.category] ?? 3) - (categoryOrder[b.category] ?? 3))

  function handleSelectInvoice(invoice: Invoice) {
    setSelectedItem({ type: 'invoice', data: invoice })
  }

  function handleSelectReply(replyEmail: ReplyEmail) {
    setSelectedItem({ type: 'reply', data: replyEmail })
    onMarkReplyRead(replyEmail.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #e4e6e7', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e4e6e7', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="3" width="16" height="12" rx="2" stroke="#1a3a6b" strokeWidth="1.5"/>
            <polyline points="1,3 9,10 17,3" stroke="#1a3a6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1d2f36' }}>AP Invoice Inbox</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>Last synced: just now</span>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1b823f' }} />
            <span style={{ fontSize: '12px', color: '#1b823f', fontFamily: 'Lato, sans-serif', fontWeight: 700 }}>Live</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {replyEmails.map(re => (
            <ReplyEmailCard
              key={re.id}
              replyEmail={re}
              isSelected={selectedItem?.type === 'reply' && selectedItem.data.id === re.id}
              onClick={() => handleSelectReply(re)}
            />
          ))}
          {sortedInvoices.map(inv => (
            <EmailCard
              key={inv.id}
              invoice={inv}
              isSelected={selectedItem?.type === 'invoice' && selectedItem.data.id === inv.id}
              onClick={() => handleSelectInvoice(inv)}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {selectedItem === null && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', gap: '16px' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="8" width="40" height="32" rx="4" stroke="#c8cccf" strokeWidth="2"/>
              <polyline points="4,8 24,26 44,8" stroke="#c8cccf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontFamily: 'Cabin', fontSize: '16px', fontWeight: 700, color: '#6b767b' }}>Select an email to begin</div>
            <div style={{ fontSize: '14px', color: '#94a3b0', fontFamily: 'Lato', textAlign: 'center', maxWidth: '260px', lineHeight: '1.5' }}>
              Click any email in the inbox to view it and start AI-powered processing
            </div>
          </div>
        )}
        {selectedItem?.type === 'invoice' && (
          <InvoiceEmailViewer
            key={selectedItem.data.id}
            invoice={selectedItem.data}
            onSelectInvoice={onSelectInvoice}
          />
        )}
        {selectedItem?.type === 'reply' && (
          <ReplyEmailViewer
            key={selectedItem.data.id}
            replyEmail={selectedItem.data}
            onSelectInvoice={onSelectInvoice}
          />
        )}
      </div>
    </div>
  )
}
