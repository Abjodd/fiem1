import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import PageLayout from '../../../layouts/PageLayout.jsx'
import {
  ForecastReportApi,
  toSapDate,
  groupPeriodsMonthly,
  authConfig
} from "../../../services/Reports/ForecastReport/ForecastReport.js";
import { useUser } from "../../../context/UserContext.jsx";


const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const getExportFilename = (viewMode) => {
  const d = new Date();
  return `Forecast_Report_${viewMode}_${MONTHS_SHORT[d.getMonth()]}_${String(d.getDate()).padStart(2, "0")}.xlsx`;
};
const calcVariance = (schedule, supply) => {
  if (schedule === 0) return 0;
  return ((schedule - supply) / schedule) * 100;
};
const PAGE_SIZE = 100;

function ValueHelpModal({ title, options, onSelect, onCancel, loading }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        (o.label && o.label.toLowerCase().includes(q)),
    );
  }, [options, search]);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[360px] max-w-[95vw] overflow-hidden flex flex-col" style={{ maxHeight: "70vh", animation: "modalIn .2s ease-out both" }}>
        <div className="px-5 py-4 border-b border-[#e5e5e5]">
          <h3 className="text-[16px] font-semibold text-[#32363a]">{title}</h3>
        </div>
        <div className="px-4 py-3 border-b border-[#e5e5e5]">
          <div className="relative">
            <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search"
              className="w-full h-9 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-2.5 text-[#6a6d70]">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#6a6d70] text-[13px]">
              <div className="w-5 h-5 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin mr-2" />Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[#6a6d70]">No results</div>
          ) : (
            filtered.map((opt) => (
              <button key={opt.code} onClick={() => onSelect(opt)}
                className="w-full text-left px-5 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] transition-colors">
                <div className="text-[14px] font-semibold text-[#0a6ed1]">{opt.code}</div>
                {opt.label && <div className="text-[12px] text-[#6a6d70] mt-0.5">{opt.label}</div>}
              </button>
            ))
          )}
        </div>
        <div className="px-5 py-3 border-t border-[#e5e5e5] flex justify-end">
          <button onClick={onCancel} className="px-5 h-9 text-[14px] font-semibold text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ValueHelpInput({ placeholder, value, onOpen, onClear }) {
  return (
    <div className="flex h-9 border border-[#d9d9d9] rounded-lg overflow-hidden bg-white focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all">
      <div className="flex-1 flex items-center pl-3 pr-1 text-[13px] text-[#32363a] truncate min-w-0">
        {value ? <span className="truncate font-medium">{value}</span> : <span className="text-[#94a3b8]">{placeholder}</span>}
      </div>
      {value && (
        <button type="button" onClick={onClear} className="flex-shrink-0 w-6 flex items-center justify-center text-[#6a6d70] hover:text-[#cc1c14]">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
      <button type="button" onClick={onOpen} className="flex-shrink-0 w-8 flex items-center justify-center border-l border-[#e5e5e5] text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex w-11 h-6 items-center rounded-full transition-colors duration-200 ${value ? "bg-[#0a6ed1]" : "bg-[#d9d9d9]"}`}>
      <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function ForecastReport() {
  const { loginId, loginType, loading: userLoading } = useUser();
  authConfig.loginId   = loginId;
  authConfig.loginType = loginType;
  const [date, setDate] = useState(todayIso());
  const [partNo, setPartNo] = useState("");
  const [saNo, setSaNo] = useState("");
  const [supplier, setSupplier] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [vhModal, setVhModal] = useState(null);
  const [vhOptions, setVhOptions] = useState([]);
  const [vhLoading, setVhLoading] = useState(false);
  const [showSupply, setShowSupply] = useState(true);
  const [viewMode, setViewMode] = useState("Daily");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);

  const tableBodyRef = useRef(null);
  const skipRef = useRef(0);
  const lastParamsRef = useRef(null);
  // ✅ FIX: Use refs for flags so scroll handler always sees latest values
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);

  // Keep hasMoreRef in sync with hasMore state
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  const buildParams = useCallback(
  (mode) => ({
    inputDate: toSapDate(date),
    matnr: partNo,
    ebeln: saNo,
    supplier: supplier,
    bukrs: "DSAL",
    mdIndicator: (mode ?? viewMode) === "Daily" ? "D" : "M",
  }),
  [date, partNo, saNo, supplier, viewMode],
);

  // ✅ FIX: doFetch resets ALL pagination state cleanly on every new search
  const doFetch = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setRows([]);
    setHasMore(false);
    hasMoreRef.current = false;
    skipRef.current = 0;
    lastParamsRef.current = params;
    try {
      const data = await ForecastReportApi.fetchReport({
        ...params,
        skip: 0,
        top: PAGE_SIZE,
      });
      setRows(data);
      setHasMore(data.length >= PAGE_SIZE);
      hasMoreRef.current = data.length >= PAGE_SIZE;
      setHasSearched(true);
      skipRef.current = data.length;
    } catch (err) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIX: loadMore reads from refs (not stale closure state)
  //         so it always sees the latest hasMore / loadingMore values
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || !lastParamsRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const data = await ForecastReportApi.fetchReport({
        ...lastParamsRef.current,
        skip: skipRef.current,
        top: PAGE_SIZE,
      });
      if (data.length === 0) {
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }
      setRows((prev) => [...prev, ...data]);
      skipRef.current += data.length;
      const more = data.length >= PAGE_SIZE;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch (err) {
      console.error(err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []); // ✅ Empty deps — safe because we only use refs inside

  // On mount: load default data
  useEffect(() => {
    if (userLoading) return;
    if (!loginId || !loginType) return;
    const defaultParams = {
      inputDate: toSapDate(todayIso()),
      matnr: "",
      ebeln: "",
      supplier: "",
      bukrs: "DSAL",
      mdIndicator: "D",
    };
    lastParamsRef.current = defaultParams;
    ForecastReportApi.fetchDefaultReport({ skip: 0, top: PAGE_SIZE })
      .then((data) => {
        setRows(data);
        setHasSearched(true);
        setHasMore(data.length >= PAGE_SIZE);
        hasMoreRef.current = data.length >= PAGE_SIZE;
        skipRef.current = data.length;
      })
      .catch((err) => setError(err.message));
  }, [userLoading, loginId, loginType]);

  // ✅ FIX: Scroll listener registered ONCE (empty deps).
  //         It calls loadMore which reads refs — never stale.
  useEffect(() => {
  const el = tableBodyRef.current;
  if (!el) return;
  const handleScroll = () => {
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 250) loadMore();
  };
  el.addEventListener("scroll", handleScroll, { passive: true });
  return () => el.removeEventListener("scroll", handleScroll);
}, [hasSearched]); // ✅ Empty deps — registered once, never stale

  // ✅ FIX: Pass new mode directly to buildParams — state update is async
  //         so viewMode would still be old value if we called buildParams()
  const handleViewChange = (mode) => {
    setViewMode(mode);
    doFetch(buildParams(mode));
  };

  const handleGo = () => doFetch(buildParams());

  const handleClear = () => {
    setDate(todayIso());
    setPartNo("");
    setSaNo("");
    setSupplier("");
    setRows([]);
    setHasSearched(false);
    setError(null);
    setHasMore(false);
    hasMoreRef.current = false;
    skipRef.current = 0;
    lastParamsRef.current = null;
  };

  const openVh = async (field) => {
    setVhLoading(true);
    setVhModal(field);
    setVhOptions([]);
    try {
      const inputDate = toSapDate(date);
      const opts =
        field === "part"
        ? await ForecastReportApi.fetchMaterials({ inputDate })
        : field === "sa"
        ? await ForecastReportApi.fetchSaNumbers({ inputDate })
        : await ForecastReportApi.fetchSuppliers({ inputDate });
      setVhOptions(opts);
    } catch {
      setVhOptions([]);
    }
    setVhLoading(false);
  };

  const handleVhSelect = (opt) => {
    if (vhModal === "part") setPartNo(opt.code);
    else if (vhModal === "sa") setSaNo(opt.code);
    else setSupplier(opt.code);
    setVhModal(null);
  };

  const displayColumns = useMemo(() => {
    if (rows.length === 0) return [];
    if (viewMode === "Monthly") {
      const monthly = groupPeriodsMonthly(rows[0].periods);
      if (monthly.length === 0 && rows[0].periods.length > 0)
        return rows[0].periods.map((p) => ({ key: p.startdate, label: p.startdate }));
      return monthly.map((m) => ({ key: m.key, label: m.label }));
    }
    return rows[0].periods.map((p) => ({ key: p.startdate, label: p.startdate }));
  }, [rows, viewMode]);

  const getRowPeriodMap = useCallback(
    (row) => {
      const map = new Map();
      if (viewMode === "Monthly") {
        const monthly = groupPeriodsMonthly(row.periods);
        if (monthly.length > 0)
          monthly.forEach((m) => map.set(m.key, { schedule: m.schedule, supply: m.supply }));
        else
          row.periods.forEach((p) => map.set(p.startdate, { schedule: p.schedule, supply: p.supply }));
      } else {
        row.periods.forEach((p) => map.set(p.startdate, { schedule: p.schedule, supply: p.supply }));
      }
      return map;
    },
    [viewMode],
  );

  const colsPerPeriod = showSupply ? 3 : 1;
  const FIXED_COL_COUNT = 6;

  const handleExport = async () => {
    if (rows.length === 0) return;
    setExporting(true);
    setExportPct(0);
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      const fixedH = ["S No.", "SA No.", "Item", "Part No.", "Part Name", "Plant", "Cumulative Backlog Qty"];
      const periodH = displayColumns.flatMap((c) =>
        showSupply
          ? [`${c.label} Sched`, `${c.label} Supply`, `${c.label} Variance`]
          : [`${c.label} Sched`],
      );
      const headers = [...fixedH, ...periodH];
      const dataRows = new Array(rows.length);
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const cumNet = r.cumBacklogQty - r.grnQty;
        const pm = getRowPeriodMap(r);
        const pCells = displayColumns.flatMap((col) => {
          const p = pm.get(col.key) || { schedule: 0, supply: 0 };
          const v = calcVariance(p.schedule, p.supply);
          return showSupply ? [p.schedule, p.supply, v] : [p.schedule];
        });
        dataRows[i] = [r.srNo || i + 1, r.ebeln, r.ebelp, r.matnr, r.maktx, r.werks, cumNet, ...pCells];
        if (i % 500 === 0) {
          setExportPct(Math.round((i / rows.length) * 80));
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      setExportPct(85);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let C = range.s.c; C <= range.e.c; C++) {
        const a = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[a]) ws[a].s = { font: { bold: true } };
      }
      ws["!cols"] = headers.map((_, i) => ({ wch: i < 7 ? [6, 14, 6, 16, 28, 6, 18][i] : 14 }));
      XLSX.utils.book_append_sheet(wb, ws, "FIEM Forecast Export");
      XLSX.writeFile(wb, getExportFilename(viewMode));
      setExportPct(100);
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
      setExportPct(0);
    }
  };

  const supplierName = rows[0]?.supplierName || "—";

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
        .anim-fade{animation:fadeIn .3s ease-out both}
        .row-stagger>*{animation:fadeIn .3s ease-out both}
        .row-stagger>*:nth-child(1){animation-delay:.02s}.row-stagger>*:nth-child(2){animation-delay:.04s}
        .row-stagger>*:nth-child(3){animation-delay:.06s}.row-stagger>*:nth-child(4){animation-delay:.08s}
        .row-stagger>*:nth-child(5){animation-delay:.10s}
      `}</style>

      {vhModal === "part" && (
        <ValueHelpModal title="Part No." options={vhOptions} onSelect={handleVhSelect} onCancel={() => setVhModal(null)} loading={vhLoading} />
      )}
      {vhModal === "sa" && (
        <ValueHelpModal title="SA No." options={vhOptions} onSelect={handleVhSelect} onCancel={() => setVhModal(null)} loading={vhLoading} />
      )}
      {vhModal === "supplier" && (
        <ValueHelpModal title="Supplier" options={vhOptions} onSelect={handleVhSelect} onCancel={() => setVhModal(null)} loading={vhLoading} />
      )}

      {exporting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-xl shadow-2xl w-[380px] max-w-[90vw] p-5" style={{ animation: "modalIn .2s ease-out both" }}>
            <div className="text-[15px] font-semibold text-[#32363a] mb-3">Exporting…</div>
            <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div className="h-full bg-[#0a6ed1] rounded-full transition-all duration-150" style={{ width: `${exportPct}%` }} />
            </div>
            <div className="text-[12px] text-[#6a6d70] mt-2 text-right tabular-nums">{exportPct}%</div>
          </div>
        </div>
      )}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <div className="flex flex-col bg-white" style={{ height: "calc(100vh - 104px)" }}>

          <div className="flex-shrink-0 border-b border-[#e5e5e5]">
            {/* Title bar */}
            <div className="px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-bold text-[#32363a] tracking-tight">Forecast Report</h2>
                <div className="text-[12px] text-[#6a6d70] mt-0.5">
                  Supplier: <span className="font-semibold text-[#32363a]">{supplierName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleGo} disabled={loading}
                  className="flex items-center gap-1.5 px-4 h-8 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all shadow-sm disabled:opacity-50">
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Go
                </button>
                <button onClick={() => setFiltersOpen((v) => !v)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all"
                  title={filtersOpen ? "Collapse" : "Expand"}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button onClick={handleClear}
                  className="px-3 h-8 text-[12px] font-semibold text-[#cc1c14] bg-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all">
                  Clear
                </button>
              </div>
            </div>

            {/* Collapsible filters */}
            <div className={`overflow-hidden transition-all duration-250 ease-out ${filtersOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="px-4 sm:px-6 lg:px-10 pb-3">
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                      className="h-9 pl-3 pr-2 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-[150px]" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Part No.</label>
                    <div className="w-[170px]">
                      <ValueHelpInput placeholder="Select Part" value={partNo} onOpen={() => openVh("part")} onClear={() => setPartNo("")} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">SA No.</label>
                    <div className="w-[170px]">
                      <ValueHelpInput placeholder="Select SA" value={saNo} onOpen={() => openVh("sa")} onClear={() => setSaNo("")} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Supplier</label>
                    <div className="w-[170px]">
                    <ValueHelpInput placeholder="Select Supplier" value={supplier} onOpen={() => openVh("supplier")} onClear={() => setSupplier("")}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 sm:px-6 lg:px-10 py-2 flex items-center justify-between gap-3 bg-[#fafbfc] border-t border-[#e5e5e5]">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#6a6d70] font-medium">Supply</span>
                  <Toggle value={showSupply} onChange={setShowSupply} />
                </div>
                <div className="flex h-8 bg-[#e5e5e5] rounded-lg p-[3px] gap-[3px]">
                  {["Daily", "Monthly"].map((m) => (
                    <button key={m} onClick={() => handleViewChange(m)}
                      className={`px-4 text-[12px] font-semibold rounded-md transition-all duration-200 ${viewMode === m ? "bg-white text-[#0a6ed1] shadow-sm" : "text-[#6a6d70] hover:text-[#32363a]"}`}>
                      {m}
                    </button>
                  ))}
                </div>
                {hasSearched && (
                  <span className="text-[11px] text-[#6a6d70]">
                    {rows.length} rows{hasMore ? "+" : " (all loaded)"}
                  </span>
                )}
              </div>
              <button onClick={handleExport} disabled={rows.length === 0 || exporting}
                className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:border-[#0a6ed1] hover:text-[#0a6ed1] transition-all disabled:opacity-40">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Table area */}
          <div className="flex-1 overflow-hidden min-h-0">
            {!hasSearched && !loading ? (
              <div className="flex items-center justify-center h-full anim-fade">
                <div className="text-center text-[#6a6d70]">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-25">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9M3 15h18" />
                  </svg>
                  <div className="text-[14px] font-semibold mb-1">No report loaded</div>
                  <div className="text-[12px]">Set filters and click <strong>Go</strong></div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full anim-fade">
                <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
                  <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
                  <span className="text-[13px]">Loading…</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  {error}
                </div>
              </div>
            ) : (
              <div ref={tableBodyRef} className="overflow-auto h-full">
                <table className="text-[12px] border-collapse"
                  style={{ tableLayout: "fixed", minWidth: `${488 + displayColumns.length * (showSupply ? 270 : 95)}px` }}>
                  <colgroup>
                    <col style={{ width: 44 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 44 }} />
                    <col style={{ width: 145 }} />
                    <col style={{ width: 50 }} />
                    <col style={{ width: 95 }} />
                    {displayColumns.map((c) =>
                      showSupply
                        ? [
                            <col key={c.key + "s"} style={{ width: 90 }} />,
                            <col key={c.key + "u"} style={{ width: 90 }} />,
                            <col key={c.key + "v"} style={{ width: 90 }} />,
                          ]
                        : [<col key={c.key + "s"} style={{ width: 95 }} />],
                    )}
                  </colgroup>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#f5f6f7] text-[#6a6d70]">
                      <th rowSpan={2} className="text-center font-semibold py-2.5 px-2 text-[10px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">S.No</th>
                      <th rowSpan={2} className="text-left font-semibold py-2.5 px-2 text-[10px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">SA No.</th>
                      <th rowSpan={2} className="text-center font-semibold py-2.5 px-1 text-[10px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">Item</th>
                      <th rowSpan={2} className="text-left font-semibold py-2.5 px-2 text-[10px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">Part</th>
                      <th rowSpan={2} className="text-center font-semibold py-2.5 px-1 text-[10px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">Plant</th>
                      <th rowSpan={2} className="text-right font-semibold py-2.5 px-2 text-[10px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7] whitespace-nowrap leading-tight">
                        Cum.<br />Backlog Qty
                      </th>
                      {displayColumns.map((c) => (
                        <th key={c.key} colSpan={showSupply ? 3 : 1}
                          className="text-center font-semibold py-2 px-1 text-[10px] border-b border-r border-[#e5e5e5] bg-[#ebf5ff] text-[#0a6ed1] whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-[#fafbfc] text-[#6a6d70]">
                      {displayColumns.map((c) =>
                        showSupply
                          ? [
                              <th key={c.key + "s"} className="text-center font-semibold py-1.5 px-1 text-[9px] border-b border-r border-[#e5e5e5] uppercase">Sched</th>,
                              <th key={c.key + "u"} className="text-center font-semibold py-1.5 px-1 text-[9px] border-b border-r border-[#e5e5e5] uppercase">Supply</th>,
                              <th key={c.key + "v"} className="text-center font-semibold py-1.5 px-1 text-[9px] border-b border-r border-[#e5e5e5] uppercase text-[#b45309]">Variance</th>,
                            ]
                          : [
                              <th key={c.key + "s"} className="text-center font-semibold py-1.5 px-1 text-[9px] border-b border-r border-[#e5e5e5] uppercase">Sched</th>,
                            ],
                      )}
                    </tr>
                  </thead>
                  <tbody className="row-stagger">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={FIXED_COL_COUNT + displayColumns.length * colsPerPeriod}
                          className="py-12 text-center text-[13px] text-[#6a6d70]">No records</td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => {
                        const pm = getRowPeriodMap(row);
                        const cumNet = row.cumBacklogQty - row.grnQty;
                        return (
                          <tr key={`${row.ebeln}-${row.ebelp}-${idx}`}
                            className="border-b border-[#f0f0f0] hover:bg-[#fafbfc] transition-colors">
                            <td className="py-2 px-2 text-center text-[#6a6d70] font-semibold border-r border-[#f0f0f0]">{row.srNo || idx + 1}</td>
                            <td className="py-2 px-2 text-[#0a6ed1] font-semibold border-r border-[#f0f0f0] whitespace-nowrap">{row.ebeln}</td>
                            <td className="py-2 px-1 text-center text-[#32363a] border-r border-[#f0f0f0]">{row.ebelp}</td>
                            <td className="py-2 px-2 border-r border-[#f0f0f0]">
                              <div className="font-semibold text-[#0a6ed1] text-[11px]">{row.matnr || "—"}</div>
                              <div className="text-[#6a6d70] text-[10px] truncate">{row.maktx}</div>
                            </td>
                            <td className="py-2 px-1 text-center text-[#32363a] font-semibold border-r border-[#f0f0f0]">{row.werks}</td>
                            <td className="py-2 px-2 text-right border-r border-[#f0f0f0]">
                              <span className={`tabular-nums ${cumNet > 0 ? "font-bold text-[#b45309]" : cumNet < 0 ? "font-bold text-[#cc1c14]" : "text-[#d9d9d9]"}`}>
                                {cumNet.toFixed(3)}
                              </span>
                            </td>
                            {displayColumns.map((col) => {
                              const p = pm.get(col.key) || { schedule: 0, supply: 0 };
                              const v = calcVariance(p.schedule, p.supply);
                              return showSupply
                                ? [
                                    <td key={col.key + "s"} className="py-2 px-1 text-center border-r border-[#f0f0f0]">
                                      <span className={`tabular-nums text-[11px] ${p.schedule > 0 ? "font-semibold text-[#32363a]" : "text-[#d9d9d9]"}`}>{p.schedule.toFixed(3)}</span>
                                    </td>,
                                    <td key={col.key + "u"} className="py-2 px-1 text-center border-r border-[#f0f0f0]">
                                      <span className={`tabular-nums text-[11px] ${p.supply > 0 ? "font-semibold text-[#32363a]" : "text-[#d9d9d9]"}`}>{p.supply.toFixed(3)}</span>
                                    </td>,
                                    <td key={col.key + "v"} className="py-2 px-1 text-center border-r border-[#f0f0f0]">
                                      <span className={`tabular-nums text-[11px] ${v > 0 ? "font-semibold text-[#107e3e]" : v < 0 ? "font-semibold text-[#cc1c14]" : "text-[#d9d9d9]"}`}>
                                        {v === 0 ? "0.000" : `${v.toFixed(2)}%`}
                                      </span>
                                    </td>,
                                  ]
                                : [
                                    <td key={col.key + "s"} className="py-2 px-1 text-center border-r border-[#f0f0f0]">
                                      <span className={`tabular-nums text-[11px] ${p.schedule > 0 ? "font-semibold text-[#32363a]" : "text-[#d9d9d9]"}`}>{p.schedule.toFixed(3)}</span>
                                    </td>,
                                  ];
                            })}
                          </tr>
                        );
                      })
                    )}
                    {loadingMore && (
                      <tr>
                        <td colSpan={FIXED_COL_COUNT + displayColumns.length * colsPerPeriod} className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-[12px] text-[#6a6d70]">
                            <div className="w-4 h-4 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
                            Loading more…
                          </div>
                        </td>
                      </tr>
                    )}
                    {!hasMore && rows.length > 0 && (
                      <tr>
                        <td colSpan={FIXED_COL_COUNT + displayColumns.length * colsPerPeriod}
                          className="py-3 text-center text-[11px] text-[#6a6d70]">
                          ✓ All {rows.length} records loaded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}