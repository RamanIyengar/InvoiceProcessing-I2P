import { Invoice } from '../types'
import { ProcessingView } from './ProcessingView'

interface Props {
  invoice: Invoice
  onBack: () => void
  onTaxMismatchSent?: () => void
  taxMismatchAutoResolved?: boolean
  onMissingGRSent?: () => void
  missingGRAutoResolved?: boolean
  onGLApprovalSent?: () => void
  glApprovalReceived?: boolean
  onProcessingComplete?: (invoiceId: string) => void
  metroGLApprovalSent?: boolean
  onMetroGLApprovalSend?: () => void
  metroApproved?: boolean
  onMetroApprove?: () => void
  metroInvoiceApprovedIds?: Set<string>
  glEmailsViewed?: boolean
}

export function InvoiceWorkspace({ invoice, onBack, onTaxMismatchSent, taxMismatchAutoResolved, onMissingGRSent, missingGRAutoResolved, onGLApprovalSent, glApprovalReceived, onProcessingComplete, metroGLApprovalSent, onMetroGLApprovalSend, metroApproved, onMetroApprove, metroInvoiceApprovedIds, glEmailsViewed }: Props) {
  return (
    <ProcessingView
      invoice={invoice}
      onBack={onBack}
      onTaxMismatchSent={onTaxMismatchSent}
      taxMismatchAutoResolved={taxMismatchAutoResolved}
      onMissingGRSent={onMissingGRSent}
      missingGRAutoResolved={missingGRAutoResolved}
      onGLApprovalSent={onGLApprovalSent}
      glApprovalReceived={glApprovalReceived}
      onProcessingComplete={onProcessingComplete}
      metroGLApprovalSent={metroGLApprovalSent}
      onMetroGLApprovalSend={onMetroGLApprovalSend}
      metroApproved={metroApproved}
      onMetroApprove={onMetroApprove}
      metroInvoiceApprovedIds={metroInvoiceApprovedIds}
      glEmailsViewed={glEmailsViewed}
    />
  )
}
