const URL_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

function cerrarSesionPorTokenVencido() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.hash = "#/login";
}

async function leerError(respuesta) {
  const datos = await respuesta.json().catch(() => ({}));
  return (
    datos.error ||
    (Array.isArray(datos.errors) && datos.errors[0]?.msg) ||
    `Error ${respuesta.status} del servidor`
  );
}

async function pedir(metodo, ruta, cuerpo) {
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
    throw new Error("No se pudo conectar con el servidor. ¿Está levantada la API?");
  }

  if (respuesta.status === 401 && token && ruta !== "/auth/login") {
    cerrarSesionPorTokenVencido();
    throw new Error("La sesión venció. Iniciá sesión otra vez.");
  }

  if (!respuesta.ok) throw new Error(await leerError(respuesta));

  // 204 No Content: las bajas no devuelven cuerpo.
  if (respuesta.status === 204) return null;

  return respuesta.json();
}

async function descargar(ruta) {
  const token = localStorage.getItem("token");
  const opciones = { method: "GET", headers: {} };
  if (token) opciones.headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, opciones);
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está levantada la API?");
  }

  if (respuesta.status === 401 && token) {
    cerrarSesionPorTokenVencido();
    throw new Error("La sesión venció. Iniciá sesión otra vez.");
  }

  if (!respuesta.ok) throw new Error(await leerError(respuesta));

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
