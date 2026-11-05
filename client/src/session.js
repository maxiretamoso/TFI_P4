export function leerUsuario() {
  const guardado = localStorage.getItem("usuario");
  return guardado ? JSON.parse(guardado) : null;
}

export function haySesion() {
  return Boolean(localStorage.getItem("token") && leerUsuario());
}

export function guardarSesion(datos) {
  localStorage.setItem("token", datos.token);
  localStorage.setItem("usuario", JSON.stringify(datos.usuario));
}

export function actualizarUsuarioGuardado(cambios) {
  const usuario = leerUsuario();
  if (!usuario) return;
  localStorage.setItem("usuario", JSON.stringify({ ...usuario, ...cambios }));
}

export function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}
