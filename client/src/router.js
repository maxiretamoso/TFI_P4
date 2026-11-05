import * as login from "./pages/login.js";
import * as incidencias from "./pages/incidencias.js";
import * as catalogos from "./pages/catalogos.js";
import * as usuarios from "./pages/usuarios.js";
import * as perfil from "./pages/perfil.js";
import * as dashboard from "./pages/dashboard.js";
import * as reportes from "./pages/reportes.js";
import * as nueva from "./pages/nueva.js";
import { haySesion, leerUsuario, cerrarSesion } from "./session.js";
import { esc, ROLES, NOMBRES_ROL, avatarHtml } from "./ui.js";
import { botonTema, activarBotonTema } from "./tema.js";
import { rutaDeInicio } from "./permisos.js";

const TODOS = [ROLES.DIRECTOR, ROLES.EMPLEADO_SISTEMAS, ROLES.EMPLEADO_MUNICIPAL];

const RUTAS = {
  "/dashboard": { pagina: dashboard, texto: "Dashboard", roles: [ROLES.DIRECTOR] },
  "/": {
    pagina: incidencias,
    texto: {
      [ROLES.DIRECTOR]: "Incidencias",
      [ROLES.EMPLEADO_SISTEMAS]: "Mis asignadas",
      [ROLES.EMPLEADO_MUNICIPAL]: "Mis incidencias",
    },
    roles: TODOS,
  },
  "/nueva": { pagina: nueva, texto: "Nueva incidencia", roles: [ROLES.EMPLEADO_MUNICIPAL] },
  "/catalogos": {
    pagina: catalogos,
    texto: "Catálogos",
    roles: [ROLES.DIRECTOR, ROLES.EMPLEADO_SISTEMAS],
  },
  "/reportes": { pagina: reportes, texto: "Reportes", roles: [ROLES.DIRECTOR] },
  "/usuarios": { pagina: usuarios, texto: "Usuarios", roles: [ROLES.DIRECTOR] },
  "/perfil": { pagina: perfil, texto: "Mi perfil", roles: TODOS },
};

const TITULO = "Gestión de Incidencias Municipales";

function textoDelEnlace(config, usuario) {
  return typeof config.texto === "string" ? config.texto : config.texto[usuario.rol];
}

function enlacesDelMenu(rutaActual, usuario) {
  return Object.entries(RUTAS)
    .filter(([, config]) => config.roles.includes(usuario.rol))
    .map(([ruta, config]) => {
      const activa = ruta === rutaActual;
      return `<li>
        <a class="enlace-menu${activa ? " activo" : ""}" href="#${ruta}"${activa ? ' aria-current="page"' : ""}>${textoDelEnlace(config, usuario)}</a>
      </li>`;
    })
    .join("");
}

function estructuraHtml(rutaActual, usuario) {
  return `<div class="app-con-menu">
    <aside class="lateral offcanvas-lg offcanvas-start" tabindex="-1" id="menu-lateral" aria-label="Menú principal">
      <div class="lateral-logo">
        <img src="/logo-muni.png" alt="Municipalidad de Concordia">
        <button type="button" class="btn-close btn-close-white d-lg-none" data-bs-dismiss="offcanvas" data-bs-target="#menu-lateral" aria-label="Cerrar el menú"></button>
      </div>
      <nav>
        <ul class="lista-menu">${enlacesDelMenu(rutaActual, usuario)}</ul>
      </nav>
      <button type="button" class="enlace-menu boton-salir" id="salir">Salir</button>
    </aside>

    <div class="area-principal">
      <header class="barra-superior">
        <button type="button" class="boton-menu d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#menu-lateral" aria-controls="menu-lateral" aria-label="Abrir el menú">☰</button>
        <h1 class="titulo-app">${TITULO}</h1>
        <div class="barra-derecha">
          ${botonTema()}
          <a class="enlace-usuario" href="#/perfil" title="Ir a Mi perfil">
            ${avatarHtml(usuario, "avatar-barra")}
            <span class="usuario-actual">
              <span class="usuario-nombre">${esc(usuario.nombres)} ${esc(usuario.apellidos)}</span>
              <span class="usuario-rol">${esc(NOMBRES_ROL[usuario.rol] ?? "")}</span>
            </span>
          </a>
        </div>
      </header>
      <main id="contenido-principal"></main>
    </div>
  </div>`;
}

// Al navegar se repinta todo; si el menú del celular estaba abierto, su fondo queda colgado.
function limpiarMenuAbierto() {
  document.querySelectorAll(".offcanvas-backdrop").forEach((fondo) => fondo.remove());
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
}

export async function enrutar() {
  const rutaPedida = window.location.hash.slice(1) || "/";
  const app = document.getElementById("app");
  limpiarMenuAbierto();

  if (!haySesion()) {
    app.innerHTML = "";
    if (rutaPedida !== "/login") {
      window.location.hash = "#/login";
      return;
    }
    await login.pintar(app);
    return;
  }

  const usuario = leerUsuario();

  if (rutaPedida === "/login") {
    window.location.hash = `#${rutaDeInicio(usuario)}`;
    return;
  }

  const config = RUTAS[rutaPedida];
  const permitida = config && config.roles.includes(usuario.rol);
  const ruta = permitida ? rutaPedida : rutaDeInicio(usuario);
  if (!permitida) history.replaceState(null, "", `#${ruta}`);

  app.innerHTML = estructuraHtml(ruta, usuario);
  activarBotonTema(app);

  document.getElementById("salir").addEventListener("click", () => {
    cerrarSesion();
    window.location.hash = "#/login";
  });

  await RUTAS[ruta].pagina.pintar(document.getElementById("contenido-principal"));
}
