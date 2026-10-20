import * as login from "./pages/login.js";
import * as incidencias from "./pages/incidencias.js";
import * as asignadas from "./pages/asignadas.js";
import * as catalogos from "./pages/catalogos.js";
import * as usuarios from "./pages/usuarios.js";
import * as dashboard from "./pages/dashboard.js";
import * as reportes from "./pages/reportes.js";
import { haySesion, leerUsuario, cerrarSesion } from "./session.js";
import { esc } from "./ui.js";

const RUTAS = {
  "/": incidencias,
  "/asignadas": asignadas,
  "/catalogos": catalogos,
  "/usuarios": usuarios,
  "/dashboard": dashboard,
  "/reportes": reportes,
  "/login": login,
};

function menuHtml(ruta) {
  const usuario = leerUsuario();

  const enlaces = [
    { ruta: "/", texto: "Mis incidencias" },
    { ruta: "/asignadas", texto: "Mis asignadas", rolMinimo: 2 },
    { ruta: "/catalogos", texto: "Catálogos" },
    { ruta: "/usuarios", texto: "Usuarios" },
    { ruta: "/dashboard", texto: "Dashboard", rolMinimo: 3 },
    { ruta: "/reportes", texto: "Reportes", rolMinimo: 3 },
  ].filter((enlace) => !enlace.rolMinimo || usuario.rol >= enlace.rolMinimo);

  const items = enlaces
    .map(
      (enlace) => `<li class="nav-item">
        <a class="nav-link${enlace.ruta === ruta ? " active" : ""}" href="#${enlace.ruta}">${enlace.texto}</a>
      </li>`
    )
    .join("");

  return `<nav class="navbar navbar-expand-lg navbar-gim" id="menu-principal">
    <div class="container-fluid px-0">
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu-colapsable" aria-controls="menu-colapsable" aria-expanded="false" aria-label="Abrir o cerrar el menú">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="menu-colapsable">
        <ul class="navbar-nav me-auto">${items}</ul>
        <span class="navbar-text">Hola, ${esc(usuario.nombres)} ${esc(usuario.apellidos)} (rol ${usuario.rol})</span>
        <button type="button" class="btn btn-salir btn-sm ms-lg-3 mt-2 mt-lg-0" id="salir">Salir</button>
      </div>
    </div>
  </nav>`;
}

export async function enrutar() {
  const rutaActual = window.location.hash.slice(1) || "/";
  const conSesion = haySesion();

  if (!conSesion && rutaActual !== "/login") {
    window.location.hash = "#/login";
    return;
  }

  if (conSesion && rutaActual === "/login") {
    window.location.hash = "#/";
    return;
  }

  const app = document.getElementById("app");

  if (!conSesion) {
    app.innerHTML = "";
    await login.pintar(app);
    return;
  }

  const rutaValida = rutaActual in RUTAS ? rutaActual : "/";
  const pagina = RUTAS[rutaValida];

  app.innerHTML =
    menuHtml(rutaValida) + `<main id="contenido-principal"></main>`;

  document.getElementById("salir").addEventListener("click", () => {
    cerrarSesion();
    window.location.hash = "#/login";
  });

  await pagina.pintar(document.getElementById("contenido-principal"));
}
