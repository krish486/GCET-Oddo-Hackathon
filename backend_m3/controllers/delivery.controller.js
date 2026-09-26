const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/response');
const deliveryService = require('../services/delivery.service');

exports.listDeliveries = asyncHandler(async (req, res) => {
  const deliveries = await deliveryService.listDeliveries(req.query);
  sendResponse(res, 200, deliveries);
});

exports.getDelivery = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.getDeliveryById(req.params.id);
  sendResponse(res, 200, delivery);
});

exports.createDelivery = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.createDelivery(req.body, req.user.id);
  sendResponse(res, 201, delivery, 'Delivery created');
});

exports.updateDelivery = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.updateDelivery(req.params.id, req.body);
  sendResponse(res, 200, delivery, 'Delivery updated');
});

exports.checkAvailability = asyncHandler(async (req, res) => {
  const result = await deliveryService.checkAvailability(req.params.id);
  sendResponse(res, 200, result);
});

exports.validateDelivery = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.validateDelivery(req.params.id, req.user.id);
  sendResponse(res, 200, delivery, 'Delivery validated — stock updated');
});

exports.cancelDelivery = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.cancelDelivery(req.params.id);
  sendResponse(res, 200, delivery, 'Delivery canceled');
});
