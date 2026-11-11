import { ROLES, ESTADOS } from "../../shared/constantes.js";


// Reflejan lo que permite la API; el control real está siempre en el servidor.

export function esDirector(usuario) {
  return usuario.rol === ROLES.DIRECTOR;
}

export function esDeSistemas(usuario) {
  return usuario.rol === ROLES.EMPLEADO_SISTEMAS;
}

function esMunicipal(usuario) {
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
  const sinResolver =
    incidencia.id_estado !== ESTADOS.RESUELTA && incidencia.id_estado !== ESTADOS.CANCELADA;
  return sinResolver && esDeSistemas(usuario) && incidencia.asignado_a === usuario.id_usuario;
}

export function puedeAsignar(usuario, incidencia) {
  const sinResolver =
    incidencia.id_estado !== ESTADOS.RESUELTA && incidencia.id_estado !== ESTADOS.CANCELADA;
  return sinResolver && esDirector(usuario);
}

export function puedeGestionarUsuarios(usuario) {
  return esDirector(usuario);
}

export function rutaDeInicio(usuario) {
  return esDirector(usuario) ? "/dashboard" : "/";
}
