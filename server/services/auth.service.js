const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const usuariosDatos = require("../datos/usuarios.datos");
const { crearError } = require("../utils/httpError");

const HORAS_DE_SESION = "8h";

// Los usuarios que trae incidencias_db.sql guardan la contraseña en SHA-256.
// Los que se crean desde la aplicación usan bcrypt.
function esHashBcrypt(hash) {
  return /^\$2[aby]\$/.test(hash);
}

function sha256(texto) {
  return crypto.createHash("sha256").update(texto, "utf8").digest("hex");
}

function compararContrasenia(contrasenia, hash) {
  if (!hash) return Promise.resolve(false);
  if (esHashBcrypt(hash)) return bcrypt.compare(contrasenia, hash);
  return Promise.resolve(sha256(contrasenia) === hash);
}

function hashearContrasenia(contrasenia) {
  return bcrypt.hash(contrasenia, 10);
}

function firmarToken(usuario) {
  return jwt.sign(
    { id_usuario: usuario.id_usuario, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: HORAS_DE_SESION }
  );
}

async function login(usuario, contrasenia) {
  const encontrado = await usuariosDatos.buscarCredenciales(usuario);
  if (!encontrado) throw crearError(401, "Usuario o contraseña incorrectos");

  const coincide = await compararContrasenia(contrasenia, encontrado.contrasenia);
  if (!coincide) throw crearError(401, "Usuario o contraseña incorrectos");

  if (encontrado.activo !== 1) throw crearError(403, "El usuario está dado de baja");

  return {
    token: firmarToken(encontrado),
    usuario: {
      id_usuario: encontrado.id_usuario,
      nombres: encontrado.nombres,
      apellidos: encontrado.apellidos,
      usuario: encontrado.usuario,
      avatar: encontrado.avatar,
      rol: encontrado.rol,
    },
  };
}

async function cambiarContrasenia(idUsuario, actual, nueva) {
  const encontrado = await usuariosDatos.buscarCredencialesPorId(idUsuario);
  if (!encontrado) throw crearError(404, "Usuario no encontrado");

  const coincide = await compararContrasenia(actual, encontrado.contrasenia);
  if (!coincide) throw crearError(400, "La contraseña actual no es correcta");

  await usuariosDatos.actualizarContrasenia(idUsuario, await hashearContrasenia(nueva));
  return { mensaje: "Contraseña actualizada" };
}

module.exports = { login, cambiarContrasenia, hashearContrasenia, compararContrasenia };
