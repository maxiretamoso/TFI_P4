import express from "express";
import { body, param, query } from "express-validator";
import verificarToken from "../middlewares/verificarToken.js";
import verificarRol from "../middlewares/verificarRol.js";
import * as incidenciasController from "../controllers/incidencias.controller.js";
import { ROLES } from "../config/constantes.js";

const router = express.Router();

router.use(verificarToken);

/**
 * @swagger
 * tags:
 *   name: Incidencias
 *   description: Alta, asignación, resolución y cancelación de incidencias
 */

/**
 * @swagger
 * /incidencias:
 *   get:
 *     summary: Lista las incidencias que corresponden al rol del usuario
 *     description: >
 *       El Empleado Municipal ve las que creó, el Empleado de Sistemas las que
 *       tiene asignadas y el Director todas.
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: pagina,    schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limite,    schema: { type: integer, minimum: 1, maximum: 100, default: 15 } }
 *       - { in: query, name: estado,    schema: { type: string, example: "1,2" }, description: Uno o varios id_estado separados por coma }
 *       - { in: query, name: prioridad, schema: { type: integer, minimum: 1, maximum: 3 } }
 *       - { in: query, name: buscar,    schema: { type: string }, description: Texto en el pedido o el artículo }
 *       - { in: query, name: desde,     schema: { type: string, format: date }, description: Creadas desde esa fecha (AAAA-MM-DD) }
 *       - { in: query, name: fecha,     schema: { type: string, format: date }, description: Creadas ese día (AAAA-MM-DD) }
 *       - { in: query, name: sin_asignar, schema: { type: boolean }, description: Solo las que todavía no tienen a nadie asignado (asignado_a en null) }
 *       - { in: query, name: area,      schema: { type: integer }, description: id_area del artículo }
 *       - { in: query, name: categoria, schema: { type: integer }, description: id_categoria del artículo }
 *       - { in: query, name: asignado,  schema: { type: integer }, description: id_usuario del responsable }
 *     responses:
 *       200:
 *         description: Página de incidencias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:   { type: array, items: { $ref: '#/components/schemas/Incidencia' } }
 *                 total:   { type: integer, description: Incidencias que cumplen los filtros }
 *                 total_sin_filtros: { type: integer, description: Incidencias que el usuario puede ver, sin aplicar filtros }
 *                 primer_anio: { type: integer, nullable: true, description: Año de la incidencia más vieja que el usuario puede ver (mínimo del filtro desde) }
 *                 pagina:  { type: integer }
 *                 limite:  { type: integer }
 *                 paginas: { type: integer }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       401: { $ref: '#/components/responses/NoAutenticado' }
 */
router.get(
  "/",
  [
    query("pagina").optional().isInt({ min: 1 }),
    query("limite").optional().isInt({ min: 1, max: 100 }),
    query("estado")
      .optional()
      .matches(/^\d+(,\d+)*$/)
      .withMessage("estado debe ser uno o varios números separados por coma"),
    query("prioridad").optional().isInt({ min: 1, max: 3 }),
    query("buscar").optional().trim().isLength({ max: 255 }),
    query("desde").optional().isISO8601({ strict: true }).withMessage("desde debe ser una fecha AAAA-MM-DD"),
    query("fecha").optional().isISO8601({ strict: true }).withMessage("fecha debe ser una fecha AAAA-MM-DD"),
    query("sin_asignar").optional().isBoolean().withMessage("sin_asignar debe ser true o false"),
    query("area").optional().isInt({ min: 1 }),
    query("categoria").optional().isInt({ min: 1 }),
    query("asignado").optional().isInt({ min: 1 }),
  ],
  incidenciasController.listar
);

/**
 * @swagger
 * /incidencias:
 *   post:
 *     summary: Crea una incidencia
 *     description: Nace en estado Pendiente y sin asignar (asignado_a en null) hasta que el Director la asigna. El artículo tiene que ser del área del empleado (si no, 403).
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_articulo, prioridad, descripcion_pedido]
 *             properties:
 *               id_articulo:        { type: integer, example: 1 }
 *               prioridad:          { type: integer, minimum: 1, maximum: 3, example: 2 }
 *               descripcion_pedido: { type: string, maxLength: 250, example: El monitor no enciende }
 *     responses:
 *       201:
 *         description: Incidencia creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Incidencia' }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 */
router.post(
  "/",
  verificarRol(ROLES.EMPLEADO_MUNICIPAL),
  [
    body("id_articulo").isInt({ min: 1 }).withMessage("El artículo es obligatorio"),
    body("prioridad").isInt({ min: 1, max: 3 }).withMessage("La prioridad va de 1 a 3"),
    body("descripcion_pedido")
      .isString()
      .trim()
      .isLength({ min: 1, max: 250 })
      .withMessage("La descripción del pedido es obligatoria (máximo 250 caracteres)"),
  ],
  incidenciasController.crear
);

/**
 * @swagger
 * /incidencias/{id}:
 *   get:
 *     summary: Obtiene una incidencia
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Incidencia' }
 *         description: La incidencia pedida
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 */
router.get("/:id", [param("id").isInt({ min: 1 })], incidenciasController.obtenerPorId);

/**
 * @swagger
 * /incidencias/{id}/estados:
 *   get:
 *     summary: Historial de estados de una incidencia
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Cambios de estado, del más viejo al más nuevo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_pedidos_estados: { type: integer, example: 7 }
 *                   id_estado:          { type: integer, example: 3 }
 *                   estado:             { type: string, example: Resuelta }
 *                   fecha_hora_estado:  { type: string, format: date-time, example: "2026-11-05T18:30:00-03:00" }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 */
router.get("/:id/estados", [param("id").isInt({ min: 1 })], incidenciasController.obtenerHistorial);

/**
 * @swagger
 * /incidencias/{id}/asignacion:
 *   patch:
 *     summary: Asigna la incidencia a un empleado del área de Sistemas
 *     description: Solo el Director. La incidencia pasa a En Proceso.
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [asignado_a]
 *             properties:
 *               asignado_a: { type: integer, description: id_usuario de un empleado de Sistemas }
 *     responses:
 *       200: { description: Incidencia asignada }
 *       400: { description: El usuario indicado no es un empleado de Sistemas }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       409: { description: La incidencia ya está resuelta o cancelada }
 */
router.patch(
  "/:id/asignacion",
  verificarRol(ROLES.DIRECTOR),
  [
    param("id").isInt({ min: 1 }),
    body("asignado_a").isInt({ min: 1 }).withMessage("Hay que indicar a quién se asigna"),
  ],
  incidenciasController.asignar
);

/**
 * @swagger
 * /incidencias/{id}/resolucion:
 *   patch:
 *     summary: Finaliza la incidencia
 *     description: Solo el Empleado de Sistemas que la tiene asignada. Envía un correo al creador.
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [descripcion_resolucion]
 *             properties:
 *               descripcion_resolucion: { type: string, maxLength: 250 }
 *     responses:
 *       200: { description: Incidencia resuelta }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       409: { description: La incidencia ya estaba resuelta o cancelada }
 */
router.patch(
  "/:id/resolucion",
  verificarRol(ROLES.EMPLEADO_SISTEMAS),
  [
    param("id").isInt({ min: 1 }),
    body("descripcion_resolucion")
      .isString()
      .trim()
      .isLength({ min: 1, max: 250 })
      .withMessage("Hay que describir cómo se resolvió (máximo 250 caracteres)"),
  ],
  incidenciasController.finalizar
);

/**
 * @swagger
 * /incidencias/{id}/cancelacion:
 *   patch:
 *     summary: Cancela una incidencia pendiente
 *     description: El Empleado Municipal solo las propias; el Director, cualquiera. Envía un correo al creador.
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Incidencia cancelada }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       404: { $ref: '#/components/responses/NoEncontrado' }
 *       409: { description: La incidencia no está pendiente }
 */
router.patch(
  "/:id/cancelacion",
  verificarRol(ROLES.DIRECTOR, ROLES.EMPLEADO_MUNICIPAL),
  [param("id").isInt({ min: 1 })],
  incidenciasController.cancelar
);

export default router;
