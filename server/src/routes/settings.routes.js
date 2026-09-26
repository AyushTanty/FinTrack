const express = require('express');
const router = express.Router();
const controller = require('../controllers/settings.controller');
const validate = require('../middleware/validate');
const { updateSettingsSchema, createAccountSchema, updateAccountSchema } = require('../validators/settings.validator');

router.get('/', controller.getSettings);
router.put('/', validate(updateSettingsSchema), controller.updateSettings);
router.get('/accounts', controller.listAccounts);
router.post('/accounts', validate(createAccountSchema), controller.createAccount);
router.put('/accounts/:id', validate(updateAccountSchema), controller.updateAccount);

module.exports = router;
