const express = require("express");
const router = express.Router();
const pool = require("../db");
const verificarToken = require("../middlewares/verificarToken");

// GET /api/me -> Devuelve el perfil del usuario autenticado (usa el id del JWT)
router.get("/", verificarToken, async (req, res) => {
  try {
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
      [req.usuario.id_usuario]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el perfil" });
  }
});

module.exports = router;
