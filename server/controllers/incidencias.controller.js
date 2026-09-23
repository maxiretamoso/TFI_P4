const { responderSiHayErroresDeValidacion } = require("../utils/validar");
const incidenciasService = require("../services/incidencias.service");

async function listar(req, res, next) {
  try {
    res.json(await incidenciasService.listar(req.usuario.rol, req.usuario.id_usuario));
  } catch (e) {
    next(e);
  }
}

async function listarMias(req, res, next) {
  try {
    res.json(await incidenciasService.listarMias(req.usuario.id_usuario));
  } catch (e) {
    next(e);
  }
}

async function listarAsignadas(req, res, next) {
  try {
    res.json(await incidenciasService.listarAsignadas(req.usuario.id_usuario));
  } catch (e) {
    next(e);
  }
}

async function listarTodas(req, res, next) {
  try {
    res.json(await incidenciasService.listarTodas());
  } catch (e) {
    next(e);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const { rol, id_usuario } = req.usuario;
    res.json(await incidenciasService.obtenerPorId(req.params.id, { rol, id_usuario }));
  } catch (e) {
    next(e);
  }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const { id_articulo, prioridad, descripcion_pedido, descripcion_resolucion, id_estado } = req.body;
    const inc = await incidenciasService.crear({
      id_articulo,
      prioridad,
      descripcion_pedido,
      descripcion_resolucion,
      id_estado,
      creado_por: req.usuario.id_usuario,
    });
    res.status(201).json(inc);
  } catch (e) {
    next(e);
  }
}

async function cancelar(req, res, next) {
  try {
    const { rol, id_usuario } = req.usuario;
    res.json(await incidenciasService.cancelar(parseInt(req.params.id, 10), { rol, id_usuario }));
  } catch (e) {
    next(e);
  }
}

async function finalizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(
      await incidenciasService.finalizar(parseInt(req.params.id, 10), {
        descripcion_resolucion: req.body.descripcion_resolucion,
        rol: req.usuario.rol,
        id_usuario: req.usuario.id_usuario,
      }),
    );
  } catch (e) {
    next(e);
  }
}

async function asignar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(
      await incidenciasService.asignar(parseInt(req.params.id, 10), { asignado_a: req.body.asignado_a }),
    );
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listar,
  listarMias,
  listarAsignadas,
  listarTodas,
  obtenerPorId,
  crear,
  cancelar,
  finalizar,
  asignar,
};
