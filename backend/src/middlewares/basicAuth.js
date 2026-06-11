const AppError = require("../utils/AppError");

function basicAuth(req, _res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Basic ")) {
    return next(
      new AppError("Autenticação administrativa obrigatória.", 401, "UNAUTHORIZED")
    );
  }

  const encodedCredentials = authorization.split(" ")[1];
  const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString("utf8");
  const separatorIndex = decodedCredentials.indexOf(":");

  if (separatorIndex === -1) {
    return next(new AppError("Credenciais inválidas.", 401, "UNAUTHORIZED"));
  }

  const user = decodedCredentials.slice(0, separatorIndex);
  const password = decodedCredentials.slice(separatorIndex + 1);

  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "troque_esta_senha";

  if (user !== expectedUser || password !== expectedPassword) {
    return next(new AppError("Usuário ou senha inválidos.", 401, "UNAUTHORIZED"));
  }

  return next();
}

module.exports = basicAuth;
