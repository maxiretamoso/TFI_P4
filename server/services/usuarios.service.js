const pool = require("../db");
const bcrypt = require("bcryptjs");
const { crearError } = require("../utils/httpError");

async function listarUsuarios() {
  const r = await pool.query(`
    SELECT usuarios.id_usuario, usuarios.nombres, usuarios.apellidos, usuarios.usuario, usuarios.rol, usuarios.activo, usuarios.avatar,
           areas.descripcion AS area
    FROM usuarios JOIN areas ON usuarios.id_area=areas.id_area
    WHERE usuarios.activo=1 ORDER BY apellidos`);
  return r.rows;
}

async function obtenerUsuarioPorId(id) {
  const r = await pool.query(
    `SELECT id_usuario, nombres, apellidos, usuario, rol, activo, avatar, id_area FROM usuarios WHERE id_usuario=$1`,
    [id]
  );
  return r.rows[0] || null;
}

async function crearUsuario(datos) {
  const { id_area, nombres, apellidos, usuario, contrasenia, rol, avatar } = datos;
  const hash = await bcrypt.hash(contrasenia, 10);
  const r = await pool.query(
    `INSERT INTO usuarios (id_area, nombres, apellidos, usuario, contrasenia, avatar, rol, activo) VALUES ($1,$2,$3,$4,$5,$6,$7,1) RETURNING id_usuario, usuario, rol`,
    [id_area, nombres, apellidos, usuario, hash, avatar || null, rol]
  );
  return r.rows[0];
}

async function actualizarUsuario(id, datos, solicitante) {
  if (!solicitante || (solicitante.rol !== 3 && parseInt(id, 10) !== solicitante.id_usuario)) {
    throw crearError(403, "No autorizado");
  }
  const cur = await pool.query(`SELECT * FROM usuarios WHERE id_usuario=$1`, [id]);
  if (cur.rows.length === 0) return null;
  const u = cur.rows[0];
  let hash = u.contrasenia;
  if (datos.contrasenia) hash = await bcrypt.hash(datos.contrasenia, 10);
  const r = await pool.query(
    `UPDATE usuarios SET id_area=$1, nombres=$2, apellidos=$3, usuario=$4, contrasenia=$5, rol=$6 WHERE id_usuario=$7 RETURNING id_usuario, nombres, apellidos, usuario, rol`,
    [datos.id_area ?? u.id_area, datos.nombres ?? u.nombres, datos.apellidos ?? u.apellidos, datos.usuario ?? u.usuario, hash, datos.rol ?? u.rol, id]
  );
  return r.rows[0];
}

async function desactivarUsuario(id) {
  const r = await pool.query(`UPDATE usuarios SET activo=0 WHERE id_usuario=$1 RETURNING id_usuario`, [id]);
  return r.rows[0] || null;
}

async function actualizarAvatar(id, relPath) {
  const r = await pool.query(`UPDATE usuarios SET avatar=$1 WHERE id_usuario=$2 RETURNING id_usuario, avatar`, [relPath, id]);
  return r.rows[0] || null;
}

module.exports = { listarUsuarios, obtenerUsuarioPorId, crearUsuario, actualizarUsuario, desactivarUsuario, actualizarAvatar };
