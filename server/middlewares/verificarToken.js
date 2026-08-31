const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "No se proporcionó un token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Formato de token inválido" });
  }

  try {
    const datosUsuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datosUsuario;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

module.exports = verificarToken;
