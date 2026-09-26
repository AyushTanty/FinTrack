const express = require('express');
const router = express.Router();
const controller = require('../controllers/recurringExpense.controller');
const validate = require('../middleware/validate');
const { createRecurringSchema, updateRecurringSchema } = require('../validators/recurringExpense.validator');

router.get('/', controller.list);
router.post('/', validate(createRecurringSchema), controller.create);
router.put('/:id', validate(updateRecurringSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
