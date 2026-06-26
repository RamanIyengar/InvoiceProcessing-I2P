import { mockInvoices } from '../data/mockData'
import { Invoice } from '../types'

const outlookFont = "'Segoe UI', system-ui, -apple-system, sans-serif"

interface EmailItemProps {
  invoice: Invoice
  isSelected: boolean
  isUnread: boolean
}

function EmailItem({ invoice, isSelected, isUnread }: EmailItemProps) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: isSelected ? '#d0e5f3' : '#f3f3f3',
        borderLeft: isSelected ? '3px solid #0078d4' : '3px solid transparent',
        borderBottom: '1px solid #e5e5e5',
        cursor: 'default',
        fontFamily: outlookFont,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          {isUnread && (
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#0078d4',
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontSize: '12px',
              fontWeight: isUnread ? 700 : 400,
              color: isUnread ? '#000000' : '#333333',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: outlookFont,
            }}
          >
            {invoice.emailSender}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '4px' }}>
          {invoice.attachmentName && (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <path
                d="M6 0H1C0.45 0 0 0.45 0 1V11C0 11.55 0.45 12 1 12H9C9.55 12 10 11.55 10 11V4L6 0ZM6 1.5L8.5 4H6V1.5Z"
                fill="#666666"
              />
            </svg>
          )}
          <span style={{ fontSize: '10px', color: '#444444', fontFamily: outlookFont }}>{invoice.emailTime}</span>
        </div>
      </div>
      <div
        style={{
          fontSize: '12px',
          fontWeight: isUnread ? 600 : 400,
          color: isUnread ? '#000000' : '#333333',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: '2px',
          fontFamily: outlookFont,
        }}
      >
        {invoice.emailSubject}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: '#666666',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: outlookFont,
        }}
      >
        {invoice.emailPreview}
      </div>
    </div>
  )
}

export function OutlookPanel() {
  const folders = [
    { name: 'Inbox', count: 3, active: true },
    { name: 'Sent Items', count: null, active: false },
    { name: 'Drafts', count: 1, active: false },
    { name: 'Archive', count: null, active: false },
  ]

  return (
    <div
      style={{
        width: '300px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: outlookFont,
        borderRight: '1px solid #d0d0d0',
      }}
    >
      {/* Outlook top bar */}
      <div
        style={{
          background: '#0F3C78',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Waffle icon */}
        <button
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <rect x="0" y="0" width="4" height="4" rx="0.5" />
            <rect x="6" y="0" width="4" height="4" rx="0.5" />
            <rect x="12" y="0" width="4" height="4" rx="0.5" />
            <rect x="0" y="6" width="4" height="4" rx="0.5" />
            <rect x="6" y="6" width="4" height="4" rx="0.5" />
            <rect x="12" y="6" width="4" height="4" rx="0.5" />
            <rect x="0" y="12" width="4" height="4" rx="0.5" />
            <rect x="6" y="12" width="4" height="4" rx="0.5" />
            <rect x="12" y="12" width="4" height="4" rx="0.5" />
          </svg>
        </button>

        <span
          style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 400,
            flex: 1,
            fontFamily: outlookFont,
          }}
        >
          Outlook
        </span>

        {/* Search icon */}
        <button
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="white" strokeWidth="1.5" />
            <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body: left nav + email list */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left nav */}
        <div
          style={{
            width: '120px',
            background: '#0F3C78',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: '8px',
            overflowY: 'auto',
          }}
        >
          {folders.map((folder) => (
            <div
              key={folder.name}
              style={{
                padding: '7px 10px',
                cursor: 'default',
                background: folder.active ? 'rgba(255,255,255,0.25)' : 'transparent',
                borderLeft: folder.active ? '3px solid #ffffff' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  color: 'white',
                  fontSize: '11px',
                  fontFamily: outlookFont,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {folder.name}
              </span>
              {folder.count !== null && (
                <span
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    fontSize: '9px',
                    padding: '1px 4px',
                    borderRadius: '8px',
                    fontFamily: outlookFont,
                    flexShrink: 0,
                  }}
                >
                  {folder.count}
                </span>
              )}
            </div>
          ))}

          {/* Separator */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '6px 8px' }} />

          {/* Special folder */}
          <div
            style={{
              padding: '7px 10px',
              cursor: 'default',
              background: 'transparent',
              borderLeft: '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '10px',
                fontFamily: outlookFont,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Bertelsmann AP Invoices
            </span>
            <span
              style={{
                background: '#0078d4',
                color: 'white',
                fontSize: '9px',
                padding: '1px 4px',
                borderRadius: '8px',
                fontFamily: outlookFont,
                flexShrink: 0,
              }}
            >
              8
            </span>
          </div>
        </div>

        {/* Email list */}
        <div
          style={{
            flex: 1,
            background: '#f3f3f3',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search bar */}
          <div
            style={{
              padding: '8px',
              background: '#f3f3f3',
              borderBottom: '1px solid #e5e5e5',
            }}
          >
            <div
              style={{
                background: 'white',
                border: '1px solid #d0d0d0',
                borderRadius: '2px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="5" cy="5" r="4" stroke="#666" strokeWidth="1.2" />
                <line x1="8" y1="8" x2="11" y2="11" stroke="#666" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: '11px', color: '#999', fontFamily: outlookFont }}>Search mail</span>
            </div>
          </div>

          {/* Email items */}
          {mockInvoices.map((invoice, index) => (
            <EmailItem
              key={invoice.id}
              invoice={invoice}
              isSelected={index === 0}
              isUnread={index < 4}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
