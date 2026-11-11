import fs from "fs";
import path from "path";
import * as usuariosService from "../services/usuarios.service.js";
import { uploadDir } from "../utils/avatarUpload.js";
import { responderSiHayErroresDeValidacion } from "../utils/validarSolicitud.js";
import { archivoDelPredefinido, esPredefinido } from "../config/avatares.js";

function borrarArchivo(ruta) {
  try {
    if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta);
  } catch {
    // la limpieza no debe hacer fallar el pedido
  }
}

// basename() evita que un "../" guardado en la base salga de la carpeta.
function borrarAvatarAnterior(nombreArchivo) {
  if (!nombreArchivo || esPredefinido(nombreArchivo)) return;
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
    const predefinido = req.body?.predefinido;
    if (!req.file && !predefinido) {
      return res
        .status(400)
        .json({ error: "Mandá una imagen en el campo 'avatar' o un avatar en 'predefinido'" });
    }

    const nuevo = req.file ? req.file.filename : archivoDelPredefinido(predefinido);
    const anterior = await usuariosService.obtenerUsuarioPorId(req.params.id, req.usuario);
    const usuario = await usuariosService.actualizarAvatar(req.params.id, nuevo, req.usuario);

    if (anterior.avatar !== nuevo) borrarAvatarAnterior(anterior.avatar);

    res.json(usuario);
  } catch (error) {
    if (req.file) borrarArchivo(req.file.path);
    next(error);
  }
}

export { listar, obtenerPorId, crear, actualizar, eliminar, subirAvatar };
