const { getSettings, updateSettings, listAccounts, createAccount, updateAccount } = require('../services/settings.service');
const { successResponse } = require('../utils/apiResponse');

exports.getSettings = async (req, res, next) => {
  try {
    const data = await getSettings(req.user.id);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.updateSettings = async (req, res, next) => {
  try {
    const data = await updateSettings(req.user.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.listAccounts = async (req, res, next) => {
  try {
    const data = await listAccounts(req.user.id);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.createAccount = async (req, res, next) => {
  try {
    const data = await createAccount(req.user.id, req.body);
    return successResponse(res, data, 201);
  } catch (error) { next(error); }
};
exports.updateAccount = async (req, res, next) => {
  try {
    const data = await updateAccount(req.user.id, req.params.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
