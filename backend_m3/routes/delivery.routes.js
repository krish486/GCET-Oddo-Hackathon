const express = require('express');
const router = express.Router();
const controller = require('../controllers/delivery.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { createDeliverySchema, updateDeliverySchema } = require('../validators/delivery.validator');

router.use(authenticate);

router.get('/', controller.listDeliveries);
router.get('/:id', controller.getDelivery);
router.post('/', validate(createDeliverySchema), controller.createDelivery);
router.patch('/:id', validate(updateDeliverySchema), controller.updateDelivery);
router.get('/:id/availability', controller.checkAvailability);
router.post('/:id/validate', controller.validateDelivery);
router.post('/:id/cancel', controller.cancelDelivery);

module.exports = router;
