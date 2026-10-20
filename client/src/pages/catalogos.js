import { api } from "../api.js";
import { leerUsuario } from "../session.js";
import { esc, cargando, mensajeError } from "../ui.js";

export async function pintar(zona) {
  const usuario = leerUsuario();
  const puedeEscribir = usuario.rol >= 2;

  zona.innerHTML = `
    <div class="zona-bloque">${cargando("Cargando artículos...")}</div>
    <div class="zona-bloque">${cargando("Cargando categorías...")}</div>
    <div class="zona-bloque">${cargando("Cargando áreas...")}</div>
    <div class="zona-bloque">${cargando("Cargando estados...")}</div>`;

  const bloques = zona.querySelectorAll(".zona-bloque");

  await Promise.all([
    crearArticulos(bloques[0], puedeEscribir),
    crearCatalogo(bloques[1], {
      titulo: "Categorías",
      ruta: "/categorias",
      campoId: "id_categoria",
      placeholderBuscar: "Buscar categoría...",
      textoVacio: "No hay registros.",
      puedeEscribir,
    }),
    crearCatalogo(bloques[2], {
      titulo: "Áreas",
      ruta: "/areas",
      campoId: "id_area",
      placeholderBuscar: "Buscar área...",
      textoVacio: "No hay registros.",
      puedeEscribir,
    }),
    crearCatalogo(bloques[3], {
      titulo: "Estados",
      ruta: "/estados",
      campoId: "id_estado",
      placeholderBuscar: "Buscar estado...",
      textoVacio: "No hay registros.",
      puedeEscribir,
    }),
  ]);
}

async function crearCatalogo(zona, cfg) {
  let items = [];
  let error = "";
  let editandoId = null;
  let descripcion = "";
  let busqueda = "";

  const formulario = cfg.puedeEscribir
    ? `<form class="row g-2 align-items-end mb-4">
        <div class="col-12 col-md-6">
          <input class="form-control campo-descripcion" type="text" placeholder="${esc(cfg.titulo)}" aria-label="${esc(cfg.titulo)}" maxlength="100" required>
        </div>
        <div class="col-6 col-md-3">
          <button class="btn btn-gim boton-guardar" type="submit">Agregar</button>
        </div>
        <div class="col-6 col-md-3 zona-cancelar" hidden>
          <button class="btn btn-outline-secondary" type="button">Cancelar</button>
        </div>
      </form>`
    : "";

  zona.innerHTML = `
    <div class="categorias-container">
      <h2 class="titulo-bloque">${esc(cfg.titulo)}</h2>

      <div class="zona-error"></div>
      ${formulario}

      <div class="buscador">
        <input class="form-control" type="search" placeholder="${esc(cfg.placeholderBuscar)}" aria-label="${esc(cfg.placeholderBuscar)}">
      </div>

      <div class="tabla-scroll zona-tabla">${cargando(`Cargando ${cfg.titulo.toLowerCase()}...`)}</div>
    </div>`;

  if (cfg.puedeEscribir) {
    zona.querySelector("form").addEventListener("submit", guardar);
    zona.querySelector(".zona-cancelar button").addEventListener("click", cancelarEdicion);
  }

  zona.querySelector(".buscador input").addEventListener("input", (evento) => {
    busqueda = evento.target.value;
    pintarTabla();
  });

  zona.querySelector(".zona-tabla").addEventListener("click", manejarAccion);

  await recargar();

  function pintarError() {
    zona.querySelector(".zona-error").innerHTML = mensajeError(error);
  }

  async function recargar() {
    try {
      items = await api.get(cfg.ruta);
      error = "";
    } catch (e) {
      error = e.message;
    }
    pintarError();
    pintarTabla();
  }

  function pintarTabla() {
    const visibles = items.filter((item) =>
      item.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    );

    let cuerpo = `<tr><td colspan="${cfg.puedeEscribir ? 3 : 2}">${esc(cfg.textoVacio)}</td></tr>`;

    if (visibles.length > 0) {
      cuerpo = visibles
        .map(
          (item) => `<tr>
            <td>${item[cfg.campoId]}</td>
            <td>${esc(item.descripcion)}</td>
            ${
              cfg.puedeEscribir
                ? `<td class="celda-acciones">
                    <button type="button" class="btn btn-editar btn-sm" data-accion="editar" data-id="${item[cfg.campoId]}">Editar</button>
                    <button type="button" class="btn btn-eliminar btn-sm" data-accion="eliminar" data-id="${item[cfg.campoId]}">Eliminar</button>
                  </td>`
                : ""
            }
          </tr>`
        )
        .join("");
    }

    zona.querySelector(".zona-tabla").innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Descripción</th>
            ${cfg.puedeEscribir ? "<th>Acciones</th>" : ""}
          </tr>
        </thead>
        <tbody>${cuerpo}</tbody>
      </table>`;
  }

  function manejarAccion(evento) {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const item = items.find((i) => i[cfg.campoId] === Number(boton.dataset.id));

    if (boton.dataset.accion === "editar") empezarEdicion(item);
    if (boton.dataset.accion === "eliminar") eliminar(item);
  }

  function refrescarForm() {
    if (!cfg.puedeEscribir) return;

    zona.querySelector(".campo-descripcion").value = descripcion;
    zona.querySelector(".boton-guardar").textContent = editandoId
      ? "Guardar"
      : "Agregar";
    zona.querySelector(".zona-cancelar").hidden = !editandoId;
    zona.querySelector(".titulo-bloque").textContent = editandoId
      ? `Editar ${cfg.titulo.toLowerCase()}`
      : cfg.titulo;
  }

  function empezarEdicion(item) {
    error = "";
    pintarError();
    editandoId = item[cfg.campoId];
    descripcion = item.descripcion;
    refrescarForm();
    zona.querySelector(".campo-descripcion").focus();
  }

  function cancelarEdicion() {
    editandoId = null;
    descripcion = "";
    error = "";
    pintarError();
    refrescarForm();
  }

  async function guardar(evento) {
    evento.preventDefault();

    descripcion = zona.querySelector(".campo-descripcion").value;
    error = "";

    try {
      if (editandoId) {
        await api.put(`${cfg.ruta}/${editandoId}`, { descripcion });
      } else {
        await api.post(cfg.ruta, { descripcion });
      }
      cancelarEdicion();
      await recargar();
    } catch (e) {
      error = e.message;
      pintarError();
    }
  }

  async function eliminar(item) {
    const seguro = window.confirm(`¿Eliminar "${item.descripcion}"?`);
    if (!seguro) return;

    error = "";
    try {
      await api.delete(`${cfg.ruta}/${item[cfg.campoId]}`);
      await recargar();
    } catch (e) {
      error = e.message;
      pintarError();
    }
  }
}

async function crearArticulos(zona, puedeEscribir) {
  let articulos = [];
  let areas = [];
  let categorias = [];
  let error = "";
  let editandoId = null;
  let idArea = "";
  let idCategoria = "";
  let descripcion = "";
  let busqueda = "";

  const formulario = puedeEscribir
    ? `<form class="row g-2 align-items-end mb-4">
        <div class="col-12 col-md-4">
          <label class="form-label" for="campo-area">Área:</label>
          <select class="form-select" id="campo-area" required>
            <option value="">Elegir área...</option>
          </select>
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label" for="campo-categoria">Categoría:</label>
          <select class="form-select" id="campo-categoria" required>
            <option value="">Elegir categoría...</option>
          </select>
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label" for="campo-articulo">Artículo:</label>
          <input class="form-control" type="text" id="campo-articulo" placeholder="Nombre del artículo" maxlength="150" required>
        </div>

        <div class="col-6 col-md-2 mt-md-2">
          <button class="btn btn-gim boton-guardar w-100" type="submit">Agregar</button>
        </div>

        <div class="col-6 col-md-2 mt-md-2 zona-cancelar" hidden>
          <button class="btn btn-outline-secondary w-100" type="button">Cancelar</button>
        </div>
      </form>`
    : "";

  zona.innerHTML = `
    <div class="categorias-container">
      <h2 class="titulo-bloque">Artículos</h2>

      <div class="zona-error"></div>
      ${formulario}

      <div class="buscador">
        <input class="form-control" type="search" placeholder="Buscar artículo..." aria-label="Buscar artículo...">
      </div>

      <div class="tabla-scroll zona-tabla">${cargando("Cargando artículos...")}</div>
    </div>`;

  if (puedeEscribir) {
    zona.querySelector("form").addEventListener("submit", guardar);
    zona.querySelector(".zona-cancelar button").addEventListener("click", cancelarEdicion);
  }

  zona.querySelector(".buscador input").addEventListener("input", (evento) => {
    busqueda = evento.target.value;
    pintarTabla();
  });

  zona.querySelector(".zona-tabla").addEventListener("click", manejarAccion);

  try {
    const [listaArticulos, listaAreas, listaCategorias] = await Promise.all([
      api.get("/articulos"),
      api.get("/areas"),
      api.get("/categorias"),
    ]);
    articulos = listaArticulos;
    areas = listaAreas;
    categorias = listaCategorias;
    llenarSelects();
  } catch (e) {
    error = e.message;
  }

  pintarError();
  pintarTabla();

  function pintarError() {
    zona.querySelector(".zona-error").innerHTML = mensajeError(error);
  }

  function llenarSelects() {
    if (!puedeEscribir) return;

    zona.querySelector("#campo-area").innerHTML =
      `<option value="">Elegir área...</option>` +
      areas
        .map((area) => `<option value="${area.id_area}">${esc(area.descripcion)}</option>`)
        .join("");

    zona.querySelector("#campo-categoria").innerHTML =
      `<option value="">Elegir categoría...</option>` +
      categorias
        .map(
          (categoria) =>
            `<option value="${categoria.id_categoria}">${esc(categoria.descripcion)}</option>`
        )
        .join("");
  }

  function pintarTabla() {
    const visibles = articulos.filter((articulo) =>
      articulo.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    );

    let cuerpo = `<tr><td colspan="${puedeEscribir ? 5 : 4}">No hay artículos cargados.</td></tr>`;

    if (visibles.length > 0) {
      cuerpo = visibles
        .map(
          (articulo) => `<tr>
            <td>${articulo.id_articulo}</td>
            <td>${esc(articulo.descripcion)}</td>
            <td>${esc(articulo.area)}</td>
            <td>${esc(articulo.categoria)}</td>
            ${
              puedeEscribir
                ? `<td class="celda-acciones">
                    <button type="button" class="btn btn-editar btn-sm" data-accion="editar" data-id="${articulo.id_articulo}">Editar</button>
                    <button type="button" class="btn btn-eliminar btn-sm" data-accion="eliminar" data-id="${articulo.id_articulo}">Eliminar</button>
                  </td>`
                : ""
            }
          </tr>`
        )
        .join("");
    }

    zona.querySelector(".zona-tabla").innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Artículo</th>
            <th>Área</th>
            <th>Categoría</th>
            ${puedeEscribir ? "<th>Acciones</th>" : ""}
          </tr>
        </thead>
        <tbody>${cuerpo}</tbody>
      </table>`;
  }

  function manejarAccion(evento) {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const articulo = articulos.find(
      (a) => a.id_articulo === Number(boton.dataset.id)
    );

    if (boton.dataset.accion === "editar") empezarEdicion(articulo);
    if (boton.dataset.accion === "eliminar") eliminar(articulo);
  }

  function refrescarForm() {
    if (!puedeEscribir) return;

    zona.querySelector("#campo-area").value = idArea;
    zona.querySelector("#campo-categoria").value = idCategoria;
    zona.querySelector("#campo-articulo").value = descripcion;
    zona.querySelector(".boton-guardar").textContent = editandoId
      ? "Guardar"
      : "Agregar";
    zona.querySelector(".zona-cancelar").hidden = !editandoId;
    zona.querySelector(".titulo-bloque").textContent = editandoId
      ? "Editar artículo"
      : "Artículos";
  }

  function empezarEdicion(articulo) {
    error = "";
    pintarError();
    editandoId = articulo.id_articulo;
    idArea = String(articulo.id_area);
    idCategoria = String(articulo.id_categoria);
    descripcion = articulo.descripcion;
    refrescarForm();
    zona.querySelector("#campo-articulo").focus();
  }

  function cancelarEdicion() {
    editandoId = null;
    idArea = "";
    idCategoria = "";
    descripcion = "";
    error = "";
    pintarError();
    refrescarForm();
  }

  async function guardar(evento) {
    evento.preventDefault();

    idArea = zona.querySelector("#campo-area").value;
    idCategoria = zona.querySelector("#campo-categoria").value;
    descripcion = zona.querySelector("#campo-articulo").value;
    error = "";

    const datos = {
      id_area: Number(idArea),
      id_categoria: Number(idCategoria),
      descripcion,
    };

    try {
      if (editandoId) {
        await api.put(`/articulos/${editandoId}`, datos);
      } else {
        await api.post("/articulos", datos);
      }
      cancelarEdicion();
      try {
        articulos = await api.get("/articulos");
        error = "";
      } catch (e) {
        error = e.message;
      }
      pintarError();
      pintarTabla();
    } catch (e) {
      error = e.message;
      pintarError();
    }
  }

  async function eliminar(articulo) {
    const seguro = window.confirm(`¿Eliminar "${articulo.descripcion}"?`);
    if (!seguro) return;

    error = "";
    try {
      await api.delete(`/articulos/${articulo.id_articulo}`);
      articulos = await api.get("/articulos");
      error = "";
    } catch (e) {
      error = e.message;
    }
    pintarError();
    pintarTabla();
  }
}
