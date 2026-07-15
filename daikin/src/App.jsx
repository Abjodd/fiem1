import { Routes, Route, Navigate } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import LandingPage from './components/landingpage.jsx'
import Home from './pages/home.jsx'
import POreturn from './pages/purchasing/POReturn/POreturn.jsx'
import './App.css'
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
import Asnreport from './pages/reports/ASNReport/asnReport.jsx'

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