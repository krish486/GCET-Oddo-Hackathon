const ROLES = Object.freeze({ MANAGER: 'manager', STAFF: 'staff' });
const DOCUMENT_STATUS = Object.freeze({ DRAFT: 'draft', WAITING: 'waiting', READY: 'ready', DONE: 'done', CANCELED: 'canceled' });
const OPERATION_TYPES = Object.freeze({ RECEIPT: 'receipt', DELIVERY: 'delivery', TRANSFER: 'transfer', ADJUSTMENT: 'adjustment', INITIAL: 'initial' });

module.exports = { ROLES, DOCUMENT_STATUS, OPERATION_TYPES };
