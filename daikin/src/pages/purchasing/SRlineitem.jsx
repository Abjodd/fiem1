import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout.jsx'
import { scheduleReleaseApi } from '../../services/Schedulerelease.js'

// ── Status config (duplicated for standalone use) ──
const STATUS_CONFIG = {
  'Confirmation Required': { bg: '#fff3e0', text: '#e65100', dot: '#ff9800', label: 'Confirmation Required' },
  'Partially Confirmed':   { bg: '#e3f2fd', text: '#1565c0', dot: '#1976d2', label: 'Partially Confirmed'   },
  'Confirmed':             { bg: '#e8f5e9', text: '#2e7d32', dot: '#43a047', label: 'Confirmed'             },
  'Completed':             { bg: '#f3e5f5', text: '#6a1b9a', dot: '#8e24aa', label: 'Completed'             },
}
const getStatus = (s) => STATUS_CONFIG[s] || { bg: '#f5f5f5', text: '#616161', dot: '#9e9e9e', label: s || 'Unknown' }

function StatusBadge({ status }) {
  const cfg = getStatus(status)
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

export default function SRlineitem() {
  const navigate  = useNavigate()
  const location  = useLocation()

  // Expected state shape: { agreement, item }
  // agreement: { id, vendor, plant, plantName, date, items: [...] }
  // item: the specific item object clicked
  const { agreement, item: drilledItem } = location.state || {}

  const [scheduleLines, setScheduleLines] = useState([])
  const [linesLoading,  setLinesLoading]  = useState(false)

  useEffect(() => {
    if (!drilledItem || !agreement) return
    let cancelled = false
    setLinesLoading(true)
    scheduleReleaseApi
      .getScheduleLines(
        agreement.id,
        drilledItem.itemNo,
        drilledItem.materialNumber,
        drilledItem.deliveryUnit,
      )
      .then(lines => { if (!cancelled) setScheduleLines(lines) })
      .catch(err  => { if (!cancelled) console.error(err) })
      .finally(()  => { if (!cancelled) setLinesLoading(false) })
    return () => { cancelled = true }
  }, [drilledItem, agreement])

  // Fallback — bad navigation
  if (!drilledItem || !agreement) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-64 text-[#6a6d70]">
          <span className="text-[14px]">No item data. Please go back and select an item.</span>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-5 h-10 text-[14px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] rounded-lg hover:bg-[#d9ecff] transition-all"
          >
            ← Go Back
          </button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn      { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: translateY(0);  } }
        @keyframes slideInRight{ from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0);  } }
        .anim-fade    { animation: fadeIn        0.35s ease-out both; }
        .anim-slide-r { animation: slideInRight  0.35s ease-out both; }
        .row-stagger > * { animation: fadeIn 0.4s ease-out both; }
        .row-stagger > *:nth-child(1) { animation-delay: 0.02s; }
        .row-stagger > *:nth-child(2) { animation-delay: 0.06s; }
        .row-stagger > *:nth-child(3) { animation-delay: 0.10s; }
        .row-stagger > *:nth-child(4) { animation-delay: 0.14s; }
        .row-stagger > *:nth-child(5) { animation-delay: 0.18s; }
      `}</style>

      <main className="bg-white anim-fade" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-10 py-5 sm:py-7 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[14px] text-[#0a6ed1] hover:underline mb-5 hover:-translate-x-0.5 transition-transform"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Back to Items
          </button>
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Material Number</div>
            <h2 className="text-[22px] sm:text-[26px] font-bold text-[#0a6ed1] tracking-tight">{drilledItem.materialNumber}</h2>
            <div className="text-[14px] text-[#6a6d70] mt-1.5">{drilledItem.materialName}</div>
            <div className="mt-3 flex justify-center"><StatusBadge status={drilledItem.status} /></div>
          </div>
        </div>

        {/* Schedule lines table */}
        <div className="px-4 sm:px-6 lg:px-10 py-5 sm:py-7">
          {linesLoading ? (
            <div className="flex items-center justify-center py-12 text-[#6a6d70] text-[13px] gap-2">
              <div className="w-5 h-5 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin"/>
              Loading…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] shadow-sm">
              <table className="w-full text-[14px]" style={{ minWidth: '480px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                    {['Sch. Line', 'Delivery Date', 'Delivery Schedule', 'Confirmed Qty'].map(h => (
                      <th key={h} className="text-left font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="row-stagger">
                  {scheduleLines.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[13px] text-[#6a6d70]">No schedule lines</td>
                    </tr>
                  ) : scheduleLines.map((line, idx) => (
                    <tr
                      key={`${line.schLineNo}-${idx}`}
                      className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[13px] font-bold">
                          {line.schLineNo}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#32363a] font-medium">
                        <div className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6a6d70] flex-shrink-0">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                          </svg>
                          {line.deliveryDate}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-[15px] text-[#32363a]">{line.deliverySchedule}</span>{' '}
                        <span className="text-[#6a6d70] text-[13px]">{line.unit}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e8f5e9] text-[#2e7d32] rounded-md text-[13px] font-semibold">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7"/>
                          </svg>
                          {line.confirmedQty} {line.unit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </PageLayout>
  )
}