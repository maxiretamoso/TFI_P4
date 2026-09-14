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
    incidencias.id_articulo,
    incidencias.id_estado,
    estados.descripcion AS estado,
    articulos.descripcion AS articulo_descripcion,
    creador.nombres AS creado_por_nombre,
    creador.apellidos AS creado_por_apellido,
    asignado.nombres AS asignado_a_nombre,
    asignado.apellidos AS asignado_a_apellido
  FROM incidencias
  JOIN estados ON incidencias.id_estado = estados.id_estado
  JOIN articulos ON incidencias.id_articulo = articulos.id_articulo
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
router.post(
  "/",
  verificarToken,
  [
    body("id_articulo").isInt(),
    body("prioridad").isInt({ min: 1, max: 3 }),
    body("descripcion_pedido").isString().trim().isLength({ min: 1, max: 255 }),
    body("id_estado").optional().isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id_articulo, prioridad, descripcion_pedido, descripcion_resolucion } = req.body;
    // id_estado por defecto PENDIENTE = 1
    const id_estado = req.body.id_estado || 1;
    const creado_por = req.usuario.id_usuario;

    try {
      const r = await pool.query(
        `INSERT INTO incidencias (id_estado, creado_por, asignado_a, creado, prioridad, id_articulo, descripcion_pedido, descripcion_resolucion)
         VALUES ($1,$2,NULL, now(), $3,$4,$5,$6) RETURNING *`,
        [id_estado, creado_por, prioridad, id_articulo, descripcion_pedido, descripcion_resolucion || null]
      );
      const inc = r.rows[0];
      // historial
      await pool.query(`INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado) VALUES ($1,$2, now())`, [inc.id_incidencia, id_estado]);
      res.status(201).json(inc);
    } catch (e) { next(e); }
  }
);

// PATCH /:id/cancelar
router.patch("/:id/cancelar", verificarToken, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const q = await pool.query(`SELECT * FROM incidencias WHERE id_incidencia=$1`, [id]);
    if (q.rows.length === 0) return res.status(404).json({ error: "Incidencia no encontrada" });
    const inc = q.rows[0];
    const { rol, id_usuario } = req.usuario;

    // Solo si está pendiente (1)
    if (inc.id_estado !== 1) return res.status(400).json({ error: "Solo se pueden cancelar incidencias PENDIENTES" });

    // Permisos: municipal solo propias, director cualquiera pendiente, sistemas NO puede cancelar
    if (rol === 1 && inc.creado_por !== id_usuario) return res.status(403).json({ error: "Solo podés cancelar tus propias incidencias" });
    if (rol === 2) return res.status(403).json({ error: "Empleado de sistemas no puede cancelar incidencias" });
    if (rol !== 1 && rol !== 3) return res.status(403).json({ error: "Rol no autorizado para cancelar" });

    const upd = await pool.query(`UPDATE incidencias SET id_estado=4 WHERE id_incidencia=$1 RETURNING *`, [id]);
    await pool.query(`INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado) VALUES ($1,4, now())`, [id]);

    // email al creador
    try {
      const creador = await pool.query(`SELECT usuario, nombres, apellidos FROM usuarios WHERE id_usuario=$1`, [inc.creado_por]);
      const to = creador.rows[0] ? `${creador.rows[0].usuario}@example.com` : null;
      // Si existe columna email real, usarla; por ahora usuario como placeholder o env var
      const dest = process.env.MAIL_TO_TEST || to;
      if (dest) {
        await enviarMail({
          to: dest,
          subject: `Incidencia #${id} cancelada`,
          text: `Tu incidencia #${id} fue cancelada.`,
          html: `<p>Tu incidencia <b>#${id}</b> fue cancelada por ${rol === 3 ? 'el Director' : 'vos'}.</p><p>${inc.descripcion_pedido}</p>`,
        });
      }
    } catch (mailErr) {
      console.error("Error enviando mail cancelación:", mailErr.message);
    }

    res.json(upd.rows[0]);
  } catch (e) { next(e); }
});

// PATCH /:id/finalizar - solo empleado sistemas (2) o director (3) si quiere finalizar? enunciado dice empleado sistemas finaliza
router.patch(
  "/:id/finalizar",
  verificarToken,
  verificarRol(2, 3),
  [body("descripcion_resolucion").isString().trim().isLength({ min: 1, max: 255 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const id = parseInt(req.params.id, 10);
      const q = await pool.query(`SELECT * FROM incidencias WHERE id_incidencia=$1`, [id]);
      if (q.rows.length === 0) return res.status(404).json({ error: "Incidencia no encontrada" });
      const inc = q.rows[0];

      // Solo puede finalizar si está ASIGNADA (2) o PENDIENTE? Según flujo debería ser ASIGNADA, pero permitimos PENDIENTE asignada previamente
      if (inc.id_estado === 3) return res.status(400).json({ error: "La incidencia ya está FINALIZADA" });
      if (inc.id_estado === 4) return res.status(400).json({ error: "La incidencia está CANCELADA, no se puede finalizar" });

      // Si es empleado sistemas, debe estar asignada a él
      if (req.usuario.rol === 2 && inc.asignado_a !== req.usuario.id_usuario) {
        return res.status(403).json({ error: "Solo podés finalizar incidencias asignadas a vos" });
      }

      const upd = await pool.query(
        `UPDATE incidencias SET id_estado=3, descripcion_resolucion=$1 WHERE id_incidencia=$2 RETURNING *`,
        [req.body.descripcion_resolucion, id]
      );
      await pool.query(`INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado) VALUES ($1,3, now())`, [id]);

      try {
        const creador = await pool.query(`SELECT usuario FROM usuarios WHERE id_usuario=$1`, [inc.creado_por]);
        const dest = process.env.MAIL_TO_TEST || (creador.rows[0] ? `${creador.rows[0].usuario}@example.com` : null);
        if (dest) {
          await enviarMail({
            to: dest,
            subject: `Incidencia #${id} finalizada`,
            text: `Tu incidencia #${id} fue finalizada. Resolución: ${req.body.descripcion_resolucion}`,
            html: `<p>Tu incidencia <b>#${id}</b> fue finalizada.</p><p>Resolución: ${req.body.descripcion_resolucion}</p>`,
          });
        }
      } catch (mailErr) {
        console.error("Error enviando mail finalización:", mailErr.message);
      }

      res.json(upd.rows[0]);
    } catch (e) { next(e); }
  }
);

// PATCH /:id/asignar - solo director
router.patch(
  "/:id/asignar",
  verificarToken,
  verificarRol(3),
  [body("asignado_a").isInt()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const id = parseInt(req.params.id, 10);
      const { asignado_a } = req.body;

      // Validar que asignado_a sea empleado sistemas (rol 2) activo
      const u = await pool.query(`SELECT id_usuario, rol, activo FROM usuarios WHERE id_usuario=$1`, [asignado_a]);
      if (u.rows.length === 0) return res.status(404).json({ error: "Usuario a asignar no encontrado" });
      if (u.rows[0].rol !== 2) return res.status(400).json({ error: "Solo se puede asignar a un empleado de sistemas (rol 2)" });
      if (u.rows[0].activo !== 1) return res.status(400).json({ error: "Usuario inactivo" });

      const q = await pool.query(`SELECT * FROM incidencias WHERE id_incidencia=$1`, [id]);
      if (q.rows.length === 0) return res.status(404).json({ error: "Incidencia no encontrada" });
      if (q.rows[0].id_estado === 3 || q.rows[0].id_estado === 4) {
        return res.status(400).json({ error: "No se puede asignar una incidencia finalizada o cancelada" });
      }

      const upd = await pool.query(`UPDATE incidencias SET asignado_a=$1, id_estado=2 WHERE id_incidencia=$2 RETURNING *`, [asignado_a, id]);
      await pool.query(`INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado) VALUES ($1,2, now())`, [id]);
      res.json(upd.rows[0]);
    } catch (e) { next(e); }
  }
);

module.exports = router;
