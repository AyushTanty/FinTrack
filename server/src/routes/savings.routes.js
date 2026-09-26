const express = require('express');
const router = express.Router();
const controller = require('../controllers/savings.controller');
const validate = require('../middleware/validate');
const { createGoalSchema, updateGoalSchema, addContributionSchema } = require('../validators/savings.validator');

router.get('/', controller.list);
router.post('/', validate(createGoalSchema), controller.create);
router.put('/:id', validate(updateGoalSchema), controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/contributions', validate(addContributionSchema), controller.addContribution);
router.get('/:id/contributions', controller.getContributions);

module.exports = router;
