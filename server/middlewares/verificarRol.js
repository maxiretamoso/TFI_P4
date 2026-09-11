/**
 * Middleware de autorización por rol.
 * No modifica ningún router existente hasta que el equipo decida importarlo.
 * Uso: router.get("/ruta", verificarToken, verificarRol(2,3), handler)
 * Roles del proyecto (según database/TFI_Prog4.sql):
 *   1 = empleado municipal, 2 = empleado de sistemas, 3 = director
 */
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
