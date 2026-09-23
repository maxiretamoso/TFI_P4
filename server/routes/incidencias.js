const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body } = require("express-validator");
const incidenciasController = require("../controllers/incidencias.controller");

/**
 * @swagger
 * tags:
 *   name: Incidencias
 *   description: Gestión de incidencias
 */

/**
 * @swagger
 * /api/v1/incidencias:
 *   get:
 *     summary: Lista incidencias filtradas por rol
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de incidencias }
 */
router.get("/", verificarToken, incidenciasController.listar);

// Sub-rutas explícitas (opcional, más prolijo para frontend, pero no reemplaza el filtrado automático)
router.get("/mias", verificarToken, incidenciasController.listarMias);
router.get("/asignadas", verificarToken, verificarRol(2, 3), incidenciasController.listarAsignadas);
router.get("/todas", verificarToken, verificarRol(3), incidenciasController.listarTodas);

/**
 * @swagger
 * /api/v1/incidencias/{id}:
 *   get:
 *     summary: Obtiene una incidencia por id
 *     tags: [Incidencias]
 */
router.get("/:id", verificarToken, incidenciasController.obtenerPorId);

/**
 * @swagger
 * /api/v1/incidencias:
 *   post:
 *     summary: Crea una incidencia (empleado municipal)
 *     tags: [Incidencias]
 */
router.post(
  "/",
  verificarToken,
  [
    body("id_articulo").isInt(),
    body("prioridad").isInt({ min: 1, max: 3 }),
    body("descripcion_pedido").isString().trim().isLength({ min: 1, max: 255 }),
    body("id_estado").optional().isInt(),
  ],
  incidenciasController.crear,
);

/**
 * @swagger
 * /api/v1/incidencias/{id}/cancelar:
 *   patch:
 *     summary: Cancelar incidencia pendiente (municipal propia o director cualquiera)
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 * /api/v1/incidencias/{id}/finalizar:
 *   patch:
 *     summary: Finalizar incidencia (rol 2/3, requiere descripcion_resolucion, envía email)
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 * /api/v1/incidencias/{id}/asignar:
 *   patch:
 *     summary: Asignar incidencia a empleado sistemas (solo director)
 *     tags: [Incidencias]
 *     security: [{ bearerAuth: [] }]
 */
// PATCH /:id/cancelar
router.patch("/:id/cancelar", verificarToken, incidenciasController.cancelar);

// PATCH /:id/finalizar - solo empleado sistemas (2) o director (3) si quiere finalizar? enunciado dice empleado sistemas finaliza
router.patch(
  "/:id/finalizar",
  verificarToken,
  verificarRol(2, 3),
  [
    body("descripcion_resolucion")
      .isString()
      .trim()
      .isLength({ min: 1, max: 255 }),
  ],
  incidenciasController.finalizar,
);

// PATCH /:id/asignar - solo director
router.patch(
  "/:id/asignar",
  verificarToken,
  verificarRol(3),
  [body("asignado_a").isInt()],
  incidenciasController.asignar,
);

module.exports = router;
