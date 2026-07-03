import { useState } from 'react'
import { ReplyEmail, SentEmail } from '../types'

interface Props {
  replyEmails: ReplyEmail[]
  sentEmails: SentEmail[]
  onMarkReplyRead: (id: string) => void
  onClose: () => void
}

type InboxTab = 'inbound' | 'sent' | 'workflow'

const INFLOW_SOURCES = [
  { label: 'Email PDF', icon: '📧', count: 8, color: '#7C3AED' },
  { label: 'Direct Upload', icon: '📤', count: 3, color: '#16A34A' },
  { label: 'Paper Scan', icon: '🖨️', count: 2, color: '#D97706' },
  { label: 'MSP Portal', icon: '🌐', count: 1, color: '#64748B' },
]

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', color: '#94A3B8', fontSize: '14px', fontFamily: 'Lato, sans-serif', gap: '8px' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
      <span>{message}</span>
    </div>
  )
}

export function SubmissionInbox({ replyEmails, sentEmails, onMarkReplyRead, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<InboxTab>('inbound')
  const [selectedEmail, setSelectedEmail] = useState<ReplyEmail | SentEmail | null>(null)

  const unreadCount = replyEmails.filter(e => e.isUnread).length

  const tabs: { id: InboxTab; label: string; badge?: number }[] = [
    { id: 'inbound',  label: 'Inbound',  badge: replyEmails.length > 0 ? unreadCount : undefined },
    { id: 'sent',     label: 'Dispatched' },
    { id: 'workflow', label: 'I2P Workflow' },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC', fontFamily: 'Lato, sans-serif' }}>
      {/* Page header */}
      <div style={{ background: '#fff', padding: '16px 28px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
          I2P · Submission /  <span style={{ color: '#475569', fontWeight: 600 }}>Invoice Inbox</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
              Invoice Submission
            </h1>
            {unreadCount > 0 && (
              <span style={{ background: '#FEF2F2', color: '#DC2626', borderRadius: '12px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '7px 16px', fontSize: '13px', color: '#475569', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}
          >
            ← Back to Cases
          </button>
        </div>
      </div>

      {/* Inflow source tiles */}
      <div style={{ background: '#fff', padding: '12px 28px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {INFLOW_SOURCES.map(src => (
            <div key={src.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', cursor: 'default' }}>
              <span style={{ fontSize: '18px' }}>{src.icon}</span>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>{src.label}</div>
                <div style={{ fontSize: '16px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: src.color }}>{src.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 28px', display: 'flex', flexShrink: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px', background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #7C3AED' : '2px solid transparent',
              color: activeTab === tab.id ? '#7C3AED' : '#64748B',
              fontSize: '13px', fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span style={{ background: '#DC2626', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '10px', fontWeight: 700, fontFamily: 'Cabin, sans-serif' }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Email list */}
        <div style={{ width: '380px', flexShrink: 0, borderRight: '1px solid #E2E8F0', background: '#fff', overflowY: 'auto' }}>
          {activeTab === 'inbound' && (
            replyEmails.length === 0 ? (
              <EmptyState message="No inbound submissions yet" />
            ) : (
              replyEmails.map(email => (
                <div
                  key={email.id}
                  onClick={() => { setSelectedEmail(email); onMarkReplyRead(email.id) }}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    background: selectedEmail && 'id' in selectedEmail && selectedEmail.id === email.id ? '#FAFAFF' : '#fff',
                    borderLeft: email.isUnread ? '3px solid #7C3AED' : '3px solid transparent',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!(selectedEmail && 'id' in selectedEmail && selectedEmail.id === email.id)) (e.currentTarget as HTMLElement).style.background = '#FAFAFA' }}
                  onMouseLeave={e => { if (!(selectedEmail && 'id' in selectedEmail && selectedEmail.id === email.id)) (e.currentTarget as HTMLElement).style.background = '#fff' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: email.isUnread ? 700 : 600, color: '#1E293B' }}>{email.senderName}</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{email.time}</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: email.isUnread ? 600 : 400, color: '#475569', marginBottom: '4px' }}>{email.subject}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.body.slice(0, 80)}…
                  </div>
                  {email.isUnread && (
                    <div style={{ marginTop: '6px' }}>
                      <span style={{ fontSize: '10px', background: '#EDE9FE', color: '#7C3AED', borderRadius: '3px', padding: '2px 6px', fontWeight: 700 }}>NEW</span>
                    </div>
                  )}
                </div>
              ))
            )
          )}

          {activeTab === 'sent' && (
            sentEmails.length === 0 ? (
              <EmptyState message="No dispatched messages yet" />
            ) : (
              sentEmails.map(email => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    background: selectedEmail && 'id' in selectedEmail && selectedEmail.id === email.id ? '#FAFAFF' : '#fff',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFAFA'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>To: {email.toName}</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{email.time}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>{email.subject}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.body.slice(0, 80)}…
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', background: '#F0FDF4', color: '#16A34A', borderRadius: '3px', padding: '2px 6px', fontWeight: 700 }}>SENT</span>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'workflow' && (
            <WorkflowItems replyEmails={replyEmails} sentEmails={sentEmails} />
          )}
        </div>

        {/* Reading pane */}
        <div style={{ flex: 1, background: '#fff', overflowY: 'auto', padding: '28px 32px' }}>
          {selectedEmail ? (
            <EmailReadingPane email={selectedEmail} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', gap: '12px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <span style={{ fontSize: '14px' }}>Select a message to read</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WorkflowItems({ replyEmails, sentEmails }: { replyEmails: ReplyEmail[]; sentEmails: SentEmail[] }) {
  const wfItems = [
    ...sentEmails.map(e => ({ id: e.id, title: e.subject, subtitle: `To: ${e.toName} · ${e.time}`, status: 'Submitted', color: '#7C3AED', bg: '#EDE9FE' })),
    ...replyEmails.map(e => ({ id: e.id, title: e.subject, subtitle: `From: ${e.senderName} · ${e.time}`, status: e.isUnread ? 'Pending Review' : 'Completed', color: e.isUnread ? '#D97706' : '#16A34A', bg: e.isUnread ? '#FFFBEB' : '#F0FDF4' })),
  ]
  if (wfItems.length === 0) return <EmptyState message="No workflow items yet" />
  return (
    <>
      {wfItems.map(item => (
        <div key={item.id} style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', flex: 1, marginRight: '8px' }}>{item.title}</span>
            <span style={{ fontSize: '10px', background: item.bg, color: item.color, borderRadius: '3px', padding: '2px 8px', fontWeight: 700, flexShrink: 0 }}>{item.status}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{item.subtitle}</div>
        </div>
      ))}
    </>
  )
}

function EmailReadingPane({ email }: { email: ReplyEmail | SentEmail }) {
  const isReply = 'senderEmail' in email
  const from = isReply ? `${email.senderName} <${(email as ReplyEmail).senderEmail}>` : `r.thothadri.iyengar <r.thothadri.iyengar@accenture.com>`
  const to = isReply ? 'r.thothadri.iyengar@accenture.com' : `${(email as SentEmail).toName} <${(email as SentEmail).toEmail}>`

  return (
    <div>
      <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
        <h2 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1E293B', marginBottom: '16px', lineHeight: 1.3 }}>
          {email.subject}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: '13px' }}>
          <span style={{ color: '#94A3B8', fontWeight: 600 }}>From</span>
          <span style={{ color: '#1E293B' }}>{from}</span>
          <span style={{ color: '#94A3B8', fontWeight: 600 }}>To</span>
          <span style={{ color: '#1E293B' }}>{to}</span>
          <span style={{ color: '#94A3B8', fontWeight: 600 }}>Date</span>
          <span style={{ color: '#1E293B' }}>{email.time}</span>
        </div>
      </div>

      {isReply && (email as ReplyEmail).attachmentName && (
        <div style={{ marginBottom: '20px', background: '#FAFAFF', border: '1px solid #EDE9FE', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
          </svg>
          <span style={{ fontSize: '13px', color: '#7C3AED', fontWeight: 600 }}>{(email as ReplyEmail).attachmentName}</span>
          <span style={{ fontSize: '11px', background: '#EDE9FE', color: '#7C3AED', borderRadius: '3px', padding: '2px 8px', fontWeight: 700 }}>Attachment</span>
        </div>
      )}

      <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.75', whiteSpace: 'pre-wrap', fontFamily: 'Lato, sans-serif' }}>
        {email.body}
      </div>
    </div>
  )
}
