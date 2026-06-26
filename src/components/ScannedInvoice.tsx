import { useEffect, useRef, useState } from 'react'
import { Invoice } from '../types'

interface Props {
  invoice: Invoice
  isExtractionActive?: boolean
  isExtractionDone?: boolean
  extractionAgentIdx?: number
  showLegend?: boolean
  showConfidenceOverlays?: boolean
}

// visible=false → fully hidden; visible=true → fade-in transition
// Overlay and badge use RAG: green ≥90%, amber 70–89%, red <70%
function HV({ conf, children, visible }: { conf: number; children: React.ReactNode; visible: boolean }) {
  const ragColor = conf >= 90 ? '#1b823f' : conf >= 70 ? '#b06b00' : '#b91f1f'
  const ragBg = conf >= 90 ? 'rgba(27,130,63,0.06)' : conf >= 70 ? 'rgba(176,107,0,0.06)' : 'rgba(185,31,31,0.06)'
  const ragBorder = conf >= 90 ? 'rgba(27,130,63,0.4)' : conf >= 70 ? 'rgba(176,107,0,0.4)' : 'rgba(185,31,31,0.4)'
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <span style={{
        position: 'absolute', top: '-3px', left: '-4px', right: '-4px', bottom: '-3px',
        background: ragBg, border: `1px dashed ${ragBorder}`,
        borderRadius: '2px', pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: visible ? 'opacity 0.4s ease' : 'none',
      }} />
      <span style={{
        position: 'absolute', top: '-12px', right: '-2px',
        fontSize: '9px', color: ragColor, fontWeight: 700,
        background: 'white', padding: '0 2px', lineHeight: '1', whiteSpace: 'nowrap',
        opacity: visible ? 1 : 0,
        transition: visible ? 'opacity 0.4s ease 0.1s' : 'none',
      }}>
        {conf}%
      </span>
    </span>
  )
}

const BILL_TO_FREMANTLE = (
  <>
    Fremantle / RTL Group<br />
    Attn: Accounts Payable (Bertelsmann GBS)<br />
    Picassoplatz 1<br />
    50679 Köln, Germany
  </>
)

// PO invoice — ARRI Rental production equipment (inv-1). 9 HV fields:
// 0 supplier · 1 invoice# · 2 inv date · 3 due date · 4 PO# · 5 SES# · 6 subtotal · 7 tax · 8 total
function POInvoice({ vc }: { vc: number }) {
  const v = (i: number) => vc > i
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
            <HV conf={100} visible={v(0)}>ARRI RENTAL DEUTSCHLAND GMBH</HV>
          </div>
          <div style={{ fontSize: '11px', color: '#555', lineHeight: '1.6' }}>
            Kapellenstraße 19, 85622 Feldkirchen, Munich, Germany<br />
            Tel: +49 (89) 3809-0 | Email: billing@arrirental.de<br />
            USt-IdNr: DE128762100
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>INVOICE</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>Bill To</div>
          <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.7' }}>{BILL_TO_FREMANTLE}</div>
        </div>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '12px' }}>Invoice No.</td><td style={{ fontWeight: 600, color: '#1a1a1a' }}><HV conf={100} visible={v(1)}>ARRI-2026-148750</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '12px' }}>Invoice Date</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(2)}>June 12, 2026</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '12px' }}>Due Date</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(3)}>July 12, 2026</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '12px' }}>PO Number</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(4)}>4500291837</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '12px' }}>SES Ref</td><td style={{ color: '#1a1a1a' }}><HV conf={98} visible={v(5)}>SES-FRM-291837-006</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '12px' }}>Terms</td><td style={{ color: '#1a1a1a' }}>Net 30 · EUR</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
            <th style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Description</th>
            <th style={{ padding: '8px 10px', textAlign: 'center', color: '#555', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', width: '50px' }}>Qty</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', color: '#555', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', width: '90px' }}>Unit Price</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', color: '#555', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', width: '100px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['ALEXA Mini LF Camera Package (3-week rental)', '2', '€18,000.00', '€36,000.00'],
            ['Signature Prime Lens Set', '1', '€22,000.00', '€22,000.00'],
            ['Lighting & Grip Package', '1', '€41,000.00', '€41,000.00'],
            ['SkyPanel S60-C LED', '4', '€4,000.00', '€16,000.00'],
            ['Camera Dolly & Track', '1', '€10,000.00', '€10,000.00'],
          ].map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 10px', color: '#333' }}>{r[0]}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#333' }}>{r[1]}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#333' }}>{r[2]}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <table style={{ fontSize: '11px', minWidth: '230px' }}>
          <tbody>
            <tr><td style={{ padding: '4px 16px 4px 0', color: '#666' }}>Subtotal</td><td style={{ padding: '4px 0', textAlign: 'right', color: '#333' }}><HV conf={100} visible={v(6)}>€125,000.00</HV></td></tr>
            <tr><td style={{ padding: '4px 16px 4px 0', color: '#666' }}>VAT (19%)</td><td style={{ padding: '4px 0', textAlign: 'right', color: '#333' }}><HV conf={100} visible={v(7)}>€23,750.00</HV></td></tr>
            <tr style={{ borderTop: '2px solid #333' }}><td style={{ padding: '6px 16px 4px 0', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}>Total Due</td><td style={{ padding: '6px 0 4px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}><HV conf={100} visible={v(8)}>€148,750.00 EUR</HV></td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px', fontSize: '10px', color: '#888', lineHeight: '1.7' }}>
        <div style={{ fontWeight: 600, marginBottom: '4px', color: '#555' }}>Payment Instructions</div>
        <div>Bank: Commerzbank München &nbsp;|&nbsp; Account Name: ARRI Rental Deutschland GmbH</div>
        <div>IBAN: DE89 7004 0041 0123 4567 00 &nbsp;|&nbsp; BIC: COBADEFFXXX</div>
        <div style={{ marginTop: '8px' }}>Please reference the invoice number on all payments. Queries: billing@arrirental.de</div>
      </div>
    </div>
  )
}

// Lehmanns Media book supply invoice (inv-5 / inv-5-r1) — VAT mismatch scenario.
// 9 HV fields: 0 supplier · 1 invoice# · 2 inv date · 3 PO# · 4 SES# · 5 qty · 6 unit price · 7 subtotal/tax · 8 total
function LehmannsInvoice({ vc, corrected }: { vc: number; corrected?: boolean }) {
  const v = (i: number) => vc > i
  const vatAmt = corrected ? '€3,500.00' : '€9,500.00'
  const total = corrected ? '€53,500.00' : '€59,500.00'
  const vatLabel = corrected ? 'VAT (DE-VAT-RED 7%)' : 'VAT (DE-VAT-STD 19%)'
  return (
    <div style={{ position: 'relative', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#1a3a6b', letterSpacing: '-0.3px', marginBottom: '4px' }}>
            <HV conf={100} visible={v(0)}>LEHMANNS MEDIA GMBH</HV>
          </div>
          <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.6' }}>
            Lehmanns Media GmbH<br />
            Helmholtzstraße 2–9, 10587 Berlin, Germany<br />
            Tel: +49 (30) 4174-3290 &nbsp;|&nbsp; rechnung@lehmanns.de<br />
            USt-IdNr: DE136275489
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Vendor ID: LM-2241</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>Rechnung / Invoice</div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>XRechnung · Page 1 of 1</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '18px', border: '1px solid #ccc', fontSize: '11px' }}>
        <div style={{ padding: '10px 12px', borderRight: '1px solid #ccc' }}>
          <div style={{ fontWeight: 700, color: '#333', marginBottom: '5px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill-To</div>
          <div style={{ color: '#333', lineHeight: '1.65' }}>
            Bertelsmann Education Group<br />
            Attn: Accounts Payable (Bertelsmann GBS)<br />
            Carl-Bertelsmann-Straße 270<br />
            33311 Gütersloh, Germany
          </div>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, color: '#333', marginBottom: '5px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Details</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <tr><td style={{ color: '#555', paddingBottom: '3px', paddingRight: '8px', fontWeight: 600 }}>Invoice No.</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(1)}>{corrected ? 'LM-2026-04781-R1' : 'LM-2026-04781'}</HV></td></tr>
              <tr><td style={{ color: '#555', paddingBottom: '3px', paddingRight: '8px', fontWeight: 600 }}>Invoice Date</td><td style={{ color: '#1a1a1a' }}><HV conf={98} visible={v(2)}>15.04.2026</HV></td></tr>
              <tr><td style={{ color: '#555', paddingBottom: '3px', paddingRight: '8px', fontWeight: 600 }}>PO Number</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(3)}>4500301992</HV></td></tr>
              <tr><td style={{ color: '#555', paddingBottom: '3px', paddingRight: '8px', fontWeight: 600 }}>SES Ref</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(4)}>SES-EDU-301992-001</HV></td></tr>
              <tr><td style={{ color: '#555', paddingBottom: '3px', paddingRight: '8px', fontWeight: 600 }}>Currency</td><td style={{ color: '#1a1a1a' }}>EUR</td></tr>
              <tr><td style={{ color: '#555', paddingRight: '8px', fontWeight: 600 }}>Payment Terms</td><td style={{ color: '#1a1a1a' }}>Net 30</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0', fontSize: '11px', border: '1px solid #ccc' }}>
        <thead>
          <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
            <th style={{ padding: '7px 10px', textAlign: 'left', color: '#444', fontWeight: 700, fontSize: '10px', width: '30px' }}>#</th>
            <th style={{ padding: '7px 10px', textAlign: 'left', color: '#444', fontWeight: 700, fontSize: '10px' }}>Description</th>
            <th style={{ padding: '7px 10px', textAlign: 'center', color: '#444', fontWeight: 700, fontSize: '10px', width: '70px' }}>Qty</th>
            <th style={{ padding: '7px 10px', textAlign: 'right', color: '#444', fontWeight: 700, fontSize: '10px', width: '90px' }}>Unit Price</th>
            <th style={{ padding: '7px 10px', textAlign: 'right', color: '#444', fontWeight: 700, fontSize: '10px', width: '90px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
            <td style={{ padding: '8px 10px', color: '#333', textAlign: 'center' }}>1</td>
            <td style={{ padding: '8px 10px', color: '#333' }}><div style={{ fontWeight: 600 }}>Hardcover Textbook "Medizinische Grundlagen"</div></td>
            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#333' }}><HV conf={98} visible={v(5)}>1,000</HV></td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#333' }}><HV conf={98} visible={v(6)}>€35.00</HV></td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}>€35,000.00</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
            <td style={{ padding: '8px 10px', color: '#333', textAlign: 'center' }}>2</td>
            <td style={{ padding: '8px 10px', color: '#333' }}><div style={{ fontWeight: 600 }}>Paperback Study Guides</div></td>
            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#333' }}>1,500</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#333' }}>€8.00</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}>€12,000.00</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', color: '#333', textAlign: 'center' }}>3</td>
            <td style={{ padding: '8px 10px', color: '#333' }}><div style={{ fontWeight: 600 }}>Reference Atlas (Hardcover)</div></td>
            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#333' }}>200</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#333' }}>€15.00</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}><HV conf={100} visible={v(7)}>€3,000.00</HV></td>
          </tr>
        </tbody>
      </table>

      <div style={{ borderTop: '2px solid #888', marginTop: '0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '1px solid #ddd', fontSize: '11px' }}>
          <span style={{ color: '#444' }}>Net Amount</span><span style={{ color: '#333' }}>€50,000.00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '1px solid #ddd', fontSize: '11px' }}>
          <span style={{ color: corrected ? '#1b823f' : '#b91f1f', fontWeight: 600 }}>{vatLabel}</span>
          <span style={{ color: corrected ? '#1b823f' : '#b91f1f', fontWeight: 600 }}>{vatAmt}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '2px solid #888', fontSize: '12px' }}>
          <span style={{ fontWeight: 700, color: '#1a1a1a' }}>Total Amount (EUR)</span>
          <span style={{ fontWeight: 700, color: '#1a1a1a' }}><HV conf={100} visible={v(8)}>{total}</HV></span>
        </div>
      </div>

      <div style={{ marginTop: '14px', fontSize: '10px', color: '#555', lineHeight: '1.6' }}>
        <div style={{ marginBottom: '8px', color: '#444', fontStyle: 'italic' }}>
          Printed books are subject to the reduced German VAT rate of 7% (§12 Abs. 2 UStG). e-invoice issued per XRechnung / ZUGFeRD.
        </div>
        <div style={{ paddingTop: '8px', borderTop: '1px solid #ddd' }}>
          <div style={{ fontWeight: 700, color: '#333', marginBottom: '3px' }}>Bank Transfer:</div>
          <div>Bank: Deutsche Bank Berlin &nbsp;|&nbsp; IBAN: DE12 1007 0000 0987 6543 21 &nbsp;|&nbsp; BIC: DEUTDEBBXXX</div>
        </div>
      </div>
    </div>
  )
}

// Sunset Post Production invoice (inv-2) — single milestone line. 9 HV fields:
// 0 supplier · 1 invoice# · 2 inv date · 3 PO# · (4 unused) · 5 qty · 6 unit · (7 unused) · 8 total
function SunsetPostInvoice({ vc }: { vc: number }) {
  const v = (i: number) => vc > i
  return (
    <div style={{ position: 'relative', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
            <HV conf={100} visible={v(0)}>SUNSET POST PRODUCTION LTD</HV>
          </div>
          <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.6' }}>
            12 Soho Square, London W1D 3QF<br />
            United Kingdom<br />
            VAT Reg: GB 422 8810 55
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>Invoice</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11px' }}>
        <div><span style={{ color: '#888' }}>Invoice No: </span><span style={{ fontWeight: 600, color: '#1a1a1a' }}><HV conf={100} visible={v(1)}>SPP-2026-0461</HV></span></div>
        <div><span style={{ color: '#888' }}>Date: </span><span style={{ color: '#1a1a1a' }}><HV conf={98} visible={v(2)}>14 June 2026</HV></span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '11px' }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>Bill To</div>
          <div style={{ color: '#333', lineHeight: '1.65' }}>{BILL_TO_FREMANTLE}</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>Production</div>
          <div style={{ color: '#333', lineHeight: '1.65' }}>
            "Coastlines" Season 2<br />
            Episode 6 — Picture & Sound Post<br />
            Milestone: Ep.6 Picture Lock
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>S.No.</th>
            <th style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Particulars</th>
            <th style={{ padding: '8px 10px', textAlign: 'center', color: '#555', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', width: '70px' }}>Qty</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', color: '#555', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', width: '110px' }}>Amount EUR</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '10px 10px', color: '#555', textAlign: 'center' }}>1</td>
            <td style={{ padding: '10px 10px', color: '#333' }}>
              <div style={{ fontWeight: 500 }}>Picture & Sound Post — "Coastlines" S2 Ep.6</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>
                PO No.: <HV conf={100} visible={v(3)}>4500288120</HV> &nbsp;|&nbsp; Milestone: Ep.6 Picture Lock
              </div>
            </td>
            <td style={{ padding: '10px 10px', textAlign: 'center', color: '#333' }}><HV conf={98} visible={v(5)}>1</HV></td>
            <td style={{ padding: '10px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}><HV conf={98} visible={v(6)}>312,000.00</HV></td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <table style={{ fontSize: '11px', minWidth: '220px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderTop: '2px solid #333' }}><td style={{ padding: '8px 16px 4px 0', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}>Total (EUR)</td><td style={{ padding: '8px 0 4px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}><HV conf={100} visible={v(8)}>312,000.00</HV></td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: '14px', fontSize: '10px', color: '#666', lineHeight: '1.7' }}>
        <div style={{ marginBottom: '6px', color: '#444' }}>
          Cross-border supply of services — reverse charge applies (VAT to be accounted for by the recipient).
        </div>
        <div style={{ fontWeight: 700, color: '#333', marginBottom: '3px' }}>Payment Instructions</div>
        <div>Beneficiary: Sunset Post Production Ltd &nbsp;|&nbsp; Bank: Barclays London</div>
        <div>IBAN: GB29 BARC 2000 0055 7799 11 &nbsp;|&nbsp; BIC: BARCGB22</div>
        <div style={{ marginTop: '6px', color: '#888' }}>Payment Terms: Net 45.</div>
      </div>
    </div>
  )
}

// Generic Non-PO service invoice — used for advisory/creative spend (inv-4, inv-6). 7 HV fields:
// 0 supplier · 1 bill no · 2 inv date · 3 due date · 4 subtotal · 5 tax · 6 total
function NonPOInvoice({ vc }: { vc: number }) {
  const v = (i: number) => vc > i
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ background: '#1d3557', borderRadius: '3px 3px 0 0', padding: '14px 18px', marginBottom: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.02em', marginBottom: '2px' }}>
            <HV conf={100} visible={v(0)}>DELOITTE CONSULTING GMBH</HV>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.5' }}>
            Schwannstraße 6, 40476 Düsseldorf, Germany &nbsp;|&nbsp; USt-IdNr: DE811138787
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Service Invoice</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', marginTop: '2px' }}>INVOICE</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '18px', border: '1px solid #dde', borderTop: '3px solid #1d3557' }}>
        <div style={{ padding: '12px 14px', borderRight: '1px solid #dde' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#1d3557', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Billed To</div>
          <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.7', fontWeight: 500 }}>
            Bertelsmann Group — Arvato Connect<br />
            Attn: Accounts Payable (Bertelsmann GBS)<br />
            Carl-Bertelsmann-Straße 270, 33311 Gütersloh
          </div>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px', whiteSpace: 'nowrap' }}>Bill No.</td><td style={{ fontWeight: 600, color: '#1a1a1a' }}><HV conf={100} visible={v(1)}>DLT-2026-05-001</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px' }}>Invoice No.</td><td style={{ fontWeight: 600, color: '#1a1a1a' }}>DLT-2026-7741</td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px' }}>Invoice Date</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(2)}>June 10, 2026</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px' }}>Due Date</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(3)}>June 25, 2026</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px' }}>Terms</td><td style={{ color: '#1a1a1a' }}>Net 15 &nbsp;|&nbsp; EUR</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: '16px', padding: '9px 13px', background: '#f4f7fc', border: '1px solid #c6d6ee', borderLeft: '3px solid #1d3557', borderRadius: '0 3px 3px 0' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#1d3557', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Description of Services</div>
        <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.6' }}>
          Advisory services for Arvato Connect — operating-model design workshops, process diagnostics, and implementation roadmap per engagement letter.
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#1d3557' }}>
            <th style={{ padding: '7px 10px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ref</th>
            <th style={{ padding: '7px 10px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
            <th style={{ padding: '7px 10px', textAlign: 'center', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '45px' }}>Qty</th>
            <th style={{ padding: '7px 10px', textAlign: 'right', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '95px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['DLT-001', 'Operating-model design workshops', '1', '€18,000.00'],
            ['DLT-002', 'Process diagnostics & current-state assessment', '1', '€12,000.00'],
            ['DLT-003', 'Implementation roadmap', '1', '€6,000.00'],
          ].map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 ? '#fafafa' : '#fff' }}>
              <td style={{ padding: '7px 10px', color: '#555', fontFamily: 'monospace', fontSize: '10px' }}>{r[0]}</td>
              <td style={{ padding: '7px 10px', color: '#333' }}>{r[1]}</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', color: '#333' }}>{r[2]}</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.7' }}>
          <div style={{ fontWeight: 600, marginBottom: '2px', color: '#1d3557', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Remittance</div>
          <div>Bank: Deutsche Bank Düsseldorf &nbsp;|&nbsp; A/C: Deloitte Consulting GmbH</div>
          <div>IBAN: DE60 3007 0010 0123 4567 00 &nbsp;|&nbsp; BIC: DEUTDEDDXXX</div>
          <div style={{ marginTop: '5px', color: '#aaa' }}>Ref: DLT-2026-7741 on all payments &nbsp;·&nbsp; billing@deloitte.de</div>
        </div>
        <table style={{ fontSize: '11px', minWidth: '200px' }}>
          <tbody>
            <tr><td style={{ padding: '3px 16px 3px 0', color: '#666' }}>Net Amount</td><td style={{ padding: '3px 0', textAlign: 'right', color: '#333' }}><HV conf={100} visible={v(4)}>€36,000.00</HV></td></tr>
            <tr><td style={{ padding: '3px 16px 3px 0', color: '#666' }}>VAT (19%)</td><td style={{ padding: '3px 0', textAlign: 'right', color: '#333' }}><HV conf={98} visible={v(5)}>€6,840.00</HV></td></tr>
            <tr style={{ borderTop: '2px solid #1d3557' }}><td style={{ padding: '6px 16px 4px 0', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}>Total Due</td><td style={{ padding: '6px 0 4px', textAlign: 'right', fontWeight: 700, color: '#1d3557', fontSize: '13px' }}><HV conf={100} visible={v(6)}>€42,840.00</HV></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Intercompany content cross-charge (inv-12). 6 HV fields:
// 0 supplier · 1 doc no · 2 inv date · 3 trading partner · 4 amount A · 5 total
function ICInvoice({ vc }: { vc: number }) {
  const v = (i: number) => vc > i
  return (
    <div style={{ position: 'relative', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#5a2d82', marginBottom: '4px' }}>
            <HV conf={100} visible={v(0)}>FREMANTLE LTD (UK)</HV>
          </div>
          <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.6' }}>
            1 Stephen Street, London W1T 1AL, United Kingdom<br />
            A Bertelsmann / RTL Group company<br />
            VAT Reg: GB 590 1188 22
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#5a2d82', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Intercompany</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>IC CHARGE NOTE</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '18px', border: '1px solid #d9cce6', fontSize: '11px' }}>
        <div style={{ padding: '10px 12px', borderRight: '1px solid #d9cce6' }}>
          <div style={{ fontWeight: 700, color: '#5a2d82', marginBottom: '5px', fontSize: '10px', textTransform: 'uppercase' }}>Charged To (Trading Partner)</div>
          <div style={{ color: '#333', lineHeight: '1.65' }}>
            <HV conf={100} visible={v(3)}>RTL Deutschland GmbH</HV><br />
            Picassoplatz 1, 50679 Köln<br />
            IC Clearing Account
          </div>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <tr><td style={{ color: '#555', paddingBottom: '3px', fontWeight: 600 }}>IC Document</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(1)}>IC-INV-FRM-88421</HV></td></tr>
              <tr><td style={{ color: '#555', paddingBottom: '3px', fontWeight: 600 }}>Date</td><td style={{ color: '#1a1a1a' }}><HV conf={98} visible={v(2)}>June 17, 2026</HV></td></tr>
              <tr><td style={{ color: '#555', paddingBottom: '3px', fontWeight: 600 }}>Period</td><td style={{ color: '#1a1a1a' }}>June 2026</td></tr>
              <tr><td style={{ color: '#555', fontWeight: 600 }}>Currency</td><td style={{ color: '#1a1a1a' }}>EUR</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '11px', border: '1px solid #d9cce6' }}>
        <thead>
          <tr style={{ background: '#f3eef9', borderBottom: '1px solid #d9cce6' }}>
            <th style={{ padding: '7px 10px', textAlign: 'left', color: '#5a2d82', fontWeight: 700, fontSize: '10px' }}>Description</th>
            <th style={{ padding: '7px 10px', textAlign: 'right', color: '#5a2d82', fontWeight: 700, fontSize: '10px', width: '120px' }}>Amount EUR</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '9px 10px', color: '#333' }}>Shared format rights — content cross-charge</td>
            <td style={{ padding: '9px 10px', textAlign: 'right', color: '#333' }}>€156,000.00</td>
          </tr>
          <tr>
            <td style={{ padding: '9px 10px', color: '#333' }}>Production cost recharge</td>
            <td style={{ padding: '9px 10px', textAlign: 'right', color: '#333' }}>€58,000.00</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
        <table style={{ fontSize: '11px', minWidth: '230px' }}>
          <tbody>
            <tr><td style={{ padding: '4px 16px 4px 0', color: '#666' }}>IC Invoice (Fremantle UK)</td><td style={{ padding: '4px 0', textAlign: 'right', color: '#333' }}><HV conf={100} visible={v(4)}>€214,000.00</HV></td></tr>
            <tr><td style={{ padding: '4px 16px 4px 0', color: '#b91f1f' }}>IC Clearing (RTL DE)</td><td style={{ padding: '4px 0', textAlign: 'right', color: '#b91f1f' }}>€198,500.00</td></tr>
            <tr style={{ borderTop: '2px solid #5a2d82' }}><td style={{ padding: '6px 16px 4px 0', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}>Posted Amount</td><td style={{ padding: '6px 0 4px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}><HV conf={100} visible={v(5)}>€214,000.00</HV></td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: '12px', fontSize: '10px', color: '#888', lineHeight: '1.7' }}>
        Both sides post to the standard intercompany clearing account. Reconciled via the ICE system across affiliated entities.
      </div>
    </div>
  )
}

// Royalty invoice — Wylie Agency (inv-13). 6 HV fields:
// 0 supplier · 1 invoice# · 2 inv date · 3 author/title · 4 rate · 5 total
function RoyaltyInvoice({ vc }: { vc: number }) {
  const v = (i: number) => vc > i
  return (
    <div style={{ position: 'relative', fontFamily: 'Georgia, serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '2px solid #1a1a1a', paddingBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '0.02em', marginBottom: '4px' }}>
            <HV conf={100} visible={v(0)}>THE WYLIE AGENCY LLC</HV>
          </div>
          <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.6', fontFamily: 'Arial, sans-serif' }}>
            250 West 57th Street, Suite 2114, New York, NY 10107, USA<br />
            Literary representation &nbsp;|&nbsp; royalties@wylieagency.com
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>ROYALTY INVOICE</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Bill To</div>
          <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.7' }}>
            Penguin Random House LLC<br />
            Attn: Royalty Accounting<br />
            1745 Broadway, New York, NY 10019
          </div>
        </div>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '12px' }}>Invoice No.</td><td style={{ fontWeight: 600, color: '#1a1a1a' }}><HV conf={100} visible={v(1)}>WYL-RY-2026-0312</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '12px' }}>Invoice Date</td><td style={{ color: '#1a1a1a' }}><HV conf={98} visible={v(2)}>June 15, 2026</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '12px' }}>Contract Ref</td><td style={{ color: '#1a1a1a' }}>PRH-CTR-2023-4471</td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '12px' }}>Terms</td><td style={{ color: '#1a1a1a' }}>Net 30 · USD</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '11px', fontFamily: 'Arial, sans-serif', border: '1px solid #ccc' }}>
        <thead>
          <tr style={{ background: '#f3f0ea', borderBottom: '1px solid #ccc' }}>
            <th style={{ padding: '7px 10px', textAlign: 'left', color: '#444', fontWeight: 700, fontSize: '10px' }}>Author / Title</th>
            <th style={{ padding: '7px 10px', textAlign: 'left', color: '#444', fontWeight: 700, fontSize: '10px' }}>Basis</th>
            <th style={{ padding: '7px 10px', textAlign: 'center', color: '#444', fontWeight: 700, fontSize: '10px', width: '70px' }}>Rate</th>
            <th style={{ padding: '7px 10px', textAlign: 'right', color: '#444', fontWeight: 700, fontSize: '10px', width: '110px' }}>Amount USD</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px 10px', color: '#333' }}><HV conf={100} visible={v(3)}>Eleanor Vance — "The Long Horizon"</HV></td>
            <td style={{ padding: '10px 10px', color: '#333' }}>Hardback net receipts (H1 2026)</td>
            <td style={{ padding: '10px 10px', textAlign: 'center', color: '#b91f1f', fontWeight: 700 }}><HV conf={100} visible={v(4)}>15.0%</HV></td>
            <td style={{ padding: '10px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}>$32,400.00</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px', fontFamily: 'Arial, sans-serif' }}>
        <table style={{ fontSize: '11px', minWidth: '220px' }}>
          <tbody>
            <tr style={{ borderTop: '2px solid #333' }}><td style={{ padding: '6px 16px 4px 0', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}>Total Due</td><td style={{ padding: '6px 0 4px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}><HV conf={100} visible={v(5)}>$32,400.00 USD</HV></td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: '12px', fontSize: '10px', color: '#888', lineHeight: '1.7', fontFamily: 'Arial, sans-serif' }}>
        Royalty invoiced at 15.0% on hardback net receipts. Per contract PRH-CTR-2023-4471, the agreed hardback rate is 12.5%. Remit to The Wylie Agency LLC client account.
      </div>
    </div>
  )
}

// Scanned royalty/IT statement (inv-9 BMG royalty, inv-10/11 T-Systems IT) — rendered as a
// photocopied-look HTML doc with AI overlay badges (no external image dependency).
function ScannedCopyInvoice({ vc, invoice }: { vc: number; invoice: Invoice }) {
  const v = (i: number) => vc > i
  const isRoyalty = invoice.id === 'inv-9'
  const f = invoice.extractedFields
  const cur = f.currency === 'EUR' ? '€' : '$'
  const fmtAmt = (n: number) => `${cur}${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const supplier = isRoyalty ? 'Kobalt Music Group' : 'T-Systems International GmbH'
  const docLabel = isRoyalty ? 'Royalty / Usage Statement' : 'Service Invoice'
  const activity = isRoyalty ? 'Q1 2026 Usage Pool — Administration Agreement' : 'Managed IT Services — MSA Hours Pool'
  return (
    <div style={{ position: 'relative', fontFamily: 'Arial, sans-serif', filter: 'grayscale(0.35) contrast(1.05)', transform: 'rotate(-0.4deg)' }}>
      <div style={{ textAlign: 'center', fontSize: '9px', color: '#aaa', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Scanned Copy — {docLabel}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0', border: '1px solid #bbb', marginBottom: '12px' }}>
        <div style={{ padding: '8px 12px', borderRight: '1px solid #bbb' }}>
          <div style={{ fontSize: '9px', color: '#666', fontWeight: 700, marginBottom: '4px' }}>Supplier</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}><HV conf={92} visible={v(0)}>{supplier}</HV></div>
          <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>{isRoyalty ? 'royalties@kobaltmusic.com' : 'billing@t-systems.com'}</div>
        </div>
        <div style={{ padding: '8px 12px' }}>
          <div style={{ fontSize: '9px', color: '#666', fontWeight: 700, marginBottom: '4px' }}>Bill-to</div>
          <div style={{ fontSize: '10px', color: '#444', lineHeight: '1.6' }}>{isRoyalty ? 'BMG Rights Management' : 'Arvato Systems'}<br />Bertelsmann GBS</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', border: '1px solid #bbb', fontSize: '10px' }}>
        <tbody>
          <tr style={{ borderBottom: '1px solid #bbb', background: '#f4f4f4' }}>
            <td style={{ padding: '5px 8px', color: '#555', width: '28%' }}>Document Number</td>
            <td style={{ padding: '5px 8px', color: '#1a1a1a', fontWeight: 600, width: '22%' }}><HV conf={88} visible={v(1)}>{f.invoiceNumber}</HV></td>
            <td style={{ padding: '5px 8px', color: '#555', width: '25%', borderLeft: '1px solid #bbb' }}>Payment Due</td>
            <td style={{ padding: '5px 8px', color: '#1a1a1a', fontWeight: 500 }}><HV conf={85} visible={v(3)}>{f.dueDate}</HV></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #bbb' }}>
            <td style={{ padding: '5px 8px', color: '#555' }}>Document Date</td>
            <td style={{ padding: '5px 8px', color: '#1a1a1a' }}><HV conf={85} visible={v(2)}>{f.invoiceDate}</HV></td>
            <td style={{ padding: '5px 8px', color: '#555', borderLeft: '1px solid #bbb' }}>Payment Terms</td>
            <td style={{ padding: '5px 8px', color: '#1a1a1a' }}><HV conf={80} visible={v(1)}>{f.paymentTerms}</HV></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #bbb', background: '#f4f4f4' }}>
            <td style={{ padding: '5px 8px', color: '#555' }}>{isRoyalty ? 'PO / Contract' : 'Sales Order'}</td>
            <td style={{ padding: '5px 8px', color: '#1a1a1a' }}><HV conf={78} visible={v(4)}>{f.grNumber ?? f.contractRef ?? 'SO-8426'}</HV></td>
            <td style={{ padding: '5px 8px', color: '#555', borderLeft: '1px solid #bbb' }}>Contract Ref</td>
            <td style={{ padding: '5px 8px', color: '#1a1a1a', fontWeight: 500 }}><HV conf={75} visible={v(4)}>{f.contractRef ?? f.poNumber ?? 'Contract 10008'}</HV></td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: '10px', color: '#444', marginBottom: '8px' }}>
        As per {f.contractRef ?? 'Contract 10008, Exhibit B'}, we hereby invoice you for:
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', border: '1px solid #bbb', fontSize: '10px' }}>
        <thead>
          <tr style={{ background: '#eee', borderBottom: '1px solid #bbb' }}>
            <th style={{ padding: '6px 10px', textAlign: 'left', color: '#444', fontWeight: 700 }}>Activity</th>
            <th style={{ padding: '6px 10px', textAlign: 'right', color: '#444', fontWeight: 700, width: '110px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '8px 10px', color: '#333' }}><HV conf={72} visible={v(5)}>{activity}</HV></td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}><HV conf={90} visible={v(5)}>{fmtAmt(f.subtotal)}</HV></td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <table style={{ fontSize: '10px', minWidth: '210px', border: '1px solid #bbb' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #bbb' }}><td style={{ padding: '5px 12px', color: '#555' }}>Subtotal:</td><td style={{ padding: '5px 12px', textAlign: 'right', color: '#333' }}><HV conf={90} visible={v(6)}>{fmtAmt(f.subtotal)}</HV></td></tr>
            <tr style={{ borderBottom: '1px solid #bbb' }}><td style={{ padding: '5px 12px', color: '#555' }}>Tax:</td><td style={{ padding: '5px 12px', textAlign: 'right', color: '#333' }}><HV conf={88} visible={v(7)}>0.00</HV></td></tr>
            <tr style={{ background: '#f4f4f4' }}><td style={{ padding: '5px 12px', fontWeight: 700, color: '#1a1a1a' }}>Total Payable<br />{f.currency}:</td><td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a' }}><HV conf={90} visible={v(8)}>{fmtAmt(f.totalAmount)}</HV></td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px solid #ccc', paddingTop: '12px', fontSize: '10px', color: '#555', lineHeight: '1.6' }}>
        <div style={{ fontWeight: 700, marginBottom: '3px', color: '#222' }}>Remit payment to bank account on file.</div>
        <div>Moderate-quality scan — some fields extracted below the auto-approval confidence threshold and require manual verification.</div>
      </div>
    </div>
  )
}

// Maersk Line ocean freight invoice (inv-3 — MAEU-2026-58900). 8 HV fields:
// 0 supplier · 1 invoice# · 2 inv date · 3 due date · 4 PO# · 5 B/L ref · 6 subtotal · 7 total
function MaerskInvoice({ vc }: { vc: number }) {
  const v = (i: number) => vc > i
  return (
    <div style={{ position: 'relative', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '3px solid #003B71', paddingBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#003B71', letterSpacing: '0.04em', marginBottom: '4px' }}>
            <HV conf={100} visible={v(0)}>MAERSK LINE</HV>
          </div>
          <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.6' }}>
            A.P. Møller – Mærsk A/S<br />
            Esplanaden 50, 1098 Copenhagen K, Denmark<br />
            invoices@maersk.com &nbsp;|&nbsp; maersk.com
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#003B71', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '2px' }}>Ocean Freight</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>INVOICE</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '18px', border: '1px solid #ccc', fontSize: '11px' }}>
        <div style={{ padding: '10px 12px', borderRight: '1px solid #ccc' }}>
          <div style={{ fontWeight: 700, color: '#003B71', marginBottom: '5px', fontSize: '10px', textTransform: 'uppercase' }}>Bill To</div>
          <div style={{ color: '#333', lineHeight: '1.65' }}>
            Penguin Random House LLC<br />
            Attn: Accounts Payable (Finance)<br />
            1745 Broadway, New York, NY 10019<br />
            USA
          </div>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px', fontWeight: 600 }}>Invoice No.</td><td style={{ fontWeight: 600, color: '#1a1a1a' }}><HV conf={100} visible={v(1)}>MAEU-2026-58900</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px', fontWeight: 600 }}>Invoice Date</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(2)}>June 12, 2026</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px', fontWeight: 600 }}>Due Date</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(3)}>July 12, 2026</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px', fontWeight: 600 }}>PO Reference</td><td style={{ color: '#1a1a1a' }}><HV conf={98} visible={v(4)}>PO-PRH-2026-04417</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px', fontWeight: 600 }}>Currency</td><td style={{ color: '#1a1a1a' }}>USD</td></tr>
              <tr><td style={{ color: '#888', paddingRight: '10px', fontWeight: 600 }}>Payment Terms</td><td style={{ color: '#1a1a1a' }}>Net 30</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: '16px', padding: '9px 13px', background: '#f0f4fa', border: '1px solid #c6d6ee', borderLeft: '3px solid #003B71', borderRadius: '0 3px 3px 0' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#003B71', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Shipment Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: '#333' }}>
          <div><span style={{ color: '#888' }}>B/L Number: </span><HV conf={95} visible={v(5)}>MAEU026HWB0041</HV></div>
          <div><span style={{ color: '#888' }}>Vessel: </span>Maersk Essex</div>
          <div><span style={{ color: '#888' }}>Origin Port: </span>Hamburg (DEHAM)</div>
          <div><span style={{ color: '#888' }}>Dest. Port: </span>Baltimore (USBAL)</div>
          <div><span style={{ color: '#888' }}>Container: </span>MSCU4812770 (40&prime; HC)</div>
          <div><span style={{ color: '#888' }}>Cargo: </span>Printed Books — PRH Distribution</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '11px', border: '1px solid #ccc' }}>
        <thead>
          <tr style={{ background: '#003B71' }}>
            <th style={{ padding: '7px 10px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Charge Description</th>
            <th style={{ padding: '7px 10px', textAlign: 'center', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', width: '80px' }}>Unit</th>
            <th style={{ padding: '7px 10px', textAlign: 'right', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', width: '110px' }}>Amount USD</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Ocean Freight — Hamburg to Baltimore', '1 × 40′ HC', '$38,200.00'],
            ['Bunker Adjustment Factor (BAF)', '1 × 40′ HC', '$8,400.00'],
            ['Terminal Handling — Origin (THC)', '1 × 40′ HC', '$3,850.00'],
            ['Terminal Handling — Destination', '1 × 40′ HC', '$4,200.00'],
            ['Documentation & B/L Fee', '1', '$450.00'],
            ['Security Surcharge (ISPS)', '1 × 40′ HC', '$1,800.00'],
            ['Carbon Levy (EU ETS)', '1 × 40′ HC', '$2,000.00'],
          ].map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 ? '#fafafa' : '#fff' }}>
              <td style={{ padding: '7px 10px', color: '#333' }}>{r[0]}</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', color: '#555' }}>{r[1]}</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}>{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <table style={{ fontSize: '11px', minWidth: '230px' }}>
          <tbody>
            <tr><td style={{ padding: '4px 16px 4px 0', color: '#666' }}>Freight &amp; Surcharges</td><td style={{ padding: '4px 0', textAlign: 'right', color: '#333' }}><HV conf={100} visible={v(6)}>$58,900.00</HV></td></tr>
            <tr><td style={{ padding: '4px 16px 4px 0', color: '#666' }}>Tax / Duties</td><td style={{ padding: '4px 0', textAlign: 'right', color: '#333' }}>$0.00</td></tr>
            <tr style={{ borderTop: '2px solid #003B71' }}><td style={{ padding: '6px 16px 4px 0', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}>Total Due</td><td style={{ padding: '6px 0 4px', textAlign: 'right', fontWeight: 700, color: '#003B71', fontSize: '13px' }}><HV conf={100} visible={v(7)}>$58,900.00 USD</HV></td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: '14px', fontSize: '10px', color: '#888', lineHeight: '1.7' }}>
        <div style={{ fontWeight: 600, marginBottom: '2px', color: '#003B71', fontSize: '10px', textTransform: 'uppercase' }}>Payment Instructions</div>
        <div>Beneficiary: A.P. Møller – Mærsk A/S &nbsp;|&nbsp; Bank: Danske Bank Copenhagen</div>
        <div>IBAN: DK50 0040 0440 1162 43 &nbsp;|&nbsp; BIC: DABADKKKXXX</div>
        <div style={{ marginTop: '6px', color: '#aaa' }}>Please quote invoice number on remittance. Queries: invoices@maersk.com</div>
      </div>
    </div>
  )
}

// Jung von Matt creative agency invoice (inv-6 — JVM-2026-0623). 7 HV fields:
// 0 supplier · 1 invoice# · 2 inv date · 3 due date · 4 net amount · 5 VAT · 6 total
function JungVonMattInvoice({ vc }: { vc: number }) {
  const v = (i: number) => vc > i
  return (
    <div style={{ position: 'relative', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#111', borderRadius: '3px 3px 0 0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff', letterSpacing: '0.06em', marginBottom: '2px' }}>
            <HV conf={100} visible={v(0)}>JUNG VON MATT AG</HV>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.5' }}>
            Glashüttenstraße 79, 20357 Hamburg, Germany &nbsp;|&nbsp; USt-IdNr: DE212756870
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '2px' }}>Creative Services</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>INVOICE</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '18px', border: '1px solid #ddd', borderTop: '3px solid #111', fontSize: '11px' }}>
        <div style={{ padding: '12px 14px', borderRight: '1px solid #ddd' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#111', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Billed To</div>
          <div style={{ color: '#333', lineHeight: '1.7' }}>
            Bertelsmann Marketing Services GmbH<br />
            Attn: Territory Marketing — AP (Bertelsmann GBS)<br />
            Carl-Bertelsmann-Straße 270, 33311 Gütersloh
          </div>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px' }}>Invoice No.</td><td style={{ fontWeight: 600, color: '#1a1a1a' }}><HV conf={100} visible={v(1)}>JVM-2026-0623</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px' }}>Invoice Date</td><td style={{ color: '#1a1a1a' }}><HV conf={98} visible={v(2)}>June 16, 2026</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px' }}>Due Date</td><td style={{ color: '#1a1a1a' }}><HV conf={98} visible={v(3)}>July 1, 2026</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px' }}>Terms</td><td style={{ color: '#1a1a1a' }}>Net 15 &nbsp;|&nbsp; EUR</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: '16px', padding: '9px 13px', background: '#f7f7f7', border: '1px solid #e0e0e0', borderLeft: '3px solid #111', borderRadius: '0 3px 3px 0' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#111', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Scope of Work</div>
        <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.6' }}>
          Campaign creative and production services for the Territory marketing team — concept development, key visual design, and asset production for a seasonal campaign, June 2026.
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '11px', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ background: '#111' }}>
            <th style={{ padding: '7px 10px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Ref</th>
            <th style={{ padding: '7px 10px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Description</th>
            <th style={{ padding: '7px 10px', textAlign: 'center', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', width: '45px' }}>Qty</th>
            <th style={{ padding: '7px 10px', textAlign: 'right', color: '#fff', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', width: '100px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['JVM-A01', 'Creative Concept Development & Strategy', '1', '€6,200.00'],
            ['JVM-A02', 'Key Visual Design (3 formats, 2 revisions)', '1', '€7,400.00'],
            ['JVM-A03', 'Asset Production & Format Adaptation', '1', '€4,800.00'],
          ].map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 ? '#fafafa' : '#fff' }}>
              <td style={{ padding: '7px 10px', color: '#555', fontFamily: 'monospace', fontSize: '10px' }}>{r[0]}</td>
              <td style={{ padding: '7px 10px', color: '#333' }}>{r[1]}</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', color: '#333' }}>{r[2]}</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.7' }}>
          <div style={{ fontWeight: 600, marginBottom: '2px', color: '#111', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bank Details</div>
          <div>Bank: Commerzbank Hamburg &nbsp;|&nbsp; A/C: Jung von Matt AG</div>
          <div>IBAN: DE29 2004 0060 0290 0012 00 &nbsp;|&nbsp; BIC: COBADEHHXXX</div>
          <div style={{ marginTop: '5px', color: '#aaa' }}>Ref: JVM-2026-0623 &nbsp;·&nbsp; billing@jvm.de</div>
        </div>
        <table style={{ fontSize: '11px', minWidth: '200px' }}>
          <tbody>
            <tr><td style={{ padding: '3px 16px 3px 0', color: '#666' }}>Net Amount</td><td style={{ padding: '3px 0', textAlign: 'right', color: '#333' }}><HV conf={100} visible={v(4)}>€18,400.00</HV></td></tr>
            <tr><td style={{ padding: '3px 16px 3px 0', color: '#666' }}>VAT (reverse charge)</td><td style={{ padding: '3px 0', textAlign: 'right', color: '#333' }}><HV conf={95} visible={v(5)}>€0.00</HV></td></tr>
            <tr style={{ borderTop: '2px solid #111' }}><td style={{ padding: '6px 16px 4px 0', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}>Total Due</td><td style={{ padding: '6px 0 4px', textAlign: 'right', fontWeight: 700, color: '#111', fontSize: '13px' }}><HV conf={100} visible={v(6)}>€18,400.00</HV></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Stellify Media production invoice (inv-14) — milestone cleared by GenAI. 9 HV fields:
// 0 supplier · 1 invoice# · 2 inv date · 3 PO# · 4 SES# · 5 qty · 6 unit · (7 unused) · 8 total
function StellifyInvoice({ vc }: { vc: number }) {
  const v = (i: number) => vc > i
  return (
    <div style={{ position: 'relative', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
            <HV conf={100} visible={v(0)}>STELLIFY MEDIA LTD</HV>
          </div>
          <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.6' }}>
            The Paint Hall, Queen's Road, Belfast BT3 9DT<br />
            United Kingdom &nbsp;|&nbsp; A Fremantle company<br />
            VAT Reg: GB 271 8841 09
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>Invoice</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11px' }}>
        <div><span style={{ color: '#888' }}>Invoice No: </span><span style={{ fontWeight: 600, color: '#1a1a1a' }}><HV conf={100} visible={v(1)}>STM-2026-0188</HV></span></div>
        <div><span style={{ color: '#888' }}>Date: </span><span style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(2)}>June 13, 2026</HV></span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', fontSize: '11px' }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>Bill To</div>
          <div style={{ color: '#333', lineHeight: '1.65' }}>{BILL_TO_FREMANTLE}</div>
        </div>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px' }}>PO Number</td><td style={{ color: '#1a1a1a' }}><HV conf={100} visible={v(3)}>4500294500</HV></td></tr>
              <tr><td style={{ color: '#888', paddingBottom: '4px', paddingRight: '10px' }}>SES Ref</td><td style={{ color: '#1a1a1a' }}><HV conf={97} visible={v(4)}>SES-FRM-294500-001</HV></td></tr>
              <tr><td style={{ color: '#888', paddingRight: '10px' }}>Terms</td><td style={{ color: '#1a1a1a' }}>Net 45 · EUR</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: '16px', padding: '9px 13px', background: '#fdf4ff', border: '1px solid #e9c6f2', borderLeft: '3px solid #c026d3', borderRadius: '0 3px 3px 0' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#86198f', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Milestone (Contract-Described)</div>
        <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.6' }}>
          Production agreement — Schedule 2, Clause 4.3: "payment due on delivery and acceptance of the Episode 1 final cut master".
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>S.No.</th>
            <th style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Particulars</th>
            <th style={{ padding: '8px 10px', textAlign: 'center', color: '#555', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', width: '70px' }}>Qty</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', color: '#555', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', width: '110px' }}>Amount EUR</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '10px 10px', color: '#555', textAlign: 'center' }}>1</td>
            <td style={{ padding: '10px 10px', color: '#333' }}>
              <div style={{ fontWeight: 500 }}>Episode 1 Final Cut — "Northern Lines"</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>Milestone payment per Schedule 2, Clause 4.3</div>
            </td>
            <td style={{ padding: '10px 10px', textAlign: 'center', color: '#333' }}><HV conf={98} visible={v(5)}>1</HV></td>
            <td style={{ padding: '10px 10px', textAlign: 'right', color: '#333', fontWeight: 500 }}><HV conf={98} visible={v(6)}>185,000.00</HV></td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <table style={{ fontSize: '11px', minWidth: '220px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderTop: '2px solid #333' }}><td style={{ padding: '8px 16px 4px 0', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}>Total (EUR)</td><td style={{ padding: '8px 0 4px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a', fontSize: '13px' }}><HV conf={100} visible={v(8)}>185,000.00</HV></td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: '14px', fontSize: '10px', color: '#666', lineHeight: '1.7' }}>
        <div style={{ marginBottom: '6px', color: '#444' }}>Cross-border supply of services — reverse charge applies.</div>
        <div style={{ fontWeight: 700, color: '#333', marginBottom: '3px' }}>Payment Instructions</div>
        <div>Beneficiary: Stellify Media Ltd &nbsp;|&nbsp; Bank: Danske Bank (UK) &nbsp;|&nbsp; IBAN: GB94 DABA 9520 1199 4471 22</div>
      </div>
    </div>
  )
}

export function ScannedInvoice({ invoice, isExtractionActive = false, isExtractionDone = false, extractionAgentIdx = -1, showLegend = true, showConfidenceOverlays = true }: Props) {
  const isScannedCopy = invoice.id === 'inv-9' || invoice.id === 'inv-10' || invoice.id === 'inv-11'
  const isSunset = invoice.id === 'inv-2'
  const isLehmanns = invoice.id === 'inv-5' || invoice.id === 'inv-5-r1'
  const isCorrected = invoice.id === 'inv-5-r1'
  const isIC = invoice.id === 'inv-12'
  const isRoyalty = invoice.id === 'inv-13'
  const isStellify = invoice.id === 'inv-14'
  const isMaersk = invoice.id === 'inv-3'
  const isJVM = invoice.id === 'inv-6'
  const isPO = invoice.category === 'PO'
  const totalHVFields = isScannedCopy ? 9
    : isMaersk ? 8
    : isJVM ? 7
    : (isPO || isSunset || isLehmanns) ? 9
    : (isIC || isRoyalty) ? 6
    : 7

  const [visibleCount, setVisibleCount] = useState(0)
  const startedRef = useRef(false)
  const tidRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isExtractionDone && !startedRef.current) {
      startedRef.current = true
      setVisibleCount(totalHVFields)
      return
    }
    if (!isExtractionActive || extractionAgentIdx < 1 || startedRef.current) return
    startedRef.current = true

    let count = 0
    function revealNext() {
      count++
      setVisibleCount(count)
      if (count < totalHVFields) {
        tidRef.current = setTimeout(revealNext, 370)
      }
    }
    tidRef.current = setTimeout(revealNext, 200)
  }, [extractionAgentIdx, isExtractionActive, isExtractionDone]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (tidRef.current) clearTimeout(tidRef.current) }
  }, [])

  const vc = showConfidenceOverlays ? visibleCount : 0

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--now-bg)' }}>
      <div
        style={{
          background: isScannedCopy ? '#fcfaf6' : '#fdfcf8',
          border: isScannedCopy ? '1px solid #d8d0c0' : '1px solid #e8e4da',
          borderRadius: '2px',
          boxShadow: isScannedCopy
            ? '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(180,160,120,0.15)'
            : '0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)',
          padding: '32px 36px',
          minHeight: '600px',
          position: 'relative',
          fontFamily: isScannedCopy ? 'Arial, sans-serif' : 'Georgia, serif',
        }}
      >
        {showLegend && (
          <div style={{ position: 'absolute', top: '10px', right: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9.5px', color: '#888', fontFamily: 'Lato, sans-serif', letterSpacing: '0.01em' }}>
            <div style={{ width: '13px', height: '9px', background: 'rgba(26,58,107,0.06)', border: '1px dashed rgba(26,58,107,0.4)', borderRadius: '1px', flexShrink: 0 }} />
            <span>AI-extracted fields with confidence scores</span>
          </div>
        )}
        {isScannedCopy
          ? <ScannedCopyInvoice vc={vc} invoice={invoice} />
          : isSunset
            ? <SunsetPostInvoice vc={vc} />
            : isLehmanns
              ? <LehmannsInvoice vc={vc} corrected={isCorrected} />
              : isIC
                ? <ICInvoice vc={vc} />
                : isRoyalty
                  ? <RoyaltyInvoice vc={vc} />
                  : isStellify
                    ? <StellifyInvoice vc={vc} />
                    : isMaersk
                      ? <MaerskInvoice vc={vc} />
                      : isJVM
                        ? <JungVonMattInvoice vc={vc} />
                        : isPO
                          ? <POInvoice vc={vc} />
                          : <NonPOInvoice vc={vc} />
        }
      </div>
    </div>
  )
}
