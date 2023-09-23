'use strict';

const jwt = require(`jsonwebtoken`);
const { success, error, sendStatus } = require(`./req_handler`);
const { logger } = require(`../middleware/logger`);
const util = require(`util`);
const session = require(`./session`);

const env = process.env;

async function login(user, req, type) {
  try {
    await session.regenerate(req);

    req.session.userId = user._id;
    req.session.type = type;
    await session.save(req);
    return true;
  } catch (error) {
    logger.error(`Failed setting session cookies.`, { error });
    return false;
  }
}

async function logout(req, res) {
  req.session.userId = null;
  req.session.type = null;

  try {
    await session.save(req);
    await session.regenerate(req);

    return await success(res);
  } catch (error) {
    logger.error(`Failed logout.`, { error });
    return await sendStatus(res, 500);
  }
}

function auth(req, res, next) {
  const { userId } = req.session;

  if (!userId) {
    return sendStatus(res, 403, `No credentials found.`);
  }

  req.user = { userId };
  return next();
}

function validate(req, res) {
  const { type } = req.session;

  if (!type) return sendStatus(res, 403, `No credentials found.`);

  return success(res, { token_type: type });
}

function set_refresh(user, res) {
  const refreshToken = jwt.sign(
    { userId: user._id, email: user.email },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: `7d`,
    }
  );

  try {
    res.cookie(`refreshToken`, refreshToken, {
      httpOnly: true,
      path: `/token/refresh`,
      sameSite: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  } catch (error) {
    logger.error(`Error setting refresh token as cookie.`, { error });
  }
  return refreshToken;
}

function set_access(user, res, type) {
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email, type },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: `2h`,
    }
  );

  try {
    res.cookie(`accessToken`, accessToken, {
      httpOnly: true,
      sameSite: true,
      maxAge: 2 * 60 * 60 * 1000,
    });
  } catch (error) {
    logger.error(`Error setting access token as cookie.`, { error });
  }
  return accessToken;
}

function set_tokens(user, res, type) {
  return {
    accessToken: set_access(user, res, type),
    refreshToken: set_refresh(user, res),
  };
}

function auth_token(req, res, next) {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return sendStatus(res, 403, `No token found.`);
  }

  try {
    const decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
  } catch (error) {
    return sendStatus(res, 401, `Invalid token.`);
  }

  return next();
}

function refresh(req, res) {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return sendStatus(res, 403, `No token found.`);
  }

  try {
    const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
    const user = decoded;

    const tokens = set_tokens(
      { _id: user.userId, email: user.email },
      res,
      user.type
    );

    return sendStatus(res, 200);
  } catch (error) {
    return sendStatus(res, 401, `Invalid token.`);
  }
}

function validate_token(req, res) {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return sendStatus(res, 403, `No token found.`);
  }

  try {
    const decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);
    return success(res, { token_type: decoded.type, expiresIn: decoded.exp });
    req.user = decoded;
  } catch (error) {
    return sendStatus(res, 401, `Invalid token.`);
  }
}

module.exports = { login, logout, auth, validate };
