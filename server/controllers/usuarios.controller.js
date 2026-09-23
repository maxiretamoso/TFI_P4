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

// Solo borra avatares dentro de uploads/avatars (evita path traversal).
function esAvatarGestionado(relPath) {
  return typeof relPath === "string" && relPath.startsWith("uploads/avatars/");
}

async function listar(req, res, next) {
  try {
    res.json(await usuariosService.listarUsuarios());
  } catch (e) { next(e); }
}

async function obtenerPorId(req, res, next) {
  try {
    const usuario = await usuariosService.obtenerUsuarioPorId(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
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
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (e) { next(e); }
}

async function eliminar(req, res, next) {
  try {
    const usuario = await usuariosService.desactivarUsuario(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
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
    if (!previo) {
      borrarArchivoSeguro(req.file.path);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const relPath = `uploads/avatars/${req.file.filename}`;
    const usuario = await usuariosService.actualizarAvatar(req.params.id, relPath);
    if (!usuario) {
      borrarArchivoSeguro(req.file.path);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    if (previo.avatar && previo.avatar !== relPath && esAvatarGestionado(previo.avatar)) {
      borrarArchivoSeguro(path.join(__dirname, "..", previo.avatar));
    }
    res.json(usuario);
  } catch (e) {
    if (req.file) borrarArchivoSeguro(req.file.path);
    next(e);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar, subirAvatar };
