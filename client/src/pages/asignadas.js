import { api } from "../api.js";
import { leerUsuario } from "../session.js";
import {
  PRIORIDADES,
  esc,
  fechaHora,
  cargando,
  mensajeError,
  badgeEstado,
} from "../ui.js";

let contenedor = null;
let usuario = null;
let incidencias = [];
let error = "";
let finalizandoId = null;
let asignandoId = null;
let usuariosSistemas = [];

export async function pintar(zona) {
  contenedor = zona;
  usuario = leerUsuario();
  incidencias = [];
  error = "";
  finalizandoId = null;
  asignandoId = null;
  usuariosSistemas = [];

  contenedor.innerHTML = `
    <div class="tarjeta-lista">
      <h2>Mis asignadas</h2>

      <div class="zona-error"></div>
      <div class="tabla-scroll zona-lista">${cargando("Cargando incidencias asignadas...")}</div>
    </div>`;

  contenedor.querySelector(".zona-lista").addEventListener("click", manejarAccion);

  await recargar();
}

function pintarError() {
  contenedor.querySelector(".zona-error").innerHTML = mensajeError(error);
}

function encabezado() {
  return `<tr>
    <th>#</th>
    <th>Artículo</th>
    <th>Pedido</th>
    <th>Prioridad</th>
    <th>Estado</th>
    <th>Asignado a</th>
    <th>Creado</th>
    <th>Acciones</th>
  </tr>`;
}

function filaIncidencia(inc) {
  const asignado = inc.asignado_a_nombre
    ? `${esc(inc.asignado_a_nombre)} ${esc(inc.asignado_a_apellido)}`
    : "—";

  let acciones = "";

  if (puedeCancelar(inc)) {
    acciones += `<button type="button" class="btn btn-eliminar btn-sm" data-accion="cancelar" data-id="${inc.id_incidencia}">Cancelar</button>`;
  }

  if (puedeFinalizar(inc)) {
    acciones += `<button type="button" class="btn btn-editar btn-sm" data-accion="abrir-finalizar" data-id="${inc.id_incidencia}">Finalizar</button>`;
  }

  if (puedeAsignar(inc)) {
    acciones += `<button type="button" class="btn btn-asignar btn-sm" data-accion="abrir-asignar" data-id="${inc.id_incidencia}">Asignar</button>`;
  }

  let extra = "";

  if (finalizandoId === inc.id_incidencia) {
    extra += `<tr class="fila-accion">
      <td colspan="8">
        <div class="accion-inline">
          <label for="campo-resolucion">Resolución:</label>
          <input class="form-control" type="text" id="campo-resolucion" maxlength="255" placeholder="Contá qué se hizo">
          <button type="button" class="btn btn-gim btn-sm" data-accion="aceptar-finalizar" data-id="${inc.id_incidencia}">Aceptar</button>
          <button type="button" class="btn btn-outline-secondary btn-sm" data-accion="cerrar-finalizar">Cerrar</button>
        </div>
      </td>
    </tr>`;
  }

  if (asignandoId === inc.id_incidencia) {
    const opciones = usuariosSistemas
      .map(
        (u) => `<option value="${u.id_usuario}">${esc(u.apellidos)}, ${esc(u.nombres)}</option>`
      )
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
          <button type="button" class="btn btn-outline-secondary btn-sm" data-accion="cerrar-asignar">Cerrar</button>
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
  let cuerpo = `<tr><td colspan="8">No hay incidencias asignadas.</td></tr>`;

  if (incidencias.length > 0) {
    cuerpo = incidencias.map(filaIncidencia).join("");
  }

  contenedor.querySelector(".zona-lista").innerHTML = `
    <table>
      <thead>${encabezado()}</thead>
      <tbody>${cuerpo}</tbody>
    </table>`;
}

function puedeCancelar(inc) {
  return inc.id_estado === 1 && usuario.rol === 3;
}

function puedeFinalizar(inc) {
  return inc.id_estado !== 3 && inc.id_estado !== 4;
}

function puedeAsignar(inc) {
  return inc.id_estado !== 3 && inc.id_estado !== 4 && usuario.rol === 3;
}

function manejarAccion(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const accion = boton.dataset.accion;
  const inc = incidencias.find(
    (i) => i.id_incidencia === Number(boton.dataset.id)
  );

  if (accion === "cancelar") cancelar(inc);
  if (accion === "abrir-finalizar") abrirFinalizar(inc);
  if (accion === "cerrar-finalizar") cerrarAcciones();
  if (accion === "aceptar-finalizar") finalizar(inc);
  if (accion === "abrir-asignar") abrirAsignar(inc);
  if (accion === "cerrar-asignar") cerrarAcciones();
  if (accion === "aceptar-asignar") asignar(inc);
}

async function recargar() {
  try {
    incidencias = await api.get("/incidencias/asignadas");
    error = "";
  } catch (e) {
    error = e.message;
  }
  pintarError();
  pintarLista();
}

function cerrarAcciones() {
  finalizandoId = null;
  asignandoId = null;
  pintarLista();
}

async function cancelar(inc) {
  const seguro = window.confirm(
    `¿Cancelar la incidencia #${inc.id_incidencia}?`
  );
  if (!seguro) return;

  error = "";
  try {
    await api.patch(`/incidencias/${inc.id_incidencia}/cancelar`);
    await recargar();
  } catch (e) {
    error = e.message;
    pintarError();
  }
}

function abrirFinalizar(inc) {
  error = "";
  pintarError();
  asignandoId = null;
  finalizandoId = inc.id_incidencia;
  pintarLista();
  contenedor.querySelector("#campo-resolucion")?.focus();
}

async function finalizar(inc) {
  const resolucion = contenedor.querySelector("#campo-resolucion").value;

  if (!resolucion.trim()) {
    error = "Contá cómo se resolvió.";
    pintarError();
    return;
  }

  error = "";
  try {
    await api.patch(`/incidencias/${inc.id_incidencia}/finalizar`, {
      descripcion_resolucion: resolucion,
    });
    finalizandoId = null;
    await recargar();
  } catch (e) {
    error = e.message;
    pintarError();
  }
}

async function abrirAsignar(inc) {
  error = "";
  pintarError();
  finalizandoId = null;
  asignandoId = inc.id_incidencia;

  if (usuariosSistemas.length === 0) {
    try {
      const todos = await api.get("/usuarios");
      usuariosSistemas = todos.filter((u) => u.rol === 2);
    } catch (e) {
      error = e.message;
      pintarError();
    }
  }

  pintarLista();
  contenedor.querySelector("#campo-destino")?.focus();
}

async function asignar(inc) {
  const destino = contenedor.querySelector("#campo-destino").value;

  if (!destino) {
    error = "Elegí un empleado de Sistemas.";
    pintarError();
    return;
  }

  error = "";
  try {
    await api.patch(`/incidencias/${inc.id_incidencia}/asignar`, {
      asignado_a: Number(destino),
    });
    asignandoId = null;
    await recargar();
  } catch (e) {
    error = e.message;
    pintarError();
  }
}
