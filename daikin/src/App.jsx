import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import './app.css'

// Purchasing
import ScheduleRelease from './pages/purchasing/ScheduleRelease.jsx'
import PurchaseOrder from './pages/purchasing/PurchaseOrder.jsx'
import POScheduleReport from './pages/purchasing/POScheduleReport.jsx'
import ScheduleGenerate from './pages/purchasing/scheduleGenerate.jsx'

// Reports
import ForecastReport from './pages/reports/ForecastReport.jsx'
import VendorLedgerReport from './pages/reports/VendorLedgerReport.jsx'

// Goods Receipt
import GateInMIGO from './pages/goodsreceipt/GateInMIGO.jsx'

// Logistics
import DeliverySchedule from './pages/logistics/DeliverySchedule.jsx'

// ASN
import Asnreport from './pages/asn/Asnreport.jsx'

// Shipment
import Advanceshipment from './pages/shipment/Advanceshipment.jsx'
import GoodsMovement from './pages/shipment/GoodsMovement.jsx'
import GateInGateOut from './pages/shipment/gateingateout.jsx'

// Other
import CreateASN from './pages/purchasing/createASN.jsx'
import LandingPage from './components/landingpage.jsx'

export default function App() {
  return (
    <Routes>

      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Landing */}
      <Route path="/landing" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />

      {/* Purchasing */}
      <Route path="/purchasing/create-asn"         element={<ProtectedRoute><CreateASN /></ProtectedRoute>} />
      <Route path="/purchasing/schedule-release"   element={<ProtectedRoute><ScheduleRelease /></ProtectedRoute>} />
      <Route path="/purchasing/purchase-order"     element={<ProtectedRoute><PurchaseOrder /></ProtectedRoute>} />
      <Route path="/purchasing/po-schedule-report" element={<ProtectedRoute><POScheduleReport /></ProtectedRoute>} />
      <Route path="/purchasing/schedule-generate"  element={<ProtectedRoute><ScheduleGenerate /></ProtectedRoute>} />

      {/* Reports */}
      <Route path="/reports/forecast-report"       element={<ProtectedRoute><ForecastReport /></ProtectedRoute>} />
      <Route path="/reports/vendor-ledger-report"  element={<ProtectedRoute><VendorLedgerReport /></ProtectedRoute>} />

      {/* Goods Receipt */}
      <Route path="/goodsreceipt/gatein-to-migo"   element={<ProtectedRoute><GateInMIGO /></ProtectedRoute>} />

      {/* Logistics */}
      <Route path="/logistics/delivery-schedule"   element={<ProtectedRoute><DeliverySchedule /></ProtectedRoute>} />

      {/* ASN */}
      <Route path="/asn/asn-report"                element={<ProtectedRoute><Asnreport /></ProtectedRoute>} />

      {/* Shipment */}
      <Route path="/shipment/advance-shipping-note" element={<ProtectedRoute><Advanceshipment /></ProtectedRoute>} />
      <Route path="/shipment/goods-movement"        element={<ProtectedRoute><GoodsMovement /></ProtectedRoute>} />
      <Route path="/shipment/gatein-gateout"        element={<ProtectedRoute><GateInGateOut /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  )
}