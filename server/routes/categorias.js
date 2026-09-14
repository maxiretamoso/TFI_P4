const express = require("express");
const router = express.Router();
const pool = require("../db");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body, validationResult } = require("express-validator");

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: BREAD de categorías
 */

/**
 * @swagger
 * /api/v1/categorias:
 *   get:
 *     summary: Listar categorías activas
 *     tags: [Categorias]
 *   post:
 *     summary: Crear categoría (rol 2/3)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 */
// GET /api/v1/categorias -> lista activas (Browse)
router.get("/", async (req, res, next) => {
  try {
    const r = await pool.query("SELECT * FROM categorias WHERE activo=1 ORDER BY descripcion");
    res.json(r.rows);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /api/v1/categorias/{id}:
 *   get:
 *     summary: Obtener categoría
 *     tags: [Categorias]
 *   put:
 *     summary: Editar categoría (rol 2/3)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Soft delete categoría
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 */
// GET /:id -> Read
router.get("/:id", async (req, res, next) => {
  try {
    const r = await pool.query("SELECT * FROM categorias WHERE id_categoria=$1", [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

// POST / -> Add (solo sistemas 2 y director 3)
router.post("/", verificarToken, verificarRol(2, 3), [body("descripcion").isString().trim().isLength({ min: 1, max: 100 })], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const r = await pool.query(`INSERT INTO categorias (descripcion, activo) VALUES ($1,1) RETURNING *`, [req.body.descripcion]);
    res.status(201).json(r.rows[0]);
  } catch (e) { next(e); }
});

// PUT /:id -> Edit
router.put("/:id", verificarToken, verificarRol(2, 3), [body("descripcion").isString().trim().isLength({ min: 1, max: 100 })], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const r = await pool.query(`UPDATE categorias SET descripcion=$1 WHERE id_categoria=$2 RETURNING *`, [req.body.descripcion, req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

// DELETE /:id -> soft delete activo=false
router.delete("/:id", verificarToken, verificarRol(2, 3), async (req, res, next) => {
  try {
    const r = await pool.query(`UPDATE categorias SET activo=0 WHERE id_categoria=$1 RETURNING *`, [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json({ mensaje: "Categoría desactivada", categoria: r.rows[0] });
  } catch (e) { next(e); }
});

module.exports = router;
