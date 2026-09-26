const express = require('express');
const router = express.Router();
const controller = require('../controllers/monthlyPlan.controller');
const validate = require('../middleware/validate');
const { createMonthlyPlanSchema, updateMonthlyPlanSchema, rolloverSchema } = require('../validators/monthlyPlan.validator');

router.get('/', controller.list);
router.post('/', validate(createMonthlyPlanSchema), controller.create);
router.put('/:id', validate(updateMonthlyPlanSchema), controller.update);
router.post('/:id/rollover', validate(rolloverSchema), controller.rollover);

module.exports = router;
