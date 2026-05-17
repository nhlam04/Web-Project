const config = require("../config");

function unauthorizedError(message = "Unauthorized") {
  const err = new Error(message);
  err.status = 401;
  err.code = "UNAUTHORIZED";
  return err;
}

async function verifyAccessToken(token) {
  if (!token) {
    throw unauthorizedError("Missing access token");
  }

  const response = await fetch(`${config.iam.baseUrl}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload?.error || payload?.message || "Token verification failed");
    err.status = response.status === 403 ? 403 : 401;
    err.code = response.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED";
    throw err;
  }

  const user = payload?.data || null;
  if (!user || !user.id) {
    throw unauthorizedError("Invalid identity response from IAM service");
  }

  return {
    userId: user.id,
    username: user.username || null,
  };
}

module.exports = {
  verifyAccessToken,
};
