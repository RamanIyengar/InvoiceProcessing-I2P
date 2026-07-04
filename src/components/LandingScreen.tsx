import { useState } from 'react'

const USE_CASES = [
  { no: 1,  label: 'Straight-Through PO Processing — ARRI Rental (Fremantle)',           ticket: 'AP-TKT-100248',    amount: '€148,750' },
  { no: 2,  label: 'Missing Service Entry Sheet — Sunset Post Production (Fremantle)',    ticket: 'AP-TKT-100249',    amount: '€312,000' },
  { no: 3,  label: 'Duplicate Invoice Detection — Maersk Line (PRH)',                     ticket: 'AP-TKT-100250',    amount: '€58,900'  },
  { no: 4,  label: 'Ambiguous GL Coding — Internal Dual Approval — Deloitte (Arvato)',   ticket: 'AP-TKT-100251',    amount: '€42,840'  },
  { no: 5,  label: 'VAT / Tax Code Mismatch — Lehmanns Media (Bertelsmann Education)',   ticket: 'AP-TKT-100252',    amount: '€59,500'  },
  { no: 6,  label: 'Non-PO GL Coding — Creative Agency — Jung von Matt (RTL)',           ticket: 'AP-TKT-100253',    amount: '€18,400'  },
  { no: 7,  label: 'GL Coding — WBS / Project Accounting — T-Systems (Arvato)',          ticket: 'AP-TKT-100254/58', amount: '€63,400 / €50,000' },
  { no: 8,  label: 'Royalty Statement — Manual Confidence Review — Kobalt Music (BMG)',  ticket: 'AP-TKT-100256',    amount: '€48,250'  },
  { no: 9,  label: 'Intercompany Mismatch — Fremantle UK / RTL Germany',                 ticket: 'AP-TKT-100259',    amount: '€214,000' },
  { no: 10, label: 'Royalty Rate Contract Deviation — The Wylie Agency (PRH / BMG)',     ticket: 'AP-TKT-100260',    amount: '€32,400'  },
  { no: 11, label: 'GenAI Contract Milestone Validation — Stellify Media (Fremantle)',   ticket: 'AP-TKT-100261',    amount: '€185,000' },
]

const USE_CASE_CARDS: { no: number; context: string[]; challenge: string[]; demo: string[] }[] = [
  {
    no: 1,
    context: [
      'You run 70+ productions annually across Europe — each requiring high-end cinema cameras, lenses, and lighting rigs rented from ARRI Rental on a recurring basis.',
      'Every transaction follows the same clean, predictable pattern: a PO is raised in SAP before the rental begins, equipment receipt is confirmed (the Goods Receipt), and ARRI\'s invoice arrives shortly after.',
      'All three documents — PO, GR, and invoice — exist and match perfectly. This is the textbook clean invoice: low-risk, high-frequency, zero ambiguity.',
      'It is also the ideal candidate for full automation — no human judgement is required at any step.',
    ],
    challenge: [
      'Even a perfectly clean invoice requires a human analyst to: open it, locate the PO, verify each line item (quantity, unit price, totals), check the tax code, confirm the goods receipt, and post manually to SAP.',
      'Time cost: 10–20 minutes per invoice — even when everything is correct. At your production volumes, this adds up to weeks of analyst time per month on zero-judgement, mechanical data entry.',
      'Any miskey in the manual posting creates errors that require further correction — compounding the wasted effort.',
      'Skilled AP staff are consumed by routine processing rather than exception handling, supplier disputes, or process improvement.',
    ],
    demo: [
      'The AI extracts all invoice fields using document intelligence — no manual data entry at any step.',
      'Performs a fully automated 3-way match: invoice vs. PO vs. goods receipt.',
      'Validates vendor master data, tax codes (via SAP DRC), and payment terms in real time.',
      'Posts directly to SAP with no human touch — the entire cycle completes in seconds.',
      'Every validation is logged to the audit trail automatically.',
      'Watch the agent timeline on screen: each check completing in sequence, giving the audience a precise view of what intelligent automation looks like in practice.',
    ],
  },
  {
    no: 2,
    context: [
      'Sunset Post Production delivers post-production services — editing, colour grading, VFX, and final sound mix — under a master service agreement with Fremantle.',
      'SAP requires a Service Entry Sheet (SES) before payment can be released: a formal internal confirmation that agreed services were actually received.',
      'This is a key financial control — without an SES, the 3-way match cannot complete and payment is correctly blocked by SAP.',
      'The SES must be created internally by the project manager or production executive who commissioned the work — not by AP.',
    ],
    challenge: [
      'When no SES exists, your AP team must: identify the blocking reason, find the responsible project manager, explain what an SES is (most have never created one), and chase for a response.',
      'Typical delay: 3–7 business days per invoice — and this repeats for every service invoice where the PM hasn\'t proactively created the SES.',
      'Suppliers call chasing payment; internal relationships suffer; AP is perceived as the bottleneck rather than the control function it is.',
      'Late payment carries contractual risk — service providers may apply interest clauses or deprioritise your work.',
    ],
    demo: [
      'The AI detects the missing SES as part of automated invoice validation — instantly, no manual investigation needed.',
      'Routes a SAP VIM Workflow task directly to the responsible PO owner\'s SAP inbox — pre-populated with all invoice and PO details, no manual drafting.',
      'Invoice is placed in a clear "pending SES confirmation" hold state — visible to all stakeholders.',
      'The moment the PM completes the VIM work item confirming delivery, the invoice is automatically released for payment. No chasing. No delay.',
      'Internal routing via SAP VIM Workflow — the right task, to the right person, through the system they already use every day.',
    ],
  },
  {
    no: 3,
    context: [
      'PRH ships millions of books annually with Maersk Line as a primary freight carrier — a high-volume, high-frequency supplier relationship with significant invoice throughput.',
      'Duplicate invoices arise from re-submissions after payment queries, system errors, acquired entities with overlapping vendor records, or supplier admin mistakes.',
      'Industry data: 0.1–0.5% of all B2B invoices globally are duplicates. At PRH\'s volumes, this is meaningful financial exposure every month.',
      'Sophisticated duplicates use slightly different references, date formats, or are resubmitted weeks later — bypassing SAP\'s native exact-match duplicate check entirely.',
    ],
    challenge: [
      'Your AP team relies on SAP\'s basic duplicate check and periodic manual exception reports — both of which miss near-duplicate submissions.',
      'When a double payment occurs: AP must identify it, engage Maersk diplomatically, request a credit note, apply it, and reconcile — a weeks-long process.',
      'Recovery cost in staff time often exceeds the original invoice value.',
      'Each overpayment damages the commercial relationship and signals a poorly controlled AP function — a reputational risk with a strategic carrier.',
    ],
    demo: [
      'The AI performs fuzzy matching across: supplier, amount, invoice date, line items, and reference numbers simultaneously — going well beyond SAP\'s native check.',
      'Identifies this Maersk invoice as a duplicate of an already-paid AP document.',
      'Surfaces the original payment details: AP document number, payment amount, method, and settlement date.',
      'Auto-rejects the invoice and sends a professional, detailed notification to Maersk\'s finance team.',
      'Entire detection and rejection cycle: seconds. Zero analyst effort. Zero financial risk.',
    ],
  },
  {
    no: 4,
    context: [
      'Arvato engages Deloitte for strategic consulting — digital transformation, process re-engineering, and technology implementation.',
      'These invoices are large, complex, and reference multiple deliverables that could legitimately map to different GL accounts: operational consulting, capitalised project cost, or IT transformation spend.',
      'Each option has different budget owners, approval workflows, and P&L / balance sheet treatment.',
      'GL coding accuracy directly affects profit centre reporting, budget variance analysis, and management accounts used for business decisions.',
    ],
    challenge: [
      'Your AP analysts have no visibility into the project context behind a Deloitte invoice — they cannot determine the correct GL code without escalating.',
      'Escalating means: finding the right cost centre owner, framing the question, and waiting days for a response while the invoice ages and payment reminders arrive.',
      'Making the wrong call creates a posting error requiring manual journal entry correction — with audit trail implications.',
      'At month-end, volume pressure leads to incorrectly coded invoices pushed through just to clear the backlog — a poor but common outcome.',
    ],
    demo: [
      'The AI analyses the invoice and presents two candidate GL accounts with confidence scores and clear business rationale for each.',
      'Transparently surfaces the ambiguity rather than forcing a single incorrect answer.',
      'Routes a SAP VIM Workflow task to the Cost Centre Owner\'s SAP inbox — pre-populated with invoice details, GL options, and a single action to confirm.',
      'AP Lead is also notified via VIM Workflow for dual authorisation.',
      'Posts automatically with a full audit trail once both approvals are complete. Right decision, right person, right system — no bottleneck, no rework.',
    ],
  },
  {
    no: 5,
    context: [
      'Bertelsmann Education supplies printed textbooks and academic materials to Lehmanns Media, a leading German academic bookseller serving universities and research institutions.',
      'Under §12 Abs. 2 Nr. 14 UStG (German VAT law): printed books attract 7% VAT, not the standard 19% — a distinction suppliers frequently misapply.',
      'Mixed invoices (print + digital) require the correct rate applied line by line — an added complexity that amplifies the error rate.',
      'Incorrect VAT coding has immediate compliance consequences: wrong input tax recovery and potential audit exposure for Bertelsmann.',
    ],
    challenge: [
      'Your AP team lacks the tax expertise to validate VAT codes on every invoice — and shouldn\'t be expected to.',
      'Errors that pass through result in: wrong input tax claimed in your VAT return, potential penalties if discovered in audit, and supplier disputes requiring multiple rounds of email.',
      'By the time your tax team runs a periodic review, many incorrectly coded invoices have already been paid — triggering credit note requests and VAT return amendments.',
      'Each manual VAT correction: 30–45 minutes of AP time plus tax specialist involvement. At quarterly volume, this is a significant compliance burden.',
    ],
    demo: [
      'The AI validates the supplier\'s VAT code directly against SAP DRC (Document and Reporting Compliance) — your authoritative tax code configuration for all jurisdictions.',
      'Catches that Lehmanns has applied 19% (DE-V1) where 7% (DE-V3) is correct for printed educational materials.',
      'Auto-rejects the invoice with a precise notification to Lehmanns: wrong rate applied, correct rate specified, relevant tax code referenced, clear request to resubmit.',
      'No tax specialist review needed. No compliance exposure. Supplier receives unambiguous correction guidance immediately.',
    ],
  },
  {
    no: 6,
    context: [
      'RTL commissions creative agencies like Jung von Matt for brand campaigns, content production, and digital marketing.',
      'These are non-PO invoices — the pace of creative work doesn\'t align with formal procurement, so invoices arrive without a SAP purchase order reference.',
      'Without a PO: no pre-approved spend commitment in SAP, no automatic GL code, no price or quantity to validate against.',
      'This is common and legitimate for creative spend — but it creates a specific governance and processing gap that your AP team must navigate manually for every such invoice.',
    ],
    challenge: [
      'Your AP team must: assess legitimacy, determine the correct GL account (from hundreds of options), find the right budget owner, obtain approval, then process — for every non-PO invoice.',
      'Typical cycle: 3–7 days per invoice, with significant inconsistency across analysts (two clerks may code the same invoice type to different GL accounts).',
      'Inconsistent coding distorts your marketing budget reports and creates reposting effort.',
      'Agencies like Jung von Matt factor slow payment risk into future pricing — RTL\'s marketing team bears the relationship and cost consequence.',
    ],
    demo: [
      'The AI reads the invoice description and applies GL coding logic informed by your chart of accounts and historical coding patterns for similar vendor and invoice types.',
      'Recommends the correct marketing GL account with a clear, auditable rationale.',
      'Routes a SAP VIM Workflow task to the identified Cost Centre Owner\'s SAP inbox — one action in their worklist to confirm.',
      'Posts automatically on sign-off.',
      '3–7 days compressed to minutes. Consistent coding every time. Full audit trail.',
    ],
  },
  {
    no: 7,
    context: [
      'Arvato IT Solutions runs large-scale IT infrastructure projects with T-Systems covering cloud migration, managed services, network operations, and application support.',
      'These projects require WBS (Work Breakdown Structure) accounting — costs tracked at individual project phase level, not just cost centre.',
      'WBS accuracy is essential for: accurate client billing, project profitability reporting, capitalisation of development costs, and balance sheet integrity.',
      'A single T-Systems invoice may need to be split across multiple WBS elements based on the work content — a task that requires both project and finance knowledge.',
    ],
    challenge: [
      'Your AP team cannot determine the correct WBS split without specialist project knowledge — so every such invoice requires an escalation to project finance.',
      'While the escalation is pending: project cost reports exclude the accrued cost, distorting the management view and decisions made on that basis.',
      'For capitalised costs: WBS coding errors take months to unwind and carry external audit implications.',
      'Coordinating between AP, project finance, and T-Systems delivery teams adds days to every invoice — at scale, this is a persistent bottleneck.',
    ],
    demo: [
      'The AI extracts the project reference from the invoice header and line items.',
      'Maps costs to the correct WBS elements in SAP automatically — splitting the invoice across two project accounting codes based on the described work content.',
      'Generates two linked AP tickets (AP-TKT-100254 and AP-TKT-100258), each routed as a SAP VIM Workflow task to the appropriate internal approver.',
      'Complex, multi-dimension accounting logic executed without specialist intervention. Project cost reports stay current. No escalation. No delay.',
    ],
  },
  {
    no: 8,
    context: [
      'BMG manages an extensive rights catalogue spanning publishing, recorded music, synchronisation, and neighbouring rights across multiple territories.',
      'Kobalt Music administers publishing rights for a large artist and songwriter roster — quarterly royalty statements arrive as complex, multi-line documents.',
      'Each line requires validation against: territory-specific royalty rates, usage type (streaming, sync, performance, mechanical), minimum guarantees, recoupment positions, and contract terms.',
      'A single statement can contain hundreds of line items across dozens of territories and multiple rights categories.',
    ],
    challenge: [
      'Correct royalty processing requires specialist expertise in music rights structures, contract terms, and calculation logic — knowledge your general AP team does not have.',
      'At peak statement periods, volume exceeds your specialist team\'s capacity, creating a backlog that delays payments and strains artist relationships.',
      'Errors carry legal and reputational risk: underpayment triggers disputes; overpayment affects your margin and may not be recoverable.',
      'Disputes with high-profile rights holders are costly to resolve and can escalate — making accuracy both a financial and a relationship imperative for BMG.',
    ],
    demo: [
      'The AI reads the Kobalt statement in full and validates calculations against contracted rates stored in the system.',
      'Identifies a discrepancy in the medium-confidence zone — not clearly right, not clearly wrong, but requiring expert assessment.',
      'Rather than auto-approving (overpayment risk) or auto-rejecting (blocking a legitimate payment), it presents a structured review to your royalties analyst.',
      'Shows: specific line items in question, contracted vs. invoiced rates, the calculated variance, and the relevant contract clause.',
      'One-click approve or escalate — AI eliminates the routine 90%; your specialist focuses only on the judgement call that actually requires them.',
    ],
  },
  {
    no: 9,
    context: [
      'Fremantle UK licences content to RTL Germany for broadcast rights — what one entity records as AR, the other must record as AP for the same amount, same period, same IC partner code.',
      'This mirroring is a hard requirement under IFRS 10: uneliminated intercompany balances cause group consolidation errors affecting Bertelsmann\'s published financial statements.',
      'Mismatches arise from: timing differences, FX rounding, in-transit invoices, or incorrect intercompany partner codes.',
      'You face this challenge across multiple Bertelsmann subsidiary pairs — at group scale, it is a persistent, resource-intensive month-end problem.',
    ],
    challenge: [
      'Identifying a mismatch requires finance teams in two entities — different countries, systems, calendars, and priorities — to investigate and agree a correction together.',
      'A single unresolved IC mismatch can delay your entire group close by days.',
      'External auditors specifically target IC elimination failures as a sign of weak financial controls — a finding that carries board-level visibility.',
      'Resolution cost — analyst time, management escalation, potential restatement — is disproportionate to what is often a simple timing or coding error.',
    ],
    demo: [
      'The AI detects the posting mismatch between Fremantle UK\'s AR and RTL Germany\'s AP for the same transaction — in real time, before month-end consolidation.',
      'Routes SAP VIM Workflow tasks to intercompany finance contacts at both entities simultaneously — no email, directly into their SAP worklists.',
      'Places the relevant payment on hold with a clearly documented status visible to both sides.',
      'IC reconciliation shifts from a painful month-end scramble to a real-time automated control.',
      'Mismatches are caught when they occur — not three weeks later when they surface as a consolidation error.',
    ],
  },
  {
    no: 10,
    context: [
      'PRH and BMG both hold commercial contracts with The Wylie Agency, one of the world\'s most prestigious literary agencies, representing major authors including Salman Rushdie and Zadie Smith.',
      'Royalty rates are complex and tiered: varying by format (hardback, paperback, audiobook, e-book), territory, cumulative sales thresholds, and contractual review periods.',
      'A single author contract may contain 20–30 distinct rate schedules — the applicable rate at any point depends on which sales threshold has been crossed.',
      'Rate deviations occur when: contracts are renegotiated but billing systems aren\'t updated, sales thresholds are crossed triggering new tiers, or errors are made on the agency\'s side.',
    ],
    challenge: [
      'Without automated rate verification, deviations are caught only through periodic manual audits — after multiple overpaid statement periods.',
      'Recovery of historical overpayments from a high-profile agency like Wylie is diplomatically sensitive and legally complex.',
      'Demanding corrections risks damaging a relationship that is critical to your publishing and rights portfolio — friction that is extremely difficult to undo.',
      'Each undetected overpayment directly affects BMG\'s and PRH\'s margins on rights that are already tightly negotiated.',
    ],
    demo: [
      'The AI compares the invoiced royalty rate against the contracted rate for the specific format, territory, and cumulative sales level applicable to this statement period.',
      'Identifies the deviation, quantifies the financial variance, and cites the relevant contract clause.',
      'Routes a SAP VIM Workflow task to your Royalty Manager with the full case detail — no manual investigation or email drafting required.',
      'Payment placed on hold automatically until resolution.',
      'Overpayment risk eliminated. Specialist review triggered only where it\'s actually needed. Full audit trail on every case.',
    ],
  },
  {
    no: 11,
    context: [
      'Fremantle commissions Stellify Media — known for \'The Chase\' and \'Beat the Chasers\' — under a milestone-based payment contract.',
      'Payment is gated to specific production deliverables: development scripts, locked picture edit, final broadcast master, technical delivery.',
      'This structure is standard in TV commissioning — it controls your cash flow and acts as a quality milestone gate.',
      'Payment can only release when the specific milestone is formally confirmed as complete by your commissioning team — not on invoice receipt alone.',
    ],
    challenge: [
      'Your AP team must: locate the contract and commission schedule, identify the referenced milestone, check whether delivery confirmation has been received, chase the commissioning executive if not, then clear for payment.',
      'Invoices sit unpaid for 5–10 business days while the confirmation chase runs — across multiple teams with no automated handoff.',
      'Stellify, having delivered the work, experiences cash flow friction that creates disputes and affects their prioritisation of subsequent milestones.',
      'AP, production management, and commissioning must all coordinate manually — a workflow that has no systematic structure without automation.',
    ],
    demo: [
      'The AI reads the invoice and extracts the milestone reference from the document.',
      'Uses GenAI-powered contract reading to locate the corresponding clause in the commission contract — understanding delivery conditions in natural language, not just keyword matching.',
      'Determines that formal confirmation is required and routes a SAP VIM Workflow task directly to your commissioning executive\'s SAP inbox.',
      'Invoice held in a clearly documented pending state until confirmation arrives.',
      'Payment releases automatically on confirmation — no further human intervention at any step.',
      'This is AI at the intersection of document intelligence, contract management, and AP automation: a capability that goes beyond RPA or traditional workflow tools, and the direction your entire AP function is heading.',
    ],
  },
]

function UseCaseCardModal({ no, onClose, onPrev, onNext }: { no: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const [maximized, setMaximized] = useState(false)
  const uc = USE_CASES.find(u => u.no === no)!
  const card = USE_CASE_CARDS.find(c => c.no === no)!
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: maximized ? '0' : '24px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: maximized ? '0' : '12px', width: maximized ? '100vw' : '1100px', height: maximized ? '100vh' : undefined, maxWidth: maximized ? '100vw' : '96vw', maxHeight: maximized ? '100vh' : '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 28px 90px rgba(0,0,0,0.5)', overflow: 'hidden', transition: 'all 0.2s ease' }}>
        {/* Header */}
        <div style={{ background: '#1a3a6b', padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#fff' }}>{no}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{uc.label}</div>
            <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '3px' }}>{uc.ticket} · {uc.amount}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => setMaximized(m => !m)} title={maximized ? 'Restore' : 'Maximise'} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {maximized
                ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round"><path d="M9 1h4v4M5 13H1V9M13 9v4h-4M1 5V1h4"/></svg>
                : <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round"><path d="M1 5V1h4M9 1h4v4M13 9v4h-4M5 13H1V9"/></svg>
              }
            </button>
            <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
          </div>
        </div>
        {/* Body — 3 columns */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Industry Context */}
          <div style={{ flex: 1, padding: '18px 20px', borderRight: '1px solid #eef0f2', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#e7ecf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🏭</div>
              <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '10.5px', fontWeight: 700, color: '#1a3a6b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Industry Context</div>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {card.context.map((bullet, i) => (
                <li key={i} style={{ fontFamily: 'Lato, sans-serif', fontSize: '12.5px', color: '#2c3e50', lineHeight: '1.6', marginBottom: '7px' }}>{bullet}</li>
              ))}
            </ul>
          </div>
          {/* Process Challenge */}
          <div style={{ flex: 1, padding: '18px 20px', borderRight: '1px solid #eef0f2', background: '#fffbf5', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#fef3e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>⚠️</div>
              <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '10.5px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Process Challenge — Without AI</div>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {card.challenge.map((bullet, i) => (
                <li key={i} style={{ fontFamily: 'Lato, sans-serif', fontSize: '12.5px', color: '#2c3e50', lineHeight: '1.6', marginBottom: '7px' }}>{bullet}</li>
              ))}
            </ul>
          </div>
          {/* What you see in the demo */}
          <div style={{ flex: 1, padding: '18px 20px', background: '#f5fbf7', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🎯</div>
              <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '10.5px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.08em' }}>What You See in the Demo</div>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {card.demo.map((bullet, i) => (
                <li key={i} style={{ fontFamily: 'Lato, sans-serif', fontSize: '12.5px', color: '#2c3e50', lineHeight: '1.6', marginBottom: '7px' }}>{bullet}</li>
              ))}
            </ul>
          </div>
        </div>
        {/* Footer nav */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #e4e6e7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f6f7f7', flexShrink: 0 }}>
          <button onClick={onPrev} disabled={no === 1} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #c8cccf', background: no === 1 ? '#f0f1f2' : '#fff', color: no === 1 ? '#b0b8be' : '#4a555c', fontSize: '12px', cursor: no === 1 ? 'default' : 'pointer', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>
            ← Previous
          </button>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#89919a' }}>{no} of {USE_CASES.length}</span>
          <button onClick={onNext} disabled={no === USE_CASES.length} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #c8cccf', background: no === USE_CASES.length ? '#f0f1f2' : '#fff', color: no === USE_CASES.length ? '#b0b8be' : '#4a555c', fontSize: '12px', cursor: no === USE_CASES.length ? 'default' : 'pointer', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}

function UseCasesModal({ onClose }: { onClose: () => void }) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  return (
    <>
      {selectedCard !== null && (
        <UseCaseCardModal
          no={selectedCard}
          onClose={() => setSelectedCard(null)}
          onPrev={() => setSelectedCard(n => Math.max(1, (n ?? 1) - 1))}
          onNext={() => setSelectedCard(n => Math.min(USE_CASES.length, (n ?? 1) + 1))}
        />
      )}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', width: '860px', maxWidth: '95vw', maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.45)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 10px', borderBottom: '2px solid #1a3a6b', flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1d2f36' }}>Bertelsmann Invoice Processing — Use Cases</div>
              <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#89919a', marginTop: '2px' }}>AI-Powered AP Automation · Demo Scope · 11 Use Cases · Click any row for context card</div>
            </div>
            <button onClick={onClose} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #d0d4d7', background: '#f6f7f7', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b767b', fontWeight: 700, lineHeight: 1 }}>×</button>
          </div>
          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {USE_CASES.map((uc) => (
              <div
                key={uc.no}
                onClick={() => setSelectedCard(uc.no)}
                onMouseEnter={() => setHoveredRow(uc.no)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{ display: 'flex', alignItems: 'center', padding: '9px 20px', borderBottom: '1px dashed #e0e3e6', cursor: 'pointer', background: hoveredRow === uc.no ? '#f0f4fa' : 'transparent', transition: 'background 0.12s' }}
              >
                <div style={{ width: '24px', flexShrink: 0, fontFamily: 'Cabin, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1a3a6b' }}>{uc.no}</div>
                <div style={{ flex: 1, fontFamily: 'Lato, sans-serif', fontSize: '13px', color: '#1d2f36', fontWeight: 500, paddingRight: '16px' }}>{uc.label}</div>
                <div style={{ flexShrink: 0, fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#89919a', marginRight: '20px', whiteSpace: 'nowrap' }}>{uc.ticket}</div>
                <div style={{ flexShrink: 0, fontFamily: 'Cabin, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1a3a6b', minWidth: '110px', textAlign: 'right', whiteSpace: 'nowrap' }}>{uc.amount}</div>
                <div style={{ flexShrink: 0, marginLeft: '12px', width: '18px', height: '18px', borderRadius: '50%', background: hoveredRow === uc.no ? '#1a3a6b' : '#e4e6e7', color: hoveredRow === uc.no ? '#fff' : '#89919a', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s', fontFamily: 'Lato, sans-serif' }}>i</div>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div style={{ padding: '9px 20px', borderTop: '1px solid #e4e6e7', background: '#f6f7f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#aab0b5' }}>Bertelsmann Invoice Processing Automation · Accenture</span>
            <button onClick={onClose} style={{ padding: '5px 16px', borderRadius: '6px', border: '1px solid #c8cccf', background: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'Lato, sans-serif', color: '#4a555c', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      </div>
    </>
  )
}

function ProcessFlowModal({ onClose }: { onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', maxWidth: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e4e6e7', background: '#f6f7f7' }}>
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1d2f36' }}>Reimagined Accounts Payable with AI</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #c8cccf', background: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d2f36', fontWeight: 700 }}>−</button>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: '#6b767b', minWidth: '44px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #c8cccf', background: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d2f36', fontWeight: 700 }}>+</button>
            <button onClick={() => setZoom(1)} style={{ padding: '0 10px', height: '32px', borderRadius: '6px', border: '1px solid #c8cccf', background: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'Lato, sans-serif', color: '#6b767b', fontWeight: 600 }}>Reset</button>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #c8cccf', background: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b767b', fontWeight: 700, marginLeft: '4px' }}>×</button>
          </div>
        </div>
        <div style={{ overflow: 'auto', flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: '16px' }}>
          <img src="/reimagined-ap.png" alt="Reimagined AP with AI" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', display: 'block', maxWidth: 'none' }} />
        </div>
      </div>
    </div>
  )
}

interface Props {
  onSelectOutlook: () => void
  onSelectSAP: () => void
}

function VIMIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="3" width="20" height="3" rx="1" fill="#0070B1" />
      <rect x="1" y="8" width="20" height="3" rx="1" fill="#0070B1" opacity="0.7" />
      <rect x="1" y="13" width="14" height="3" rx="1" fill="#0070B1" opacity="0.5" />
      <rect x="1" y="18" width="10" height="2" rx="1" fill="#0070B1" opacity="0.3" />
    </svg>
  )
}

function WorkflowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="4" cy="5" r="3" stroke="#5a6872" strokeWidth="1.5" />
      <circle cx="18" cy="5" r="3" stroke="#5a6872" strokeWidth="1.5" />
      <circle cx="11" cy="17" r="3" stroke="#5a6872" strokeWidth="1.5" />
      <path d="M7 5h8M6.5 7.5l3 7M15.5 7.5l-3 7" stroke="#5a6872" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function GLIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="2" width="18" height="18" rx="2" stroke="#5a6872" strokeWidth="1.5" />
      <path d="M2 8h18M8 8v12" stroke="#5a6872" strokeWidth="1.3" />
      <path d="M12 12h4M12 15.5h3" stroke="#5a6872" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ExceptionIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2L2 19h18L11 2z" stroke="#5a6872" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 9v4" stroke="#5a6872" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11" cy="16" r="1" fill="#5a6872" />
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="12" width="4" height="8" rx="1" fill="#5a6872" opacity="0.5" />
      <rect x="9" y="7" width="4" height="13" rx="1" fill="#5a6872" opacity="0.65" />
      <rect x="16" y="3" width="4" height="17" rx="1" fill="#5a6872" opacity="0.8" />
    </svg>
  )
}

function VendorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="8" r="4" stroke="#5a6872" strokeWidth="1.5" />
      <path d="M3 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#5a6872" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function AuditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="1" width="13" height="17" rx="1.5" stroke="#5a6872" strokeWidth="1.5" />
      <path d="M6 6h7M6 9.5h7M6 13h4" stroke="#5a6872" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="17" cy="17" r="4" fill="white" stroke="#5a6872" strokeWidth="1.5" />
      <path d="M15.5 17l1 1 2-2" stroke="#5a6872" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InactiveTile({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div
      style={{
        width: '164px',
        height: '160px',
        background: 'white',
        borderRadius: '4px',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.10)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        opacity: 0.72,
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ width: '38px', height: '38px', background: '#f0f4f8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: '#32363a', lineHeight: '1.3' }}>{title}</div>
        <div style={{ fontSize: '11px', color: '#89919a', fontFamily: 'Lato, sans-serif', lineHeight: '1.4' }}>{subtitle}</div>
      </div>
    </div>
  )
}

export function LandingScreen({ onSelectOutlook, onSelectSAP }: Props) {
  const [showFlowModal, setShowFlowModal] = useState(false)
  const [showUseCasesModal, setShowUseCasesModal] = useState(false)
  const [vimHovered, setVimHovered] = useState(false)
  const [outlookHovered, setOutlookHovered] = useState(false)

  return (
    <>
      {showFlowModal && <ProcessFlowModal onClose={() => setShowFlowModal(false)} />}
      {showUseCasesModal && <UseCasesModal onClose={() => setShowUseCasesModal(false)} />}
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f0f0', overflow: 'hidden' }}>

        {/* SAP Fiori Shell Bar */}
        <div style={{ height: '44px', background: '#354a5e', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '0', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
          {/* SAP Logo + App Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingRight: '20px', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ width: '34px', height: '21px', background: '#0070B1', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: '11px', fontFamily: 'Arial, sans-serif', fontWeight: 700, letterSpacing: '0.8px' }}>SAP</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Lato, sans-serif', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>SAP S/4HANA Cloud</span>
          </div>

          {/* System info */}
          <div style={{ flex: 1, padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Lato, sans-serif', fontSize: '12px' }}>Bertelsmann · BERT_PRD · Client 100 · EN</span>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowFlowModal(true)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)', fontFamily: 'Lato, sans-serif', fontSize: '12px', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="1" width="10" height="13" rx="1.5" /><path d="M5 5h6M5 8h6M5 11h4" strokeLinecap="round" /><path d="M10 1v3.5H14" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Reimagined with AI
            </button>

            <button
              onClick={() => setShowUseCasesModal(true)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)', fontFamily: 'Lato, sans-serif', fontSize: '12px', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="14" height="12" rx="1.5" /><path d="M4 6h8M4 9h6" strokeLinecap="round" /></svg>
              List of Use Cases
            </button>

            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />

            {/* User avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.2 }}>Lena Fischer</div>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.2 }}>AP Analyst · LFISCHER</div>
              </div>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#0070B1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabin, sans-serif', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>LF</div>
            </div>
          </div>
        </div>

        {/* Launchpad body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 44px 40px' }}>

          {/* Breadcrumb + title */}
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#89919a', fontFamily: 'Lato, sans-serif', fontSize: '12px' }}>SAP Fiori Launchpad / </span>
            <span style={{ color: '#32363a', fontFamily: 'Lato, sans-serif', fontSize: '12px', fontWeight: 600 }}>Accounts Payable</span>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontFamily: 'Cabin, sans-serif', fontSize: '26px', fontWeight: 700, color: '#32363a', margin: '0 0 4px' }}>Invoice Processing</h1>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: '#89919a', margin: 0 }}>SAP S/4HANA · OpenText VIM · AP Workflow · AI-Powered Automation</p>
          </div>

          {/* ─── Group: VIM & AP Processing ─── */}
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 700, color: '#89919a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>VIM &amp; AP Processing</span>
            <div style={{ flex: 1, height: '1px', background: '#d9d9d9' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '36px' }}>

            {/* Primary tile — VIM Invoice Worklist */}
            <div
              onClick={onSelectSAP}
              onMouseEnter={() => setVimHovered(true)}
              onMouseLeave={() => setVimHovered(false)}
              style={{
                width: '210px',
                height: '172px',
                background: 'white',
                borderRadius: '4px',
                boxShadow: vimHovered ? '0 4px 20px rgba(0,112,177,0.28)' : '0 0 0 1px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'all 0.15s',
                transform: vimHovered ? 'translateY(-2px)' : 'none',
                borderTop: '4px solid #0070B1',
                userSelect: 'none',
              }}
            >
              <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '40px', height: '40px', background: '#e8f0fa', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VIMIcon />
                </div>
                <div style={{ fontSize: '14px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: '#32363a', lineHeight: '1.3' }}>VIM Invoice Worklist</div>
                <div style={{ fontSize: '11px', color: '#89919a', fontFamily: 'Lato, sans-serif' }}>OpenText VIM · Cockpit</div>
              </div>
              <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '6px', background: vimHovered ? '#f5f9ff' : 'white', transition: 'background 0.15s' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#0070B1', fontFamily: 'Lato, sans-serif', lineHeight: 1 }}>14</span>
                <div>
                  <div style={{ fontSize: '10px', color: '#89919a', fontFamily: 'Lato, sans-serif', lineHeight: 1.2 }}>documents</div>
                  <div style={{ fontSize: '9px', color: '#b91f1f', fontFamily: 'Lato, sans-serif', lineHeight: 1.2, fontWeight: 600 }}>6 exceptions</div>
                </div>
              </div>
            </div>

            <InactiveTile icon={<WorkflowIcon />} title="AP Workflow Monitor" subtitle="Approval Tracking · FI Workflow" />
            <InactiveTile icon={<GLIcon />} title="GL Coding Workbench" subtitle="Account Assignment · BSEG" />
            <InactiveTile icon={<ExceptionIcon />} title="Exception Monitor" subtitle="Invoice Exceptions · VIM" />
          </div>

          {/* ─── Group: Analytics & Reporting ─── */}
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 700, color: '#89919a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Analytics &amp; Reporting</span>
            <div style={{ flex: 1, height: '1px', background: '#d9d9d9' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '44px', flexWrap: 'wrap' }}>
            <InactiveTile icon={<AnalyticsIcon />} title="Processing Analytics" subtitle="KPI Dashboard · AP Analytics" />
            <InactiveTile icon={<VendorIcon />} title="Vendor Management" subtitle="Vendor Master · BP Cockpit" />
            <InactiveTile icon={<AuditIcon />} title="Audit &amp; Compliance" subtitle="Document Audit Trail · GRC" />
          </div>

          {/* ─── Microsoft 365 Integration ─── */}
          <div style={{ borderTop: '1px solid #d9d9d9', paddingTop: '28px' }}>
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', fontWeight: 700, color: '#89919a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Microsoft 365 Integration</span>
              <div style={{ flex: 1, height: '1px', background: '#d9d9d9' }} />
            </div>

            <div
              onClick={onSelectOutlook}
              onMouseEnter={() => setOutlookHovered(true)}
              onMouseLeave={() => setOutlookHovered(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'white',
                borderRadius: '4px',
                boxShadow: outlookHovered ? '0 4px 14px rgba(0,120,212,0.18)' : '0 0 0 1px rgba(0,0,0,0.10)',
                cursor: 'pointer',
                padding: '12px 20px',
                transition: 'all 0.15s',
                transform: outlookHovered ? 'translateY(-1px)' : 'none',
                userSelect: 'none',
              }}
            >
              <img src="/Outlook.png" alt="Outlook" style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'Cabin, sans-serif', fontWeight: 700, color: '#32363a' }}>Microsoft Outlook</div>
                <div style={{ fontSize: '11px', color: '#0078d4', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>AP Invoice Email Inbox · BERT_AP@bertelsmann.de</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#0078d4" strokeWidth="1.8" style={{ marginLeft: '8px' }}><path d="M3 7h8M8 4l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>

            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: '#b0b8c0', marginTop: '10px' }}>
              AP vendor emails captured from Outlook and ingested into SAP VIM via Email Capture integration.
            </p>
          </div>
        </div>

        {/* SAP Footer bar */}
        <div style={{ height: '30px', background: '#354a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.03em' }}>
            SAP S/4HANA Cloud · Bertelsmann Global · BERT_PRD · Client 100 · © 2026 SAP SE
          </span>
        </div>
      </div>
    </>
  )
}

export function UseCasesPanel() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  return (
    <>
      {selectedCard !== null && (
        <UseCaseCardModal
          no={selectedCard}
          onClose={() => setSelectedCard(null)}
          onPrev={() => setSelectedCard(n => Math.max(1, (n ?? 1) - 1))}
          onNext={() => setSelectedCard(n => Math.min(USE_CASES.length, (n ?? 1) + 1))}
        />
      )}
      <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
        {/* Header banner */}
        <div style={{ background: '#0F1934', padding: '28px 40px 24px', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: '22px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
            Demo Briefing — Use Cases
          </div>
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
            AI-Powered AP Automation · Bertelsmann · 11 Use Cases · Click any row to open context card
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, padding: '28px 40px 40px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            {/* Table header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ width: '32px', flexShrink: 0, fontFamily: 'Cabin, sans-serif', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>#</div>
              <div style={{ flex: 1, fontFamily: 'Cabin, sans-serif', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Use Case</div>
              <div style={{ flexShrink: 0, width: '130px', fontFamily: 'Cabin, sans-serif', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ticket</div>
              <div style={{ flexShrink: 0, width: '130px', textAlign: 'right', fontFamily: 'Cabin, sans-serif', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Amount</div>
              <div style={{ flexShrink: 0, width: '28px' }} />
            </div>

            {USE_CASES.map((uc) => (
              <div
                key={uc.no}
                onClick={() => setSelectedCard(uc.no)}
                onMouseEnter={() => setHoveredRow(uc.no)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '13px 20px',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  background: hoveredRow === uc.no ? '#F5F3FF' : 'transparent',
                  transition: 'background 0.12s',
                }}
              >
                <div style={{ width: '32px', flexShrink: 0, fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>{uc.no}</div>
                <div style={{ flex: 1, fontFamily: 'Lato, sans-serif', fontSize: '14px', color: '#1E293B', fontWeight: 500, paddingRight: '16px' }}>{uc.label}</div>
                <div style={{ flexShrink: 0, width: '130px', fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{uc.ticket}</div>
                <div style={{ flexShrink: 0, width: '130px', textAlign: 'right', fontFamily: 'Cabin, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>{uc.amount}</div>
                <div style={{
                  flexShrink: 0,
                  marginLeft: '12px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: hoveredRow === uc.no ? '#7C3AED' : '#E2E8F0',
                  color: hoveredRow === uc.no ? '#fff' : '#94A3B8',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.12s',
                  fontFamily: 'Lato, sans-serif',
                }}>i</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', fontFamily: 'Lato, sans-serif', fontSize: '12px', color: '#94A3B8', textAlign: 'right' }}>
            Bertelsmann Invoice Processing Automation · Accenture · {USE_CASES.length} use cases
          </div>
        </div>
      </div>
    </>
  )
}
