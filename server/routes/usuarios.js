import express from "express";
import { body, param, query } from "express-validator";
import verificarToken from "../middlewares/verificarToken.js";
import verificarRol from "../middlewares/verificarRol.js";
import * as usuariosController from "../controllers/usuarios.controller.js";
import { uploadAvatar } from "../utils/avatarUpload.js";
import { ROLES } from "../config/constantes.js";
import { AVATARES_PREDEFINIDOS } from "../config/avatares.js";

const router = express.Router();

router.use(verificarToken);

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: BREAD de usuarios y carga del avatar
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista los usuarios activos
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: rol
 *         schema: { type: string, enum: [sistemas] }
 *         description: Con "sistemas" devuelve solo los empleados del área de Sistemas
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Usuario' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *   post:
 *     summary: Crea un usuario
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_area, nombres, apellidos, usuario, contrasenia, rol]
 *             properties:
 *               id_area:     { type: integer, description: 'Director y Sistemas deben ser del área Sistemas (3); el Municipal elige' }
 *               nombres:     { type: string, maxLength: 250 }
 *               apellidos:   { type: string, maxLength: 250 }
 *               usuario:     { type: string, format: email }
 *               contrasenia: { type: string, minLength: 6 }
 *               rol:         { type: integer, enum: [1, 2, 3], description: '1 Director, 2 Sistemas, 3 Municipal' }
 *     responses:
 *       201: { description: Usuario creado }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       409: { description: Ya existe un usuario con ese correo }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 */
router.get(
  "/",
  verificarRol(ROLES.DIRECTOR),
  [query("rol").optional().isIn(["sistemas"])],
  usuariosController.listar
);

router.post(
  "/",
  verificarRol(ROLES.DIRECTOR),
  [
    body("id_area").isInt({ min: 1 }),
    body("nombres").isString().trim().isLength({ min: 1, max: 250 }),
    body("apellidos").isString().trim().isLength({ min: 1, max: 250 }),
    body("usuario").trim().isEmail().withMessage("El usuario debe ser un correo válido").toLowerCase(),
    body("contrasenia").isString().isLength({ min: 6, max: 100 }),
    body("rol").isInt({ min: 1, max: 3 }),
  ],
  usuariosController.crear
);

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Obtiene un usuario por id
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: El usuario pedido }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *   put:
 *     summary: Modifica un usuario
 *     description: El Director puede modificar a cualquiera; el resto, solo su propio perfil y sin cambiar rol ni área.
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_area:     { type: integer, description: 'Director y Sistemas deben ser del área Sistemas (3); el Municipal elige' }
 *               nombres:     { type: string }
 *               apellidos:   { type: string }
 *               usuario:     { type: string, format: email }
 *               rol:         { type: integer, enum: [1, 2, 3] }
 *     responses:
 *       200: { description: Usuario modificado }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       400: { description: Datos inválidos o intento de cambiar el propio rol }
 *       409: { description: Ya existe un usuario con ese correo, o es empleado de Sistemas con incidencias sin resolver y se le cambia el rol }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 *   delete:
 *     summary: Da de baja un usuario (soft delete, activo = 0)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204: { description: Usuario dado de baja }
 *       400: { description: No podés darte de baja a vos mismo }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       409: { description: Es empleado de Sistemas y tiene incidencias sin resolver asignadas }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 */
router.get("/:id", [param("id").isInt({ min: 1 })], usuariosController.obtenerPorId);

router.put(
  "/:id",
  [
    param("id").isInt({ min: 1 }),
    body("id_area").optional().isInt({ min: 1 }),
    body("nombres").optional().isString().trim().isLength({ min: 1, max: 250 }),
    body("apellidos").optional().isString().trim().isLength({ min: 1, max: 250 }),
    body("usuario").optional().trim().isEmail().withMessage("El usuario debe ser un correo válido").toLowerCase(),
    body("rol").optional().isInt({ min: 1, max: 3 }),
  ],
  usuariosController.actualizar
);

router.delete(
  "/:id",
  verificarRol(ROLES.DIRECTOR),
  [param("id").isInt({ min: 1 })],
  usuariosController.eliminar
);

/**
 * @swagger
 * /usuarios/{id}/avatar:
 *   patch:
 *     summary: Cambia la foto de perfil del usuario
 *     description: >
 *       Acepta una imagen propia (multipart, campo avatar, máximo 2 MB, jpg/png/webp)
 *       o el id de un avatar predefinido (JSON, campo predefinido, ver GET /avatares).
 *       Cada usuario puede cambiar la propia; el Director, la de cualquiera.
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar: { type: string, format: binary }
 *         application/json:
 *           schema:
 *             type: object
 *             required: [predefinido]
 *             properties:
 *               predefinido: { type: string, example: caricatura-03 }
 *     responses:
 *       200: { description: Avatar actualizado }
 *       400: { description: Falta la imagen o el predefinido, el archivo no es válido o supera los 2 MB }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 */
router.patch(
  "/:id/avatar",
  [
    param("id").isInt({ min: 1 }),
    body("predefinido").optional().isIn(AVATARES_PREDEFINIDOS).withMessage("Ese avatar no existe"),
  ],
  uploadAvatar.single("avatar"),
  usuariosController.subirAvatar
);

export default router;
