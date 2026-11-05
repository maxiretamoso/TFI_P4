const estadosDatos = require("../datos/estados.datos");
const { crearError } = require("../utils/httpError");

function listarEstados() {
  return estadosDatos.listar();
}

async function obtenerEstadoPorId(id) {
  const estado = await estadosDatos.buscarPorId(id);
  if (!estado) throw crearError(404, "Estado no encontrado");
  return estado;
}

function crearEstado(descripcion) {
  return estadosDatos.insertar(descripcion);
}

async function actualizarEstado(id, descripcion) {
  const estado = await estadosDatos.actualizar(id, descripcion);
  if (!estado) throw crearError(404, "Estado no encontrado");
  return estado;
}

async function desactivarEstado(id) {
  const estado = await estadosDatos.desactivar(id);
  if (!estado) throw crearError(404, "Estado no encontrado");
  return estado;
}

module.exports = {
  listarEstados,
  obtenerEstadoPorId,
  crearEstado,
  actualizarEstado,
  desactivarEstado,
};
