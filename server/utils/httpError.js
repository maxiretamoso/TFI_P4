// Los servicios lanzan estos errores y el manejador central de index.js
// los convierte en una respuesta con su código de estado.
function crearError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { crearError };
