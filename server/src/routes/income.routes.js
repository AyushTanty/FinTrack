const express = require('express');
const router = express.Router();
const controller = require('../controllers/income.controller');
const validate = require('../middleware/validate');
const { createIncomeSchema, updateIncomeSchema } = require('../validators/income.validator');

router.get('/', controller.list);
router.post('/', validate(createIncomeSchema), controller.create);
router.put('/:id', validate(updateIncomeSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
