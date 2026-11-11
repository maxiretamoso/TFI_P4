import { api } from "../api.js";
import { esDirector } from "../auth/permisos.js";
import { leerUsuario } from "../auth/session.js";
import { esc, cargando, mensajeError, paginar, paginacion } from "../ui/ui.js";
import { confirmar } from "../ui/confirmar.js";

const CATALOGOS = {
  articulos: {
    titulo: "Artículos",
    singular: "artículo",
    ruta: "/articulos",
    campoId: "id_articulo",
    columnas: [
      ["descripcion", "Artículo"],
      ["area", "Área"],
      ["categoria", "Categoría"],
    ],
    soloDirector: false,
  },
  categorias: {
    titulo: "Categorías",
    singular: "categoría",
    ruta: "/categorias",
    campoId: "id_categoria",
    columnas: [["descripcion", "Descripción"]],
    soloDirector: false,
  },
  areas: {
    titulo: "Áreas",
    singular: "área",
    ruta: "/areas",
    campoId: "id_area",
    columnas: [["descripcion", "Descripción"]],
    soloDirector: true,
  },
};

let contenedor = null;
let cfg = null;
let items = [];
let areas = [];
let categorias = [];
let busqueda = "";
let pagina = 1;
let editandoId = null;

function pestanias(usuario, actual) {
  return Object.entries(CATALOGOS)
    .filter(([, c]) => !c.soloDirector || esDirector(usuario))
    .map(
      ([clave, c]) => `<li class="nav-item">
        <a class="nav-link${clave === actual ? " active" : ""}" href="#/catalogos?ver=${clave}"${clave === actual ? ' aria-current="page"' : ""}>${c.titulo}</a>
      </li>`
    )
    .join("");
}

function camposDelFormulario() {
  const descripcion = `<div class="mb-3">
    <label class="form-label" for="campo-descripcion">${cfg === CATALOGOS.articulos ? "Nombre del artículo" : "Descripción"}</label>
    <input class="form-control" type="text" id="campo-descripcion" maxlength="250" required>
  </div>`;
  if (cfg !== CATALOGOS.articulos) return descripcion;

  return `${descripcion}
    <div class="mb-3">
      <label class="form-label" for="campo-area">Área</label>
      <select class="form-select" id="campo-area" required></select>
    </div>
    <div class="mb-3">
      <label class="form-label" for="campo-categoria">Categoría</label>
      <select class="form-select" id="campo-categoria" required></select>
    </div>`;
}

function ventanaDeFormulario() {
  return `<div class="modal fade" id="modal-catalogo" tabindex="-1" aria-labelledby="titulo-catalogo" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <form class="modal-content" id="form-catalogo" novalidate>
        <div class="modal-header">
          <h2 class="modal-title fs-5" id="titulo-catalogo"></h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body">
          ${camposDelFormulario()}
          <div class="zona-error-formulario"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-gim" id="boton-guardar-catalogo">Guardar</button>
        </div>
      </form>
    </div>
  </div>
  <button type="button" id="abrir-catalogo" data-bs-toggle="modal" data-bs-target="#modal-catalogo" hidden></button>`;
}

export async function pintar(zona, parametros = new URLSearchParams()) {
  contenedor = zona;
  const usuario = leerUsuario();
  let clave = parametros.get("ver");
  if (!CATALOGOS[clave] || (CATALOGOS[clave].soloDirector && !esDirector(usuario))) clave = "articulos";
  cfg = CATALOGOS[clave];
  items = [];
  busqueda = "";
  pagina = 1;
  editandoId = null;

  contenedor.innerHTML = `
    <div class="tarjeta-lista">
      <div class="encabezado-lista">
        <h2>Catálogos</h2>
      </div>
      <ul class="nav nav-pills pestanias-catalogo mb-3">${pestanias(usuario, clave)}</ul>
      <div class="barra-herramientas">
        <input class="form-control buscador-catalogo" type="search" placeholder="Buscar ${cfg.singular}..." aria-label="Buscar ${cfg.singular}">
        <button type="button" class="btn btn-gim" id="boton-agregar">+ Agregar ${cfg.singular}</button>
      </div>
      <div class="zona-error"></div>
      <div class="tabla-scroll zona-tabla">${cargando(`Cargando ${cfg.titulo.toLowerCase()}...`)}</div>
    </div>
    ${ventanaDeFormulario()}`;

  contenedor.querySelector(".buscador-catalogo").addEventListener("input", (e) => {
    busqueda = e.target.value;
    pagina = 1;
    pintarTabla();
  });
  contenedor.querySelector("#boton-agregar").addEventListener("click", () => abrirFormulario(null));
  contenedor.querySelector(".zona-tabla").addEventListener("click", manejarAccion);
  contenedor.querySelector("#form-catalogo").addEventListener("submit", guardar);

  await recargar();
}

async function recargar() {
  try {
    const pedidos = [api.get(cfg.ruta)];
    if (cfg === CATALOGOS.articulos) pedidos.push(api.get("/areas"), api.get("/categorias"));
    [items, areas = [], categorias = []] = await Promise.all(pedidos);
    contenedor.querySelector(".zona-error").innerHTML = "";
  } catch (e) {
    contenedor.querySelector(".zona-error").innerHTML = mensajeError(e.message, { fijo: true });
  }
  pintarTabla();
}

function pintarTabla() {
  const buscado = busqueda.trim().toLowerCase();
  const visibles = items.filter((item) =>
    cfg.columnas.some(([campo]) => String(item[campo] ?? "").toLowerCase().includes(buscado))
  );

  const vista = paginar(visibles, pagina, items.length);
  pagina = vista.pagina;

  const filas = visibles.length
    ? vista.items
        .map(
          (item) => `<tr>
            ${cfg.columnas.map(([campo]) => `<td>${esc(item[campo])}</td>`).join("")}
            <td class="celda-acciones">
              <button type="button" class="btn btn-editar btn-sm" data-accion="editar" data-id="${item[cfg.campoId]}">Editar</button>
              <button type="button" class="btn btn-eliminar btn-sm" data-accion="eliminar" data-id="${item[cfg.campoId]}">Eliminar</button>
            </td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="${cfg.columnas.length + 1}">${
        buscado ? "No hay resultados para la búsqueda." : `Todavía no hay ${cfg.titulo.toLowerCase()} cargados.`
      }</td></tr>`;

  contenedor.querySelector(".zona-tabla").innerHTML = `
    <table>
      <thead>
        <tr>${cfg.columnas.map(([, titulo]) => `<th>${titulo}</th>`).join("")}<th class="columna-acciones">Acciones</th></tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    ${paginacion(vista, [cfg.singular, cfg.titulo.toLowerCase()])}`;
}

function opciones(lista, campoId, elegido) {
  return (
    `<option value="">Elegir...</option>` +
    lista
      .map((o) => `<option value="${o[campoId]}"${o[campoId] === elegido ? " selected" : ""}>${esc(o.descripcion)}</option>`)
      .join("")
  );
}

function abrirFormulario(item) {
  editandoId = item ? item[cfg.campoId] : null;
  contenedor.querySelector("#titulo-catalogo").textContent = item
    ? `Editar ${cfg.singular}`
    : `Agregar ${cfg.singular}`;
  contenedor.querySelector("#campo-descripcion").value = item?.descripcion ?? "";
  contenedor.querySelector(".zona-error-formulario").innerHTML = "";

  if (cfg === CATALOGOS.articulos) {
    contenedor.querySelector("#campo-area").innerHTML = opciones(areas, "id_area", item?.id_area);
    contenedor.querySelector("#campo-categoria").innerHTML = opciones(categorias, "id_categoria", item?.id_categoria);
  }

  contenedor.querySelector("#abrir-catalogo").click();
  setTimeout(() => contenedor.querySelector("#campo-descripcion")?.focus(), 300);
}

function manejarAccion(evento) {
  const botonPagina = evento.target.closest("button[data-pagina]");
  if (botonPagina) {
    pagina = Number(botonPagina.dataset.pagina);
    pintarTabla();
    return;
  }
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;
  const item = items.find((i) => i[cfg.campoId] === Number(boton.dataset.id));
  if (boton.dataset.accion === "editar") abrirFormulario(item);
  if (boton.dataset.accion === "eliminar") eliminar(item);
}

function datosDelFormulario() {
  const descripcion = contenedor.querySelector("#campo-descripcion").value.trim();
  if (!descripcion) return { error: "Completá la descripción." };
  if (cfg !== CATALOGOS.articulos) return { datos: { descripcion } };

  const idArea = contenedor.querySelector("#campo-area").value;
  const idCategoria = contenedor.querySelector("#campo-categoria").value;
  if (!idArea || !idCategoria) return { error: "Elegí el área y la categoría." };
  return { datos: { descripcion, id_area: Number(idArea), id_categoria: Number(idCategoria) } };
}

async function guardar(evento) {
  evento.preventDefault();
  const zonaError = contenedor.querySelector(".zona-error-formulario");
  const { datos, error } = datosDelFormulario();
  if (error) {
    zonaError.innerHTML = mensajeError(error, { fijo: true });
    return;
  }

  const boton = contenedor.querySelector("#boton-guardar-catalogo");
  boton.disabled = true;
  try {
    if (editandoId) await api.put(`${cfg.ruta}/${editandoId}`, datos);
    else await api.post(cfg.ruta, datos);

    contenedor.querySelector('#modal-catalogo [data-bs-dismiss="modal"]').click();
    contenedor.querySelector(".zona-error").innerHTML =
      `<p class="mensaje-ok" role="status">${editandoId ? "Cambios guardados." : `${cfg.singular[0].toUpperCase()}${cfg.singular.slice(1)} agregado.`}</p>`;
    await recargar();
  } catch (e) {
    zonaError.innerHTML = mensajeError(e.message, { fijo: true });
  } finally {
    boton.disabled = false;
  }
}

async function eliminar(item) {
  const seguro = await confirmar({
    titulo: `Eliminar ${cfg.singular}`,
    mensaje: `¿Seguro que querés eliminar "${item.descripcion}"? Deja de aparecer en los listados, pero se conserva en las incidencias que ya lo usan.`,
  });
  if (!seguro) return;

  try {
    await api.del(`${cfg.ruta}/${item[cfg.campoId]}`);
    contenedor.querySelector(".zona-error").innerHTML = `<p class="mensaje-ok" role="status">"${esc(item.descripcion)}" se eliminó.</p>`;
    await recargar();
  } catch (e) {
    contenedor.querySelector(".zona-error").innerHTML = mensajeError(e.message);
  }
}
