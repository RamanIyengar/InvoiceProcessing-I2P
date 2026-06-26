import { useEffect, useRef, useState } from 'react'
import { Invoice, StepStatus } from '../types'
import { DecisionPanel } from './DecisionPanel'

interface Props {
  invoice: Invoice
  onShowAudit: () => void
  onDecide: (d: 'approved' | 'rejected' | 'info-requested') => void
  decision: string | null
}

const STEP_TIMINGS = [
  { runAt: 400, completeAt: 1300 },
  { runAt: 1500, completeAt: 2400 },
  { runAt: 2600, completeAt: 3500 },
  { runAt: 3700, completeAt: 4800 },
  { runAt: 5000, completeAt: 6200 },
]

const RECOMMENDATION_AT = 6500

export function AgentTimeline({ invoice, onShowAudit, onDecide, decision }: Props) {
  const hasRun = useRef(false)

  const initialStatuses: StepStatus[] = invoice.agentSteps.map(() => 'queued')
  const completedStatuses: StepStatus[] = invoice.agentSteps.map(() => 'complete')

  const isAlreadyDone =
    invoice.status === 'approved' || invoice.status === 'rejected' || decision !== null

  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    isAlreadyDone ? completedStatuses : initialStatuses
  )
  const [showRecommendation, setShowRecommendation] = useState(isAlreadyDone)
  const [showDecision, setShowDecision] = useState(isAlreadyDone)

  useEffect(() => {
    if (isAlreadyDone || hasRun.current || invoice.agentSteps.length === 0) return
    hasRun.current = true

    const timers: ReturnType<typeof setTimeout>[] = []

    invoice.agentSteps.forEach((_, idx) => {
      const timing = STEP_TIMINGS[idx]
      if (!timing) return

      timers.push(
        setTimeout(() => {
          setStepStatuses((prev) => {
            const next = [...prev]
            next[idx] = 'running'
            return next
          })
        }, timing.runAt)
      )

      timers.push(
        setTimeout(() => {
          setStepStatuses((prev) => {
            const next = [...prev]
            next[idx] = 'complete'
            return next
          })
        }, timing.completeAt)
      )
    })

    timers.push(
      setTimeout(() => {
        setShowRecommendation(true)
        setShowDecision(true)
      }, RECOMMENDATION_AT)
    )

    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (invoice.agentSteps.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--now-text-secondary)',
          fontSize: '13px',
          fontStyle: 'italic',
        }}
      >
        Agent processing not yet started for this invoice.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Scrollable steps area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
          {invoice.agentSteps.map((step, idx) => {
            const status = stepStatuses[idx]
            return (
              <div key={step.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                {/* Connector line */}
                {idx < invoice.agentSteps.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '11px',
                      top: '26px',
                      bottom: '-4px',
                      width: '2px',
                      background:
                        status === 'complete'
                          ? '#1b823f'
                          : status === 'running'
                          ? '#1a3a6b'
                          : '#e4e6e7',
                      transition: 'background 0.3s ease',
                    }}
                  />
                )}

                {/* Status indicator */}
                <div style={{ flexShrink: 0, zIndex: 1 }}>
                  {status === 'complete' && (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#1b823f',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                      }}
                    >
                      ✓
                    </div>
                  )}
                  {status === 'running' && (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid #e4e6e7',
                        borderTopColor: '#1a3a6b',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                  )}
                  {status === 'queued' && (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid #c8cccf',
                        background: 'white',
                      }}
                    />
                  )}
                </div>

                {/* Step content */}
                <div style={{ flex: 1, paddingBottom: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'Cabin, sans-serif',
                      fontSize: '13px',
                      fontWeight: 600,
                      color:
                        status === 'complete'
                          ? 'var(--now-text)'
                          : status === 'running'
                          ? 'var(--now-primary)'
                          : 'var(--now-text-disabled)',
                      marginBottom: status !== 'queued' ? '4px' : '0',
                    }}
                  >
                    {step.name}
                  </div>

                  {status !== 'queued' && (
                    <div
                      style={{
                        fontFamily: 'Lato, sans-serif',
                        fontSize: '11px',
                        color: 'var(--now-text-secondary)',
                        lineHeight: '1.5',
                        marginBottom: '6px',
                      }}
                    >
                      {step.description}
                    </div>
                  )}

                  {status === 'complete' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {step.agents.map((agent) => (
                        <span
                          key={agent}
                          style={{
                            background: '#f0f1f1',
                            border: '1px solid #e4e6e7',
                            borderRadius: '3px',
                            padding: '2px 7px',
                            fontSize: '10px',
                            color: 'var(--now-text)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {agent}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Recommendation card */}
        {showRecommendation && invoice.recommendation && (
          <div
            style={{
              background: '#e8f5ee',
              border: '1px solid #1b823f',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  fontFamily: 'Cabin, sans-serif',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1b823f',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>✓</span>
                <span>Agent Recommendation</span>
              </div>
              <button
                onClick={onShowAudit}
                style={{
                  background: 'none',
                  border: '1px solid #1b823f',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 10px',
                  fontSize: '11px',
                  color: '#1b823f',
                  cursor: 'pointer',
                  fontFamily: 'Lato, sans-serif',
                }}
              >
                View Audit Trail
              </button>
            </div>
            <div
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '12px',
                color: '#1a5c30',
                lineHeight: '1.5',
              }}
            >
              {invoice.recommendation}
            </div>
          </div>
        )}
      </div>

      {/* Decision panel pinned at bottom */}
      {showDecision && (
        <DecisionPanel onDecide={onDecide} decision={decision} invoice={invoice} />
      )}
    </div>
  )
}
