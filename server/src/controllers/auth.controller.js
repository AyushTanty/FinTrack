const { register, login, refresh, getCurrentUser } = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const isProduction = process.env.NODE_ENV === 'production';
const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
});

async function registerHandler(req, res, next) {
  try {
    const data = await register(req.body);
    res.cookie('refreshToken', data.refreshToken, getCookieOptions());
    return successResponse(res, { accessToken: data.accessToken, user: data.user }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
}

async function loginHandler(req, res, next) {
  try {
    const data = await login(req.body);
    res.cookie('refreshToken', data.refreshToken, getCookieOptions());
    return successResponse(res, { accessToken: data.accessToken, user: data.user });
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
}

async function logoutHandler(req, res) {
  res.clearCookie('refreshToken', getCookieOptions());
  return successResponse(res, { message: 'Logged out' });
}

async function refreshHandler(req, res, next) {
  const unauthenticated = () => successResponse(res, { authenticated: false });
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return unauthenticated();

  try {
    const data = await refresh(refreshToken);
    if (!data) {
      res.clearCookie('refreshToken', getCookieOptions());
      return unauthenticated();
    }
    return successResponse(res, { ...data, authenticated: true });
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
      res.clearCookie('refreshToken', getCookieOptions());
      return unauthenticated();
    }
    return next(error);
  }
}

async function meHandler(req, res) {
  try {
    return successResponse(res, await getCurrentUser(req.user.id));
  } catch (error) {
    return errorResponse(res, error.message, 404);
  }
}

module.exports = { registerHandler, loginHandler, logoutHandler, refreshHandler, meHandler };
