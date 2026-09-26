const { errorResponse } = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === 'ZodError') {
    const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return errorResponse(res, messages, 400);
  }
  return errorResponse(res, 'Internal Server Error', 500);
}

module.exports = errorHandler;
