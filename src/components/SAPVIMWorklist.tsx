import { useState } from 'react'
import { ReplyEmail, SentEmail } from '../types'

interface Props {
  replyEmails: ReplyEmail[]
  sentEmails: SentEmail[]
  onMarkReplyRead: (id: string) => void
  onClose: () => void
}

type SelectedItem =
  | { kind: 'sent'; sent: SentEmail }
  | { kind: 'reply'; reply: ReplyEmail }
  | null

function SAPDocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="1" width="14" height="18" rx="2" fill="white" opacity="0.9" />
      <rect x="2" y="1" width="14" height="18" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <path d="M5 7h8M5 10h8M5 13h5" stroke="#1c3f6e" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="12" y="10" width="8" height="10" rx="1.5" fill="#1c3f6e" />
      <path d="M14 14h4M14 16.5h2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ChecklistIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1" y="1" width="12" height="12" rx="2" />
      <path d="M3.5 7 L5.5 9 L10 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M1 1 L13 7 L1 13 L3 7 Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 7 L13 7" strokeLinecap="round" />
    </svg>
  )
}

function EnvelopeEmptyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="18" width="52" height="36" rx="4" stroke="#c8d4e0" strokeWidth="2" />
      <path d="M6 22 L32 40 L58 22" stroke="#c8d4e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="8" width="24" height="16" rx="2" fill="#e8eef7" stroke="#c8d4e0" strokeWidth="1.5" />
      <path d="M24 14h16M24 18h10" stroke="#c8d4e0" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function SAPVIMWorklist({ replyEmails, sentEmails, onMarkReplyRead, onClose }: Props) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null)
  const [activeTab, setActiveTab] = useState<'notifications' | 'dispatched'>('notifications')

  const vimSentItems = sentEmails.filter(s => s.toEmail === 'vim-no-reply@sap.bertelsmann.de')
  const vimReplyItems = replyEmails.filter(r => r.senderEmail === 'vim-no-reply@sap.bertelsmann.de')
  const unreadNotificationsCount = vimReplyItems.filter(r => r.isUnread).length

  const selectedReply = selectedItem?.kind === 'reply' ? selectedItem.reply : null
  const selectedSent = selectedItem?.kind === 'sent' ? selectedItem.sent : null

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div
        style={{
          height: '48px',
          background: '#1c3f6e',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SAPDocIcon />
          <span style={{ color: 'white', fontSize: '15px', fontWeight: 700, fontFamily: "'Segoe UI', sans-serif", letterSpacing: '0.01em' }}>
            SAP OpenText VIM
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', fontWeight: 300 }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontFamily: "'Segoe UI', sans-serif" }}>
            Vendor Invoice Management — AP Inbox
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', fontFamily: "'Segoe UI', sans-serif", whiteSpace: 'nowrap' }}>
          Lena Fischer · AP Analyst
        </span>
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
          Back to Invoice
        </button>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left sidebar */}
        <div
          style={{
            width: '220px',
            background: '#f0f4f9',
            borderRight: '1px solid #c8d4e0',
            flexShrink: 0,
            padding: '12px 0',
          }}
        >
          <div
            style={{
              padding: '6px 14px 8px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#1c3f6e',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            VIM Worklist
          </div>

          {/* Notifications tab */}
          <div
            onClick={() => { setActiveTab('notifications'); setSelectedItem(null) }}
            style={{
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 14px',
              fontSize: '13px',
              fontFamily: "'Segoe UI', sans-serif",
              cursor: 'pointer',
              background: activeTab === 'notifications' ? 'rgba(28,63,110,0.1)' : 'transparent',
              borderLeft: activeTab === 'notifications' ? '3px solid #1c3f6e' : '3px solid transparent',
              color: activeTab === 'notifications' ? '#1c3f6e' : '#2c3e50',
              fontWeight: activeTab === 'notifications' ? 600 : 400,
            }}
          >
            <ChecklistIcon />
            <span style={{ flex: 1 }}>Completion Notifications</span>
            {unreadNotificationsCount > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'white',
                  background: '#1c3f6e',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  minWidth: '18px',
                  textAlign: 'center',
                }}
              >
                {unreadNotificationsCount}
              </span>
            )}
          </div>

          {/* Dispatched tab */}
          <div
            onClick={() => { setActiveTab('dispatched'); setSelectedItem(null) }}
            style={{
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 14px',
              fontSize: '13px',
              fontFamily: "'Segoe UI', sans-serif",
              cursor: 'pointer',
              background: activeTab === 'dispatched' ? 'rgba(28,63,110,0.1)' : 'transparent',
              borderLeft: activeTab === 'dispatched' ? '3px solid #1c3f6e' : '3px solid transparent',
              color: activeTab === 'dispatched' ? '#1c3f6e' : '#2c3e50',
              fontWeight: activeTab === 'dispatched' ? 600 : 400,
            }}
          >
            <SendIcon />
            <span style={{ flex: 1 }}>Dispatched Work Items</span>
            {vimSentItems.length > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'white',
                  background: '#1c3f6e',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  minWidth: '18px',
                  textAlign: 'center',
                }}
              >
                {vimSentItems.length}
              </span>
            )}
          </div>
        </div>

        {/* Message list */}
        <div
          style={{
            width: '340px',
            borderRight: '1px solid #c8d4e0',
            overflowY: 'auto',
            background: 'white',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* List header */}
          <div
            style={{
              background: '#f0f4f9',
              padding: '8px 12px',
              borderBottom: '1px solid #c8d4e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1c3f6e' }}>
              {activeTab === 'notifications' ? 'Completion Notifications' : 'Dispatched Work Items'}
            </span>
            <select style={{ fontSize: '12px', border: 'none', background: 'transparent', color: '#6b767b', cursor: 'pointer' }}>
              <option>Date</option>
              <option>Subject</option>
            </select>
          </div>

          {/* Notifications list */}
          {activeTab === 'notifications' && vimReplyItems.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6b767b', fontSize: '13px' }}>
              No completion notifications
            </div>
          )}
          {activeTab === 'notifications' && vimReplyItems.map(reply => {
            const isSelected = selectedReply?.id === reply.id
            return (
              <div
                key={reply.id}
                onClick={() => {
                  setSelectedItem({ kind: 'reply', reply })
                  if (reply.isUnread) onMarkReplyRead(reply.id)
                }}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #f0f2f5',
                  cursor: 'pointer',
                  background: isSelected ? '#e8eef7' : reply.isUnread ? 'rgba(28,63,110,0.05)' : 'white',
                  borderLeft: isSelected ? '3px solid #1c3f6e' : reply.isUnread ? '3px solid #1c3f6e' : '3px solid rgba(28,63,110,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {reply.isUnread && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1c3f6e', flexShrink: 0 }} />
                  )}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      background: '#1c3f6e',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      flexShrink: 0,
                      letterSpacing: '0.03em',
                    }}
                  >
                    VIM
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: reply.isUnread ? 700 : 500, color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                        SAP VIM — Automated
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b767b', flexShrink: 0 }}>{reply.time}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reply.subject}</div>
                    <div style={{ fontSize: '12px', color: '#6b767b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', background: 'rgba(27,107,46,0.12)', color: '#1b6b2e', borderRadius: '4px', padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>Completed</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reply.body.substring(0, 55)}...</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Dispatched list */}
          {activeTab === 'dispatched' && vimSentItems.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6b767b', fontSize: '13px' }}>
              No dispatched work items
            </div>
          )}
          {activeTab === 'dispatched' && vimSentItems.map(sent => {
            const isSelected = selectedSent?.id === sent.id
            return (
              <div
                key={sent.id}
                onClick={() => setSelectedItem({ kind: 'sent', sent })}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #f0f2f5',
                  cursor: 'pointer',
                  background: isSelected ? '#e8eef7' : 'white',
                  borderLeft: isSelected ? '3px solid #1c3f6e' : '3px solid rgba(28,63,110,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      background: 'rgba(28,63,110,0.15)',
                      color: '#1c3f6e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      flexShrink: 0,
                      letterSpacing: '0.03em',
                    }}
                  >
                    VIM
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                        {sent.toName.replace('SAP VIM — ', '')}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b767b', flexShrink: 0 }}>{sent.time}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#1d2f36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sent.subject}</div>
                    <div style={{ fontSize: '12px', color: '#6b767b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', background: 'rgba(28,63,110,0.1)', color: '#1c3f6e', borderRadius: '4px', padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>Dispatched</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sent.body.substring(0, 55)}...</span>
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
              <EnvelopeEmptyIcon />
              <div style={{ fontSize: '15px', color: '#6b767b', fontFamily: "'Segoe UI', sans-serif" }}>
                Select a work item to view
              </div>
            </div>
          ) : selectedItem.kind === 'reply' ? (
            <VIMReplyPane reply={selectedItem.reply} />
          ) : (
            <VIMSentPane sent={selectedItem.sent} />
          )}
        </div>
      </div>
    </div>
  )
}

function VIMReplyPane({ reply }: { reply: ReplyEmail }) {
  return (
    <div>
      <div style={{ background: '#1c3f6e', padding: '20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="12" rx="2" stroke="white" strokeWidth="1.6" />
              <path d="M6 9h8M6 12h5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              SAP VIM — Automated Workflow Notification
            </div>
            <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>
              vim-no-reply@sap.bertelsmann.de · {reply.time}
            </div>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'Lato, sans-serif',
              background: '#1b6b2e',
              color: '#fff',
              borderRadius: '12px',
              padding: '3px 10px',
              flexShrink: 0,
            }}
          >
            ✓ Completed
          </span>
        </div>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginTop: '10px' }}>
          {reply.subject}
        </div>
      </div>
      <div style={{ background: '#f8fafc', padding: '24px 28px' }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #dde3ea',
            borderRadius: '6px',
            padding: '20px 24px',
            whiteSpace: 'pre-wrap',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#1d2f36',
          }}
        >
          {reply.body}
        </div>
      </div>
    </div>
  )
}

function VIMSentPane({ sent }: { sent: SentEmail }) {
  return (
    <div>
      <div style={{ background: '#1c3f6e', padding: '20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="12" rx="2" stroke="white" strokeWidth="1.6" />
              <path d="M6 9h8M6 12h5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              SAP VIM — Automated Workflow Notification
            </div>
            <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>
              vim-no-reply@sap.bertelsmann.de · {sent.time}
            </div>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'Lato, sans-serif',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              borderRadius: '12px',
              padding: '3px 10px',
              flexShrink: 0,
            }}
          >
            → Dispatched
          </span>
        </div>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginTop: '10px' }}>
          {sent.subject}
        </div>
        <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '6px' }}>
          Routed to: {sent.toName}
        </div>
      </div>
      <div style={{ background: '#f8fafc', padding: '24px 28px' }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #dde3ea',
            borderRadius: '6px',
            padding: '20px 24px',
            whiteSpace: 'pre-wrap',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#1d2f36',
          }}
        >
          {sent.body}
        </div>
      </div>
    </div>
  )
}
