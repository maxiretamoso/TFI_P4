import pool from "../db/index.js";
import { ROLES } from "../config/roles.js";

const CAMPOS = `
  usuarios.id_usuario,
  usuarios.id_area,
  usuarios.nombres,
  usuarios.apellidos,
  usuarios.usuario,
  usuarios.avatar,
  usuarios.rol,
  usuarios.activo
`;

function listar() {
  return pool
    .query(`SELECT ${CAMPOS}, areas.descripcion AS area
            FROM usuarios
            JOIN areas ON usuarios.id_area = areas.id_area
            WHERE usuarios.activo = 1
            ORDER BY usuarios.id_usuario`)
    .then((r) => r.rows);
}

function listarEmpleadosDeSistemas() {
  return pool
    .query(`SELECT ${CAMPOS}
            FROM usuarios
            WHERE usuarios.rol = $1 AND usuarios.activo = 1
            ORDER BY usuarios.apellidos, usuarios.nombres`, [ROLES.EMPLEADO_SISTEMAS])
    .then((r) => r.rows);
}

function buscarDirectorActivo() {
  return pool
    .query(`SELECT ${CAMPOS}
            FROM usuarios
            WHERE usuarios.rol = $1 AND usuarios.activo = 1
            ORDER BY usuarios.id_usuario
            LIMIT 1`, [ROLES.DIRECTOR])
    .then((r) => r.rows[0] || null);
}

function buscarPorId(id) {
  return pool
    .query(`SELECT ${CAMPOS} FROM usuarios WHERE usuarios.id_usuario = $1`, [id])
    .then((r) => r.rows[0] || null);
}

function buscarPerfil(id) {
  return pool
    .query(`SELECT ${CAMPOS}, areas.descripcion AS area
            FROM usuarios
            JOIN areas ON usuarios.id_area = areas.id_area
            WHERE usuarios.id_usuario = $1`, [id])
    .then((r) => r.rows[0] || null);
}

function buscarCredenciales(usuario) {
  return pool
    .query(`SELECT ${CAMPOS}, usuarios.contrasenia
            FROM usuarios
            WHERE usuarios.usuario = $1`, [usuario])
    .then((r) => r.rows[0] || null);
}

function buscarCredencialesPorId(id) {
  return pool
    .query(`SELECT ${CAMPOS}, usuarios.contrasenia
            FROM usuarios
            WHERE usuarios.id_usuario = $1`, [id])
    .then((r) => r.rows[0] || null);
}

function insertar({ id_area, nombres, apellidos, usuario, hash, avatar, rol }) {
  return pool
    .query(`INSERT INTO usuarios (id_area, nombres, apellidos, usuario, contrasenia, avatar, rol, activo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
            RETURNING id_usuario, id_area, nombres, apellidos, usuario, avatar, rol, activo`,
      [id_area, nombres, apellidos, usuario, hash, avatar || "", rol])
    .then((r) => r.rows[0]);
}

function actualizar(id, { id_area, nombres, apellidos, usuario, rol }) {
  return pool
    .query(`UPDATE usuarios
            SET id_area = $1, nombres = $2, apellidos = $3, usuario = $4, rol = $5
            WHERE id_usuario = $6
            RETURNING id_usuario, id_area, nombres, apellidos, usuario, avatar, rol, activo`,
      [id_area, nombres, apellidos, usuario, rol, id])
    .then((r) => r.rows[0] || null);
}

function actualizarContrasenia(id, hash) {
  return pool
    .query(`UPDATE usuarios SET contrasenia = $1 WHERE id_usuario = $2 RETURNING id_usuario`, [hash, id])
    .then((r) => r.rows[0] || null);
}

function actualizarAvatar(id, avatar) {
  return pool
    .query(`UPDATE usuarios SET avatar = $1 WHERE id_usuario = $2
            RETURNING id_usuario, avatar`, [avatar, id])
    .then((r) => r.rows[0] || null);
}

function desactivar(id) {
  return pool
    .query(`UPDATE usuarios SET activo = 0 WHERE id_usuario = $1 RETURNING id_usuario`, [id])
    .then((r) => r.rows[0] || null);
}

export {
  listar,
  listarEmpleadosDeSistemas,
  buscarDirectorActivo,
  buscarPorId,
  buscarPerfil,
  buscarCredenciales,
  buscarCredencialesPorId,
  insertar,
  actualizar,
  actualizarContrasenia,
  actualizarAvatar,
  desactivar,
};
