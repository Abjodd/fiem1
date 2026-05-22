import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import './app.css'

// Purchasing
import ScheduleRelease from './pages/purchasing/ScheduleRelease.jsx'
import PurchaseOrder from './pages/purchasing/PurchaseOrder.jsx'
import POScheduleReport from './pages/purchasing/POScheduleReport.jsx'  //20th May Requirement
import ScheduleGenerate from './pages/purchasing/scheduleGenerate.jsx'  //New Requirement given on 14th May

//Reports
import ForecastReport from './pages/reports/ForecastReport.jsx'
//import VendorLedgerReport from './pages/reports/VendorLedgerReport.jsx'
import GateInMIGO from './pages/reports/GateInMIGO.jsx'
import DeliverySchedule from './pages/reports/DeliverySchedule.jsx'
  

// Shipment
import Advanceshipment from './pages/shipment/Advanceshipment.jsx'
import GoodsMovement from './pages/shipment/GoodsMovement.jsx'
import GateInGateOut from './pages/shipment/gateingateout.jsx'
import CreateASN from './pages/purchasing/createASN.jsx'
import PageLayout from './layouts/PageLayout.jsx'

// Landing
import LandingPage from './components/landingpage.jsx'


export default function App() {
  return (
    
    <Routes>

      {/* First Page */}
      <Route path="/" element={<Navigate to="/landing" replace />} />
      {/* Create ASN - New Route */}
      <Route path="/purchasing/create-asn" element={<CreateASN />} />

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

      {/* Reports */}
      <Route
        path="/reports/forecast-report" element={<ForecastReport />}
      />

      {/* <Route
        path="/reports/vendor-ledger-report" element={<VendorLedgerReport />}
      /> */}

      <Route
        path="/reports/gatein-to-migo" element={<GateInMIGO />}
      />

      <Route
        path="/reports/delivery-schedule" element={<DeliverySchedule />}
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