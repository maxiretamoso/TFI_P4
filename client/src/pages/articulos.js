import { api } from "../api.js";
import { esc, cargando, mensajeError } from "../ui.js";

let contenedor = null;
let articulos = [];

export async function pintar(zona) {
  contenedor = zona;
  contenedor.innerHTML = `
    <div class="tarjeta-lista">
      <div class="encabezado-lista">
        <h2>Artículos</h2>
        <a class="btn btn-gim" href="#/nueva">+ Nueva incidencia</a>
      </div>
      <p class="texto-ayuda">Equipos de tu área sobre los que podés reportar una incidencia.</p>
      <input class="form-control buscador" type="search" id="buscar-articulo" placeholder="Buscar por artículo, área o categoría" aria-label="Buscar artículos">
      <div class="tabla-scroll zona-lista">${cargando("Cargando artículos...")}</div>
    </div>`;

  try {
    articulos = await api.get("/articulos");
  } catch (e) {
    contenedor.querySelector(".zona-lista").innerHTML = mensajeError(e.message, { fijo: true });
    return;
  }

  contenedor.querySelector("#buscar-articulo").addEventListener("input", (e) => pintarTabla(e.target.value));
  pintarTabla("");
}

function pintarTabla(texto) {
  const buscado = texto.trim().toLowerCase();
  const filtrados = articulos.filter((a) =>
    [a.descripcion, a.area, a.categoria].some((campo) => campo.toLowerCase().includes(buscado))
  );

  const filas =
    filtrados.length > 0
      ? filtrados
          .map(
            (a) => `<tr>
              <td>${esc(a.descripcion)}</td>
              <td>${esc(a.area)}</td>
              <td>${esc(a.categoria)}</td>
            </tr>`
          )
          .join("")
      : `<tr><td colspan="3">${
          articulos.length === 0
            ? "Todavía no hay artículos cargados en tu área."
            : "No hay artículos que coincidan con la búsqueda."
        }</td></tr>`;

  contenedor.querySelector(".zona-lista").innerHTML = `
    <table>
      <thead><tr><th>Artículo</th><th>Área</th><th>Categoría</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <p class="texto-paginacion">${filtrados.length} de ${articulos.length} artículos</p>`;
}
