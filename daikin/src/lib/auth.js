export const MOCK_USERS = {
  'arbeel.admin@daikin.com': { password: 'admin123', user: { id: '1', name: 'Arbeel Admin', email: 'arbeel.admin@daikin.com', role: 'partner' } },
  'arbeel.user@daikin.com':  { password: 'user123',  user: { id: '2', name: 'Arbeel User',  email: 'arbeel.user@daikin.com',  role: 'employee'  } },
};
// Map route paths to allowed roles
export const PAGE_PERMISSIONS = {
  '/landing': ['partner', 'employee', 'employeeadmin','approval'],
  '/dashboard': ['partner', 'employee', 'employeeadmin','approval'],
  '/purchasing/ScheduleRelease/schedule-release':    ['partner', 'employee','employeeadmin','approval'],
  '/purchasing/PurchaseOrder/purchase-order':      ['partner' , 'employee','employeeadmin','approval'],
  // '/purchasing/po-schedule-report':  ['partner', 'employee','employeeadmin'],
  '/purchasing/POReturn/poreturn':  ['partner', 'employee','employeeadmin','approval'],
  '/purchasing/ScheduleGenerate/schedule-generate':   [ 'employee','employeeadmin','approval'],
  '/purchasing/ScheduleGenerate/schedule-lines':      ['employee', 'employeeadmin', 'approval'],
  '/purchasing/create-asn':          ['partner', 'employee','employeeadmin','approval'],
  '/reports/ForecastReport/forecast-report':        ['partner','employee','approval'],
  '/reports/VendorLedgerReport/vendor-ledger-report':   ['partner','employee','employeeadmin','approval'],
  '/reports/GateinGateout/gatein-to-migo':    ['partner','employee','approval'],
  '/reports/DeliverySchedule/delivery-schedule':    ['partner','employee','approval'],
  '/reports/ASNReport/asn-report':                 ['partner','employee','approval'],
  '/shipment/AdvanceShippingNote/advance-shipping-note': ['partner','employee','employeeadmin','approval'],
  '/shipment/GoodsMovement/goods-movement':        ['partner','employee','employeeadmin','approval'],
  '/shipment/GateinGateout/gatein-gateout':        [ 'partner','employee','employeeadmin','approval'],
};

export const canAccess = (role, path) => (PAGE_PERMISSIONS[path] ?? ['employee', 'partner']).includes(role);

export const saveUser = (user) => localStorage.setItem('daikin_user', JSON.stringify(user));
// // export const getUser  = ()     => { const s = localStorage.getItem('daikin_user'); return s ? JSON.parse(s) : null; };
// export const getUser = () => {
//   const user = localStorage.getItem("user");
//   return user ? JSON.parse(user) : null;
// };
// export const logout   = ()     => localStorage.removeItem('daikin_user');
export const getVisibleModules = (role, NAV_MODULES) => {
  return NAV_MODULES
    .map((mod) => ({
      ...mod,
      tiles: mod.tiles.filter((tile) => canAccess(role, tile.path)),
    }))
    .filter((mod) => mod.tiles.length > 0)
}