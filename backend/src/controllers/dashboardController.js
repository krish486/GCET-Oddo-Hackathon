const dashboard = require('../services/dashboardService');
const ledger = require('../services/ledgerService');
module.exports = { dashboard: ({ query }) => ({ data: dashboard.dashboard(query) }), ledger: ({ query }) => ({ data: ledger.list(query) }) };
