const express = require('express');
const router = express.Router();
const controller = require('../controllers/plannedPurchase.controller');
const validate = require('../middleware/validate');
const { createPurchaseSchema, updatePurchaseSchema, convertPurchaseSchema } = require('../validators/plannedPurchase.validator');

router.get('/', controller.list);
router.post('/', validate(createPurchaseSchema), controller.create);
router.put('/:id', validate(updatePurchaseSchema), controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/convert', validate(convertPurchaseSchema), controller.convert);
router.get('/simulate', controller.simulate);

module.exports = router;
