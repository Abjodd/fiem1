import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import './app.css'

// Purchasing
import ScheduleRelease from './pages/purchasing/ScheduleRelease.jsx'
import PurchaseOrder from './pages/purchasing/PurchaseOrder.jsx'
import POScheduleReport from './pages/purchasing/POScheduleReport.jsx'
import ScheduleGenerate from './pages/purchasing/scheduleGenerate.jsx'  //New Requirement given on 14th May

// Shipment
import Advanceshipment from './pages/shipment/Advanceshipment.jsx'
import GoodsMovement from './pages/shipment/GoodsMovement.jsx'
import GateInGateOut from './pages/shipment/gateingateout.jsx'

// Landing
import LandingPage from './components/landingpage.jsx'

export default function App() {
  return (
    <Routes>

      {/* First Page */}
      <Route path="/" element={<Navigate to="/landing" replace />} />

      {/* Landing Page */}
      <Route path="/landing" element={<LandingPage />} />

      {/* Dashboard / Main Layout */}
      <Route path="/dashboard" element={<MainLayout />} />

      {/* Purchasing */}
      <Route
        path="/purchasing/schedule-release"
        element={<ScheduleRelease />}
      />

      <Route
        path="/purchasing/purchase-order"
        element={<PurchaseOrder />}
      />

      <Route
        path="/purchasing/po-schedule-report"
        element={<POScheduleReport />}
      />

      <Route
        path="/purchasing/schedule-generate"
        element={<ScheduleGenerate />}
      />

      {/* Shipment */}
      <Route
        path="/shipment/advance-shipping-note"
        element={<Advanceshipment />}
      />

      <Route
        path="/shipment/goods-movement"
        element={<GoodsMovement />}
      />

      <Route
        path="/shipment/gatein-gateout"
        element={<GateInGateOut />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/landing" replace />} />

    </Routes>
  )
}