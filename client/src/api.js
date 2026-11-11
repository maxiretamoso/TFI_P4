import { cerrarSesion } from "./session.js";

export const URL_SERVIDOR = "http://localhost:3000";
const URL_BASE = `${URL_SERVIDOR}/api/v1`;

async function leerError(respuesta) {
  const datos = await respuesta.json().catch(() => ({}));
  return (
    datos.error ||
    (Array.isArray(datos.errors) && datos.errors[0]?.msg) ||
    `Error ${respuesta.status} del servidor`
  );
}

async function enviarSolicitud(metodo, ruta, cuerpo) {
  const token = localStorage.getItem("token");
  const opciones = { method: metodo, headers: {} };

  if (token) opciones.headers.Authorization = `Bearer ${token}`;

  if (cuerpo instanceof FormData) {
    opciones.body = cuerpo;
  } else if (cuerpo !== undefined) {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, opciones);
  } catch {
    throw new Error("No se pudo conectar con el servidor. Probá de nuevo en unos minutos.");
  }

  if (respuesta.status === 401 && token && ruta !== "/auth/login") {
    cerrarSesion();
    window.location.hash = "#/login";
    throw new Error("La sesión venció. Iniciá sesión otra vez.");
  }

  if (!respuesta.ok) throw new Error(await leerError(respuesta));
  return respuesta;
}

async function pedir(metodo, ruta, cuerpo) {
  const respuesta = await enviarSolicitud(metodo, ruta, cuerpo);
  // 204 No Content: las bajas no devuelven cuerpo.
  if (respuesta.status === 204) return null;

  return respuesta.json();
}

async function descargar(ruta) {
  const respuesta = await enviarSolicitud("GET", ruta);
  return respuesta.blob();
}

export const api = {
  get: (ruta) => pedir("GET", ruta),
  post: (ruta, datos) => pedir("POST", ruta, datos),
  put: (ruta, datos) => pedir("PUT", ruta, datos),
  patch: (ruta, datos) => pedir("PATCH", ruta, datos),
  del: (ruta) => pedir("DELETE", ruta),
  descargar,
};
