const express = require('express');
const router = express.Router();
const controller = require('../controllers/budget.controller');
const validate = require('../middleware/validate');
const { createBudgetSchema, updateBudgetSchema } = require('../validators/budget.validator');

router.get('/', controller.list);
router.get('/vs-actual', controller.vsActual);
router.post('/', validate(createBudgetSchema), controller.upsert);
router.put('/:id', validate(updateBudgetSchema), controller.update);

module.exports = router;
