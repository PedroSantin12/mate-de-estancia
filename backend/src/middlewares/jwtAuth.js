const User = require("../models/User");
const AppError = require("../utils/AppError");
const { verifyToken } = require("../services/authService");

async function jwtAuth(req, _res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const payload = authorization.startsWith("Bearer ") ? verifyToken(authorization.slice(7)) : null;
    if (!payload) throw new AppError("Faça login para continuar.", 401, "AUTH_REQUIRED");
    const user = await User.findByPk(payload.sub);
    if (!user) throw new AppError("Sessão inválida.", 401, "AUTH_REQUIRED");
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin") return next(new AppError("Acesso administrativo obrigatório.", 403, "FORBIDDEN"));
  return next();
}

module.exports = { jwtAuth, requireAdmin };
