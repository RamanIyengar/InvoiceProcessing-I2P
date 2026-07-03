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

type I2PStatus = 'Captured' | 'Ready-To-Approve' | 'Need-Attention' | 'Approved' | 'Rejected' | 'Uploaded'

interface DocRow {
  urn: string
  documentId: string
  invoice: Invoice
  tags: string[]
  ageing: string
  noErrors: number
  queueName: string
  status: I2PStatus
  currentOwner: string
  priority: 'High' | 'Medium' | 'Low'
  sla: string
}

const DOC_META: Array<{
  urn: string
  documentId: string
  invoiceId: string
  tags: string[]
  ageing: string
  noErrors: number
  queueName: string
  status: I2PStatus
  currentOwner: string
  priority: 'High' | 'Medium' | 'Low'
  sla: string
}> = [
  { urn: 'S0000481', documentId: '709', invoiceId: 'inv-1',  tags: [],            ageing: '1541:52', noErrors: 0, queueName: 'Fremantle Germany', status: 'Ready-To-Approve', currentOwner: 'r.thothadri.iyengar', priority: 'Medium', sla: '38h 12m' },
  { urn: 'S0000535', documentId: '724', invoiceId: 'inv-2',  tags: ['Missing GR'], ageing: '1563:51', noErrors: 1, queueName: 'Fremantle Germany', status: 'Need-Attention',   currentOwner: 'r.thothadri.iyengar', priority: 'High',   sla: '6h 45m' },
  { urn: 'S0000567', documentId: '785', invoiceId: 'inv-3',  tags: ['Duplicate'],  ageing: '1757:05', noErrors: 1, queueName: 'All',                status: 'Need-Attention',   currentOwner: 'm.torres.ap',         priority: 'High',   sla: '2h 10m' },
  { urn: 'S0000566', documentId: '786', invoiceId: 'inv-4',  tags: [],            ageing: '1758:50', noErrors: 0, queueName: 'Arvato Connect',      status: 'Need-Attention',   currentOwner: 'r.thothadri.iyengar', priority: 'Medium', sla: '14h 30m' },
  { urn: 'S0000565', documentId: '787', invoiceId: 'inv-5',  tags: [],            ageing: '1953:45', noErrors: 1, queueName: 'All',                status: 'Need-Attention',   currentOwner: 'r.thothadri.iyengar', priority: 'High',   sla: '22h 05m' },
  { urn: 'S0000564', documentId: '788', invoiceId: 'inv-6',  tags: [],            ageing: '1953:13', noErrors: 1, queueName: 'BMS Marketing',       status: 'Need-Attention',   currentOwner: 'a.krueger.ap',        priority: 'High',   sla: '8h 20m' },
  { urn: 'S0000581', documentId: '709', invoiceId: 'inv-9',  tags: [],            ageing: '1541:52', noErrors: 0, queueName: 'PRH Royalties',       status: 'Ready-To-Approve', currentOwner: 'm.torres.ap',         priority: 'High',   sla: '4h 00m' },
  { urn: 'S0000563', documentId: '789', invoiceId: 'inv-7',  tags: [],            ageing: '1953:13', noErrors: 0, queueName: 'PRH Procurement',     status: 'Ready-To-Approve', currentOwner: 'r.thothadri.iyengar', priority: 'Low',    sla: '44h 00m' },
  { urn: 'S0000562', documentId: '790', invoiceId: 'inv-8',  tags: [],            ageing: '2029:5',  noErrors: 0, queueName: 'All',                status: 'Captured',         currentOwner: 'm.weber.ap',          priority: 'Low',    sla: '44h 00m' },
  { urn: 'S0000561', documentId: '791', invoiceId: 'inv-10', tags: [],            ageing: '2029:5',  noErrors: 1, queueName: 'Arvato IT',           status: 'Need-Attention',   currentOwner: 'r.thothadri.iyengar', priority: 'High',   sla: '3h 45m' },
  { urn: 'S0000560', documentId: '792', invoiceId: 'inv-11', tags: ['WBS Split'], ageing: '2029:5',  noErrors: 1, queueName: 'Fremantle Germany',   status: 'Need-Attention',   currentOwner: 'r.thothadri.iyengar', priority: 'High',   sla: '2h 30m' },
  { urn: 'S0000559', documentId: '793', invoiceId: 'inv-12', tags: ['IC Mismatch'], ageing: '2029:5', noErrors: 1, queueName: 'Bertelsmann Finance', status: 'Need-Attention',  currentOwner: 'p.janssen.fin',       priority: 'High',   sla: '4h 18m' },
  { urn: 'S0000558', documentId: '794', invoiceId: 'inv-13', tags: ['Rate Mismatch'], ageing: '2029:5', noErrors: 1, queueName: 'PRH Royalties',    status: 'Need-Attention',  currentOwner: 'c.newton.prh',        priority: 'High',   sla: '4h 20m' },
  { urn: 'S0000557', documentId: '795', invoiceId: 'inv-14', tags: [],            ageing: '2029:5',  noErrors: 0, queueName: 'Fremantle Germany',   status: 'Captured',         currentOwner: 'r.thothadri.iyengar', priority: 'Medium', sla: '36h 40m' },
]

const docRows: DocRow[] = DOC_META.map(meta => ({
  ...meta,
  invoice: mockInvoices.find(inv => inv.id === meta.invoiceId)!,
})).filter(r => r.invoice != null)

type FilterTab = 'All' | 'Ready-To-Approve' | 'Need-Attention' | 'Approved' | 'Rejected' | 'Uploaded'

function getEffectiveStatus(row: DocRow, processedIds?: Set<string>, rejectedInvoiceIds?: Set<string>, straightPassInvoiceIds?: Set<string>, metroApprovedIds?: Set<string>): I2PStatus {
  if (metroApprovedIds?.has(row.invoice.id) || straightPassInvoiceIds?.has(row.invoice.id)) return 'Approved'
  if (rejectedInvoiceIds?.has(row.invoice.id)) return 'Rejected'
  if (processedIds?.has(row.invoice.id)) return 'Approved'
  return row.status
}

function StatusChip({ status }: { status: I2PStatus }) {
  const map: Record<I2PStatus, { bg: string; color: string; label: string }> = {
    'Captured':          { bg: '#F1F5F9', color: '#64748B', label: 'Captured' },
    'Ready-To-Approve':  { bg: '#F0FDF4', color: '#16A34A', label: 'Ready To Approve' },
    'Need-Attention':    { bg: '#FFFBEB', color: '#D97706', label: 'Need Attention' },
    'Approved':          { bg: '#F0FDF4', color: '#16A34A', label: 'Approved' },
    'Rejected':          { bg: '#FEF2F2', color: '#DC2626', label: 'Rejected' },
    'Uploaded':          { bg: '#EDE9FE', color: '#7C3AED', label: 'Uploaded' },
  }
  const s = map[status]
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, background: s.bg, color: s.color, borderRadius: '4px', padding: '3px 8px', fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: 'High' | 'Medium' | 'Low' }) {
  const color = priority === 'High' ? '#DC2626' : priority === 'Medium' ? '#D97706' : '#16A34A'
  const bg = priority === 'High' ? '#FEF2F2' : priority === 'Medium' ? '#FFFBEB' : '#F0FDF4'
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, background: bg, color, borderRadius: '4px', padding: '3px 8px', fontFamily: 'Cabin, sans-serif' }}>
      {priority}
    </span>
  )
}

export function TicketsView({ onSelectInvoice, replyEmails: _r, onMarkReplyRead: _m, processedIds, rejectedInvoiceIds, straightPassInvoiceIds, metroApprovedIds }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [huddleRow, setHuddleRow] = useState<DocRow | null>(null)
  const [classifiedIds, setClassifiedIds] = useState<Set<string>>(new Set())

  const filtered = docRows.filter(row => {
    const effectiveStatus = getEffectiveStatus(row, processedIds, rejectedInvoiceIds, straightPassInvoiceIds, metroApprovedIds)
    if (activeFilter !== 'All' && effectiveStatus !== activeFilter) return false
    const q = searchQuery.toLowerCase()
    if (q && !row.urn.toLowerCase().includes(q) && !row.invoice.invoiceNumber.toLowerCase().includes(q) && !row.invoice.supplier.toLowerCase().includes(q)) return false
    return true
  })

  const countFor = (f: FilterTab) => f === 'All' ? docRows.length : docRows.filter(r => getEffectiveStatus(r, processedIds, rejectedInvoiceIds, straightPassInvoiceIds, metroApprovedIds) === f).length

  const filterTabs: FilterTab[] = ['All', 'Ready-To-Approve', 'Need-Attention', 'Approved', 'Rejected', 'Uploaded']
  const tabLabels: Record<FilterTab, string> = {
    'All': 'All',
    'Ready-To-Approve': 'Ready To Approve',
    'Need-Attention': 'Need Attention',
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Uploaded': 'Uploaded',
  }
  const tabColors: Record<FilterTab, string> = {
    'All': '#7C3AED',
    'Ready-To-Approve': '#16A34A',
    'Need-Attention': '#D97706',
    'Approved': '#16A34A',
    'Rejected': '#DC2626',
    'Uploaded': '#7C3AED',
  }

  const COLS = ['', 'URN', 'Tags', 'Ageing', 'Errors', 'Supplier Name', 'Queue Name', 'Current Status', 'Current Owner', 'Reception Date', 'Priority', 'Doc ID', 'Action']

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC', fontFamily: 'Lato, sans-serif' }}>
      {/* Page header */}
      <div style={{ background: '#fff', padding: '16px 28px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
          I2P · Cases /  <span style={{ color: '#475569', fontWeight: 600 }}>All Documents</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
              All Documents
            </h1>
            <span style={{ background: '#EDE9FE', color: '#7C3AED', borderRadius: '12px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>
              {docRows.length}
            </span>
            <span style={{ background: '#FFFBEB', color: '#D97706', borderRadius: '12px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>
              {docRows.filter(r => getEffectiveStatus(r, processedIds, rejectedInvoiceIds, straightPassInvoiceIds, metroApprovedIds) === 'Need-Attention').length} need attention
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
              ⊞ Filter
            </button>
            <button style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
              ≡ Customize
            </button>
            <button style={{ background: '#7C3AED', border: 'none', borderRadius: '6px', padding: '7px 16px', fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              + New Submission
            </button>
          </div>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 28px', gap: '0', overflowX: 'auto' }}>
          {filterTabs.map(tab => {
            const count = countFor(tab)
            const isActive = activeFilter === tab
            const color = tabColors[tab]
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                  color: isActive ? color : '#64748B',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                }}
              >
                {tabLabels[tab]}
                <span style={{
                  background: isActive ? color + '20' : '#F1F5F9',
                  color: isActive ? color : '#94A3B8',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  {count}
                </span>
              </button>
            )
          })}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
            <input
              placeholder="Search by URN, invoice, supplier…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 12px',
                fontSize: '13px', fontFamily: 'Lato, sans-serif', outline: 'none', color: '#1E293B', width: '240px',
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED' }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0' }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr>
              {COLS.map(col => (
                <th key={col} style={{
                  position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 10,
                  padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#64748B',
                  textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left',
                  borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <DocTableRow
                key={row.urn}
                row={row}
                index={idx + 1}
                effectiveStatus={getEffectiveStatus(row, processedIds, rejectedInvoiceIds, straightPassInvoiceIds, metroApprovedIds)}
                isClassified={classifiedIds.has(row.invoice.id) || (processedIds?.has(row.invoice.id) ?? false)}
                onOpen={() => setHuddleRow(row)}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
            No documents match the current filter.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ background: '#fff', borderTop: '1px solid #E2E8F0', padding: '10px 28px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
        <span>1 – {filtered.length} of {docRows.length} items per page</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[1, 2, 3, 4].map(p => (
            <button key={p} style={{ width: '28px', height: '28px', border: p === 1 ? '1px solid #7C3AED' : '1px solid #E2E8F0', borderRadius: '4px', background: p === 1 ? '#7C3AED' : '#fff', color: p === 1 ? '#fff' : '#64748B', fontSize: '12px', cursor: 'pointer' }}>
              {p}
            </button>
          ))}
          <span style={{ padding: '0 4px' }}>…</span>
          <button style={{ padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: '4px', background: '#fff', color: '#64748B', fontSize: '12px', cursor: 'pointer' }}>10</button>
        </div>
      </div>

      {/* I2P Agentic Journey Modal */}
      {huddleRow && (
        <AgenticJourneyModal
          row={huddleRow}
          isAlreadyClassified={classifiedIds.has(huddleRow.invoice.id) || (processedIds?.has(huddleRow.invoice.id) ?? false)}
          onClassified={() => setClassifiedIds(prev => new Set([...prev, huddleRow.invoice.id]))}
          onProceed={() => {
            setClassifiedIds(prev => new Set([...prev, huddleRow.invoice.id]))
            setHuddleRow(null)
            onSelectInvoice(huddleRow.invoice)
          }}
          onClose={() => setHuddleRow(null)}
        />
      )}
    </div>
  )
}

function DocTableRow({ row, index, effectiveStatus, isClassified, onOpen }: { row: DocRow; index: number; effectiveStatus: I2PStatus; isClassified: boolean; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <tr
      style={{ cursor: 'pointer', background: hovered ? '#FAFAFF' : '#fff', transition: 'background 0.12s', borderBottom: '1px solid #F1F5F9' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#94A3B8' }}>{index}</td>
      <td style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'monospace', color: '#7C3AED', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.urn}</td>
      <td style={{ padding: '10px 12px', maxWidth: '120px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {row.tags.map(tag => (
            <span key={tag} style={{ fontSize: '10px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '3px', padding: '1px 6px', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: 'monospace', color: '#64748B' }}>{row.ageing}</td>
      <td style={{ padding: '10px 12px', fontSize: '12px', color: row.noErrors > 0 ? '#DC2626' : '#64748B', fontWeight: row.noErrors > 0 ? 600 : 400, textAlign: 'center' }}>{row.noErrors}</td>
      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1E293B', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {isClassified ? row.invoice.supplier : <span style={{ color: '#CBD5E1' }}>—</span>}
      </td>
      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#475569' }}>{row.queueName}</td>
      <td style={{ padding: '10px 12px' }}><StatusChip status={effectiveStatus} /></td>
      <td style={{ padding: '10px 12px', fontSize: '11px', color: '#64748B', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{row.currentOwner}</td>
      <td style={{ padding: '10px 12px', fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{row.invoice.receivedAt} {row.invoice.emailTime}</td>
      <td style={{ padding: '10px 12px' }}>{isClassified && <PriorityBadge priority={row.priority} />}</td>
      <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: 'monospace', color: '#94A3B8' }}>{row.documentId}</td>
      <td style={{ padding: '10px 12px' }}>
        <button
          onClick={e => { e.stopPropagation(); onOpen() }}
          style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '4px', border: '1px solid #7C3AED', background: '#fff', color: '#7C3AED', cursor: 'pointer', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}
        >
          Open
        </button>
      </td>
    </tr>
  )
}

function AgenticJourneyModal({ row, isAlreadyClassified, onClassified, onProceed, onClose }: { row: DocRow; isAlreadyClassified: boolean; onClassified: () => void; onProceed: () => void; onClose: () => void }) {
  const [completedStages, setCompletedStages] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const invoice = row.invoice

  const stages = [
    { label: 'Inflow Detection: scanning I2P ingestion channels', completion: `Email from ${invoice.emailSenderEmail} detected · ingested at ${invoice.emailTime}` },
    { label: 'Digitization Services: OCR scan & document validation', completion: `Attachment validated — ${invoice.attachmentName}` },
    { label: 'Creating URN in I2P Platform', completion: `URN ${row.urn} created · Document ID ${row.documentId}` },
    { label: 'Document Classification Agent: identifying document type', completion: `Classified as ${invoice.category} invoice · AI confidence 97.4%` },
    { label: 'Document Extraction Agent: extracting invoice fields', completion: '12 invoice fields queued for Agentic extraction' },
    { label: 'Initiating Agentic validation pipeline', completion: `5-stage agent pipeline configured · priority set to ${row.priority}` },
  ]

  useEffect(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setCompletedStages(0)
    stages.forEach((_, idx) => {
      const t = setTimeout(() => setCompletedStages(idx + 1), (idx + 1) * 1100)
      timersRef.current.push(t)
    })
    return () => timersRef.current.forEach(t => clearTimeout(t))
  }, [row.urn]) // eslint-disable-line react-hooks/exhaustive-deps

  const allDone = completedStages >= stages.length
  useEffect(() => { if (allDone) onClassified() }, [allDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const categoryRevealed = isAlreadyClassified || completedStages > 3

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '900px', maxWidth: 'calc(100vw - 48px)', height: '560px', background: '#fff', borderRadius: '12px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', display: 'flex', overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{ width: '320px', flexShrink: 0, background: '#FAFAFF', borderRight: '1px solid #E2E8F0', padding: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            I2P Document
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '20px', color: '#7C3AED', fontWeight: 700 }}>{row.urn}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '15px', color: '#1E293B', fontWeight: 600 }}>{invoice.invoiceNumber}</div>
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>{invoice.supplier}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
            {[
              { label: 'Category', value: categoryRevealed ? <span style={{ fontSize: '11px', fontWeight: 700, background: '#EDE9FE', color: '#7C3AED', borderRadius: '4px', padding: '2px 8px' }}>{invoice.category}</span> : <span style={{ fontSize: '11px', color: '#CBD5E1', fontStyle: 'italic' }}>Pending</span> },
              { label: 'Amount', value: `${invoice.currency} ${invoice.amount.toLocaleString()}` },
              { label: 'Received', value: `${invoice.receivedAt} · ${invoice.emailTime}` },
              { label: 'Queue', value: row.queueName },
              { label: 'Attachment', value: invoice.attachmentName },
              { label: 'Priority', value: <PriorityBadge priority={row.priority} /> },
              { label: 'Owner', value: row.currentOwner },
              { label: 'Doc ID', value: row.documentId },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: '#1E293B', wordBreak: 'break-word' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>Agentic Journey</span>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: allDone ? '#16A34A' : '#7C3AED', boxShadow: allDone ? 'none' : '0 0 0 3px rgba(124,58,237,0.2)' }} />
            <span style={{ fontSize: '12px', color: allDone ? '#16A34A' : '#7C3AED', fontWeight: 600 }}>
              {allDone ? 'Document registered — ready for processing' : 'Processing…'}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
            {stages.map((stage, idx) => {
              const isDone = idx < completedStages
              const isCurrent = idx === completedStages
              return (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? '#16A34A' : isCurrent ? '#7C3AED' : '#E2E8F0', transition: 'all 0.3s' }}>
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : isCurrent ? (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'i2p-pulse 1s infinite' }} />
                    ) : (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CBD5E1' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingTop: '4px' }}>
                    {isDone ? (
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>{stage.completion}</span>
                    ) : isCurrent ? (
                      <span style={{ fontSize: '13px', color: '#64748B', fontStyle: 'italic' }}>{stage.label} — processing…</span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{stage.label}</span>
                    )}
                  </div>
                  {isDone && <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', flexShrink: 0, paddingTop: '4px' }}>{(1.1 + idx * 0.35).toFixed(1)}s</span>}
                </div>
              )
            })}

            {allDone && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="#16A34A"/><path d="M5 9l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: '13px', color: '#16A34A', fontWeight: 600 }}>
                  URN {row.urn} registered · Agentic pipeline initiated · ready for I2P processing
                </span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', padding: '16px 28px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={onClose} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '9px 18px', fontSize: '14px', cursor: 'pointer', color: '#475569', fontFamily: 'Lato, sans-serif' }}>
              Close
            </button>
            <button
              onClick={() => { if (allDone || isAlreadyClassified) onProceed() }}
              disabled={!allDone && !isAlreadyClassified}
              style={{ background: (allDone || isAlreadyClassified) ? '#7C3AED' : '#E2E8F0', color: (allDone || isAlreadyClassified) ? '#fff' : '#94A3B8', border: 'none', borderRadius: '6px', padding: '10px 24px', fontSize: '14px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, cursor: (allDone || isAlreadyClassified) ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
            >
              Open in I2P →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes i2p-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  )
}
