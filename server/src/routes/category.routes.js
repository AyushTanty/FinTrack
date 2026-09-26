const express = require('express');
const router = express.Router();
const controller = require('../controllers/category.controller');
const validate = require('../middleware/validate');
const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');

router.get('/', controller.list);
router.post('/', validate(createCategorySchema), controller.create);
router.put('/:id', validate(updateCategorySchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
