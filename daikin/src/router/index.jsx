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
        cover:
          'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200',
      },
      {
        id: 'poreturn',
        label: 'PO Return / MATDOC',
        path: '/purchasing/poreturn',
        icon: 'return',
        cover:
          'https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=1200',
      },
      {
        id: 'purchase-order',
        label: 'Purchase Order',
        path: '/purchasing/purchase-order',
        icon: 'order',
        cover:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1562577309-2592ab84b1bc?q=80&w=1200',
      },
      {
        id:'asn-report',
        label:'ASN Report',
        path: '/reports/asn-report',
        icon: 'asn',
        cover:
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200',
      },
      {
        id:'gatein-to-migo',
        label:'Gate-In to MIGO Report', 
        path: '/reports/gatein-to-migo',
        icon: 'gate-migo',
        cover:
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200',
      },
      {
        id: 'delivery-schedule',
        label: 'Delivery Schedule Tracker',
        path: '/reports/delivery-schedule',
        icon: 'schedule-tracker',
        cover:
          'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200',
      },

      {
        id: 'vendor-ledger-report',
        label: 'Vendor Ledger Report',
        path: '/reports/vendor-ledger-report',
        icon: 'ledger',
        cover:
          'https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200',
      },

      {
        id: 'goods-movement',
        label: 'Goods Movement',
        sub: 'Track Shipments',
        path: '/shipment/goods-movement',
        icon: 'tracking',
        cover:
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200',
      },

      {
        id: 'gatein-gateout',
        label: 'Gate In Gate Out',
        sub: 'Manage Inbound/Outbound',
        path: '/shipment/gatein-gateout',
        icon: 'gate',
        cover:
          'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1200',
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