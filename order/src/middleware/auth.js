const config = require("../config");
const { verifyAccessToken } = require("../integration/iamClient");

function getBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

async function attachIdentity(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      req.identity = null;
      return next();
    }

    req.identity = await verifyAccessToken(token);
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireIdentity(req, res, next) {
  if (config.iam.authRequired && !req.identity) {
    const err = new Error("Authentication required");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    return next(err);
  }

  return next();
}

module.exports = {
  attachIdentity,
  requireIdentity,
};
