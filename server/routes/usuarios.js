const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/usuarios -> Lista todos los usuarios activos (SIN mostrar la contraseña)
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT 
        usuarios.id_usuario,
        usuarios.nombres,
        usuarios.apellidos,
        usuarios.usuario,
        usuarios.rol,
        usuarios.activo,
        areas.descripcion AS area
      FROM usuarios
      JOIN areas ON usuarios.id_area = areas.id_area
      WHERE usuarios.activo = 1
      ORDER BY usuarios.apellidos
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
});

module.exports = router;
