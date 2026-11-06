import express from "express";
import { body } from "express-validator";
import verificarToken from "../middlewares/verificarToken.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Inicio de sesión y contraseña
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicia sesión y devuelve un token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario, contrasenia]
 *             properties:
 *               usuario:
 *                 type: string
 *                 example: pamalm@correo.com
 *               contrasenia:
 *                 type: string
 *                 example: pamalm
 *     responses:
 *       200:
 *         description: Token y datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 usuario: { $ref: '#/components/schemas/Usuario' }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       401: { description: Usuario o contraseña incorrectos }
 *       403: { description: El usuario está dado de baja }
 *       429: { description: Demasiados intentos fallidos; hay que esperar 15 minutos }
 */
router.post(
  "/login",
  [
    body("usuario").isString().trim().notEmpty().withMessage("El usuario es obligatorio").toLowerCase(),
    body("contrasenia").isString().notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  authController.login
);

/**
 * @swagger
 * /auth/contrasenia:
 *   patch:
 *     summary: Cambia la contraseña del usuario autenticado
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contrasenia_actual, contrasenia_nueva]
 *             properties:
 *               contrasenia_actual: { type: string }
 *               contrasenia_nueva: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Contraseña actualizada }
 *       400: { description: La contraseña actual no es correcta }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 */
router.patch(
  "/contrasenia",
  verificarToken,
  [
    body("contrasenia_actual").isString().notEmpty(),
    body("contrasenia_nueva")
      .isString()
      .isLength({ min: 6, max: 100 })
      .withMessage("La contraseña nueva debe tener entre 6 y 100 caracteres"),
  ],
  authController.cambiarContrasenia
);

export default router;
