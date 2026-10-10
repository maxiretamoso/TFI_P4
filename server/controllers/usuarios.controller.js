const fs = require("fs");
const path = require("path");
const usuariosService = require("../services/usuarios.service");
const { responderSiHayErroresDeValidacion } = require("../utils/validar");

// Borra un archivo subido sin romper el request si falla (best-effort).
function borrarArchivoSeguro(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {
    // limpieza best-effort: no debe fallar el request
  }
}

// Carpeta física de avatares: el único lugar permitido para borrar.
const AVATAR_DIR = path.resolve(__dirname, "..", "uploads", "avatars");

// Borra el avatar anterior solo si, tras resolver la ruta, queda DENTRO de
// uploads/avatars. basename() descarta cualquier "../" del nombre guardado,
// así un valor malicioso no puede escaparse de la carpeta (path traversal).
function borrarAvatarSeguro(relPath) {
  if (!relPath || typeof relPath !== "string") return;
  const destino = path.resolve(AVATAR_DIR, path.basename(relPath));
  if (destino.startsWith(AVATAR_DIR + path.sep) && fs.existsSync(destino)) {
    borrarArchivoSeguro(destino);
  }
}

async function listar(req, res, next) {
  try {
    res.json(await usuariosService.listarUsuarios());
  } catch (e) { next(e); }
}

async function obtenerPorId(req, res, next) {
  try {
    const usuario = await usuariosService.obtenerUsuarioPorId(req.params.id);
    res.json(usuario);
  } catch (e) { next(e); }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.status(201).json(await usuariosService.crearUsuario(req.body));
  } catch (e) { next(e); }
}

async function actualizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const usuario = await usuariosService.actualizarUsuario(req.params.id, req.body, req.usuario);
    res.json(usuario);
  } catch (e) { next(e); }
}

async function eliminar(req, res, next) {
  try {
    const usuario = await usuariosService.desactivarUsuario(req.params.id);
    res.json({ mensaje: "Usuario desactivado" });
  } catch (e) { next(e); }
}

async function subirAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "Debe enviar un archivo 'avatar'" });
    if (req.usuario.rol !== 3 && parseInt(req.params.id, 10) !== req.usuario.id_usuario) {
      borrarArchivoSeguro(req.file.path);
      return res.status(403).json({ error: "No autorizado" });
    }
    const previo = await usuariosService.obtenerUsuarioPorId(req.params.id);
    const relPath = `uploads/avatars/${req.file.filename}`;
    const usuario = await usuariosService.actualizarAvatar(req.params.id, relPath);
    if (previo.avatar && previo.avatar !== relPath) borrarAvatarSeguro(previo.avatar);
    res.json(usuario);
  } catch (e) {
    if (req.file) borrarArchivoSeguro(req.file.path);
    next(e);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar, subirAvatar };
