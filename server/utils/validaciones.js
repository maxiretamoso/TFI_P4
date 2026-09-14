/**
 * Helpers de validación puros (sin tocar DB ni routers existentes).
 * El equipo puede importarlos cuando implemente POST/PUT.
 */

function esTextoNoVacio(valor, maxLen = 255) {
  return (
    typeof valor === "string" && valor.trim().length > 0 && valor.trim().length <= maxLen
  );
}

function validarArea(datos) {
  const errores = [];
  if (!esTextoNoVacio(datos.descripcion, 100)) {
    errores.push("descripcion requerida (1-100 caracteres)");
  }
  return errores;
}

function validarCategoria(datos) {
  const errores = [];
  if (!esTextoNoVacio(datos.descripcion, 100)) {
    errores.push("descripcion requerida (1-100 caracteres)");
  }
  return errores;
}

function validarEstado(datos) {
  const errores = [];
  if (!esTextoNoVacio(datos.descripcion, 100)) {
    errores.push("descripcion requerida (1-100 caracteres)");
  }
  return errores;
}

function validarArticulo(datos) {
  const errores = [];
  if (!Number.isInteger(datos.id_area)) errores.push("id_area debe ser entero");
  if (!Number.isInteger(datos.id_categoria)) errores.push("id_categoria debe ser entero");
  if (!esTextoNoVacio(datos.descripcion, 150)) {
    errores.push("descripcion requerida (1-150 caracteres)");
  }
  return errores;
}

function validarUsuario(datos) {
  const errores = [];
  if (!Number.isInteger(datos.id_area)) errores.push("id_area debe ser entero");
  if (!esTextoNoVacio(datos.nombres, 100)) errores.push("nombres requerido (1-100)");
  if (!esTextoNoVacio(datos.apellidos, 100)) errores.push("apellidos requerido (1-100)");
  if (!esTextoNoVacio(datos.usuario, 100)) errores.push("usuario requerido (1-100)");
  if (!esTextoNoVacio(datos.contrasenia, 100)) errores.push("contrasenia requerida");
  if (![1, 2, 3].includes(datos.rol)) errores.push("rol debe ser 1, 2 o 3");
  return errores;
}

function validarIncidencia(datos) {
  const errores = [];
  if (!Number.isInteger(datos.id_estado)) errores.push("id_estado debe ser entero");
  if (!Number.isInteger(datos.id_articulo)) errores.push("id_articulo debe ser entero");
  if (!Number.isInteger(datos.prioridad) || ![1, 2, 3].includes(datos.prioridad)) {
    errores.push("prioridad debe ser 1, 2 o 3");
  }
  if (!esTextoNoVacio(datos.descripcion_pedido, 255)) {
    errores.push("descripcion_pedido requerida (1-255)");
  }
  if (
    datos.descripcion_resolucion !== undefined &&
    datos.descripcion_resolucion !== null &&
    datos.descripcion_resolucion !== "" &&
    !esTextoNoVacio(datos.descripcion_resolucion, 255)
  ) {
    errores.push("descripcion_resolucion max 255 caracteres");
  }
  return errores;
}

module.exports = {
  esTextoNoVacio,
  validarArea,
  validarCategoria,
  validarEstado,
  validarArticulo,
  validarUsuario,
  validarIncidencia,
};
