/**
 * ROUTE REGISTRY
 * To add a new module: add an entry to NAV_MODULES
 * To add a new tile page: add it to the module's `tiles` array
 */

export const NAV_MODULES = [
  // =========================
  // FACTORY
  // =========================
  {
    id: 'factory',
    label: 'Factory',
    tiles: [
      {
        id: 'production-plan',
        label: 'Production Plan',
        path: '',
        icon: 'factory',
      },

      {
        id: 'machine-status',
        label: 'Machine Status',
        path: '',
        icon: 'machine',
      },

      {
        id: 'line-monitoring',
        label: 'Line Monitoring',
        path: '',
        icon: 'monitor',
      },

      {
        id: 'shift-management',
        label: 'Shift Management',
        path: '',
        icon: 'shift',
      },
    ],
  },

  // =========================
  // FINANCE
  // =========================
  {
    id: 'finance',
    label: 'Finance',
    tiles: [
      {
        id: 'invoice-management',
        label: 'Invoice Management',
        path: '',
        icon: 'invoice',
      },

      {
        id: 'payment-status',
        label: 'Payment Status',
        path: '',
        icon: 'payment',
      },

      {
        id: 'vendor-payments',
        label: 'Vendor Payments',
        path: '',
        icon: 'vendor-payment',
      },

      {
        id: 'financial-reports',
        label: 'Financial Reports',
        path: '',
        icon: 'finance',
      },
    ],
  },

  // =========================
  // LOGISTICS
  // =========================
  {
    id: 'logistics',
    label: 'Logistics',
    tiles: [
      {
        id: 'inventory-tracking',
        label: 'Inventory Tracking',
        path: '',
        icon: 'inventory',
      },

      {
        id: 'dispatch-management',
        label: 'Dispatch Management',
        path: '',
        icon: 'dispatch',
      },

      {
        id: 'material-movement',
        label: 'Material Movement',
        path: '',
        icon: 'movement',
      },

      {
        id: 'delivery-status',
        label: 'Delivery Status',
        path: '',
        icon: 'delivery',
      },
    ],
  },

  // =========================
  // PURCHASING
  // =========================
  {
    id: 'purchasing',
    label: 'Purchasing',
    tiles: [
      {
        id: 'schedule-release',
        label: 'Schedule Release',
        path: '/purchasing/schedule-release',
        icon: 'schedule',
      },

      {
        id: 'purchase-order',
        label: 'Purchase Order',
        path: '/purchasing/purchase-order',
        icon: 'order',
      },

      {
        id: 'vendor-stock',
        label: 'PU-3 : Vendor Stock Report',
        path: '',
        icon: 'stock',
      },

      {
        id: 'open-po',
        label: 'Open PO Report',
        sub: 'For Supplier',
        path: '/purchasing/open-po',
        icon: 'report',
      },
    ],
  },

  // =========================
  // QUALITY
  // =========================
  {
    id: 'quality',
    label: 'Quality',
    tiles: [
      {
        id: 'qc-4m',
        label: 'QC-4 : 4M Change Request',
        sub: 'Approval System',
        path: '',
        icon: 'change',
      },

      {
        id: 'qc-1',
        label: 'QC-1 : IR & CAR',
        sub: 'Inspection & Corrective Action',
        path: '',
        icon: 'inspect',
      },

      {
        id: 'qc-3',
        label: 'QC-3 : Sample Approval',
        path: '',
        icon: 'sample',
      },

      {
        id: 'process-audit',
        label: 'Process Audit',
        sub: 'Manage',
        path: '',
        icon: 'audit',
      },

      {
        id: 'vendor-master',
        label: 'Vendor Master',
        path: '',
        icon: 'vendor',
      },

      {
        id: 'pdir',
        label: 'PDIR Creation',
        path: '',
        icon: 'pdir',
      },
    ],
  },

  // =========================
  // REPORTS
  // =========================
  {
    id: 'reports',
    label: 'Reports',
    tiles: [
      {
        id: 'daily-reports',
        label: 'Daily Reports',
        path: '',
        icon: 'daily',
      },

      {
        id: 'monthly-reports',
        label: 'Monthly Reports',
        path: '',
        icon: 'monthly',
      },

      {
        id: 'analytics-dashboard',
        label: 'Analytics Dashboard',
        path: '',
        icon: 'analytics',
      },
    ],
  },

  // =========================
  // SERVICE PROCESS
  // =========================
  {
    id: 'service-process',
    label: 'Service Process',
    tiles: [
      {
        id: 'service-request',
        label: 'Service Request',
        path: '',
        icon: 'service',
      },

      {
        id: 'ticket-management',
        label: 'Ticket Management',
        path: '',
        icon: 'ticket',
      },

      {
        id: 'customer-support',
        label: 'Customer Support',
        path: '',
        icon: 'support',
      },
    ],
  },

  // =========================
  // SHIPMENT
  // =========================
  {
    id: 'shipment',
    label: 'Shipment',
    tiles: [
      {
        id: 'advance-shipping-note',
        label: 'Advance Shipping Note',
        path: '',
        icon: 'shipment',
      },

      {
        id: 'goods-movement',
        label: 'Goods Movement',
        sub: 'Track Shipments',
        path: '',
        icon: 'tracking',
      },

      {
        id: 'gate-in-out',
        label: 'Gate-In / Gate-Out',
        path: '',
        icon: 'gate',
      },
    ],
  },

  // =========================
  // TRANSPORT
  // =========================
  {
    id: 'transport',
    label: 'Transport',
    tiles: [
      {
        id: 'trip-summary-report',
        label: 'Trip Summary Report',
        path: '',
        icon: 'trip',
      },
    ],
  },

  // =========================
  // TMS STO
  // =========================
  {
    id: 'tms-sto',
    label: 'TMS STO',
    tiles: [
      {
        id: 'tms-sto-edit',
        label: 'TMS STO EDIT',
        path: '',
        icon: 'edit',
      },
    ],
  },

  // =========================
  // WAREHOUSE
  // =========================
  {
    id: 'warehouse',
    label: 'Warehouse',
    tiles: [
      {
        id: 'wh-2',
        label: 'WH-2 : Empty Bin Trolley Management',
        path: '',
        icon: 'warehouse',
      },

      {
        id: 'physical-verification',
        label: 'Physical Verification',
        path: '',
        icon: 'verify',
      },
    ],
  },

  // =========================
  // TMS DASHBOARD
  // =========================
  {
    id: 'tms-dashboard',
    label: 'TMS Dashboard',
    tiles: [
      {
        id: 'transport-changes',
        label: 'Transport Changes',
        path: '',
        icon: 'transport',
      },

      {
        id: 'ship-status',
        label: 'Ship Status',
        path: '',
        icon: 'ship',
      },

      {
        id: 'pod-adherence',
        label: 'POD Adherence Transporter',
        path: '',
        icon: 'pod',
      },

      {
        id: 'wh-wise-trip',
        label: 'WH wise Trip ID creation',
        path: '',
        icon: 'trip',
      },

      {
        id: 'sob-tms',
        label: 'SOB TMS',
        path: '',
        icon: 'dashboard',
      },
    ],
  },
]

export const findModuleByTilePath = (path) => {
  for (const mod of NAV_MODULES) {
    const tile = mod.tiles.find((t) => t.path === path)

    if (tile) {
      return {
        module: mod,
        tile,
      }
    }
  }

  return null
}