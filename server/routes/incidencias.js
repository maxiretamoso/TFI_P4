const express = require("express");
const router = express.Router();
const pool = require("../db");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body, validationResult } = require("express-validator");
const { enviarMail } = require("../utils/email");

/**
 * @swagger
 * tags:
 *   name: Incidencias
 *   description: Gestión de incidencias
 */

// Helper: base select with joins
const SELECT_BASE = `
  SELECT
    incidencias.id_incidencia,
    incidencias.descripcion_pedido,
    incidencias.descripcion_resolucion,
    incidencias.prioridad,
    incidencias.creado,
    incidencias.creado_por,
    incidencias.asignado_a,
    incidencias.articulo,
    incidencias.id_estado,
    estados.descripcion AS estado,
    articulos.descripcion AS articulo_descripcion,
    creador.nombres AS creado_por_nombre,
    creador.apellidos AS creado_por_apellido,
    asignado.nombres AS asignado_a_nombre,
    asignado.apellidos AS asignado_a_apellido
  FROM incidencias
  JOIN estados ON incidencias.id_estado = estados.id_estado
  JOIN articulos ON incidencias.articulo = articulos.id_articulo
  JOIN usuarios AS creador ON incidencias.creado_por = creador.id_usuario
  LEFT JOIN usuarios AS asignado ON incidencias.asignado_a = asignado.id_usuario
`;

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
router.get("/", verificarToken, async (req, res, next) => {
  try {
    const rol = req.usuario.rol;
    const id = req.usuario.id_usuario;
    let where = "";
    let params = [];
    // Filtrado por rol según enunciado:
    // 1 = empleado municipal -> solo sus incidencias (creado_por = id)
    // 2 = empleado sistemas -> solo asignadas a él (asignado_a = id)
    // 3 = director -> todas
    if (rol === 1) {
      where = "WHERE incidencias.creado_por = $1";
      params = [id];
    } else if (rol === 2) {
      where = "WHERE incidencias.asignado_a = $1";
      params = [id];
    } else {
      where = "";
      params = [];
    }

    const q = `${SELECT_BASE} ${where} ORDER BY incidencias.creado DESC`;
    const resultado = await pool.query(q, params);
    res.json(resultado.rows);
  } catch (error) {
    next(error);
  }
});

// Sub-rutas explícitas (opcional, más prolijo para frontend, pero no reemplaza el filtrado automático)
router.get("/mias", verificarToken, async (req, res, next) => {
  try {
    const r = await pool.query(`${SELECT_BASE} WHERE incidencias.creado_por=$1 ORDER BY creado DESC`, [req.usuario.id_usuario]);
    res.json(r.rows);
  } catch (e) { next(e); }
});
router.get("/asignadas", verificarToken, verificarRol(2, 3), async (req, res, next) => {
  try {
    const r = await pool.query(`${SELECT_BASE} WHERE incidencias.asignado_a=$1 ORDER BY creado DESC`, [req.usuario.id_usuario]);
    res.json(r.rows);
  } catch (e) { next(e); }
});
router.get("/todas", verificarToken, verificarRol(3), async (req, res, next) => {
  try {
    const r = await pool.query(`${SELECT_BASE} ORDER BY creado DESC`);
    res.json(r.rows);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /api/v1/incidencias/{id}:
 *   get:
 *     summary: Obtiene una incidencia por id
 *     tags: [Incidencias]
 */
router.get("/:id", verificarToken, async (req, res, next) => {
  try {
    const r = await pool.query(`${SELECT_BASE} WHERE incidencias.id_incidencia=$1`, [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Incidencia no encontrada" });
    // Control de acceso: municipal solo ve las suyas, sistemas solo asignadas, director ve todo
    const inc = r.rows[0];
    const { rol, id_usuario } = req.usuario;
    if (rol === 1 && inc.creado_por !== id_usuario) return res.status(403).json({ error: "No autorizado" });
    if (rol === 2 && inc.asignado_a !== id_usuario && rol !== 3) {
      // empleado sistemas que no es el asignado no puede ver (director sí)
      // permitir si aún no asignada y es sistemas? decidimos denegar si no es suya
      return res.status(403).json({ error: "No autorizado: no está asignada a vos" });
    }
    res.json(inc);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /api/v1/incidencias:
 *   post:
 *     summary: Crea una incidencia (empleado municipal)
 *     tags: [Incidencias]
 */
module.exports = router;
