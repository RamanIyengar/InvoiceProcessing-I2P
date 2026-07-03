import { useState } from 'react'
import { Invoice, ReplyEmail, SentEmail } from '../types'
import { ScannedInvoice } from './ScannedInvoice'
import { correctedTaxInvoice, mockInvoices } from '../data/mockData'

const kobaltInvoice = mockInvoices.find(i => i.id === 'inv-9')!

const ATTACHMENT_INVOICE_MAP: Record<string, Invoice> = {
  'inv-5-r1': correctedTaxInvoice,
  'inv-9': kobaltInvoice,
}

interface Props {
  invoices: Invoice[]
  replyEmails: ReplyEmail[]
  sentEmails?: SentEmail[]
  onMarkReplyRead: (id: string) => void
  onClose: () => void
}

type SelectedItem =
  | { kind: 'invoice'; invoice: Invoice }
  | { kind: 'reply'; reply: ReplyEmail }
  | { kind: 'sent'; sent: SentEmail }
  | null

const AVATAR_COLORS = [
  '#0078d4', '#1b823f', '#b06b00', '#7c3aed', '#b91f1f', '#1a3a6b', '#6b767b', '#0F3C78'
]

function getAvatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(h)]
}

function formatAmount(amount: number, currency: string): string {
  return `${currency === 'USD' ? '$' : currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function OutlookLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="4" fill="rgba(255,255,255,0.15)" />
      <rect x="4" y="8" width="20" height="14" rx="2" fill="white" opacity="0.9" />
      <path d="M4 10 L14 17 L24 10" stroke="#0078d4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function PaperclipIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M10 5.5 L5 10.5 A3 3 0 0 1 0.5 6 L6 0.5 A2 2 0 0 1 9 3.5 L4 8.5 A1 1 0 0 1 2.5 7 L6.5 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EmptyStateIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="14" width="52" height="38" rx="4" stroke="#c8cccf" strokeWidth="2" />
      <path d="M6 18 L32 36 L58 18" stroke="#c8cccf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}


export function OutlookInbox({ invoices, replyEmails, sentEmails = [], onMarkReplyRead, onClose }: Props) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null)
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent'>('inbox')

  // Filter out VIM items — those belong in the SAP VIM Worklist, not Outlook
  const isVimSent = (s: SentEmail) => s.toEmail === 'vim-no-reply@sap.bertelsmann.de'
  const isVimReply = (r: ReplyEmail) => r.senderEmail === 'vim-no-reply@sap.bertelsmann.de'

  const emailSentItems = sentEmails.filter(s => !isVimSent(s))
  const emailReplyItems = replyEmails.filter(r => !isVimReply(r))

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedItem({ kind: 'invoice', invoice })
  }

  const handleSelectReply = (reply: ReplyEmail) => {
    setSelectedItem({ kind: 'reply', reply })
    if (reply.isUnread) onMarkReplyRead(reply.id)
  }

  const handleSelectSent = (sent: SentEmail) => {
    setSelectedItem({ kind: 'sent', sent })
  }

  const selectedInvoice = selectedItem?.kind === 'invoice' ? selectedItem.invoice : null
  const selectedReply = selectedItem?.kind === 'reply' ? selectedItem.reply : null
  const selectedSent = selectedItem?.kind === 'sent' ? selectedItem.sent : null

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Ribbon header */}
      <div
        style={{
          height: '48px',
          background: '#0F3C78',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <OutlookLogo />
          <span style={{ color: 'white', fontSize: '16px', fontWeight: 600, fontFamily: "'Segoe UI', sans-serif" }}>
            Outlook
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <input
            placeholder="Search mail and people"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              width: '280px',
              padding: '6px 12px',
              fontSize: '13px',
              fontFamily: "'Segoe UI', sans-serif",
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            padding: '6px 14px',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'Lato, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          Logout
        </button>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar */}
        <div
          style={{
            width: '200px',
            background: '#f3f2f1',
            flexShrink: 0,
            borderRight: '1px solid #e4e6e7',
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 0',
          }}
        >
          <button
            style={{
              background: '#0F3C78',
              color: 'white',
              width: 'calc(100% - 24px)',
              margin: '8px 12px',
              borderRadius: '4px',
              padding: '8px',
              fontSize: '13px',
              fontFamily: "'Segoe UI', sans-serif",
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + New mail
          </button>

          <div style={{ padding: '8px 12px 4px', fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>AP Invoice Mailbox</div>
          <FolderItem label="Inbox" isActive={activeFolder === 'inbox'} onClick={() => { setActiveFolder('inbox'); setSelectedItem(null) }} />
          <FolderItem label="Sent Items" isActive={activeFolder === 'sent'} onClick={() => { setActiveFolder('sent'); setSelectedItem(null) }} count={emailSentItems.length > 0 ? emailSentItems.length : undefined} countColor="#1b823f" />
          <FolderItem label="Archive" isActive={false} onClick={() => {}} />
        </div>

        {/* Message list */}
        <div
          style={{
            width: '320px',
            flexShrink: 0,
            borderRight: '1px solid #e4e6e7',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {/* Pane header */}
          <div
            style={{
              background: '#f3f2f1',
              padding: '8px 12px',
              borderBottom: '1px solid #e4e6e7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1d2f36' }}>
              {activeFolder === 'sent' ? 'Sent Items' : 'Inbox'}
            </span>
            <select style={{ fontSize: '12px', border: 'none', background: 'transparent', color: '#6b767b', cursor: 'pointer' }}>
              <option>Date ↓</option>
              <option>From</option>
              <option>Subject</option>
            </select>
          </div>

          {/* Sent items view — email only */}
          {activeFolder === 'sent' && emailSentItems.map(sent => {
            const isSelected = selectedSent?.id === sent.id
            return (
              <div
                key={sent.id}
                onClick={() => handleSelectSent(sent)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #f0f1f1',
                  cursor: 'pointer',
                  background: isSelected ? '#deecf9' : 'rgba(27,130,63,0.05)',
                  borderLeft: isSelected ? '3px solid #0078d4' : '3px solid rgba(27,130,63,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1b823f', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                    AP
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        To: {sent.toName}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b767b', flexShrink: 0 }}>{sent.time}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sent.subject}</div>
                    <div style={{ fontSize: '12px', color: '#6b767b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', background: 'rgba(27,130,63,0.12)', color: '#1b823f', borderRadius: '4px', padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>Sent</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sent.body.substring(0, 60)}...</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {activeFolder === 'sent' && emailSentItems.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6b767b', fontSize: '13px', fontFamily: "'Segoe UI', sans-serif" }}>
              No sent items
            </div>
          )}

          {/* Reply emails at top (inbox only) — email replies only */}
          {activeFolder === 'inbox' && emailReplyItems.map(reply => {
            const isSelected = selectedReply?.id === reply.id
            return (
              <div
                key={reply.id}
                onClick={() => handleSelectReply(reply)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #f0f1f1',
                  cursor: 'pointer',
                  background: isSelected ? '#deecf9' : 'rgba(180,160,220,0.08)',
                  borderLeft: isSelected ? '3px solid #0078d4' : '3px solid rgba(124,58,237,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {reply.isUnread && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0078d4', flexShrink: 0 }} />
                  )}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: getAvatarColor(reply.senderName),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {reply.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: reply.isUnread ? 700 : 500, color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {reply.senderName}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b767b', flexShrink: 0 }}>{reply.time}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reply.subject}</div>
                    <div style={{ fontSize: '12px', color: '#6b767b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', background: 'rgba(124,58,237,0.12)', color: '#7c3aed', borderRadius: '4px', padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>Reply</span>
                      {reply.attachmentName && <span style={{ color: '#6b767b', flexShrink: 0 }}><PaperclipIcon /></span>}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reply.body.substring(0, 60)}...</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Invoice emails (inbox only) */}
          {activeFolder === 'inbox' && invoices.map(invoice => {
            const isSelected = selectedInvoice?.id === invoice.id
            return (
              <div
                key={invoice.id}
                onClick={() => handleSelectInvoice(invoice)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #f0f1f1',
                  cursor: 'pointer',
                  background: isSelected ? '#deecf9' : 'white',
                  borderLeft: isSelected ? '3px solid #0078d4' : '3px solid transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, paddingTop: '10px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0078d4' }} />
                  </div>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: getAvatarColor(invoice.emailSender),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {invoice.emailSender.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {invoice.emailSender}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b767b', flexShrink: 0 }}>{invoice.emailTime}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                      {invoice.emailSubject}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b767b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                      {invoice.emailPreview}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {invoice.attachmentName && (
                        <span style={{ color: '#6b767b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <PaperclipIcon />
                        </span>
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1d2f36', marginLeft: 'auto' }}>
                        {formatAmount(invoice.amount, invoice.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reading pane */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
          {!selectedItem ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
              }}
            >
              <EmptyStateIcon />
              <div style={{ fontSize: '16px', color: '#6b767b', fontFamily: "'Segoe UI', sans-serif" }}>
                Select a message to read
              </div>
            </div>
          ) : selectedSent ? (
            <SentReadingPane sent={selectedSent} />
          ) : selectedReply ? (
            <ReplyReadingPane reply={selectedReply} />
          ) : selectedInvoice ? (
            <InvoiceReadingPane invoice={selectedInvoice} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function FolderItem({ label, isActive, count, countColor, onClick }: { label: string; isActive: boolean; count?: number; countColor?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 12px',
        fontSize: '13px',
        fontFamily: "'Segoe UI', sans-serif",
        cursor: 'pointer',
        background: isActive ? 'rgba(0,120,212,0.08)' : 'transparent',
        borderLeft: isActive ? '3px solid #0078d4' : '3px solid transparent',
        color: isActive ? '#0078d4' : '#1d2f36',
        fontWeight: isActive ? 600 : 400,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M1 4 L1 13 C1 13.55 1.45 14 2 14 L14 14 C14.55 14 15 13.55 15 13 L15 6 C15 5.45 14.55 5 14 5 L8 5 L6.5 3 L2 3 C1.45 3 1 3.45 1 4 Z" />
      </svg>
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && count > 0 && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'white',
            background: countColor || '#6b767b',
            borderRadius: '10px',
            padding: '1px 6px',
            minWidth: '18px',
            textAlign: 'center',
          }}
        >
          {count}
        </span>
      )}
    </div>
  )
}

function AttachmentPreviewModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [previewZoom, setPreviewZoom] = useState(1)
  const zoomIn = () => setPreviewZoom(z => Math.min(1.8, parseFloat((z + 0.1).toFixed(1))))
  const zoomOut = () => setPreviewZoom(z => Math.max(0.6, parseFloat((z - 0.1).toFixed(1))))
  const iconBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: 'white', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }
  const docWidth = Math.round(700 * previewZoom)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 5000, display: 'flex', flexDirection: 'column' }}>
      {/* Header: filename on left, zoom + close on right */}
      <div style={{ background: '#2b2b2b', height: '48px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', flexShrink: 0 }}>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontFamily: 'Lato, sans-serif', flex: 1 }}>{invoice.attachmentName}</span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Lato, sans-serif' }}>PDF Document</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
          <button onClick={zoomOut} style={iconBtn} title="Zoom out">−</button>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Lato, sans-serif', minWidth: '40px', textAlign: 'center' }}>{Math.round(previewZoom * 100)}%</span>
          <button onClick={zoomIn} style={iconBtn} title="Zoom in">+</button>
          <button onClick={onClose} style={{ ...iconBtn, marginLeft: '4px', fontSize: '14px' }} title="Close">✕</button>
        </div>
      </div>
      {/* Scrollable document area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: '#404040' }}>
        <div style={{ background: 'white', width: `${docWidth}px`, minWidth: `${docWidth}px`, borderRadius: '2px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <ScannedInvoice invoice={invoice} isExtractionDone={true} showLegend={false} showConfidenceOverlays={false} />
        </div>
      </div>
    </div>
  )
}

function InvoiceReadingPane({ invoice }: { invoice: Invoice }) {
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false)

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #e4e6e7' }}>
        <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '24px', fontWeight: 700, color: '#1d2f36', margin: '0 0 16px' }}>
          {invoice.emailSubject}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: getAvatarColor(invoice.emailSender),
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {invoice.emailSender.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1d2f36', fontFamily: "'Segoe UI', sans-serif" }}>
              {invoice.emailSender}
            </div>
            <div style={{ fontSize: '12px', color: '#6b767b', fontFamily: "'Segoe UI', sans-serif" }}>
              {invoice.emailSenderEmail}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#6b767b', marginBottom: '4px', fontFamily: "'Segoe UI', sans-serif" }}>
          <span style={{ fontWeight: 600, color: '#1d2f36' }}>To:</span> accounts.payable@bertelsmann.de
        </div>
        <div style={{ fontSize: '13px', color: '#6b767b', marginBottom: '12px', fontFamily: "'Segoe UI', sans-serif" }}>
          <span style={{ fontWeight: 600, color: '#1d2f36' }}>Received:</span> {invoice.receivedAt} at {invoice.emailTime}
        </div>

        {invoice.attachmentName && (
          <div
            onClick={() => setShowAttachmentPreview(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f3f2f1',
              border: '1px solid #e4e6e7',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '13px',
              color: '#1d2f36',
              fontFamily: "'Segoe UI', sans-serif",
              cursor: 'pointer',
            }}
          >
            <PaperclipIcon />
            <span>{invoice.attachmentName}</span>
            <span style={{ color: '#0078d4', fontWeight: 600 }}>PDF &middot; View</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '24px 28px', fontFamily: "'Segoe UI', sans-serif", fontSize: '14px', lineHeight: '1.7', color: '#1d2f36' }}>
        {invoice.emailBody ? (
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Lato, sans-serif', fontSize: '14px', lineHeight: '1.7' }}>
            {invoice.emailBody}
          </div>
        ) : (
          <div style={{ color: '#6b767b', fontStyle: 'italic' }}>No email body available.</div>
        )}
      </div>

      {showAttachmentPreview && (
        <AttachmentPreviewModal invoice={invoice} onClose={() => setShowAttachmentPreview(false)} />
      )}
    </div>
  )
}

function ReplyReadingPane({ reply }: { reply: ReplyEmail }) {
  const [showAttachment, setShowAttachment] = useState(false)
  const attachmentInvoice = reply.attachmentInvoiceId ? ATTACHMENT_INVOICE_MAP[reply.attachmentInvoiceId] : null

  return (
    <div>
      <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #e4e6e7' }}>
        <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '24px', fontWeight: 700, color: '#1d2f36', margin: '0 0 16px' }}>
          {reply.subject}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: getAvatarColor(reply.senderName),
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {reply.senderName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1d2f36', fontFamily: "'Segoe UI', sans-serif" }}>
              {reply.senderName}
            </div>
            <div style={{ fontSize: '12px', color: '#6b767b', fontFamily: "'Segoe UI', sans-serif" }}>
              {reply.senderEmail}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: "'Segoe UI', sans-serif", marginBottom: reply.attachmentName ? '12px' : 0 }}>
          <span style={{ fontWeight: 600, color: '#1d2f36' }}>To:</span> accounts.payable@bertelsmann.de &nbsp;&middot;&nbsp;
          <span style={{ fontWeight: 600, color: '#1d2f36' }}>Received:</span> {reply.time}
        </div>
        {reply.attachmentName && (
          <div
            onClick={() => attachmentInvoice && setShowAttachment(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f3f2f1',
              border: '1px solid #e4e6e7',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '13px',
              color: '#1d2f36',
              fontFamily: "'Segoe UI', sans-serif",
              cursor: attachmentInvoice ? 'pointer' : 'default',
            }}
          >
            <PaperclipIcon />
            <span>{reply.attachmentName}</span>
            {attachmentInvoice && <span style={{ color: '#0078d4', fontWeight: 600 }}>PDF &middot; View</span>}
          </div>
        )}
      </div>
      <div style={{ padding: '24px 28px', fontFamily: "'Segoe UI', sans-serif", fontSize: '14px', lineHeight: '1.7', color: '#1d2f36' }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>{reply.body}</div>
      </div>
      {showAttachment && attachmentInvoice && (
        <AttachmentPreviewModal invoice={attachmentInvoice} onClose={() => setShowAttachment(false)} />
      )}
    </div>
  )
}

function SentReadingPane({ sent }: { sent: SentEmail }) {
  return (
    <div>
      <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #e4e6e7' }}>
        <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '24px', fontWeight: 700, color: '#1d2f36', margin: '0 0 16px' }}>
          {sent.subject}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1b823f', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
            AP
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1d2f36', fontFamily: "'Segoe UI', sans-serif" }}>
              Bertelsmann AP Team
            </div>
            <div style={{ fontSize: '12px', color: '#6b767b', fontFamily: "'Segoe UI', sans-serif" }}>
              accounts.payable@bertelsmann.de
            </div>
          </div>
        </div>
        <div style={{ fontSize: '13px', color: '#6b767b', marginBottom: '4px', fontFamily: "'Segoe UI', sans-serif" }}>
          <span style={{ fontWeight: 600, color: '#1d2f36' }}>To:</span> {sent.toName} &lt;{sent.toEmail}&gt;
        </div>
        <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: "'Segoe UI', sans-serif" }}>
          <span style={{ fontWeight: 600, color: '#1d2f36' }}>Sent:</span> {sent.time}
        </div>
      </div>
      <div style={{ padding: '24px 28px', fontFamily: "'Segoe UI', sans-serif", fontSize: '14px', lineHeight: '1.7', color: '#1d2f36' }}>
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Lato, sans-serif', fontSize: '14px', lineHeight: '1.7' }}>{sent.body}</div>
      </div>
    </div>
  )
}

