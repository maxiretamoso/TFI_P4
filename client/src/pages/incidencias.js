import { PRIORIDADES, ESTADOS } from "../../../shared/constantes.js";
import { api } from "../api.js";
import { leerUsuario } from "../session.js";
import { confirmar } from "../confirmar.js";
import { esc, fecha, fechaHora, cargando, mensajeError, badgeEstado, paginacion, nombreDelAsignado, POR_PAGINA } from "../ui.js";
import {
  puedeCrearIncidencias,
  puedeCancelar,
  puedeFinalizar,
  puedeAsignar,
  esDirector,
  esDeSistemas,
} from "../permisos.js";

const FILTROS_ADMITIDOS = ["buscar", "estado", "prioridad", "desde", "fecha", "sin_asignar", "area", "categoria", "asignado"];
// Estos vienen solo desde el dashboard; la barra de filtros los conserva al cambiar los demás.
const FILTROS_DEL_DASHBOARD = ["area", "categoria", "asignado", "fecha"];
const CERRADAS = [ESTADOS.RESUELTA, ESTADOS.CANCELADA];
const NOMBRES_ESTADO_PLURAL = {
  [ESTADOS.PENDIENTE]: "Pendientes",
  [ESTADOS.EN_PROCESO]: "En proceso",
  [ESTADOS.RESUELTA]: "Resueltas",
  [ESTADOS.CANCELADA]: "Canceladas",
};

let contenedor = null;
let usuario = null;
let incidencias = [];
let paginado = { pagina: 1, paginas: 1, total: 0, limite: POR_PAGINA };
let empleadosDeSistemas = [];
let error = "";
let finalizandoId = null;
let asignandoId = null;
let filtros = new URLSearchParams();
// Texto legible de los filtros por id (área, categoría, responsable), que llega en la URL.
let etiqueta = "";

function tituloDeLista() {
  if (esDirector(usuario)) return "Todas las incidencias";
  if (esDeSistemas(usuario)) return "Incidencias asignadas a mí";
  return "Mis incidencias";
}

function descripcionDelFiltro() {
  const partes = [];
  if (filtros.get("buscar")) partes.push(`"${filtros.get("buscar")}"`);
  if (filtros.get("estado")) partes.push(nombreDeEstados(filtros.get("estado")));
  if (filtros.get("prioridad")) partes.push(`prioridad ${PRIORIDADES[filtros.get("prioridad")] ?? ""}`);
  if (filtros.get("sin_asignar")) partes.push("sin asignar");
  if (filtros.get("desde")) partes.push(`creadas desde el ${fecha(filtros.get("desde"))}`);
  if (filtros.get("fecha")) partes.push(`creadas el ${fecha(filtros.get("fecha"))}`);
  if (etiqueta) partes.push(etiqueta);
  return partes.join(" · ");
}

function nombreDeEstados(valor) {
  return valor
    .split(",")
    .map((id, i) => {
      const nombre = NOMBRES_ESTADO_PLURAL[id] ?? id;
      return i === 0 ? nombre : nombre.toLowerCase();
    })
    .join(" y ");
}

// Si el filtro trae una combinación que no está entre las opciones (por ejemplo desde
// un enlace), se muestra mientras esté aplicada y se quita al elegir otra.
function opcionesDeEstado(estado) {
  const fijas = Object.entries(NOMBRES_ESTADO_PLURAL);

  const temporal =
    estado && !fijas.some(([valor]) => valor === estado)
      ? `<option value="${esc(estado)}" data-temporal selected>${esc(nombreDeEstados(estado))}</option>`
      : "";
  return opcion("", "Todos los estados", estado) + temporal + fijas.map(([valor, texto]) => opcion(valor, texto, estado)).join("");
}

function opcion(valor, texto, actual) {
  return `<option value="${valor}"${String(actual ?? "") === String(valor) ? " selected" : ""}>${texto}</option>`;
}

function barraDeFiltros() {
  const estado = filtros.get("estado");
  const prioridad = filtros.get("prioridad");
  return `<form class="barra-filtros" id="form-filtros" role="search">
    <input class="form-control" type="search" name="buscar" placeholder="Buscar por pedido o artículo" aria-label="Buscar por pedido o artículo" value="${esc(filtros.get("buscar") ?? "")}">
    <select class="form-select" name="estado" aria-label="Filtrar por estado">
      ${opcionesDeEstado(estado)}
    </select>
    <select class="form-select" name="prioridad" aria-label="Filtrar por prioridad">
      ${opcion("", "Todas las prioridades", prioridad)}
      ${[3, 2, 1].map((p) => opcion(p, PRIORIDADES[p], prioridad)).join("")}
    </select>
    <label class="filtro-fecha">
      <span>Desde</span>
      <input class="form-control" type="date" name="desde" value="${esc(filtros.get("desde") ?? "")}">
    </label>
    ${
      esDirector(usuario)
        ? `<label class="form-check filtro-check">
            <input class="form-check-input" type="checkbox" name="sin_asignar" value="true"${filtros.get("sin_asignar") ? " checked" : ""}>
            <span class="form-check-label">Sin asignar</span>
          </label>`
        : ""
    }
  </form>`;
}

function aplicarFiltros(evento) {
  evento?.preventDefault();
  const formulario = contenedor.querySelector("#form-filtros");
  formulario.querySelector("option[data-temporal]:not(:checked)")?.remove();
  const desde = formulario.querySelector('[name="desde"]');
  if (desde.value && desde.min && desde.value < desde.min) desde.value = desde.min;
  const nuevos = new URLSearchParams();
  for (const [clave, valor] of new FormData(formulario)) {
    if (valor.trim()) nuevos.set(clave, valor.trim());
  }
  FILTROS_DEL_DASHBOARD.forEach((clave) => {
    if (filtros.get(clave)) nuevos.set(clave, filtros.get(clave));
  });
  if (!FILTROS_DEL_DASHBOARD.some((clave) => nuevos.get(clave))) etiqueta = "";

  // Se actualiza solo la lista (no toda la pantalla) para no perder el foco del buscador.
  filtros = nuevos;
  const enUrl = new URLSearchParams(nuevos);
  if (etiqueta) enUrl.set("etiqueta", etiqueta);
  history.replaceState(null, "", enUrl.toString() ? `#/?${enUrl}` : "#/");
  contenedor.querySelector(".zona-aviso-filtro").innerHTML = avisoDeFiltro();
  recargar(1);
}

function avisoDeFiltro() {
  if ([...filtros.keys()].length === 0) return "";
  return `<div class="filtro-activo">
    <span>Filtrando: <strong>${esc(descripcionDelFiltro())}</strong></span>
    <a href="#/">Quitar filtro</a>
  </div>`;
}

export async function pintar(zona, parametros = new URLSearchParams()) {
  contenedor = zona;
  filtros = new URLSearchParams(
    [...parametros].filter(([clave]) => FILTROS_ADMITIDOS.includes(clave))
  );
  etiqueta = parametros.get("etiqueta") ?? "";
  usuario = leerUsuario();
  incidencias = [];
  paginado = { pagina: 1, paginas: 1, total: 0, limite: POR_PAGINA };
  empleadosDeSistemas = [];
  error = "";
  finalizandoId = null;
  asignandoId = null;

  contenedor.innerHTML = `
    <div class="tarjeta-lista">
      <div class="encabezado-lista">
        <h2>${tituloDeLista()}</h2>
        ${puedeCrearIncidencias(usuario) ? '<a class="btn btn-gim" href="#/nueva">+ Nueva incidencia</a>' : ""}
      </div>
      ${barraDeFiltros()}
      <div class="zona-aviso-filtro">${avisoDeFiltro()}</div>
      <div class="zona-error"></div>
      <div class="tabla-scroll zona-lista">${cargando("Cargando incidencias...")}</div>
      <div class="zona-paginacion"></div>
    </div>`;

  const formulario = contenedor.querySelector("#form-filtros");
  formulario.addEventListener("submit", aplicarFiltros);
  formulario.querySelectorAll("select, input[type=date], input[type=checkbox]").forEach((campo) =>
    campo.addEventListener("change", () => aplicarFiltros())
  );
  let espera = null;
  formulario.querySelector("[name=buscar]").addEventListener("input", () => {
    clearTimeout(espera);
    espera = setTimeout(aplicarFiltros, 300);
  });
  contenedor.querySelector(".zona-lista").addEventListener("click", manejarAccion);
  contenedor.querySelector(".zona-paginacion").addEventListener("click", cambiarPagina);

  await cargarDatos();
  pintarError();
  pintarLista();
}

function pedirIncidencias(pagina) {
  const consulta = new URLSearchParams(filtros);
  consulta.set("pagina", pagina);
  consulta.set("limite", POR_PAGINA);
  return api.get(`/incidencias?${consulta}`);
}

function guardarPagina(respuesta) {
  const { items, ...resto } = respuesta;
  incidencias = items;
  paginado = resto;
  limitarFechaDesde();
}

// "Desde" no deja elegir años anteriores a la incidencia más vieja que ve el usuario.
function limitarFechaDesde() {
  const campo = contenedor.querySelector('#form-filtros [name="desde"]');
  if (campo && paginado.primer_anio) campo.min = `${paginado.primer_anio}-01-01`;
}

async function cargarDatos() {
  try {
    const pedidos = [pedirIncidencias(1)];
    if (esDirector(usuario)) pedidos.push(api.get("/usuarios?rol=sistemas"));

    const respuestas = await Promise.all(pedidos);
    guardarPagina(respuestas[0]);

    if (esDirector(usuario)) {
      empleadosDeSistemas = respuestas[1];
    }
    error = "";
  } catch (e) {
    error = e.message;
  }
}

function pintarError() {
  contenedor.querySelector(".zona-error").innerHTML = mensajeError(error);
}

function filaIncidencia(inc) {
  const asignado = nombreDelAsignado(inc.asignado_a_nombre, inc.asignado_a_apellido);

  let acciones = "";
  if (puedeCancelar(usuario, inc)) {
    acciones += `<button type="button" class="btn btn-eliminar btn-sm" data-accion="cancelar" data-id="${inc.id_incidencia}">Cancelar</button>`;
  }
  if (puedeFinalizar(usuario, inc)) {
    acciones += `<button type="button" class="btn btn-editar btn-sm" data-accion="abrir-finalizar" data-id="${inc.id_incidencia}">Finalizar</button>`;
  }
  if (puedeAsignar(usuario, inc)) {
    acciones += `<button type="button" class="btn btn-asignar btn-sm" data-accion="abrir-asignar" data-id="${inc.id_incidencia}">Asignar</button>`;
  }

  let extra = "";

  if (finalizandoId === inc.id_incidencia) {
    extra += `<tr class="fila-accion">
      <td colspan="8">
        <div class="accion-inline">
          <label for="campo-resolucion">Resolución:</label>
          <input class="form-control" type="text" id="campo-resolucion" maxlength="250" placeholder="Contá qué se hizo">
          <button type="button" class="btn btn-gim btn-sm" data-accion="aceptar-finalizar" data-id="${inc.id_incidencia}">Aceptar</button>
          <button type="button" class="btn btn-outline-secondary btn-sm" data-accion="cerrar">Cerrar</button>
        </div>
      </td>
    </tr>`;
  }

  if (asignandoId === inc.id_incidencia) {
    const opciones = empleadosDeSistemas
      .map((u) => `<option value="${u.id_usuario}">${esc(u.apellidos)}, ${esc(u.nombres)}</option>`)
      .join("");

    extra += `<tr class="fila-accion">
      <td colspan="8">
        <div class="accion-inline">
          <label for="campo-destino">Asignar a:</label>
          <select class="form-select" id="campo-destino">
            <option value="">Elegir empleado de Sistemas...</option>
            ${opciones}
          </select>
          <button type="button" class="btn btn-gim btn-sm" data-accion="aceptar-asignar" data-id="${inc.id_incidencia}">Aceptar</button>
          <button type="button" class="btn btn-outline-secondary btn-sm" data-accion="cerrar">Cerrar</button>
        </div>
      </td>
    </tr>`;
  }

  return `<tr>
    <td>${inc.id_incidencia}</td>
    <td>${esc(inc.articulo_descripcion)}</td>
    <td class="celda-pedido">${esc(inc.descripcion_pedido)}</td>
    <td>${esc(PRIORIDADES[inc.prioridad] ?? inc.prioridad)}</td>
    <td>${badgeEstado(inc)}${
      CERRADAS.includes(inc.id_estado) && inc.fecha_estado
        ? `<span class="fecha-cierre">el ${fechaHora(inc.fecha_estado)}</span>`
        : ""
    }</td>
    <td>${asignado}</td>
    <td>${fechaHora(inc.creado)}</td>
    <td class="celda-acciones">${acciones}</td>
  </tr>${extra}`;
}

function pintarLista() {
  const cuerpo =
    incidencias.length > 0
      ? incidencias.map(filaIncidencia).join("")
      : `<tr><td colspan="8">${
          [...filtros.keys()].length ? "No hay incidencias con este filtro." : "No hay incidencias para mostrar."
        }</td></tr>`;

  contenedor.querySelector(".zona-lista").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Artículo</th><th>Pedido</th><th>Prioridad</th>
          <th>Estado</th><th>Asignado a</th><th>Creado</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>${cuerpo}</tbody>
    </table>`;
  contenedor.querySelector(".zona-paginacion").innerHTML = paginacion(paginado);
}

async function cambiarPagina(evento) {
  const boton = evento.target.closest("button[data-pagina]");
  if (!boton || boton.disabled) return;

  finalizandoId = null;
  asignandoId = null;
  await recargar(Number(boton.dataset.pagina));
  contenedor.querySelector("h2:last-of-type")?.scrollIntoView({ block: "start" });
}

const ACCIONES_CON_ESPERA = {
  cancelar,
  "aceptar-finalizar": finalizar,
  "aceptar-asignar": asignar,
};

async function manejarAccion(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton || boton.disabled) return;

  const accion = boton.dataset.accion;
  const inc = incidencias.find((i) => i.id_incidencia === Number(boton.dataset.id));

  if (accion === "abrir-finalizar") abrirPanel("finalizar", inc);
  if (accion === "abrir-asignar") abrirPanel("asignar", inc);
  if (accion === "cerrar") cerrarPaneles();

  const ejecutar = ACCIONES_CON_ESPERA[accion];
  if (!ejecutar) return;

  const texto = boton.textContent;
  boton.disabled = true;
  boton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> ${texto}`;
  await ejecutar(inc);
  if (boton.isConnected) {
    boton.disabled = false;
    boton.textContent = texto;
  }
}

function abrirPanel(cual, inc) {
  error = "";
  pintarError();
  finalizandoId = cual === "finalizar" ? inc.id_incidencia : null;
  asignandoId = cual === "asignar" ? inc.id_incidencia : null;
  pintarLista();
  contenedor.querySelector(cual === "finalizar" ? "#campo-resolucion" : "#campo-destino")?.focus();
}

function cerrarPaneles() {
  finalizandoId = null;
  asignandoId = null;
  pintarLista();
}

async function recargar(pagina = paginado.pagina) {
  try {
    let respuesta = await pedirIncidencias(pagina);
    if (respuesta.items.length === 0 && respuesta.pagina > 1) {
      respuesta = await pedirIncidencias(respuesta.paginas);
    }
    guardarPagina(respuesta);
    error = "";
  } catch (e) {
    error = e.message;
  }
  pintarError();
  pintarLista();
}

async function cancelar(inc) {
  const seguro = await confirmar({
    titulo: `Cancelar la incidencia #${inc.id_incidencia}`,
    mensaje: `"${inc.descripcion_pedido}" va a quedar cancelada y se le avisa por correo a quien la creó.`,
    textoBoton: "Cancelar incidencia",
    textoVolver: "Volver",
  });
  if (!seguro) return;

  try {
    await api.patch(`/incidencias/${inc.id_incidencia}/cancelacion`);
    await recargar();
  } catch (e) {
    error = e.message;
    pintarError();
  }
}

async function finalizar(inc) {
  const resolucion = contenedor.querySelector("#campo-resolucion").value;

  if (!resolucion.trim()) {
    error = "Contá cómo se resolvió.";
    pintarError();
    return;
  }

  try {
    await api.patch(`/incidencias/${inc.id_incidencia}/resolucion`, {
      descripcion_resolucion: resolucion,
    });
    finalizandoId = null;
    await recargar();
  } catch (e) {
    error = e.message;
    pintarError();
  }
}

async function asignar(inc) {
  const destino = contenedor.querySelector("#campo-destino").value;

  if (!destino) {
    error = "Elegí un empleado de Sistemas.";
    pintarError();
    return;
  }

  try {
    await api.patch(`/incidencias/${inc.id_incidencia}/asignacion`, {
      asignado_a: Number(destino),
    });
    asignandoId = null;
    await recargar();
  } catch (e) {
    error = e.message;
    pintarError();
  }
}
