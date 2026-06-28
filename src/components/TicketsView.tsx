import { useState, useEffect, useRef } from 'react'
import { Invoice } from '../types'
import { mockInvoices } from '../data/mockData'

interface Props {
  onSelectInvoice: (invoice: Invoice) => void
  replyEmails: any[]
  onMarkReplyRead: (id: string) => void
  processedIds?: Set<string>
  rejectedInvoiceIds?: Set<string>
  straightPassInvoiceIds?: Set<string>
  metroApprovedIds?: Set<string>
}

interface TicketRow {
  docNumber: string
  invoice: Invoice
  status: string
  priority: 'High' | 'Medium' | 'Low'
  confidence: 'Ready to Proceed' | 'Review Recommended' | 'Needs Attention'
  assignedTo: string
  sla: string
  lastUpdated: string
}

const TICKET_META = [
  { docNumber: '5100000248', invoiceId: 'inv-1', status: 'In Process', priority: 'Medium' as const, confidence: 'Ready to Proceed' as const, assignedTo: 'Lena Fischer', sla: '38h 12m', lastUpdated: '09:14 today' },
  { docNumber: '5100000249', invoiceId: 'inv-2', status: 'Exception', priority: 'High' as const, confidence: 'Needs Attention' as const, assignedTo: 'Lena Fischer', sla: '6h 45m', lastUpdated: '08:41 today' },
  { docNumber: '5100000250', invoiceId: 'inv-3', status: 'Exception', priority: 'High' as const, confidence: 'Needs Attention' as const, assignedTo: 'Michael Torres', sla: '2h 10m', lastUpdated: '07:55 today' },
  { docNumber: '5100000251', invoiceId: 'inv-4', status: 'Exception', priority: 'Medium' as const, confidence: 'Review Recommended' as const, assignedTo: 'Lena Fischer', sla: '14h 30m', lastUpdated: '10:02 today' },
  { docNumber: '5100000252', invoiceId: 'inv-5', status: 'Exception', priority: 'High' as const, confidence: 'Needs Attention' as const, assignedTo: 'Lena Fischer', sla: '22h 05m', lastUpdated: '11:30 today' },
  { docNumber: '5100000253', invoiceId: 'inv-6', status: 'Exception', priority: 'High' as const, confidence: 'Needs Attention' as const, assignedTo: 'Anja Krüger', sla: '8h 20m', lastUpdated: '13:05 today' },
  { docNumber: '5100000254', invoiceId: 'inv-9', status: 'In Process', priority: 'High' as const, confidence: 'Review Recommended' as const, assignedTo: 'Michael Torres', sla: '4h 00m', lastUpdated: '08:45 today' },
  { docNumber: '5100000255', invoiceId: 'inv-7', status: 'In Process', priority: 'Low' as const, confidence: 'Ready to Proceed' as const, assignedTo: 'Lena Fischer', sla: '44h 00m', lastUpdated: '08:20 today' },
  { docNumber: '5100000256', invoiceId: 'inv-8', status: 'In Process', priority: 'Low' as const, confidence: 'Ready to Proceed' as const, assignedTo: 'Markus Weber', sla: '44h 00m', lastUpdated: '14:15 today' },
  { docNumber: '5100000257', invoiceId: 'inv-10', status: 'Exception', priority: 'High' as const, confidence: 'Needs Attention' as const, assignedTo: 'Lena Fischer', sla: '3h 45m', lastUpdated: '09:15 today' },
  { docNumber: '5100000258', invoiceId: 'inv-11', status: 'Exception', priority: 'High' as const, confidence: 'Needs Attention' as const, assignedTo: 'Lena Fischer', sla: '2h 30m', lastUpdated: '10:30 today' },
  { docNumber: '5100000259', invoiceId: 'inv-12', status: 'Exception', priority: 'High' as const, confidence: 'Needs Attention' as const, assignedTo: 'Pieter Janssen', sla: '4h 18m', lastUpdated: '12:10 today' },
  { docNumber: '5100000260', invoiceId: 'inv-13', status: 'Exception', priority: 'High' as const, confidence: 'Needs Attention' as const, assignedTo: 'Claire Newton', sla: '4h 20m', lastUpdated: '14:20 today' },
  { docNumber: '5100000261', invoiceId: 'inv-14', status: 'In Process', priority: 'Medium' as const, confidence: 'Ready to Proceed' as const, assignedTo: 'Lena Fischer', sla: '36h 40m', lastUpdated: '09:40 today' },
]

const tickets: TicketRow[] = TICKET_META.map(meta => {
  const invoice = mockInvoices.find(inv => inv.id === meta.invoiceId)!
  return { ...meta, invoice }
}).filter(t => t.invoice != null)

function formatAmount(amount: number, currency: string): string {
  return `${currency === 'USD' ? '$' : currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}


function getCategoryChipStyle(category: string): React.CSSProperties {
  if (category === 'PO') return { background: '#e7ecf5', color: '#1a3a6b' }
  if (category === 'Non-PO') return { background: '#fef3e2', color: '#b06b00' }
  return { background: '#e8f5ee', color: '#1b823f' }
}

function getStatusChipStyle(status: string): React.CSSProperties {
  if (status === 'Exception') return { background: '#fde8e8', color: '#b91f1f' }
  if (status === 'In Process') return { background: '#e7ecf5', color: '#1a3a6b' }
  if (status === 'Approved' || status === 'Posted') return { background: '#e8f5ee', color: '#1b823f' }
  return { background: '#f0f1f1', color: '#6b767b' }
}

function getPriorityDotColor(priority: string): string {
  if (priority === 'High') return '#b91f1f'
  if (priority === 'Medium') return '#b06b00'
  return '#1b823f'
}


function getSlaColor(sla: string): string {
  const hours = parseFloat(sla)
  if (hours < 8) return '#b91f1f'
  if (hours < 24) return '#b06b00'
  return '#1b823f'
}

export function TicketsView({ onSelectInvoice, replyEmails: _replyEmails, onMarkReplyRead: _onMarkReplyRead, processedIds, rejectedInvoiceIds, straightPassInvoiceIds, metroApprovedIds }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [huddleTicket, setHuddleTicket] = useState<TicketRow | null>(null)
  const [classifiedIds, setClassifiedIds] = useState<Set<string>>(new Set())

  const filtered = tickets.filter(t => {
    const q = searchQuery.toLowerCase()
    if (q && !t.docNumber.toLowerCase().includes(q) && !t.invoice.invoiceNumber.toLowerCase().includes(q) && !t.invoice.supplier.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f6f7f7' }}>
      {/* Page header */}
      <div style={{ background: 'white', padding: '16px 28px', borderBottom: '1px solid #e4e6e7', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#89919a' }}>SAP S/4HANA · OpenText VIM /</span>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 600, color: '#32363a' }}>VIM Invoice Worklist</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '22px', fontWeight: 700, color: '#1d2f36', margin: 0 }}>
                VIM Invoice Worklist
              </h1>
              <span style={{ background: '#f0f1f1', color: '#6b767b', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontFamily: 'Lato, sans-serif', fontWeight: 700 }}>
                {filtered.length}
              </span>
              <span style={{ background: '#fde8e8', color: '#b91f1f', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontFamily: 'Lato, sans-serif', fontWeight: 700 }}>
                {filtered.filter(t => t.status === 'Exception').length} exceptions
              </span>
            </div>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#89919a', margin: '4px 0 0' }}>
              BERT_PRD · Company Code 1000 · AP Automation · Email Capture → VIM → AP Workflow
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              style={{
                background: 'white',
                border: '1px solid #c8cccf',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '13px',
                fontFamily: 'Lato, sans-serif',
                cursor: 'pointer',
                color: '#1d2f36',
              }}
            >
              ↻ Refresh
            </button>
            <button
              style={{
                background: '#0070B1',
                border: '1px solid #0070B1',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '13px',
                fontFamily: 'Cabin, sans-serif',
                fontWeight: 600,
                cursor: 'pointer',
                color: 'white',
              }}
            >
              Create Document
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          background: 'white',
          padding: '12px 28px',
          borderBottom: '1px solid #e4e6e7',
          flexShrink: 0,
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          placeholder="Search VIM doc #, invoice number, vendor..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            maxWidth: '360px',
            border: '1px solid #e4e6e7',
            borderRadius: '6px',
            padding: '7px 12px',
            fontSize: '13px',
            fontFamily: 'Lato, sans-serif',
            outline: 'none',
            color: '#1d2f36',
          }}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button style={{ background: 'white', border: '1px solid #c8cccf', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontFamily: 'Lato, sans-serif', color: '#6b767b', cursor: 'default' }}>
            ⊞ Filter
          </button>
          <span style={{ fontSize: '13px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>Sort: Received ↓</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr>
              {['#', 'VIM Doc #', 'Invoice #', 'Vendor', 'Category', 'Amount', 'Received', 'Status', 'Priority', 'SLA', 'Action'].map(col => (
                <th
                  key={col}
                  style={{
                    position: 'sticky',
                    top: 0,
                    background: '#f6f7f7',
                    zIndex: 10,
                    padding: '10px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#6b767b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    textAlign: col === 'Amount' ? 'right' : 'left',
                    borderBottom: '2px solid #e4e6e7',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Lato, sans-serif',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((ticket, idx) => (
              <TicketTableRow
                key={ticket.docNumber}
                ticket={ticket}
                index={idx + 1}
                onOpen={() => setHuddleTicket(ticket)}
                isClassified={classifiedIds.has(ticket.invoice.id) || (processedIds?.has(ticket.invoice.id) ?? false)}
                isRejected={rejectedInvoiceIds?.has(ticket.invoice.id) ?? false}
                isStraightPass={straightPassInvoiceIds?.has(ticket.invoice.id) ?? false}
                isMetroApproved={metroApprovedIds?.has(ticket.invoice.id) ?? false}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b767b', fontFamily: 'Lato, sans-serif', fontSize: '14px' }}>
            No tickets match your filters.
          </div>
        )}
      </div>

      {/* Agentic Huddle Modal */}
      {huddleTicket && (
        <AgenticHuddleModal
          ticket={huddleTicket}
          isAlreadyClassified={classifiedIds.has(huddleTicket.invoice.id) || (processedIds?.has(huddleTicket.invoice.id) ?? false)}
          onClassified={() => setClassifiedIds(prev => new Set([...prev, huddleTicket.invoice.id]))}
          onProceed={() => {
            setClassifiedIds(prev => new Set([...prev, huddleTicket.invoice.id]))
            setHuddleTicket(null)
            onSelectInvoice(huddleTicket.invoice)
          }}
          onClose={() => setHuddleTicket(null)}
        />
      )}
    </div>
  )
}

function TicketTableRow({ ticket, index, onOpen, isClassified, isRejected, isStraightPass, isMetroApproved }: { ticket: TicketRow; index: number; onOpen: () => void; isClassified: boolean; isRejected?: boolean; isStraightPass?: boolean; isMetroApproved?: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <tr
      style={{
        cursor: 'pointer',
        background: hovered ? '#f0f7ff' : 'white',
        transition: 'background 0.15s',
        borderBottom: '1px solid #f0f1f1',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif' }}>{index}</td>
      <td style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'monospace', color: '#0070B1', fontWeight: 600, whiteSpace: 'nowrap' }}>{ticket.docNumber}</td>
      <td style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'monospace', color: '#1d2f36', whiteSpace: 'nowrap' }}>{ticket.invoice.invoiceNumber}</td>
      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1d2f36', fontFamily: 'Lato, sans-serif', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.invoice.supplier}</td>
      <td style={{ padding: '10px 12px' }}>
        {isClassified && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'Lato, sans-serif',
              ...getCategoryChipStyle(ticket.invoice.category),
            }}
          >
            {ticket.invoice.category}
          </span>
        )}
      </td>
      <td style={{ padding: '10px 20px 10px 12px', fontSize: '13px', fontWeight: 600, textAlign: 'right', color: isStraightPass ? '#1b823f' : '#1d2f36', fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap' }}>
        {isStraightPass ? '€53,500.00' : formatAmount(ticket.invoice.amount, ticket.invoice.currency)}
        {isStraightPass && <div style={{ fontSize: '10px', fontWeight: 400, color: '#6b767b', marginTop: '1px' }}>LM-2026-04781-R1</div>}
      </td>
      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b767b', fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap' }}>
        {ticket.invoice.receivedAt} &middot; {ticket.invoice.emailTime}
      </td>
      <td style={{ padding: '10px 12px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '4px',
            fontFamily: 'Lato, sans-serif',
            whiteSpace: 'nowrap',
            ...(isMetroApproved ? { background: '#e8f5ee', color: '#1b823f' } : isStraightPass ? { background: '#e8f5ee', color: '#1b823f' } : isRejected ? { background: '#fde8e8', color: '#b91f1f' } : getStatusChipStyle(ticket.status)),
          }}
        >
          {isMetroApproved ? 'Posted' : isStraightPass ? 'Posted' : isRejected ? 'Rejected' : ticket.status}
        </span>
      </td>
      <td style={{ padding: '10px 12px' }}>
        {isClassified && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getPriorityDotColor(ticket.priority), flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#1d2f36', fontFamily: 'Lato, sans-serif' }}>{ticket.priority}</span>
          </div>
        )}
      </td>
      <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: getSlaColor(ticket.sla), whiteSpace: 'nowrap' }}>
        {ticket.sla}
      </td>
      <td style={{ padding: '10px 12px' }}>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onOpen() }}
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid #1a3a6b',
            background: 'white',
            color: '#1a3a6b',
            cursor: 'pointer',
            fontFamily: 'Lato, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          Open →
        </button>
      </td>
    </tr>
  )
}

function AgenticHuddleModal({ ticket, isAlreadyClassified, onClassified, onProceed, onClose }: { ticket: TicketRow; isAlreadyClassified: boolean; onClassified: () => void; onProceed: () => void; onClose: () => void }) {
  const [completedStages, setCompletedStages] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const invoice = ticket.invoice

  const stages = [
    { label: 'Email Capture: scanning AP mailbox (BERT_AP@bertelsmann.de)', completion: `Email from ${invoice.emailSenderEmail} detected · ingested at ${invoice.emailTime}` },
    { label: 'SAP Document Capture: OCR scan & PDF validation', completion: `Attachment validated — ${invoice.attachmentName}` },
    { label: 'Registering VIM document in SAP S/4HANA', completion: `VIM Doc ${ticket.docNumber} created · BERT_PRD · Co. Code 1000` },
    { label: 'Classifying document type (LIV / Non-PO / ECC Legacy)', completion: `Classified as ${invoice.category} invoice · AI confidence 97.4%` },
    { label: 'Extracting header & line item data from document', completion: '12 invoice fields queued for AI extraction' },
    { label: 'Initiating AP Workflow validation pipeline', completion: `5-stage validation pipeline configured · priority set to ${ticket.priority}` },
  ]

  useEffect(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setCompletedStages(0)

    stages.forEach((_, idx) => {
      const t = setTimeout(() => {
        setCompletedStages(idx + 1)
      }, (idx + 1) * 1200)
      timersRef.current.push(t)
    })

    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.docNumber])

  const allDone = completedStages >= stages.length

  useEffect(() => {
    if (allDone) onClassified()
  }, [allDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const categoryRevealed = isAlreadyClassified || completedStages > 3
  const priorityRevealed = isAlreadyClassified || completedStages >= 6

  const metaItems: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: 'Category',
      value: categoryRevealed ? (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            fontFamily: 'Lato, sans-serif',
            ...getCategoryChipStyle(invoice.category),
          }}
        >
          {invoice.category}
        </span>
      ) : (
        <span style={{ fontSize: '11px', color: '#c8cccf', fontStyle: 'italic', fontFamily: 'Lato, sans-serif' }}>Pending</span>
      ),
    },
    { label: 'Amount', value: formatAmount(invoice.amount, invoice.currency) },
    { label: 'Received', value: `${invoice.receivedAt} · ${invoice.emailTime}` },
    { label: 'Source', value: 'Email Capture · BERT_AP@bertelsmann.de' },
    { label: 'Attachment', value: invoice.attachmentName },
    {
      label: 'Priority',
      value: priorityRevealed ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: getPriorityDotColor(ticket.priority), display: 'inline-block' }} />
          {ticket.priority}
        </span>
      ) : (
        <span style={{ fontSize: '11px', color: '#c8cccf', fontStyle: 'italic', fontFamily: 'Lato, sans-serif' }}>Pending</span>
      ),
    },
    { label: 'Assigned To', value: ticket.assignedTo },
    { label: 'SLA', value: <span style={{ color: getSlaColor(ticket.sla), fontWeight: 700, fontFamily: 'monospace' }}>{ticket.sla}</span> },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '900px',
          maxWidth: 'calc(100vw - 48px)',
          height: '560px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Left panel */}
        <div
          style={{
            width: '340px',
            flexShrink: 0,
            background: '#f6f7f7',
            borderRight: '1px solid #e4e6e7',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'Lato, sans-serif' }}>VIM Document</span>
            <span style={{ fontFamily: 'monospace', fontSize: '16px', color: '#0070B1', fontWeight: 700 }}>{ticket.docNumber}</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '22px', color: '#1d2f36', fontWeight: 700, marginTop: '4px' }}>{invoice.invoiceNumber}</div>
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#6b767b', marginBottom: '16px' }}>{invoice.supplier}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            {metaItems.map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#6b767b', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Lato, sans-serif', marginBottom: '2px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '13px', color: '#1d2f36', fontFamily: 'Lato, sans-serif', fontWeight: 500, wordBreak: 'break-word' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right panel */}
        <div style={{ flex: 1, padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '28px 28px 16px', borderBottom: '1px solid #e4e6e7', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1d2f36' }}>
              Agentic Processing Trace
            </span>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: allDone ? '#1b823f' : '#1a3a6b',
                boxShadow: allDone ? 'none' : '0 0 0 3px rgba(26,58,107,0.25)',
              }}
            />
            <span style={{ fontSize: '12px', color: allDone ? '#1b823f' : '#1a3a6b', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>
              {allDone ? 'VIM document ready' : 'Processing...'}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
            {stages.map((stage, idx) => {
              const isDone = idx < completedStages
              const isCurrent = idx === completedStages

              return (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isDone ? '#1b823f' : isCurrent ? '#1a3a6b' : '#e4e6e7',
                      transition: 'all 0.3s',
                    }}
                  >
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : isCurrent ? (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'white',
                          animation: 'pulse 1s infinite',
                        }}
                      />
                    ) : (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c8cccf' }} />
                    )}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    {isDone ? (
                      <span style={{ fontSize: '13px', color: '#1d2f36', fontWeight: 500, fontFamily: 'Lato, sans-serif' }}>
                        {stage.completion}
                      </span>
                    ) : isCurrent ? (
                      <span style={{ fontSize: '13px', color: '#6b767b', fontStyle: 'italic', fontFamily: 'Lato, sans-serif' }}>
                        {stage.label} — Processing...
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#c8cccf', fontFamily: 'Lato, sans-serif' }}>
                        {stage.label}
                      </span>
                    )}
                  </div>

                  {isDone && (
                    <span style={{ fontSize: '11px', color: '#6b767b', fontFamily: 'monospace', flexShrink: 0 }}>
                      {(1.2 + idx * 0.4).toFixed(1)}s
                    </span>
                  )}
                </div>
              )
            })}

            {allDone && (
              <div
                style={{
                  background: '#e8f5ee',
                  border: '1px solid #1b823f',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '8px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" fill="#1b823f" />
                  <path d="M5 9l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: '13px', color: '#1b823f', fontWeight: 600, fontFamily: 'Lato, sans-serif' }}>
                  VIM document registered — AI agents initiated — ready for AP Workflow validation
                </span>
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div
            style={{
              borderTop: '1px solid #e4e6e7',
              padding: '16px 28px',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: 'white',
                border: '1px solid #c8cccf',
                borderRadius: '6px',
                padding: '9px 18px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Lato, sans-serif',
                color: '#1d2f36',
              }}
            >
              Close
            </button>
            <button
              onClick={() => { if (allDone) onProceed() }}
              disabled={!allDone}
              style={{
                background: allDone ? '#1b823f' : '#c8cccf',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 24px',
                fontSize: '15px',
                fontFamily: 'Cabin, sans-serif',
                fontWeight: 700,
                cursor: allDone ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              Open in SAP VIM →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
