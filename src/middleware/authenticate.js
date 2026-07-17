const jwt = require("jsonwebtoken");
const { secret } = require("../config/jwt");

/**
 * Middleware de autenticação para rotas REST.
 * Espera um header: Authorization: Bearer <token>
 * Popula req.user = { id, name } a partir do JWT (mesmo formato usado no login).
 *
 * NOTA: não tenho acesso ao teu middleware/authMiddleware.js original (que já
 * exporta validate, asyncHandler, authErrorHandler), por isso criei este ficheiro
 * separado em vez de arriscar sobrescrever o que já lá está. Se preferires,
 * podes mover esta função para dentro do authMiddleware.js existente.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token de autenticação em falta" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { id, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

module.exports = { authenticate };