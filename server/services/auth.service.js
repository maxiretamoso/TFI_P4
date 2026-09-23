const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { crearError } = require("../utils/httpError");

async function login(usuario, contrasenia) {
  const resultado = await pool.query(
    `SELECT id_usuario, nombres, apellidos, rol, activo, contrasenia
     FROM usuarios
     WHERE usuario = $1`,
    [usuario]
  );

  if (resultado.rows.length === 0) {
    throw crearError(401, "Usuario o contraseña incorrectos");
  }

  const u = resultado.rows[0];

  if (u.activo !== 1) {
    throw crearError(403, "El usuario está inactivo");
  }

  let ok = false;
  const hash = u.contrasenia || "";

  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    ok = await bcrypt.compare(contrasenia, hash);
  } else {
    const legacy = await pool.query(`SELECT encode(digest($1,'sha256'),'hex') AS h`, [contrasenia]);
    if (legacy.rows[0].h === hash) {
      ok = true;
      const nuevoHash = await bcrypt.hash(contrasenia, 10);
      await pool.query(`UPDATE usuarios SET contrasenia=$1 WHERE id_usuario=$2`, [nuevoHash, u.id_usuario]);
    }
  }

  if (!ok) {
    throw crearError(401, "Usuario o contraseña incorrectos");
  }

  const token = jwt.sign({ id_usuario: u.id_usuario, rol: u.rol }, process.env.JWT_SECRET, { expiresIn: "8h" });

  return {
    token,
    usuario: { id_usuario: u.id_usuario, nombres: u.nombres, apellidos: u.apellidos, rol: u.rol },
  };
}

async function register(datos, solicitante) {
  if (!solicitante || solicitante.rol !== 3) {
    throw crearError(403, "Solo el Director puede registrar usuarios");
  }

  const { id_area, nombres, apellidos, usuario, contrasenia, avatar, rol } = datos;
  try {
    const hash = await bcrypt.hash(contrasenia, 10);
    const r = await pool.query(
      `INSERT INTO usuarios (id_area, nombres, apellidos, usuario, contrasenia, avatar, rol, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,1) RETURNING id_usuario, usuario, rol`,
      [id_area, nombres, apellidos, usuario, hash, avatar || null, rol]
    );
    return r.rows[0];
  } catch (e) {
    if (e.code === "23505") throw crearError(409, "Usuario ya existe");
    throw e;
  }
}

module.exports = { login, register };
