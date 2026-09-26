const express = require('express');
const router = express.Router();
const controller = require('../controllers/expense.controller');
const validate = require('../middleware/validate');
const { createExpenseSchema, updateExpenseSchema } = require('../validators/expense.validator');

router.get('/', controller.list);
router.post('/', validate(createExpenseSchema), controller.create);
router.put('/:id', validate(updateExpenseSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
