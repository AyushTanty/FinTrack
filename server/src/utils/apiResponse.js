function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function errorResponse(res, error, statusCode = 400) {
  return res.status(statusCode).json({ success: false, error });
}

module.exports = {
  successResponse,
  errorResponse
};
