import { ROLES, ESTADOS } from "./ui.js";

// Reflejan lo que permite la API; el control real está siempre en el servidor.

export function esDirector(usuario) {
  return usuario.rol === ROLES.DIRECTOR;
}

export function esDeSistemas(usuario) {
  return usuario.rol === ROLES.EMPLEADO_SISTEMAS;
}

export function esMunicipal(usuario) {
  return usuario.rol === ROLES.EMPLEADO_MUNICIPAL;
}

export function puedeCrearIncidencias(usuario) {
  return esMunicipal(usuario);
}

export function puedeCancelar(usuario, incidencia) {
  if (incidencia.id_estado !== ESTADOS.PENDIENTE) return false;
  if (esDirector(usuario)) return true;
  return esMunicipal(usuario) && incidencia.creado_por === usuario.id_usuario;
}

export function puedeFinalizar(usuario, incidencia) {
  const abierta =
    incidencia.id_estado !== ESTADOS.RESUELTA && incidencia.id_estado !== ESTADOS.CANCELADA;
  return abierta && esDeSistemas(usuario) && incidencia.asignado_a === usuario.id_usuario;
}

export function puedeAsignar(usuario, incidencia) {
  const abierta =
    incidencia.id_estado !== ESTADOS.RESUELTA && incidencia.id_estado !== ESTADOS.CANCELADA;
  return abierta && esDirector(usuario);
}

export function puedeGestionarCatalogos(usuario) {
  return esDirector(usuario) || esDeSistemas(usuario);
}

export function puedeGestionarUsuarios(usuario) {
  return esDirector(usuario);
}
