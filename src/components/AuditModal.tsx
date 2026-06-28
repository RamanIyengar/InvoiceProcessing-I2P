import { useState } from 'react'
import { AuditEntry, Invoice } from '../types'

interface Props {
  invoice: Invoice
  onClose: () => void
  decision: string | null
}

type ActorFilter = 'All' | 'Agent' | 'Human'

function getNow(): string {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

function buildHumanApprovalEntry(invoice: Invoice): AuditEntry {
  return {
    id: 'human-approval',
    timestamp: getNow(),
    actorType: 'Human',
    actorName: 'Bertelsmann AP Analyst',
    action: 'Invoice approved',
    result: `Invoice ${invoice.invoiceNumber} approved for payment. Amount: ${invoice.amount.toLocaleString()} ${invoice.currency}`,
    evidence: 'Approved via SAP S/4HANA VIM',
  }
}

function buildHumanRejectionEntry(invoice: Invoice): AuditEntry {
  return {
    id: 'human-rejection',
    timestamp: getNow(),
    actorType: 'Human',
    actorName: 'Bertelsmann AP Analyst',
    action: 'Invoice rejected',
    result: `Invoice ${invoice.invoiceNumber} rejected. Amount: ${invoice.amount.toLocaleString()} ${invoice.currency}`,
    evidence: 'Rejected via SAP S/4HANA VIM',
  }
}

function buildHumanInfoEntry(invoice: Invoice): AuditEntry {
  return {
    id: 'human-info',
    timestamp: getNow(),
    actorType: 'Human',
    actorName: 'Bertelsmann AP Analyst',
    action: 'More information requested',
    result: `Additional information requested for invoice ${invoice.invoiceNumber}`,
    evidence: 'Request sent via SAP S/4HANA VIM',
  }
}

export function AuditModal({ invoice, onClose, decision }: Props) {
  const [filter, setFilter] = useState<ActorFilter>('All')

  const allEntries: AuditEntry[] = [...invoice.auditTrail]

  if (decision === 'approved') allEntries.push(buildHumanApprovalEntry(invoice))
  else if (decision === 'rejected') allEntries.push(buildHumanRejectionEntry(invoice))
  else if (decision === 'info-requested') allEntries.push(buildHumanInfoEntry(invoice))

  const filtered =
    filter === 'All' ? allEntries : allEntries.filter((e) => e.actorType === filter)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--now-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'white',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontFamily: 'Cabin, sans-serif',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--now-text)',
                }}
              >
                Audit Trail
              </span>
              <span
                style={{
                  background: 'var(--now-primary-light)',
                  color: 'var(--now-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '3px',
                  fontFamily: 'Lato, sans-serif',
                }}
              >
                {invoice.invoiceNumber}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: 'var(--now-text-secondary)',
              lineHeight: '1',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Filter row */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid var(--now-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--now-bg)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--now-text-secondary)', marginRight: '4px' }}>
            Filter:
          </span>
          {(['All', 'Agent', 'Human'] as ActorFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'var(--now-primary)' : 'white',
                color: filter === f ? 'white' : 'var(--now-text)',
                border: `1px solid ${filter === f ? 'var(--now-primary)' : 'var(--now-border)'}`,
                borderRadius: '12px',
                padding: '3px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Lato, sans-serif',
              }}
            >
              {f}
              <span
                style={{
                  marginLeft: '4px',
                  background: filter === f ? 'rgba(255,255,255,0.25)' : 'var(--now-bg)',
                  padding: '0 4px',
                  borderRadius: '8px',
                  fontSize: '10px',
                }}
              >
                {f === 'All'
                  ? allEntries.length
                  : allEntries.filter((e) => e.actorType === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Timeline entries */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
          {filtered.map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                gap: '14px',
                paddingTop: '12px',
                paddingBottom: '4px',
                position: 'relative',
              }}
            >
              {/* Timeline line */}
              {idx < filtered.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '60px',
                    top: '28px',
                    bottom: '-4px',
                    width: '2px',
                    background: '#e4e6e7',
                  }}
                />
              )}

              {/* Left side: timestamp + badge */}
              <div
                style={{
                  width: '72px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--now-text-secondary)',
                    fontFamily: 'Lato, sans-serif',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {entry.timestamp}
                </span>
                <span
                  style={{
                    background:
                      entry.actorType === 'Agent' ? 'var(--now-primary-light)' : 'var(--now-success-bg)',
                    color: entry.actorType === 'Agent' ? 'var(--now-primary)' : 'var(--now-success)',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: 'Lato, sans-serif',
                  }}
                >
                  {entry.actorType}
                </span>
              </div>

              {/* Timeline dot */}
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background:
                    entry.actorType === 'Agent' ? 'var(--now-primary)' : 'var(--now-success)',
                  flexShrink: 0,
                  marginTop: '2px',
                  zIndex: 1,
                }}
              />

              {/* Right side: content */}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: '8px' }}>
                <div
                  style={{
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--now-text)',
                    marginBottom: '2px',
                  }}
                >
                  {entry.actorName}
                </div>
                <div
                  style={{
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '12px',
                    color: 'var(--now-text-secondary)',
                    marginBottom: '2px',
                  }}
                >
                  {entry.action}
                </div>
                <div
                  style={{
                    fontFamily: 'Lato, sans-serif',
                    fontSize: '12px',
                    color: 'var(--now-text)',
                    marginBottom: entry.evidence ? '2px' : '0',
                  }}
                >
                  {entry.result}
                </div>
                {entry.evidence && (
                  <div
                    style={{
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '11px',
                      color: 'var(--now-text-disabled)',
                      fontStyle: 'italic',
                    }}
                  >
                    {entry.evidence}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--now-border)',
            background: 'var(--now-bg)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: 'var(--now-text-disabled)',
              fontFamily: 'Lato, sans-serif',
              fontStyle: 'italic',
            }}
          >
            Generated by S/4 Data Hub
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--now-text-disabled)',
              fontFamily: 'Lato, sans-serif',
            }}
          >
            {allEntries.length} entries
          </span>
        </div>
      </div>
    </div>
  )
}
