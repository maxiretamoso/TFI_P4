const areasDatos = require("../datos/areas.datos");
const { crearError } = require("../utils/httpError");

function listarAreas() {
  return areasDatos.listar();
}

async function obtenerAreaPorId(id) {
  const area = await areasDatos.buscarPorId(id);
  if (!area) throw crearError(404, "Área no encontrada");
  return area;
}

function crearArea(descripcion) {
  return areasDatos.insertar(descripcion);
}

async function actualizarArea(id, descripcion) {
  const area = await areasDatos.actualizar(id, descripcion);
  if (!area) throw crearError(404, "Área no encontrada");
  return area;
}

async function desactivarArea(id) {
  const area = await areasDatos.desactivar(id);
  if (!area) throw crearError(404, "Área no encontrada");
  return area;
}

module.exports = { listarAreas, obtenerAreaPorId, crearArea, actualizarArea, desactivarArea };
