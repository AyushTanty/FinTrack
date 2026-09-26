const express = require('express');
const router = express.Router();
const controller = require('../controllers/subscription.controller');
const validate = require('../middleware/validate');
const { createSubscriptionSchema, updateSubscriptionSchema, usageSchema, updateUsageSchema } = require('../validators/subscription.validator');

router.get('/', controller.list);
router.post('/', validate(createSubscriptionSchema), controller.create);
router.put('/:id', validate(updateSubscriptionSchema), controller.update);
router.post('/:id/cancel', controller.cancel);
router.post('/:id/reactivate', controller.reactivate);
router.delete('/:id', controller.remove);
router.get('/:id/usage', controller.getUsage);
router.post('/:id/usage', validate(usageSchema), controller.logUsage);
router.put('/:id/usage/:date', validate(updateUsageSchema), controller.updateUsage);
router.get('/:id/summary', controller.getSummary);

module.exports = router;
