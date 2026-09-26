const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/response');
const transferService = require('../services/transfer.service');

exports.listTransfers = asyncHandler(async (req, res) => {
  const transfers = await transferService.listTransfers(req.query);
  sendResponse(res, 200, transfers);
});

exports.getTransfer = asyncHandler(async (req, res) => {
  const transfer = await transferService.getTransferById(req.params.id);
  sendResponse(res, 200, transfer);
});

exports.createTransfer = asyncHandler(async (req, res) => {
  const transfer = await transferService.createTransfer(req.body, req.user.id);
  sendResponse(res, 201, transfer, 'Transfer created');
});

exports.updateTransfer = asyncHandler(async (req, res) => {
  const transfer = await transferService.updateTransfer(req.params.id, req.body);
  sendResponse(res, 200, transfer, 'Transfer updated');
});

exports.validateTransfer = asyncHandler(async (req, res) => {
  const transfer = await transferService.validateTransfer(req.params.id, req.user.id);
  sendResponse(res, 200, transfer, 'Transfer validated — stock moved');
});

exports.cancelTransfer = asyncHandler(async (req, res) => {
  const transfer = await transferService.cancelTransfer(req.params.id);
  sendResponse(res, 200, transfer, 'Transfer canceled');
});
