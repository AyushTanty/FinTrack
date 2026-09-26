const { errorResponse } = require('../utils/apiResponse');
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (e) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: e.errors });
  }
};
module.exports = validate;
