import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as usuariosDatos from "../datos/usuarios.datos.js";
import { crearError } from "../utils/httpError.js";

const HORAS_DE_SESION = "8h";

// Los usuarios del script de la cátedra están en SHA-256; los creados desde la app, en bcrypt.
function esHashBcrypt(hash) {
  return /^\$2[aby]\$/.test(hash);
}

function sha256(texto) {
  return crypto.createHash("sha256").update(texto, "utf8").digest("hex");
}

function compararContrasenia(contrasenia, hash) {
  if (!hash) return Promise.resolve(false);
  if (esHashBcrypt(hash)) return bcrypt.compare(contrasenia, hash);
  const calculado = Buffer.from(sha256(contrasenia), "hex");
  const guardado = Buffer.from(hash, "hex");
  return Promise.resolve(
    calculado.length === guardado.length &&
      crypto.timingSafeEqual(calculado, guardado),
  );
}

function hashearContrasenia(contrasenia) {
  return bcrypt.hash(contrasenia, 10);
}

function firmarToken(usuario) {
  return jwt.sign(
    { id_usuario: usuario.id_usuario, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: HORAS_DE_SESION },
  );
}

async function login(usuario, contrasenia) {
  const encontrado = await usuariosDatos.buscarCredenciales(usuario);
  if (!encontrado) throw crearError(401, "Usuario o contraseña incorrectos");

  const coincide = await compararContrasenia(
    contrasenia,
    encontrado.contrasenia,
  );
  if (!coincide) throw crearError(401, "Usuario o contraseña incorrectos");

  if (encontrado.activo !== 1)
    throw crearError(403, "El usuario está dado de baja");

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

  await usuariosDatos.actualizarContrasenia(
    idUsuario,
    await hashearContrasenia(nueva),
  );
  return { mensaje: "Contraseña actualizada" };
}

// El token puede seguir vigente después de una baja o un cambio de rol: se usa el estado actual.
async function validarSesion(datosDelToken) {
  const usuario = await usuariosDatos.buscarPorId(datosDelToken.id_usuario);
  if (!usuario || usuario.activo !== 1) {
    throw crearError(401, "Tu sesión ya no es válida. Iniciá sesión de nuevo.");
  }
  return {
    id_usuario: usuario.id_usuario,
    rol: usuario.rol,
    id_area: usuario.id_area,
  };
}

export { login, validarSesion, cambiarContrasenia, hashearContrasenia };
