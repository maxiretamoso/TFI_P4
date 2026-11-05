function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const rolUsuario = req.usuario.rol;

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({
        error: "Acceso denegado: rol no autorizado",
        rolRequerido: rolesPermitidos,
        tuRol: rolUsuario,
      });
    }

    next();
  };
}

module.exports = verificarRol;
