import { Invoice } from '../types'

interface Props {
  invoice: Invoice
}

function ConfidenceBadge({ value }: { value: number }) {
  let bg: string, color: string
  if (value >= 95) {
    bg = '#e8f5ee'
    color = '#1b823f'
  } else if (value >= 85) {
    bg = '#e7ecf5'
    color = '#1a3a6b'
  } else if (value >= 70) {
    bg = '#fff3d6'
    color = '#b06b00'
  } else {
    bg = '#fdecea'
    color = '#b91f1f'
  }

  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: '10px',
        fontWeight: 600,
        padding: '1px 6px',
        borderRadius: '3px',
        fontFamily: 'Lato, sans-serif',
        flexShrink: 0,
      }}
    >
      {value}%
    </span>
  )
}

function StatusChip({ value }: { value: string }) {
  const isPositive =
    value === 'Verified' || value === 'No Duplicate Found' || value === '3-Way Match Passed' || value === 'Compliant'

  return (
    <span
      style={{
        background: isPositive ? '#e8f5ee' : '#fff3d6',
        color: isPositive ? '#1b823f' : '#b06b00',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '3px',
        fontFamily: 'Lato, sans-serif',
      }}
    >
      {value}
    </span>
  )
}

interface FieldRowProps {
  label: string
  value: string | number
  confidence?: number
  isStatus?: boolean
  isAmount?: boolean
}

function FieldRow({ label, value, confidence, isStatus, isAmount }: FieldRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '7px 0',
        borderBottom: '1px solid var(--now-border)',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: '38%',
          flexShrink: 0,
          fontSize: '11px',
          color: 'var(--now-text-secondary)',
          fontFamily: 'Lato, sans-serif',
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isStatus ? (
          <StatusChip value={String(value)} />
        ) : (
          <span
            style={{
              fontSize: isAmount ? '13px' : '12px',
              fontWeight: isAmount ? 700 : 500,
              color: 'var(--now-text)',
              fontFamily: 'Lato, sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </span>
        )}
      </div>
      {confidence !== undefined && <ConfidenceBadge value={confidence} />}
    </div>
  )
}

interface GroupHeaderProps {
  title: string
}

function GroupHeader({ title }: GroupHeaderProps) {
  return (
    <div
      style={{
        fontFamily: 'Cabin, sans-serif',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--now-text-secondary)',
        paddingBottom: '6px',
        borderBottom: '2px solid var(--now-primary)',
        marginBottom: '4px',
        marginTop: '16px',
      }}
    >
      {title}
    </div>
  )
}

export function FieldsPanel({ invoice }: Props) {
  const f = invoice.extractedFields
  const conf = f.fieldConfidences
  const isPO = invoice.category === 'PO'

  const formatAmount = (n: number) =>
    `${invoice.currency === 'USD' ? '$' : '€'}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
      {/* Group 1: Document Information */}
      <GroupHeader title="Document Information" />
      <FieldRow label="Invoice Number" value={f.invoiceNumber} confidence={conf['invoiceNumber']} />
      <FieldRow label="Supplier Name" value={f.supplierName} confidence={conf['supplierName']} />
      <FieldRow label="Supplier ID" value={f.supplierId} />
      {isPO && f.poNumber && (
        <FieldRow label="PO Number" value={f.poNumber} confidence={conf['poNumber']} />
      )}
      {isPO && f.grNumber && (
        <FieldRow label="GR Number" value={f.grNumber} confidence={conf['grNumber']} />
      )}

      {/* Group 2: Payment Details */}
      <GroupHeader title="Payment Details" />
      <FieldRow label="Invoice Date" value={f.invoiceDate} confidence={conf['invoiceDate']} />
      <FieldRow label="Due Date" value={f.dueDate} confidence={conf['dueDate']} />
      <FieldRow label="Payment Terms" value={f.paymentTerms} confidence={conf['paymentTerms']} />
      <FieldRow label="Currency" value={f.currency} confidence={conf['currency']} />

      {/* Group 3: Amounts */}
      <GroupHeader title="Amounts" />
      <FieldRow label="Subtotal" value={formatAmount(f.subtotal)} confidence={conf['subtotal']} isAmount />
      <FieldRow label="Tax" value={formatAmount(f.tax)} confidence={conf['tax']} isAmount />
      <FieldRow label="Total Amount" value={formatAmount(f.totalAmount)} confidence={conf['totalAmount']} isAmount />

      {/* Group 4: Validation Status */}
      <GroupHeader title="Validation Status" />
      <FieldRow label="Bank Account" value={f.bankAccountStatus} confidence={conf['bankAccountStatus']} isStatus />
      <FieldRow label="Duplicate Check" value={f.duplicateCheck} isStatus />
      {f.matchStatus && (
        <FieldRow label="3-Way Match" value={f.matchStatus} isStatus />
      )}

      {/* Expense Description (Non-PO only) */}
      {!isPO && f.expenseDescription && (
        <div style={{ margin: '12px 0 4px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#4a7ab5', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Cabin, sans-serif' }}>Expense Description</div>
          <div style={{ fontSize: '12px', color: 'var(--now-text)', lineHeight: '1.55', padding: '8px 10px', background: '#f5f9ff', border: '1px solid #c8ddf5', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>
            {f.expenseDescription}
          </div>
        </div>
      )}

      {/* Group 5: GL Coding (Non-PO only) */}
      {!isPO && (
        <>
          <GroupHeader title="GL Coding" />
          {f.glAccount && (
            <FieldRow label="GL Account" value={f.glAccount} confidence={conf['glAccount']} />
          )}
          {f.costCenter && (
            <FieldRow label="Cost Center" value={f.costCenter} confidence={conf['costCenter']} />
          )}
          {f.taxCode && (
            <FieldRow label="Tax Code" value={f.taxCode} confidence={conf['taxCode']} />
          )}
          {f.businessUnit && (
            <FieldRow label="Business Unit" value={f.businessUnit} />
          )}
          {f.complianceStatus && (
            <FieldRow label="Compliance" value={f.complianceStatus} isStatus />
          )}
          {f.codingConfidence !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '7px 0',
                borderBottom: '1px solid var(--now-border)',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '38%',
                  flexShrink: 0,
                  fontSize: '11px',
                  color: 'var(--now-text-secondary)',
                  fontFamily: 'Lato, sans-serif',
                }}
              >
                Coding Confidence
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    flex: 1,
                    height: '6px',
                    background: '#e4e6e7',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${f.codingConfidence}%`,
                      height: '100%',
                      background:
                        f.codingConfidence >= 90
                          ? '#1b823f'
                          : f.codingConfidence >= 70
                          ? '#1a3a6b'
                          : '#b06b00',
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--now-text)',
                    fontFamily: 'Lato, sans-serif',
                    flexShrink: 0,
                  }}
                >
                  {f.codingConfidence}%
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
