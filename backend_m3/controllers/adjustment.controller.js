const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/response');
const adjustmentService = require('../services/adjustment.service');

exports.listAdjustments = asyncHandler(async (req, res) => {
  const adjustments = await adjustmentService.listAdjustments(req.query);
  sendResponse(res, 200, adjustments);
});

exports.getAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await adjustmentService.getAdjustmentById(req.params.id);
  sendResponse(res, 200, adjustment);
});

exports.createAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await adjustmentService.createAdjustment(req.body, req.user.id);
  sendResponse(res, 201, adjustment, 'Adjustment created');
});

exports.updateAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await adjustmentService.updateAdjustment(req.params.id, req.body);
  sendResponse(res, 200, adjustment, 'Adjustment updated');
});

exports.validateAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await adjustmentService.validateAdjustment(req.params.id, req.user.id);
  sendResponse(res, 200, adjustment, 'Adjustment validated — stock corrected');
});

exports.cancelAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await adjustmentService.cancelAdjustment(req.params.id);
  sendResponse(res, 200, adjustment, 'Adjustment canceled');
});
