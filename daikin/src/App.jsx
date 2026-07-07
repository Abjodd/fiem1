import { Routes, Route, Navigate } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import LandingPage from './components/landingpage.jsx'
import Home from './pages/Home.jsx'
import POreturn from './pages/purchasing/POReturn/POreturn.jsx'
import './app.css'
import SRlineitem from './pages/purchasing/ScheduleRelease/SRlineitem.jsx'
import POlineitem from './pages/purchasing/PurchaseOrder/POlineitem.jsx'

// Purchasing
import ScheduleRelease from './pages/purchasing/ScheduleRelease/ScheduleRelease.jsx'
import PurchaseOrder from './pages/purchasing/PurchaseOrder/PurchaseOrder.jsx'
import POScheduleReport from './dump/POScheduleReport.jsx'
import ScheduleGenerate from './pages/purchasing/ScheduleGenerate/scheduleGenerate.jsx'
import ImportPurchaseOrder from './pages/purchasing/ImportPO/ImportPO.jsx'

// Reports
import ForecastReport from './pages/reports/ForecastReport/ForecastReport.jsx'
import VendorLedgerReport from './pages/reports/VendorLedgerReport/VendorLedgerReport.jsx'

// Goods Receipt
import GateInMIGO from './pages/reports/GateInMIGO/GateInMIGO.jsx'

// Logistics
import DeliverySchedule from './pages/reports/DeliverySchedule/DeliverySchedule.jsx'

// ASN
import Asnreport from './pages/reports/ASNReport/Asnreport.jsx'

// Shipment
import Advanceshipment from './pages/shipment/AdvanceShipmentNote/Advanceshipment.jsx'
import GoodsMovement from './pages/shipment/GoodsMovement/GoodsMovement.jsx'
import GateInGateOut from './pages/shipment/GateinGateout/gateingateout.jsx'

// Other
import CreateASN from './pages/purchasing/PurchaseOrder/createASN.jsx'
import CreateASN2 from './pages/purchasing/ScheduleRelease/createAsn2.jsx'
import ScheduleLines from './pages/purchasing/ScheduleGenerate/Schedulelines.jsx'

export default function App() {
  return (
    <Routes>

      {/* SAP Auth Check - main entry point / login */}
      <Route path="/" element={<Home />} />

      {/* Landing */}
      <Route
        path="/landing"
        element={
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      />

      {/* Purchasing */}
      <Route
        path="/purchasing/PurchaseOrder/create-asn"
        element={
          <ProtectedRoute>
            <CreateASN />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchasing/ScheduleRelease/create-asn2"
        element={
          <ProtectedRoute>
            <CreateASN2 />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchasing/ScheduleRelease/schedule-release"
        element={
          <ProtectedRoute>
            <ScheduleRelease />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchasing/PurchaseOrder/purchase-order"
        element={
          <ProtectedRoute>
            <PurchaseOrder />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchasing/PurchaseOrder/po-lineitem"
        element={
          <ProtectedRoute>
            <POlineitem />
          </ProtectedRoute>
        }
      />

      {/* <Route
        path="/purchasing/PurchaseOrder/po-schedule-report"
        element={
          <ProtectedRoute>
            <POScheduleReport />
          </ProtectedRoute>
        }
      /> */}

      <Route
        path="/purchasing/ScheduleGenerate/schedule-generate"
        element={
          <ProtectedRoute>
            <ScheduleGenerate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchasing/ImportPO/import-purchase-order"
        element={
          <ProtectedRoute>
            <ImportPurchaseOrder />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchasing/ScheduleRelease/sr-lineitem"
        element={
          <ProtectedRoute>
            <SRlineitem />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchasing/ScheduleGenerate/schedule-lines"
        element={
          <ProtectedRoute>
            <ScheduleLines />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchasing/POReturn/poreturn"
        element={
          <ProtectedRoute>
            <POreturn />
          </ProtectedRoute>
        }
      />

      {/* Reports */}
      <Route
        path="/reports/ForecastReport/forecast-report"
        element={
          <ProtectedRoute>
            <ForecastReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports/VendorLedgerReport/vendor-ledger-report"
        element={
          <ProtectedRoute>
            <VendorLedgerReport />
          </ProtectedRoute>
        }
      />

      {/* Goods Receipt */}
      <Route
        path="/reports/GateinMIGO/gatein-to-migo"
        element={
          <ProtectedRoute>
            <GateInMIGO />
          </ProtectedRoute>
        }
      />

      {/* Logistics */}
      <Route
        path="/reports/DeliverySchedule/delivery-schedule"
        element={
          <ProtectedRoute>
            <DeliverySchedule />
          </ProtectedRoute>
        }
      />

      {/* ASN */}
      <Route
        path="/reports/ASNReport/asn-report"
        element={
          <ProtectedRoute>
            <Asnreport />
          </ProtectedRoute>
        }
      />

      {/* Shipment */}
      <Route
        path="/shipment/AdvanceShipmentNote/advance-shipping-note"
        element={
          <ProtectedRoute>
            <Advanceshipment />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shipment/GoodsMovement/goods-movement"
        element={
          <ProtectedRoute>
            <GoodsMovement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shipment/GateinGateout/gatein-gateout"
        element={
          <ProtectedRoute>
            <GateInGateOut />
          </ProtectedRoute>
        }
      />

      {/* Fallback — any unmatched route goes to main login/auth check */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}