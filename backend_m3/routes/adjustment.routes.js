const express = require('express');
const router = express.Router();
const controller = require('../controllers/adjustment.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { createAdjustmentSchema, updateAdjustmentSchema } = require('../validators/adjustment.validator');

router.use(authenticate);

router.get('/', controller.listAdjustments);
router.get('/:id', controller.getAdjustment);
router.post('/', validate(createAdjustmentSchema), controller.createAdjustment);
router.patch('/:id', validate(updateAdjustmentSchema), controller.updateAdjustment);
router.post('/:id/validate', controller.validateAdjustment);
router.post('/:id/cancel', controller.cancelAdjustment);

module.exports = router;
