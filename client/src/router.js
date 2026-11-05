import * as login from "./pages/login.js";
import * as incidencias from "./pages/incidencias.js";
import * as catalogos from "./pages/catalogos.js";
import * as usuarios from "./pages/usuarios.js";
import * as perfil from "./pages/perfil.js";
import * as dashboard from "./pages/dashboard.js";
import * as reportes from "./pages/reportes.js";
import { haySesion, leerUsuario, cerrarSesion } from "./session.js";
import { esc, ROLES, NOMBRES_ROL } from "./ui.js";

const TODOS = [ROLES.DIRECTOR, ROLES.EMPLEADO_SISTEMAS, ROLES.EMPLEADO_MUNICIPAL];

const RUTAS = {
  "/": { pagina: incidencias, texto: "Incidencias", roles: TODOS },
  "/catalogos": {
    pagina: catalogos,
    texto: "Catálogos",
    roles: [ROLES.DIRECTOR, ROLES.EMPLEADO_SISTEMAS],
  },
  "/dashboard": { pagina: dashboard, texto: "Dashboard", roles: [ROLES.DIRECTOR] },
  "/reportes": { pagina: reportes, texto: "Reportes", roles: [ROLES.DIRECTOR] },
  "/usuarios": { pagina: usuarios, texto: "Usuarios", roles: [ROLES.DIRECTOR] },
  "/perfil": { pagina: perfil, texto: "Mi perfil", roles: TODOS },
};

function menuHtml(rutaActual, usuario) {
  const items = Object.entries(RUTAS)
    .filter(([, config]) => config.roles.includes(usuario.rol))
    .map(
      ([ruta, config]) => `<li class="nav-item">
        <a class="nav-link${ruta === rutaActual ? " active" : ""}" href="#${ruta}">${config.texto}</a>
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
        <span class="navbar-text">
          ${esc(usuario.nombres)} ${esc(usuario.apellidos)} — ${esc(NOMBRES_ROL[usuario.rol] ?? "")}
        </span>
        <button type="button" class="btn btn-salir btn-sm ms-lg-3 mt-2 mt-lg-0" id="salir">Salir</button>
      </div>
    </div>
  </nav>`;
}

export async function enrutar() {
  const rutaPedida = window.location.hash.slice(1) || "/";
  const conSesion = haySesion();

  if (!conSesion) {
    const app = document.getElementById("app");
    app.innerHTML = "";
    if (rutaPedida !== "/login") {
      window.location.hash = "#/login";
      return;
    }
    await login.pintar(app);
    return;
  }

  if (rutaPedida === "/login") {
    window.location.hash = "#/";
    return;
  }

  const usuario = leerUsuario();
  const config = RUTAS[rutaPedida];
  const permitida = config && config.roles.includes(usuario.rol);
  const ruta = permitida ? rutaPedida : "/";

  const app = document.getElementById("app");
  app.innerHTML = menuHtml(ruta, usuario) + `<main id="contenido-principal"></main>`;

  document.getElementById("salir").addEventListener("click", () => {
    cerrarSesion();
    window.location.hash = "#/login";
  });

  await RUTAS[ruta].pagina.pintar(document.getElementById("contenido-principal"));
}
