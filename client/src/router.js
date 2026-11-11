import { ROLES } from "../../shared/constantes.js";
import * as login from "./pages/login.js";
import * as incidencias from "./pages/incidencias.js";
import * as catalogos from "./pages/catalogos.js";
import * as usuarios from "./pages/usuarios.js";
import * as perfil from "./pages/perfil.js";
import * as dashboard from "./pages/dashboard.js";
import * as reportes from "./pages/reportes.js";
import * as nueva from "./pages/nueva.js";
import * as articulos from "./pages/articulos.js";
import { haySesion, leerUsuario, cerrarSesion } from "./auth/session.js";
import { esc, avatarHtml } from "./ui/ui.js";
import { botonTema, activarBotonTema } from "./ui/tema.js";
import { rutaDeInicio } from "./auth/permisos.js";

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
  "/articulos": { pagina: articulos, texto: "Artículos", roles: [ROLES.EMPLEADO_MUNICIPAL] },
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
      <button type="button" class="enlace-menu boton-salir" id="salir">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Cerrar sesión
      </button>
    </aside>

    <div class="area-principal">
      <header class="barra-superior">
        <button type="button" class="boton-menu d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#menu-lateral" aria-controls="menu-lateral" aria-label="Abrir el menú">☰</button>
        <h1 class="titulo-app">${TITULO}</h1>
        <div class="barra-derecha">
          ${botonTema()}
          <a class="enlace-usuario" href="#/perfil">
            ${avatarHtml(usuario, "avatar-barra")}
            <span class="usuario-nombre">${esc(usuario.nombres)} ${esc(usuario.apellidos)}</span>
          </a>
        </div>
      </header>
      <main id="contenido-principal"></main>
    </div>
  </div>`;
}

const DURACION_SALIDA_MS = 350;

// Id del usuario cuya estructura (menú y barra superior) está en pantalla.
let usuarioEnPantalla = null;

function leerHash() {
  const [ruta, consulta = ""] = window.location.hash.slice(1).split("?");
  return { rutaPedida: ruta || "/", parametros: new URLSearchParams(consulta) };
}

function cerrarMenuDelCelular() {
  const abierto = document.querySelector("#menu-lateral.show");
  abierto?.querySelector('[data-bs-dismiss="offcanvas"]').click();
}

// Si un modal quedó abierto al cambiar de pantalla, su fondo oscuro queda colgado.
function limpiarFondos() {
  document.querySelectorAll(".modal-backdrop").forEach((fondo) => fondo.remove());
  document.body.classList.remove("modal-open");
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
}

function marcarEnlaceActivo(ruta) {
  document.querySelectorAll(".lista-menu .enlace-menu").forEach((enlace) => {
    const activo = enlace.getAttribute("href") === `#${ruta}`;
    enlace.classList.toggle("activo", activo);
    if (activo) enlace.setAttribute("aria-current", "page");
    else enlace.removeAttribute("aria-current");
  });
}

function salirDeLaCuenta() {
  document.querySelector(".app-con-menu")?.classList.add("saliendo");
  setTimeout(() => {
    cerrarSesion();
    window.location.hash = "#/login";
  }, DURACION_SALIDA_MS);
}

function pintarEstructura(app, ruta, usuario) {
  app.innerHTML = estructuraHtml(ruta, usuario);
  app.firstElementChild.classList.add("entrada-app");
  activarBotonTema(app);
  document.getElementById("salir").addEventListener("click", salirDeLaCuenta);
  usuarioEnPantalla = usuario.id_usuario;
}

export async function enrutar() {
  const { rutaPedida, parametros } = leerHash();
  const app = document.getElementById("app");
  cerrarMenuDelCelular();
  limpiarFondos();

  if (!haySesion()) {
    usuarioEnPantalla = null;
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

  if (usuarioEnPantalla !== usuario.id_usuario || !document.getElementById("contenido-principal")) {
    pintarEstructura(app, ruta, usuario);
  } else {
    marcarEnlaceActivo(ruta);
  }

  // Un <main> nuevo por pantalla: no arrastra eventos de la anterior y anima su entrada.
  const contenido = document.createElement("main");
  contenido.id = "contenido-principal";
  contenido.className = "contenido-entrando";
  document.getElementById("contenido-principal").replaceWith(contenido);

  await RUTAS[ruta].pagina.pintar(contenido, permitida ? parametros : new URLSearchParams());
}
