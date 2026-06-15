export const MOCK_USERS = {
  'arbeel.admin@daikin.com': { password: 'admin123', user: { id: '1', name: 'Arbeel Admin', email: 'arbeel.admin@daikin.com', role: 'employee' } },
  'arbeel.user@daikin.com':  { password: 'user123',  user: { id: '2', name: 'Arbeel User',  email: 'arbeel.user@daikin.com',  role: 'partner'  } },
};
// Map route paths to allowed roles
export const PAGE_PERMISSIONS = {
  '/landing': ['employee', 'partner', 'admin'],
  '/purchasing/schedule-release':    ['employee', 'partner'],
  '/purchasing/purchase-order':      ['employee'],
  '/purchasing/po-schedule-report':  ['employee', 'partner'],
  '/purchasing/schedule-generate':   ['employee'],
  '/purchasing/create-asn':          ['employee', 'partner'],
  '/reports/forecast-report':        ['employee'],
  '/reports/vendor-ledger-report':   ['employee'],
  '/goodsreceipt/gatein-to-migo':    ['employee'],
  '/logistics/delivery-schedule':    ['employee'],
  '/asn/asn-report':                 ['employee'],
  '/shipment/advance-shipping-note': ['employee'],
  '/shipment/goods-movement':        ['employee'],
  '/shipment/gatein-gateout':        ['employee'],
};

export const canAccess = (role, path) => (PAGE_PERMISSIONS[path] ?? ['partner', 'employee']).includes(role);

export const saveUser = (user) => localStorage.setItem('daikin_user', JSON.stringify(user));
// // export const getUser  = ()     => { const s = localStorage.getItem('daikin_user'); return s ? JSON.parse(s) : null; };
// export const getUser = () => {
//   const user = localStorage.getItem("user");
//   return user ? JSON.parse(user) : null;
// };
// export const logout   = ()     => localStorage.removeItem('daikin_user');