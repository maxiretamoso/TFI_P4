const express = require("express");
const router = express.Router();
const pool = require("../db");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads", "avatars");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Solo se permiten imágenes"));
    cb(null, true);
  }
});

// Browse
router.get("/", async (req, res, next) => {
  try {
    const r = await pool.query(`
      SELECT usuarios.id_usuario, usuarios.nombres, usuarios.apellidos, usuarios.usuario, usuarios.rol, usuarios.activo, usuarios.avatar,
             areas.descripcion AS area
      FROM usuarios JOIN areas ON usuarios.id_area=areas.id_area
      WHERE usuarios.activo=1 ORDER BY apellidos`);
    res.json(r.rows);
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const r = await pool.query(`SELECT id_usuario, nombres, apellidos, usuario, rol, activo, avatar, id_area FROM usuarios WHERE id_usuario=$1`, [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

router.post("/",
  verificarToken, verificarRol(3),
  [body("id_area").isInt(), body("nombres").isString().trim().isLength({ min: 1, max: 100 }), body("apellidos").isString().trim().isLength({ min: 1, max: 100 }), body("usuario").isString().trim().isLength({ min: 1, max: 100 }), body("contrasenia").isString().isLength({ min: 6, max: 100 }), body("rol").isInt({ min: 1, max: 3 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id_area, nombres, apellidos, usuario, contrasenia, rol, avatar } = req.body;
    try {
      const hash = await bcrypt.hash(contrasenia, 10);
      const r = await pool.query(`INSERT INTO usuarios (id_area, nombres, apellidos, usuario, contrasenia, avatar, rol, activo) VALUES ($1,$2,$3,$4,$5,$6,$7,1) RETURNING id_usuario, usuario, rol`, [id_area, nombres, apellidos, usuario, hash, avatar || null, rol]);
      res.status(201).json(r.rows[0]);
    } catch (e) { next(e); }
  }
);

router.put("/:id",
  verificarToken,
  [body("id_area").optional().isInt(), body("nombres").optional().isString().trim().isLength({ min: 1, max: 100 }), body("apellidos").optional().isString().trim().isLength({ min: 1, max: 100 }), body("usuario").optional().isString().trim().isLength({ min: 1, max: 100 }), body("rol").optional().isInt({ min: 1, max: 3 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    // Solo director o el propio usuario puede editar
    if (req.usuario.rol !== 3 && parseInt(req.params.id,10) !== req.usuario.id_usuario) return res.status(403).json({ error: "No autorizado" });
    try {
      const cur = await pool.query(`SELECT * FROM usuarios WHERE id_usuario=$1`, [req.params.id]);
      if (cur.rows.length===0) return res.status(404).json({ error: "Usuario no encontrado" });
      const u = cur.rows[0];
      let hash = u.contrasenia;
      if (req.body.contrasenia) hash = await bcrypt.hash(req.body.contrasenia, 10);
      const r = await pool.query(`UPDATE usuarios SET id_area=$1, nombres=$2, apellidos=$3, usuario=$4, contrasenia=$5, rol=$6 WHERE id_usuario=$7 RETURNING id_usuario, nombres, apellidos, usuario, rol`,
        [req.body.id_area ?? u.id_area, req.body.nombres ?? u.nombres, req.body.apellidos ?? u.apellidos, req.body.usuario ?? u.usuario, hash, req.body.rol ?? u.rol, req.params.id]);
      res.json(r.rows[0]);
    } catch(e){ next(e); }
  }
);

// Soft delete
router.delete("/:id", verificarToken, verificarRol(3), async (req, res, next) => {
  try {
    const r = await pool.query(`UPDATE usuarios SET activo=0 WHERE id_usuario=$1 RETURNING id_usuario`, [req.params.id]);
    if (r.rows.length===0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ mensaje: "Usuario desactivado" });
  } catch(e){ next(e); }
});

// Avatar upload
router.patch("/:id/avatar", verificarToken, upload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Debe enviar un archivo 'avatar'" });
    // solo director o propio usuario
    if (req.usuario.rol !== 3 && parseInt(req.params.id,10) !== req.usuario.id_usuario) {
      // borrar archivo subido si no autorizado
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: "No autorizado" });
    }
    const relPath = `uploads/avatars/${req.file.filename}`;
    const r = await pool.query(`UPDATE usuarios SET avatar=$1 WHERE id_usuario=$2 RETURNING id_usuario, avatar`, [relPath, req.params.id]);
    if (r.rows.length===0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(r.rows[0]);
  } catch(e){ next(e); }
});

module.exports = router;
