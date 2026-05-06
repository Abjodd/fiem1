import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import './app.css'

// Purchasing
import ScheduleRelease from './pages/purchasing/ScheduleRelease.jsx'
import PurchaseOrder from './pages/purchasing/PurchaseOrder.jsx'
// import VendorStock from './pages/purchasing/VendorStock.jsx'
import OpenPOReport from './pages/purchasing/OpenPOReport.jsx'

// Quality
// import { QC4M, QC1, QC3, ProcessAudit, VendorMaster, PDIRCreation } from './pages/quality/index.jsx'

/**
 * ADD NEW ROUTES HERE as you build more pages.
 * Pattern: <Route path="/module/tile-id" element={<YourPage />} />
 */
export default function App() {
  return (
    <Routes>
      {/* Home — shows the module tile dashboard */}
      <Route path="/" element={<MainLayout />} />

      {/* Purchasing */}
      <Route path="/purchasing/schedule-release" element={<ScheduleRelease />} />
      <Route path="/purchasing/purchase-order" element={<PurchaseOrder />} />
      {/* <Route path="/purchasing/vendor-stock" element={<VendorStock />} /> */}
      <Route path="/purchasing/open-po" element={<OpenPOReport />} />

      {/* Quality
      <Route path="/quality/qc-4m" element={<QC4M />} />
      <Route path="/quality/qc-1" element={<QC1 />} />
      <Route path="/quality/qc-3" element={<QC3 />} />
      <Route path="/quality/process-audit" element={<ProcessAudit />} />
      <Route path="/quality/vendor-master" element={<VendorMaster />} />
      <Route path="/quality/pdir" element={<PDIRCreation />} /> */}

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
