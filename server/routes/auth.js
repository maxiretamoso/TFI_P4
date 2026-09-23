const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const verificarToken = require("../middlewares/verificarToken");
const authController = require("../controllers/auth.controller");

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
  authController.login
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
  authController.register
);

module.exports = router;
