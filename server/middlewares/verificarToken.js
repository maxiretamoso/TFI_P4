import jwt from "jsonwebtoken";
import * as authService from "../services/auth.service.js";

async function verificarToken(req, res, next) {
  const [tipo, token] = (req.headers.authorization ?? "").split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "Falta el token de acceso" });
  }

  let datosDelToken;
  try {
    datosDelToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }

  req.usuario = await authService.validarSesion(datosDelToken);
  next();
}

export default verificarToken;
