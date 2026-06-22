/**
 * ROUTE REGISTRY
 * Full route file with tile cover images
 */

export const NAV_MODULES = [
  

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
        cover: import.meta.env.BASE_URL + 'images/ScheduleRelease.png',
      },      
           
      {
        id: 'poreturn',
        label: 'PO Return / MATDOC',
        path: '/purchasing/poreturn',
        icon: 'return',
        cover: import.meta.env.BASE_URL + 'images/PO_Return.png',
      },
      {
        id: 'purchase-order',
        label: 'Purchase Order',
        path: '/purchasing/purchase-order',
        icon: 'order',
        cover: import.meta.env.BASE_URL + 'images/PurchaseOrder.png',
      },

    

      // {
      //   id: 'po-schedule-report',
      //   label: 'PO Schedule Report',
      //   sub: 'Open PO Report',
      //   path: '/purchasing/po-schedule-report',
      //   icon: 'report',
      //   cover:
      //     'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200',
      // },

      {
        id: 'schedule-generate',
        label: 'Schedule Generate',
        sub: 'For Supplier',
        path: '/purchasing/schedule-generate',
        icon: 'generate',
        cover: import.meta.env.BASE_URL + 'images/ScheduleGenerate.png',
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
        id: 'forecast-report',
        label: 'Forecast Reports',
        path: '/reports/forecast-report',
        icon: 'forecast',
        cover: import.meta.env.BASE_URL + 'images/Forecast.png',
      },
      {
        id:'asn-report',
        label:'ASN Report',
        path: '/reports/asn-report',
        icon: 'asn',
        cover: import.meta.env.BASE_URL + 'images/asn-report.png',
      },
      {
        id:'gatein-to-migo',
        label:'Gate-In to MIGO Report', 
        path: '/reports/gatein-to-migo',
        icon: 'gate-migo',
        cover: import.meta.env.BASE_URL + 'images/Gate_IN_MIGO.png',
      },
      {
        id: 'delivery-schedule',
        label: 'Delivery Schedule Tracker',
        path: '/reports/delivery-schedule',
        icon: 'schedule-tracker',
        cover: import.meta.env.BASE_URL + 'images/Delivery_schedule_tracker.png',
      },

      {
        id: 'vendor-ledger-report',
        label: 'Vendor Ledger Report',
        path: '/reports/vendor-ledger-report',
        icon: 'ledger',
        cover: import.meta.env.BASE_URL + 'images/Vender_ledger_report.png',
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
        path: '/shipment/advance-shipping-note',
        icon: 'shipment',
        cover: import.meta.env.BASE_URL + 'images/advance-shipping-note.png',
      },

      {
        id: 'goods-movement',
        label: 'Goods Movement',
        sub: 'Track Shipments',
        path: '/shipment/goods-movement',
        icon: 'tracking',
        cover: import.meta.env.BASE_URL + 'images/goods-movement.png',
      },

      {
        id: 'gatein-gateout',
        label: 'Gate In Gate Out',
        sub: 'Manage Inbound/Outbound',
        path: '/shipment/gatein-gateout',
        icon: 'gate',
        cover: import.meta.env.BASE_URL + 'images/gatein-gateout.png',
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