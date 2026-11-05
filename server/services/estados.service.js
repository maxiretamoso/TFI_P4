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

module.exports = { listarEstados, obtenerEstadoPorId };
