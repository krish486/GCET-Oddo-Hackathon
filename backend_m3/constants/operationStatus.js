// Shared lifecycle status for every stock operation (Receipt, Delivery, Transfer, Adjustment)
module.exports = {
  DRAFT: 'draft',
  WAITING: 'waiting',
  READY: 'ready',
  DONE: 'done',
  CANCELED: 'canceled',
};
