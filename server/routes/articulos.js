const express = require("express");
const router = express.Router();
const pool = require("../db");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body, validationResult } = require("express-validator");

/**
 * @swagger
 * tags:
 *   name: Articulos
 *   description: BREAD de artículos
 */

// Browse
router.get("/", async (req, res, next) => {
  try {
    const r = await pool.query(`
      SELECT articulos.id_articulo, articulos.descripcion, articulos.activo,
             areas.descripcion AS area, categorias.descripcion AS categoria,
             articulos.id_area, articulos.categoria AS id_categoria
      FROM articulos
      JOIN areas ON articulos.id_area = areas.id_area
      JOIN categorias ON articulos.categoria = categorias.id_categoria
      WHERE articulos.activo=1 ORDER BY articulos.descripcion`);
    res.json(r.rows);
  } catch (e) { next(e); }
});

// Read
router.get("/:id", async (req, res, next) => {
  try {
    const r = await pool.query(`SELECT * FROM articulos WHERE id_articulo=$1`, [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Artículo no encontrado" });
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

// Add
router.post("/", verificarToken, verificarRol(2, 3),
  [body("id_area").isInt(), body("categoria").isInt(), body("descripcion").isString().trim().isLength({ min: 1, max: 150 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id_area, categoria, descripcion } = req.body;
    try {
      const r = await pool.query(`INSERT INTO articulos (id_area, descripcion, categoria, activo) VALUES ($1,$2,$3,1) RETURNING *`, [id_area, descripcion, categoria]);
      res.status(201).json(r.rows[0]);
    } catch (e) { next(e); }
  }
);

// Edit
router.put("/:id", verificarToken, verificarRol(2, 3),
  [body("id_area").optional().isInt(), body("categoria").optional().isInt(), body("descripcion").optional().isString().trim().isLength({ min: 1, max: 150 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const actual = await pool.query(`SELECT * FROM articulos WHERE id_articulo=$1`, [req.params.id]);
      if (actual.rows.length === 0) return res.status(404).json({ error: "Artículo no encontrado" });
      const a = actual.rows[0];
      const id_area = req.body.id_area ?? a.id_area;
      const categoria = req.body.categoria ?? a.categoria;
      const descripcion = req.body.descripcion ?? a.descripcion;
      const r = await pool.query(`UPDATE articulos SET id_area=$1, categoria=$2, descripcion=$3 WHERE id_articulo=$4 RETURNING *`, [id_area, categoria, descripcion, req.params.id]);
      res.json(r.rows[0]);
    } catch (e) { next(e); }
  }
);

// Delete soft
router.delete("/:id", verificarToken, verificarRol(2, 3), async (req, res, next) => {
  try {
    const r = await pool.query(`UPDATE articulos SET activo=0 WHERE id_articulo=$1 RETURNING *`, [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Artículo no encontrado" });
    res.json({ mensaje: "Artículo desactivado", articulo: r.rows[0] });
  } catch (e) { next(e); }
});

module.exports = router;
