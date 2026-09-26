const express = require('express');
const router = express.Router();
const controller = require('../controllers/receipt.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { createReceiptSchema, updateReceiptSchema } = require('../validators/receipt.validator');

router.use(authenticate);

router.get('/', controller.listReceipts);
router.get('/:id', controller.getReceipt);
router.post('/', validate(createReceiptSchema), controller.createReceipt);
router.patch('/:id', validate(updateReceiptSchema), controller.updateReceipt);
router.post('/:id/validate', controller.validateReceipt);
router.post('/:id/cancel', controller.cancelReceipt);

module.exports = router;
