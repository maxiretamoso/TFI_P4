const fs = require("fs");
const path = require("path");
const usuariosService = require("../services/usuarios.service");
const { uploadDir } = require("../utils/avatarUpload");
const { responderSiHayErroresDeValidacion } = require("../utils/validar");

function borrarArchivo(ruta) {
  try {
    if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta);
  } catch {
    // la limpieza no debe hacer fallar el pedido
  }
}

// basename() evita que un "../" guardado en la base salga de la carpeta.
function borrarAvatarAnterior(nombreArchivo) {
  if (!nombreArchivo) return;
  borrarArchivo(path.join(uploadDir, path.basename(nombreArchivo)));
}

async function listar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const soloSistemas = req.query.rol === "sistemas";
    res.json(
      soloSistemas
        ? await usuariosService.listarEmpleadosDeSistemas()
        : await usuariosService.listarUsuarios()
    );
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await usuariosService.obtenerUsuarioPorId(req.params.id, req.usuario));
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const usuario = await usuariosService.crearUsuario(req.body);
    res.status(201).location(`/api/v1/usuarios/${usuario.id_usuario}`).json(usuario);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await usuariosService.actualizarUsuario(req.params.id, req.body, req.usuario));
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    await usuariosService.desactivarUsuario(req.params.id, req.usuario);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

async function subirAvatar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) {
    borrarArchivo(req.file?.path);
    return;
  }
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Falta el archivo en el campo 'avatar'" });
    }

    const anterior = await usuariosService.obtenerUsuarioPorId(req.params.id);
    const usuario = await usuariosService.actualizarAvatar(
      req.params.id,
      req.file.filename,
      req.usuario
    );

    if (anterior.avatar && anterior.avatar !== req.file.filename) {
      borrarAvatarAnterior(anterior.avatar);
    }

    res.json(usuario);
  } catch (error) {
    if (req.file) borrarArchivo(req.file.path);
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar, subirAvatar };
