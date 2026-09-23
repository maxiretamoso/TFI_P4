const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const verificarToken = require("../middlewares/verificarToken");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y registro
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login y obtención de JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario, contrasenia]
 *             properties:
 *               usuario: { type: string }
 *               contrasenia: { type: string }
 *     responses:
 *       200: { description: Token JWT }
 *       401: { description: Credenciales inválidas }
 */
router.post(
  "/login",
  [
    body("usuario").isString().trim().notEmpty(),
    body("contrasenia").isString().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { usuario, contrasenia } = req.body;

    try {
      // Trae hash (bcrypt o hex sha256 legacy) y datos básicos
      const resultado = await pool.query(
        `SELECT id_usuario, nombres, apellidos, rol, activo, contrasenia
         FROM usuarios
         WHERE usuario = $1`,
        [usuario],
      );

      if (resultado.rows.length === 0) {
        return res
          .status(401)
          .json({ error: "Usuario o contraseña incorrectos" });
      }

      const u = resultado.rows[0];

      if (u.activo !== 1) {
        return res.status(403).json({ error: "El usuario está inactivo" });
      }

      let ok = false;
      const hash = u.contrasenia || "";

      if (
        hash.startsWith("$2a$") ||
        hash.startsWith("$2b$") ||
        hash.startsWith("$2y$")
      ) {
        ok = await bcrypt.compare(contrasenia, hash);
      } else {
        // Fallback legacy: sha256 hex (seed original). Si coincide, migra a bcrypt.
        const legacy = await pool.query(
          `SELECT encode(digest($1,'sha256'),'hex') AS h`,
          [contrasenia],
        );
        if (legacy.rows[0].h === hash) {
          ok = true;
          // migra silenciosamente a bcrypt para próximos logins
          const nuevoHash = await bcrypt.hash(contrasenia, 10);
          await pool.query(
            `UPDATE usuarios SET contrasenia=$1 WHERE id_usuario=$2`,
            [nuevoHash, u.id_usuario],
          );
        }
      }

      if (!ok) {
        return res
          .status(401)
          .json({ error: "Usuario o contraseña incorrectos" });
      }

      const token = jwt.sign(
        { id_usuario: u.id_usuario, rol: u.rol },
        process.env.JWT_SECRET,
        { expiresIn: "8h" },
      );

      res.json({
        token,
        usuario: {
          id_usuario: u.id_usuario,
          nombres: u.nombres,
          apellidos: u.apellidos,
          rol: u.rol,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  },
);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Crea un usuario (hashea contraseña con bcrypt)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  "/register",
  verificarToken,
  [
    body("id_area").isInt(),
    body("nombres").isString().trim().isLength({ min: 1, max: 100 }),
    body("apellidos").isString().trim().isLength({ min: 1, max: 100 }),
    body("usuario").isString().trim().isLength({ min: 1, max: 100 }),
    body("contrasenia").isString().isLength({ min: 6, max: 100 }),
    body("rol").isInt({ min: 1, max: 3 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    // Solo director (3) puede crear usuarios, o permitir auto-registro si no hay auth? Por seguridad exigimos rol 3.
    if (req.usuario.rol !== 3) {
      return res
        .status(403)
        .json({ error: "Solo el Director puede registrar usuarios" });
    }

    const { id_area, nombres, apellidos, usuario, contrasenia, avatar, rol } =
      req.body;
    try {
      const hash = await bcrypt.hash(contrasenia, 10);
      const r = await pool.query(
        `INSERT INTO usuarios (id_area, nombres, apellidos, usuario, contrasenia, avatar, rol, activo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,1) RETURNING id_usuario, usuario, rol`,
        [id_area, nombres, apellidos, usuario, hash, avatar || "", rol],
      );
      res.status(201).json(r.rows[0]);
    } catch (e) {
      console.error(e);
      if (e.code === "23505")
        return res.status(409).json({ error: "Usuario ya existe" });
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  },
);

module.exports = router;
