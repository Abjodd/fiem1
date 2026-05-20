/**
 * ROUTE REGISTRY
 * Full route file with tile cover images
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
        cover:
          'https://images.unsplash.com/photo-1567789884554-0b844b597180?q=80&w=1200',
      },

      {
        id: 'machine-status',
        label: 'Machine Status',
        path: '',
        icon: 'machine',
        cover:
          'https://thumbs.dreamstime.com/b/control-panel-showing-buttons-lights-machine-operation-workshop-features-various-used-operating-machines-setup-444924993.jpg',
      },

      {
        id: 'line-monitoring',
        label: 'Line Monitoring',
        path: '',
        icon: 'monitor',
        cover:
          'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200',
      },

      {
        id: 'shift-management',
        label: 'Shift Management',
        path: '',
        icon: 'shift',
        cover:
          'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=1200',
      },

      {
        id: 'payment-status',
        label: 'Payment Status',
        path: '',
        icon: 'payment',
        cover:
          'https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1200',
      },

      {
        id: 'vendor-payments',
        label: 'Vendor Payments',
        path: '',
        icon: 'vendor-payment',
        cover:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200',
      },

      {
        id: 'financial-reports',
        label: 'Financial Reports',
        path: '',
        icon: 'finance',
        cover:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200',
      },

      {
        id: 'dispatch-management',
        label: 'Dispatch Management',
        path: '',
        icon: 'dispatch',
        cover:
          'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1200',
      },

      {
        id: 'material-movement',
        label: 'Material Movement',
        path: '',
        icon: 'movement',
        cover:
          'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200',
      },

      {
        id: 'delivery-status',
        label: 'Delivery Status',
        path: '',
        icon: 'delivery',
        cover:
          'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200',
      },

      {
        id: 'purchase-order',
        label: 'Purchase Order',
        path: '/purchasing/purchase-order',
        icon: 'order',
        cover:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200',
      },

      {
        id: 'vendor-stock',
        label: 'PU-3 : Vendor Stock Report',
        path: '',
        icon: 'stock',
        cover:
          'https://media.istockphoto.com/id/523155194/photo/financial-data-on-a-monitor-stock-market-data-on-led.jpg?s=612x612&w=0&k=20&c=_3Rm4QHvucRzhrosmVUPUQoDx8h-E35DijJsbtQS5mY=',
      },

      {
        id: 'po-schedule-report',
        label: 'PO Schedule Report',
        sub: 'Open PO Report',
        path: '/purchasing/po-schedule-report',
        icon: 'report',
        cover:
          'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200',
      },

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
        cover:
          'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=1200',
      },

      {
        id: 'qc-1',
        label: 'QC-1 : IR & CAR',
        sub: 'Inspection & Corrective Action',
        path: '',
        icon: 'inspect',
        cover:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200',
      },

      {
        id: 'qc-3',
        label: 'QC-3 : Sample Approval',
        path: '',
        icon: 'sample',
        cover:
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200',
      },

      {
        id: 'process-audit',
        label: 'Process Audit',
        sub: 'Manage',
        path: '',
        icon: 'audit',
        cover:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200',
      },

      {
        id: 'vendor-master',
        label: 'Vendor Master',
        path: '',
        icon: 'vendor',
        cover:
          'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200',
      },

      {
        id: 'pdir',
        label: 'PDIR Creation',
        path: '',
        icon: 'pdir',
        cover:
          'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200',
      },

      {
        id: 'monthly-reports',
        label: 'Monthly Reports',
        path: '',
        icon: 'monthly',
        cover:
          'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200',
      },

      {
        id: 'analytics-dashboard',
        label: 'Analytics Dashboard',
        path: '',
        icon: 'analytics',
        cover:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1200',
      },

      {
        id: 'ticket-management',
        label: 'Ticket Management',
        path: '',
        icon: 'ticket',
        cover:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200',
      },

      {
        id: 'customer-support',
        label: 'Customer Support',
        path: '',
        icon: 'support',
        cover:
          'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1586528116493-0e4d2f8d0c59?q=80&w=1200',
      },

      {
        id: 'physical-verification',
        label: 'Physical Verification',
        path: '',
        icon: 'verify',
        cover:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200',
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
        cover:
          'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200',
      },

      {
        id: 'ship-status',
        label: 'Ship Status',
        path: '',
        icon: 'ship',
        cover:
          'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200',
      },

      {
        id: 'pod-adherence',
        label: 'POD Adherence Transporter',
        path: '',
        icon: 'pod',
        cover:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200',
      },

      {
        id: 'wh-wise-trip',
        label: 'WH wise Trip ID creation',
        path: '',
        icon: 'trip',
        cover:
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200',
      },

      {
        id: 'sob-tms',
        label: 'SOB TMS',
        path: '',
        icon: 'dashboard',
        cover:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200',
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