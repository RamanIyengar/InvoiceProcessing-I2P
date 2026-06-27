export type InvoiceCategory = 'PO' | 'Non-PO' | 'ECC Legacy';
export type InvoiceStatus = 'detected' | 'processing' | 'awaiting-approval' | 'approved' | 'rejected' | 'info-requested';
export type StepStatus = 'queued' | 'running' | 'complete' | 'error';
export type ActorType = 'Agent' | 'Human';
export type FailType = 'gl-missing' | 'missing-gr' | 'duplicate' | 'tax-mismatch' | 'manual-approval' | 'royalty-mismatch' | 'ic-mismatch';

export interface LineItem {
  description: string;
  qty: number;
  unitPrice: number;
}

export interface ExtractedFields {
  invoiceNumber: string;
  supplierName: string;
  supplierId: string;
  poNumber?: string;
  grNumber?: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  bankAccountStatus: string;
  duplicateCheck: string;
  matchStatus?: string;
  glAccount?: string;
  costCenter?: string;
  taxCode?: string;
  businessUnit?: string;
  codingConfidence?: number;
  complianceStatus?: string;
  expenseDescription?: string;
  billedTo?: string;
  billNo?: string;
  lineDescription?: string;
  lineQty?: string;
  lineItems?: LineItem[];
  fieldConfidences: Record<string, number>;
  conflictingGLCodes?: { code: string; label: string; percentage: number }[];
  appropriationNumber?: string;
  parNumber?: string;
  accountNumber?: string;
  // Media / SAP specific
  wbsElement?: string;
  sesNumber?: string;
  contractRef?: string;
}

export interface AgentStep {
  id: string;
  name: string;
  description: string;
  agents: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorType: ActorType;
  actorName: string;
  action: string;
  result: string;
  evidence?: string;
}

export interface DuplicateInfo {
  originalInvoiceNumber: string;
  processedDate: string;
  apDocNumber: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  senderEmail: string;
  slaMinutes: number;
}

export interface MissingGRInfo {
  poNumber: string;
  poOwnerName: string;
  poOwnerEmail: string;
  slaMinutes: number;
}

export interface TaxMismatchInfo {
  detectedCode: string;
  detectedRate: string;
  expectedCode: string;
  expectedRate: string;
  taxDifference: number;
  buyerName: string;
  buyerEmail: string;
  apLeadName: string;
  apLeadEmail: string;
  slaMinutes: number;
}

export interface RoyaltyMismatchInfo {
  author: string;
  title: string;
  contractRef: string;
  basis: string;
  contractRate: string;
  invoicedRate: string;
  variance: number;
  royaltyManagerName: string;
  royaltyManagerEmail: string;
  slaMinutes: number;
}

export interface ICMismatchInfo {
  entityA: string;
  entityB: string;
  docA: string;
  docB: string;
  amountA: number;
  amountB: number;
  variance: number;
  iceRef: string;
  contactName: string;
  contactEmail: string;
  slaMinutes: number;
}

export interface ReplyEmail {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  time: string;
  body: string;
  relatedInvoiceId: string;
  isUnread: boolean;
  attachmentName?: string;
  attachmentInvoiceId?: string;
}

export interface SentEmail {
  id: string;
  toName: string;
  toEmail: string;
  subject: string;
  time: string;
  body: string;
  relatedInvoiceId: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  supplierId: string;
  amount: number;
  currency: string;
  category: InvoiceCategory;
  emailSubject: string;
  emailPreview: string;
  emailSender: string;
  emailSenderEmail: string;
  emailTime: string;
  receivedAt: string;
  attachmentName: string;
  status: InvoiceStatus;
  extractedFields: ExtractedFields;
  agentSteps: AgentStep[];
  auditTrail: AuditEntry[];
  recommendation?: string;
  failAtStep?: number;
  failMessage?: string;
  failType?: FailType;
  straightforward?: boolean;
  duplicateInfo?: DuplicateInfo;
  missingGRInfo?: MissingGRInfo;
  taxMismatchInfo?: TaxMismatchInfo;
  royaltyMismatchInfo?: RoyaltyMismatchInfo;
  icMismatchInfo?: ICMismatchInfo;
  emailBody?: string;
  glMissingVariant?: 'internal-approval' | 'prt-coding';
}
