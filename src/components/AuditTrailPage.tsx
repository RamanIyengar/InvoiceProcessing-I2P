import { useState } from 'react'
import { mockInvoices } from '../data/mockData'
import { ActorType, Invoice } from '../types'

function ActorBadge({ type }: { type: ActorType }) {
  const isAgent = type === 'Agent'
  return (
    <span
      style={{
        background: isAgent ? '#e7ecf5' : '#e8f5ee',
        color: isAgent ? '#1a3a6b' : '#1b823f',
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: '4px',
        fontFamily: 'Lato, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      {type}
    </span>
  )
}

function CategoryBadge({ category }: { category: Invoice['category'] }) {
  const map: Record<string, { bg: string; color: string }> = {
    PO: { bg: '#e7ecf5', color: '#1a3a6b' },
    'Non-PO': { bg: '#fff3d6', color: '#b06b00' },
    'ECC Legacy': { bg: '#e8f5ee', color: '#1b823f' },
  }
  const style = map[category] ?? { bg: '#f0f1f1', color: '#6b767b' }
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '4px',
        fontFamily: 'Lato, sans-serif',
      }}
    >
      {category}
    </span>
  )
}

export function AuditTrailPage() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<'All' | ActorType>('All')

  const toggleInvoice = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff' }}>
      <div style={{ padding: '28px 32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontFamily: 'Cabin, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: '#1d2f36',
              marginBottom: '6px',
            }}
          >
            Audit Trail
          </h1>
          <p style={{ fontSize: '15px', color: '#6b767b' }}>
            Immutable log of all agent and human actions, grouped by invoice.
            Powered by S/4 Data Hub.
          </p>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
          {(['All', 'Agent', 'Human'] as Array<'All' | ActorType>).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: filterType === f ? '1px solid #1a3a6b' : '1px solid #e4e6e7',
                background: filterType === f ? '#1a3a6b' : '#fff',
                color: filterType === f ? '#fff' : '#1d2f36',
                fontSize: '14px',
                fontFamily: 'Lato, sans-serif',
                fontWeight: filterType === f ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#6b767b' }}>
            {mockInvoices.length} invoices
          </span>
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mockInvoices.map((invoice) => {
            const filteredEntries =
              filterType === 'All'
                ? invoice.auditTrail
                : invoice.auditTrail.filter((e) => e.actorType === filterType)
            const isOpen = openIds.has(invoice.id)

            return (
              <div
                key={invoice.id}
                style={{
                  border: '1px solid #e4e6e7',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                {/* Accordion header */}
                <button
                  onClick={() => toggleInvoice(invoice.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 20px',
                    background: isOpen ? '#f6f7f7' : '#fff',
                    border: 'none',
                    borderBottom: isOpen ? '1px solid #e4e6e7' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Chevron */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: '#6b767b',
                    }}
                  >
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>

                  {/* Invoice number */}
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#1a3a6b',
                      flexShrink: 0,
                    }}
                  >
                    {invoice.invoiceNumber}
                  </span>

                  {/* Supplier */}
                  <span
                    style={{
                      fontSize: '15px',
                      fontFamily: 'Lato, sans-serif',
                      color: '#1d2f36',
                      fontWeight: 600,
                    }}
                  >
                    {invoice.supplier}
                  </span>

                  <CategoryBadge category={invoice.category} />

                  <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', flexShrink: 0 }}>
                    {filteredEntries.length} {filterType === 'All' ? '' : filterType.toLowerCase() + ' '}entr{filteredEntries.length === 1 ? 'y' : 'ies'}
                  </span>
                </button>

                {/* Expanded entries */}
                {isOpen && (
                  <div style={{ padding: '16px 20px 8px 20px' }}>
                    {filteredEntries.length === 0 ? (
                      <p style={{ fontSize: '14px', color: '#6b767b', fontStyle: 'italic', padding: '8px 0' }}>
                        No {filterType.toLowerCase()} entries for this invoice.
                      </p>
                    ) : (
                      <div style={{ position: 'relative', paddingLeft: '28px' }}>
                        {/* Vertical timeline line */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '7px',
                            top: '8px',
                            bottom: '8px',
                            width: '2px',
                            background: '#e4e6e7',
                            borderRadius: '1px',
                          }}
                        />

                        {filteredEntries.map((entry, idx) => (
                          <div
                            key={entry.id}
                            style={{
                              position: 'relative',
                              marginBottom: idx < filteredEntries.length - 1 ? '20px' : '8px',
                            }}
                          >
                            {/* Timeline dot */}
                            <div
                              style={{
                                position: 'absolute',
                                left: '-24px',
                                top: '3px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: entry.actorType === 'Agent' ? '#1a3a6b' : '#1b823f',
                                border: '2px solid #fff',
                                boxShadow: '0 0 0 1px ' + (entry.actorType === 'Agent' ? '#1a3a6b' : '#1b823f'),
                              }}
                            />

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', paddingTop: '2px', flexShrink: 0, minWidth: '80px' }}>
                                {entry.timestamp}
                              </span>
                              <ActorBadge type={entry.actorType} />
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>
                                {entry.actorName}
                              </span>
                            </div>

                            <div style={{ marginTop: '4px', paddingLeft: '0' }}>
                              <div style={{ fontSize: '14px', color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>
                                {entry.action}
                              </div>
                              <div style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif', marginTop: '2px' }}>
                                {entry.result}
                              </div>
                              {entry.evidence && (
                                <div style={{ fontSize: '12px', color: '#c8cccf', fontStyle: 'italic', marginTop: '2px' }}>
                                  {entry.evidence}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p style={{ marginTop: '20px', fontSize: '13px', color: '#c8cccf', textAlign: 'center' }}>
          S/4 Data Hub · Immutable audit log
        </p>
      </div>
    </div>
  )
}
