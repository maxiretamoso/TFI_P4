const pool = require("../db");
const { crearError } = require("../utils/httpError");

async function obtenerPerfil(idUsuario) {
  const resultado = await pool.query(
    `SELECT
       usuarios.id_usuario,
       usuarios.nombres,
       usuarios.apellidos,
       usuarios.usuario,
       usuarios.rol,
       usuarios.activo,
       areas.descripcion AS area
     FROM usuarios
     JOIN areas ON usuarios.id_area = areas.id_area
     WHERE usuarios.id_usuario = $1`,
    [idUsuario]
  );
  if (resultado.rows.length === 0) throw crearError(404, "Usuario no encontrado");
  return resultado.rows[0];
}

module.exports = { obtenerPerfil };
