const express = require('express');
const router = express.Router();
const controller = require('../controllers/transfer.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { createTransferSchema, updateTransferSchema } = require('../validators/transfer.validator');

router.use(authenticate);

router.get('/', controller.listTransfers);
router.get('/:id', controller.getTransfer);
router.post('/', validate(createTransferSchema), controller.createTransfer);
router.patch('/:id', validate(updateTransferSchema), controller.updateTransfer);
router.post('/:id/validate', controller.validateTransfer);
router.post('/:id/cancel', controller.cancelTransfer);

module.exports = router;
