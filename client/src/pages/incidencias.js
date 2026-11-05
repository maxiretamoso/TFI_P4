import { api } from "../api.js";
import { leerUsuario } from "../session.js";
import { PRIORIDADES, ESTADOS, esc, fecha, fechaHora, cargando, mensajeError, badgeEstado, paginacion } from "../ui.js";
import {
  puedeCrearIncidencias,
  puedeCancelar,
  puedeFinalizar,
  puedeAsignar,
  esDirector,
  esDeSistemas,
} from "../permisos.js";

const POR_PAGINA = 10;
const FILTROS_ADMITIDOS = ["estado", "prioridad", "desde", "sin_asignar"];
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

function tituloDeLista() {
  if (esDirector(usuario)) return "Todas las incidencias";
  if (esDeSistemas(usuario)) return "Incidencias asignadas a mí";
  return "Mis incidencias";
}

function descripcionDelFiltro() {
  const partes = [];
  const estados = filtros.get("estado");
  if (estados === `${ESTADOS.PENDIENTE},${ESTADOS.EN_PROCESO}`) {
    partes.push("Abiertas (pendientes o en proceso)");
  } else if (estados) {
    partes.push(estados.split(",").map((id) => NOMBRES_ESTADO_PLURAL[id] ?? id).join(" y "));
  }
  if (filtros.get("prioridad")) partes.push(`prioridad ${PRIORIDADES[filtros.get("prioridad")] ?? ""}`);
  if (filtros.get("sin_asignar")) partes.push("sin asignar");
  if (filtros.get("desde")) partes.push(`creadas desde el ${fecha(filtros.get("desde"))}`);
  return partes.join(" · ");
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
      ${avisoDeFiltro()}
      <div class="zona-error"></div>
      <div class="tabla-scroll zona-lista">${cargando("Cargando incidencias...")}</div>
      <div class="zona-paginacion"></div>
    </div>`;

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
  const asignado = inc.asignado_a_nombre
    ? `${esc(inc.asignado_a_nombre)} ${esc(inc.asignado_a_apellido)}`
    : "—";

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
    <td class="celda-pedido" title="${esc(inc.descripcion_pedido)}">${esc(inc.descripcion_pedido)}</td>
    <td>${esc(PRIORIDADES[inc.prioridad] ?? inc.prioridad)}</td>
    <td>${badgeEstado(inc)}</td>
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
  if (!window.confirm(`¿Cancelar la incidencia #${inc.id_incidencia}?`)) return;

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
