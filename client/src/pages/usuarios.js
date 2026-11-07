import { api } from "../api.js";
import { puedeGestionarUsuarios } from "../permisos.js";
import { leerUsuario } from "../session.js";
import { confirmar } from "../confirmar.js";
import { NOMBRES_ROL, esc, cargando, mensajeError } from "../ui.js";

let contenedor = null;
let esDirector = false;
let usuarios = [];
let areas = [];
let error = "";
let editandoId = null;
let nombres = "";
let apellidos = "";
let nombreUsuario = "";
let contrasenia = "";
let idArea = "";
let rol = "3";
let busqueda = "";

export async function pintar(zona) {
  contenedor = zona;
  esDirector = puedeGestionarUsuarios(leerUsuario());
  usuarios = [];
  areas = [];
  error = "";
  editandoId = null;
  nombres = "";
  apellidos = "";
  nombreUsuario = "";
  contrasenia = "";
  idArea = "";
  rol = "3";
  busqueda = "";

  const opcionesRol = Object.entries(NOMBRES_ROL)
    .map(([valor, etiqueta]) => `<option value="${valor}">${etiqueta}</option>`)
    .join("");

  const formulario = esDirector
    ? `<form class="row g-2 align-items-end mb-4" novalidate>
        <div class="col-12 col-md-3">
          <label class="form-label" for="campo-nombres">Nombre/s:</label>
          <input class="form-control" type="text" id="campo-nombres" maxlength="100" required>
        </div>

        <div class="col-12 col-md-3">
          <label class="form-label" for="campo-apellidos">Apellido/s:</label>
          <input class="form-control" type="text" id="campo-apellidos" maxlength="100" required>
        </div>

        <div class="col-12 col-md-3">
          <label class="form-label" for="campo-usuario">Usuario (correo):</label>
          <input class="form-control" type="email" id="campo-usuario" maxlength="100" placeholder="nombre@correo.com" autocomplete="off" required>
        </div>

        <div class="col-12 col-md-3 zona-contrasenia">
          <label class="form-label" for="campo-contrasenia">Contraseña:</label>
          <input class="form-control" type="password" id="campo-contrasenia" minlength="6" maxlength="100" required>
        </div>

        <div class="col-12 col-md-3">
          <label class="form-label" for="campo-area">Área:</label>
          <select class="form-select" id="campo-area" required>
            <option value="">Elegir área...</option>
          </select>
        </div>

        <div class="col-12 col-md-2">
          <label class="form-label" for="campo-rol">Rol:</label>
          <select class="form-select" id="campo-rol">
            ${opcionesRol}
          </select>
        </div>

        <div class="col-6 col-md-2">
          <button class="btn btn-gim boton-guardar w-100" type="submit">Agregar</button>
        </div>

        <div class="col-6 col-md-2 zona-cancelar" hidden>
          <button class="btn btn-outline-secondary w-100" type="button">Cancelar</button>
        </div>
      </form>`
    : "";

  contenedor.innerHTML = `
    <div class="categorias-container">
      <h2>Usuarios</h2>

      <div class="zona-error"></div>
      ${formulario}

      <div class="buscador">
        <input class="form-control" type="search" placeholder="Buscar usuario..." aria-label="Buscar usuario...">
      </div>

      <div class="tabla-scroll zona-tabla">${cargando("Cargando usuarios...")}</div>
    </div>`;

  if (esDirector) {
    contenedor.querySelector("form").addEventListener("submit", guardar);
    contenedor.querySelector(".zona-cancelar button").addEventListener("click", cancelarEdicion);
  }

  contenedor.querySelector(".buscador input").addEventListener("input", (evento) => {
    busqueda = evento.target.value;
    pintarTabla();
  });

  contenedor.querySelector(".zona-tabla").addEventListener("click", manejarAccion);

  try {
    const [listaUsuarios, listaAreas] = await Promise.all([
      api.get("/usuarios"),
      api.get("/areas"),
    ]);
    usuarios = listaUsuarios;
    areas = listaAreas;
    if (esDirector) llenarSelectArea();
  } catch (e) {
    error = e.message;
  }

  pintarError();
  pintarTabla();
}

function pintarError() {
  contenedor.querySelector(".zona-error").innerHTML = mensajeError(error);
}

function llenarSelectArea() {
  contenedor.querySelector("#campo-area").innerHTML =
    `<option value="">Elegir área...</option>` +
    areas
      .map((area) => `<option value="${area.id_area}">${esc(area.descripcion)}</option>`)
      .join("");
}

function pintarTabla() {
  const visibles = usuarios.filter((item) => {
    const texto = `${item.nombres} ${item.apellidos} ${item.usuario} ${item.area}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  let cuerpo = `<tr><td colspan="${esDirector ? 6 : 5}">No hay usuarios.</td></tr>`;

  if (visibles.length > 0) {
    cuerpo = visibles
      .map(
        (item) => `<tr>
          <td>${item.id_usuario}</td>
          <td>${esc(item.nombres)} ${esc(item.apellidos)}</td>
          <td>${esc(item.usuario)}</td>
          <td>${esc(item.area)}</td>
          <td>${esc(NOMBRES_ROL[item.rol] ?? item.rol)}</td>
          ${
            esDirector
              ? `<td class="celda-acciones">
                  <button type="button" class="btn btn-editar btn-sm" data-accion="editar" data-id="${item.id_usuario}">Editar</button>
                  <button type="button" class="btn btn-eliminar btn-sm" data-accion="eliminar" data-id="${item.id_usuario}">Eliminar</button>
                </td>`
              : ""
          }
        </tr>`
      )
      .join("");
  }

  contenedor.querySelector(".zona-tabla").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Nombre</th>
          <th>Usuario</th>
          <th>Área</th>
          <th>Rol</th>
          ${esDirector ? "<th>Acciones</th>" : ""}
        </tr>
      </thead>
      <tbody>${cuerpo}</tbody>
    </table>`;
}

function manejarAccion(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const item = usuarios.find((u) => u.id_usuario === Number(boton.dataset.id));

  if (boton.dataset.accion === "editar") empezarEdicion(item);
  if (boton.dataset.accion === "eliminar") eliminar(item);
}

function refrescarForm() {
  if (!esDirector) return;

  contenedor.querySelector("#campo-nombres").value = nombres;
  contenedor.querySelector("#campo-apellidos").value = apellidos;
  contenedor.querySelector("#campo-usuario").value = nombreUsuario;
  contenedor.querySelector("#campo-contrasenia").value = contrasenia;
  contenedor.querySelector("#campo-area").value = idArea;
  contenedor.querySelector("#campo-rol").value = rol;
  contenedor.querySelector(".zona-contrasenia").hidden = Boolean(editandoId);
  contenedor.querySelector(".boton-guardar").textContent = editandoId
    ? "Guardar"
    : "Agregar";
  contenedor.querySelector(".zona-cancelar").hidden = !editandoId;
}

async function empezarEdicion(item) {
  error = "";
  pintarError();

  try {
    const detalle = await api.get(`/usuarios/${item.id_usuario}`);
    editandoId = detalle.id_usuario;
    nombres = detalle.nombres;
    apellidos = detalle.apellidos;
    nombreUsuario = detalle.usuario;
    contrasenia = "";
    idArea = String(detalle.id_area);
    rol = String(detalle.rol);
    refrescarForm();
    contenedor.querySelector("form").scrollIntoView({ behavior: "smooth", block: "start" });
    contenedor.querySelector("#campo-nombres").focus();
  } catch (e) {
    error = e.message;
    pintarError();
  }
}

function cancelarEdicion() {
  editandoId = null;
  nombres = "";
  apellidos = "";
  nombreUsuario = "";
  contrasenia = "";
  idArea = "";
  rol = "3";
  error = "";
  pintarError();
  refrescarForm();
}

// La contraseña solo se pide al crear: al editar, su campo está oculto.
function errorDelFormulario() {
  if (!nombres.trim() || !apellidos.trim()) return "Completá el nombre y el apellido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nombreUsuario.trim())) {
    return "El usuario tiene que ser un correo, por ejemplo nombre@correo.com.";
  }
  if (!editandoId && contrasenia.length < 6) return "La contraseña tiene que tener al menos 6 caracteres.";
  if (!idArea) return "Elegí el área.";
  return "";
}

async function guardar(evento) {
  evento.preventDefault();

  nombres = contenedor.querySelector("#campo-nombres").value;
  apellidos = contenedor.querySelector("#campo-apellidos").value;
  nombreUsuario = contenedor.querySelector("#campo-usuario").value;
  contrasenia = contenedor.querySelector("#campo-contrasenia").value;
  idArea = contenedor.querySelector("#campo-area").value;
  rol = contenedor.querySelector("#campo-rol").value;
  error = errorDelFormulario();
  if (error) {
    pintarError();
    return;
  }

  const datos = {
    nombres,
    apellidos,
    usuario: nombreUsuario,
    id_area: Number(idArea),
    rol: Number(rol),
  };

  try {
    if (editandoId) {
      await api.put(`/usuarios/${editandoId}`, datos);
    } else {
      await api.post("/usuarios", { ...datos, contrasenia });
    }
    cancelarEdicion();
    usuarios = await api.get("/usuarios");
    pintarError();
    pintarTabla();
  } catch (e) {
    error = e.message;
    pintarError();
  }
}

async function eliminar(item) {
  const seguro = await confirmar({
    titulo: "Dar de baja al usuario",
    mensaje: `${item.nombres} ${item.apellidos} no va a poder iniciar sesión. Sus incidencias se conservan.`,
    textoBoton: "Dar de baja",
  });
  if (!seguro) return;

  error = "";
  try {
    await api.del(`/usuarios/${item.id_usuario}`);
    usuarios = await api.get("/usuarios");
    error = "";
  } catch (e) {
    error = e.message;
  }
  pintarError();
  pintarTabla();
}
