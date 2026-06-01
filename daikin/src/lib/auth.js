export const MOCK_USERS = {
  'arbeel.admin@daikin.com': { password: 'admin123', user: { id: '1', name: 'Arbeel Admin', email: 'arbeel.admin@daikin.com', role: 'admin' } },
  'arbeel.user@daikin.com':  { password: 'user123',  user: { id: '2', name: 'Arbeel User',  email: 'arbeel.user@daikin.com',  role: 'user'  } },
};
// Map route paths to allowed roles
export const PAGE_PERMISSIONS = {
  '/purchasing/schedule-release':    ['admin'],
  '/purchasing/purchase-order':      ['admin', 'user'],
  '/purchasing/po-schedule-report':  ['admin'],
  '/purchasing/schedule-generate':   ['admin'],
  '/purchasing/create-asn':          ['admin', 'user'],
  '/reports/forecast-report':        ['admin'],
  '/reports/vendor-ledger-report':   ['admin'],
  '/goodsreceipt/gatein-to-migo':    ['admin', 'user'],
  '/logistics/delivery-schedule':    ['admin', 'user'],
  '/asn/asn-report':                 ['admin', 'user'],
  '/shipment/advance-shipping-note': ['admin', 'user'],
  '/shipment/goods-movement':        ['admin', 'user'],
  '/shipment/gatein-gateout':        ['admin', 'user'],
};

export const canAccess = (role, path) => (PAGE_PERMISSIONS[path] ?? ['admin', 'user']).includes(role);

export const saveUser = (user) => localStorage.setItem('daikin_user', JSON.stringify(user));
export const getUser  = ()     => { const s = localStorage.getItem('daikin_user'); return s ? JSON.parse(s) : null; };
export const logout   = ()     => localStorage.removeItem('daikin_user');