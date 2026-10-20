const URL_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

async function pedir(metodo, ruta, cuerpo) {
  const token = localStorage.getItem("token");

  const opciones = {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    opciones.headers.Authorization = `Bearer ${token}`;
  }

  if (cuerpo !== undefined) {
    opciones.body = JSON.stringify(cuerpo);
  }

  const respuesta = await fetch(`${URL_BASE}${ruta}`, opciones);

  if (respuesta.status === 401 && token && ruta !== "/auth/login") {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.hash = "#/login";
    throw new Error("Sesión vencida. Iniciá sesión otra vez.");
  }

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const mensaje =
      datos.error ||
      (Array.isArray(datos.errors) && datos.errors[0]?.msg) ||
      "Error inesperado del servidor";
    throw new Error(mensaje);
  }

  return datos;
}

async function descargar(ruta) {
  const token = localStorage.getItem("token");

  const opciones = { method: "GET" };
  if (token) {
    opciones.headers = { Authorization: `Bearer ${token}` };
  }

  const respuesta = await fetch(`${URL_BASE}${ruta}`, opciones);

  if (respuesta.status === 401 && token) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.hash = "#/login";
    throw new Error("Sesión vencida. Iniciá sesión otra vez.");
  }

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new Error(datos.error || "No se pudo generar el archivo");
  }

  return await respuesta.blob();
}

export const api = {
  get: (ruta) => pedir("GET", ruta),
  post: (ruta, datos) => pedir("POST", ruta, datos),
  put: (ruta, datos) => pedir("PUT", ruta, datos),
  patch: (ruta, datos) => pedir("PATCH", ruta, datos),
  del: (ruta) => pedir("DELETE", ruta),
  descargar,
};
