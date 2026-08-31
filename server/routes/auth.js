const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

// POST /api/login -> Verifica usuario y contraseña, devuelve un token si es correcto
router.post("/login", async (req, res) => {
  const { usuario, contrasenia } = req.body;

  try {
    const resultado = await pool.query(
      `SELECT id_usuario, nombres, apellidos, rol, activo
       FROM usuarios
       WHERE usuario = $1
         AND contrasenia = encode(digest($2, 'sha256'), 'hex')`,
      [usuario, contrasenia],
    );

    if (resultado.rows.length === 0) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos" });
    }

    const usuarioEncontrado = resultado.rows[0];

    if (usuarioEncontrado.activo !== 1) {
      return res.status(403).json({ error: "El usuario está inactivo" });
    }

    const token = jwt.sign(
      {
        id_usuario: usuarioEncontrado.id_usuario,
        rol: usuarioEncontrado.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      usuario: {
        id_usuario: usuarioEncontrado.id_usuario,
        nombres: usuarioEncontrado.nombres,
        apellidos: usuarioEncontrado.apellidos,
        rol: usuarioEncontrado.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

module.exports = router;
