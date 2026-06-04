export const MOCK_USERS = {
  'arbeel.admin@daikin.com': { password: 'admin123', user: { id: '1', name: 'Arbeel Admin', email: 'arbeel.admin@daikin.com', role: 'partner' } },
  'arbeel.user@daikin.com':  { password: 'user123',  user: { id: '2', name: 'Arbeel User',  email: 'arbeel.user@daikin.com',  role: 'employee'  } },
};
// Map route paths to allowed roles
export const PAGE_PERMISSIONS = {
  '/purchasing/schedule-release':    ['partner', 'employee'],
  '/purchasing/purchase-order':      ['partner'],
  '/purchasing/po-schedule-report':  ['partner', 'employee'],
  '/purchasing/schedule-generate':   ['partner'],
  '/purchasing/create-asn':          ['partner', 'employee'],
  '/reports/forecast-report':        ['partner'],
  '/reports/vendor-ledger-report':   ['partner'],
  '/goodsreceipt/gatein-to-migo':    ['partner'],
  '/logistics/delivery-schedule':    ['partner'],
  '/asn/asn-report':                 ['partner'],
  '/shipment/advance-shipping-note': ['partner'],
  '/shipment/goods-movement':        ['partner'],
  '/shipment/gatein-gateout':        ['partner'],
};

export const canAccess = (role, path) => (PAGE_PERMISSIONS[path] ?? ['employee', 'partner']).includes(role);

export const saveUser = (user) => localStorage.setItem('daikin_user', JSON.stringify(user));
// export const getUser  = ()     => { const s = localStorage.getItem('daikin_user'); return s ? JSON.parse(s) : null; };
export const getUser = () => {
  const user = localStorage.getItem("user");

  return user ? JSON.parse(user) : null;
};
export const logout   = ()     => localStorage.removeItem('daikin_user');