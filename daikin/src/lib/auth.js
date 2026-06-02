export const MOCK_USERS = {
  'arbeel.admin@daikin.com': { password: 'admin123', user: { id: '1', name: 'Arbeel Admin', email: 'arbeel.admin@daikin.com', role: 'employee' } },
  'arbeel.user@daikin.com':  { password: 'user123',  user: { id: '2', name: 'Arbeel User',  email: 'arbeel.user@daikin.com',  role: 'supplier'  } },
};
// Map route paths to allowed roles
export const PAGE_PERMISSIONS = {
  '/purchasing/schedule-release':    ['employee', 'supplier'],
  '/purchasing/purchase-order':      ['employee'],
  '/purchasing/po-schedule-report':  ['employee', 'supplier'],
  '/purchasing/schedule-generate':   ['employee'],
  '/purchasing/create-asn':          ['employee', 'supplier'],
  '/reports/forecast-report':        ['employee'],
  '/reports/vendor-ledger-report':   ['employee'],
  '/goodsreceipt/gatein-to-migo':    ['employee'],
  '/logistics/delivery-schedule':    ['employee'],
  '/asn/asn-report':                 ['employee'],
  '/shipment/advance-shipping-note': ['employee'],
  '/shipment/goods-movement':        ['employee'],
  '/shipment/gatein-gateout':        ['employee'],
};

export const canAccess = (role, path) => (PAGE_PERMISSIONS[path] ?? ['supplier', 'employee']).includes(role);

export const saveUser = (user) => localStorage.setItem('daikin_user', JSON.stringify(user));
export const getUser  = ()     => { const s = localStorage.getItem('daikin_user'); return s ? JSON.parse(s) : null; };
export const logout   = ()     => localStorage.removeItem('daikin_user');