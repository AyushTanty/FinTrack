const { verifyAccessToken } = require('../utils/tokenHelpers');
const { errorResponse } = require('../utils/apiResponse');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Unauthorized', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
}

module.exports = authenticate;
