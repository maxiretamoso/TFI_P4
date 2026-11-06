import { api } from "../api.js";
import { PRIORIDADES, esc, cargando, mensajeError } from "../ui.js";

let contenedor = null;

export async function pintar(zona) {
  contenedor = zona;

  const opcionesPrioridad = Object.entries(PRIORIDADES)
    .map(([valor, etiqueta]) => `<option value="${valor}">${etiqueta}</option>`)
    .join("");

  contenedor.innerHTML = `
    <div class="tarjeta-lista tarjeta-angosta">
      <h2>Nueva incidencia</h2>
      <p class="texto-ayuda">Contá qué equipo tiene el problema y qué está pasando. El área de Sistemas la recibe y te avisa cuando la resuelva.</p>
      <div class="zona-articulos">${cargando("Cargando artículos...")}</div>
      <form id="form-alta" novalidate hidden>
        <div class="mb-3">
          <label class="form-label" for="articulo">Artículo</label>
          <select class="form-select" id="articulo" required></select>
        </div>
        <div class="mb-3">
          <label class="form-label" for="prioridad">Prioridad</label>
          <select class="form-select" id="prioridad">${opcionesPrioridad}</select>
        </div>
        <div class="mb-3">
          <label class="form-label" for="pedido">Descripción del problema</label>
          <textarea class="form-control" id="pedido" rows="4" maxlength="250" placeholder="Por ejemplo: la impresora no toma las hojas" required></textarea>
        </div>
        <div class="zona-error"></div>
        <div class="d-flex gap-2 justify-content-end">
          <a class="btn btn-outline-secondary" href="#/">Volver</a>
          <button class="btn btn-gim" type="submit" id="boton-crear">Crear incidencia</button>
        </div>
      </form>
    </div>`;

  contenedor.querySelector("#form-alta").addEventListener("submit", crear);

  try {
    const articulos = await api.get("/articulos");
    contenedor.querySelector("#articulo").innerHTML =
      `<option value="">Elegir artículo...</option>` +
      articulos
        .map((a) => `<option value="${a.id_articulo}">${esc(a.descripcion)}</option>`)
        .join("");
    contenedor.querySelector(".zona-articulos").innerHTML = "";
    contenedor.querySelector("#form-alta").hidden = false;
  } catch (e) {
    contenedor.querySelector(".zona-articulos").innerHTML = mensajeError(e.message, { fijo: true });
  }
}

async function crear(evento) {
  evento.preventDefault();

  const zonaError = contenedor.querySelector(".zona-error");
  const idArticulo = contenedor.querySelector("#articulo").value;
  const pedido = contenedor.querySelector("#pedido").value;

  if (!idArticulo || !pedido.trim()) {
    zonaError.innerHTML = mensajeError("Elegí el artículo y describí el problema.");
    return;
  }

  const boton = contenedor.querySelector("#boton-crear");
  zonaError.innerHTML = "";
  boton.disabled = true;
  boton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Creando...`;

  try {
    await api.post("/incidencias", {
      id_articulo: Number(idArticulo),
      prioridad: Number(contenedor.querySelector("#prioridad").value),
      descripcion_pedido: pedido,
    });
    window.location.hash = "#/";
  } catch (e) {
    zonaError.innerHTML = mensajeError(e.message);
    boton.disabled = false;
    boton.textContent = "Crear incidencia";
  }
}
