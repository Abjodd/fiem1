/**
 * ROUTE REGISTRY
 * To add a new module: add an entry to NAV_MODULES
 * To add a new tile page: add it to the module's `tiles` array
 * Each tile.path must match a <Route> in App.jsx
 */

export const NAV_MODULES = [
  {
    id: 'factory',
    label: 'Factory',
    tiles: [],
  },
  {
    id: 'finance',
    label: 'Finance',
    tiles: [],
  },
  {
    id: 'logistics',
    label: 'Logistics',
    tiles: [
      {
        id: 'inbound',
        label: 'Inbound',
        path:'/purchasing/schedule-release',
        icon: 'order',

      }
    ],
  },
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
        label: 'PU-3: Vendor Stock Report',
        path: '/purchasing/vendor-stock',
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
  {
    id: 'quality',
    label: 'Quality',
    tiles: [
      {
        id: 'qc-4m',
        label: 'QC-4: 4M Change Request',
        sub: 'Approval System',
        path: '/quality/qc-4m',
        icon: 'change',
      },
      {
        id: 'qc-1',
        label: 'QC-1: IR & CAR',
        sub: 'Inspection & Corrective Action',
        path: '/quality/qc-1',
        icon: 'inspect',
      },
      {
        id: 'qc-3',
        label: 'QC-3: Sample Approval',
        path: '/quality/qc-3',
        icon: 'sample',
      },
      {
        id: 'process-audit',
        label: 'Process Audit',
        sub: 'Manage',
        path: '/quality/process-audit',
        icon: 'audit',
      },
      {
        id: 'vendor-master',
        label: 'Vendor Master',
        path: '/quality/vendor-master',
        icon: 'vendor',
      },
      {
        id: 'pdir',
        label: 'PDIR Creation',
        path: '/quality/pdir',
        icon: 'pdir',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    tiles: [],
  },
  {
    id: 'service-process',
    label: 'Service Process',
    tiles: [],
  },
  {
    id: 'shipment',
    label: 'Shipment',
    tiles: [],
  },
  {
    id: 'transport',
    label: 'Transport',
    tiles: [],
  },
  {
    id: 'warehouse',
    label: 'Warehouse',
    tiles: [],
  },
]

export const findModuleByTilePath = (path) => {
  for (const mod of NAV_MODULES) {
    const tile = mod.tiles.find(t => t.path === path)
    if (tile) return { module: mod, tile }
  }
  return null
}
