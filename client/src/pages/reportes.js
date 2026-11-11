import { REPORTES } from "../../../shared/constantes.js";
import { api } from "../api.js";
import { mensajeError } from "../ui.js";

const OPCIONES = [["", "Todas"], ...Object.entries(REPORTES).map(([valor, config]) => [valor, config.etiqueta])];

let contenedor = null;

export async function pintar(zona) {
  contenedor = zona;

  contenedor.innerHTML = `
    <div class="tarjeta-reporte">
      <h2>Reportes</h2>

      <p>
        Descargá un PDF con el listado de incidencias y un resumen por estado,
        por prioridad y por área. Elegí qué incidencias incluir.
      </p>

      <div class="opciones-reporte" role="radiogroup" aria-label="Incidencias a incluir">
        ${OPCIONES.map(
          ([valor, texto], i) => `<input type="radio" class="btn-check" name="filtro-reporte" id="filtro-${valor || "todas"}" value="${valor}"${i === 0 ? " checked" : ""}>
          <label class="btn opcion-reporte" for="filtro-${valor || "todas"}">${texto}</label>`
        ).join("")}
      </div>

      <div class="zona-error"></div>

      <button class="btn btn-gim" type="button" id="boton-descargar">Descargar reporte</button>
    </div>`;

  contenedor.querySelector("#boton-descargar").addEventListener("click", descargar);
}

async function descargar() {
  const boton = contenedor.querySelector("#boton-descargar");
  const zona = contenedor.querySelector(".zona-error");
  const filtro = contenedor.querySelector("[name=filtro-reporte]:checked").value;

  boton.disabled = true;
  boton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Generando...`;
  zona.innerHTML = "";

  try {
    const blob = await api.descargar(`/reportes/incidencias${filtro ? `?filtro=${filtro}` : ""}`);

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = filtro ? `reporte-incidencias-${filtro}.pdf` : "reporte-incidencias.pdf";
    enlace.click();

    URL.revokeObjectURL(url);
  } catch (e) {
    zona.innerHTML = mensajeError(e.message);
  } finally {
    boton.disabled = false;
    boton.textContent = "Descargar reporte";
  }
}
