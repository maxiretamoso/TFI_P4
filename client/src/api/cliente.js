// Ventanilla única: todos los pedidos a la API pasan por acá

const URL_BASE = "http://localhost:3000/api/v1";

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

  // Sesión vencida: solo si había token y no es el pedido de login
  // (en el login, 401 = usuario o contraseña incorrectos)
  if (respuesta.status === 401 && token && ruta !== "/auth/login") {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.assign("/login");
    throw new Error("Sesión vencida. Iniciá sesión otra vez.");
  }

  // El backend siempre responde JSON
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    // El backend manda { error: "texto" } o, si falló un campo, { errors: [...] }
    const mensaje =
      datos.error ||
      (Array.isArray(datos.errors) && datos.errors[0]?.msg) ||
      "Error inesperado del servidor";
    throw new Error(mensaje);
  }

  return datos;
}

// Para archivos binarios (PDF): la respuesta NO es JSON, viene en bytes
async function descargar(ruta) {
  const token = localStorage.getItem("token");

  const opciones = { method: "GET" };
  if (token) {
    opciones.headers = { Authorization: `Bearer ${token}` };
  }

  const respuesta = await fetch(`${URL_BASE}${ruta}`, opciones);

  // Sesión vencida: mismo criterio que en pedir()
  if (respuesta.status === 401 && token) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.assign("/login");
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
