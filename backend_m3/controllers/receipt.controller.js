const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/response');
const receiptService = require('../services/receipt.service');

exports.listReceipts = asyncHandler(async (req, res) => {
  const receipts = await receiptService.listReceipts(req.query);
  sendResponse(res, 200, receipts);
});

exports.getReceipt = asyncHandler(async (req, res) => {
  const receipt = await receiptService.getReceiptById(req.params.id);
  sendResponse(res, 200, receipt);
});

exports.createReceipt = asyncHandler(async (req, res) => {
  const receipt = await receiptService.createReceipt(req.body, req.user.id);
  sendResponse(res, 201, receipt, 'Receipt created');
});

exports.updateReceipt = asyncHandler(async (req, res) => {
  const receipt = await receiptService.updateReceipt(req.params.id, req.body);
  sendResponse(res, 200, receipt, 'Receipt updated');
});

exports.validateReceipt = asyncHandler(async (req, res) => {
  const receipt = await receiptService.validateReceipt(req.params.id, req.user.id);
  sendResponse(res, 200, receipt, 'Receipt validated — stock updated');
});

exports.cancelReceipt = asyncHandler(async (req, res) => {
  const receipt = await receiptService.cancelReceipt(req.params.id);
  sendResponse(res, 200, receipt, 'Receipt canceled');
});
