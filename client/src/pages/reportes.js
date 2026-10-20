import { api } from "../api.js";
import { mensajeError } from "../ui.js";

let contenedor = null;

export async function pintar(zona) {
  contenedor = zona;

  contenedor.innerHTML = `
    <div class="tarjeta-reporte">
      <h2>Reportes</h2>

      <p>
        Reporte estadístico de incidencias en PDF: totales por estado, por
        prioridad y por área del artículo. Solo el director puede generarlo.
      </p>

      <div class="zona-error"></div>

      <button class="btn btn-gim" type="button" id="boton-descargar">
        Descargar reporte de incidencias (PDF)
      </button>
    </div>`;

  contenedor
    .querySelector("#boton-descargar")
    .addEventListener("click", descargar);
}

async function descargar() {
  const boton = contenedor.querySelector("#boton-descargar");
  const zona = contenedor.querySelector(".zona-error");

  boton.disabled = true;
  boton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Generando...`;
  zona.innerHTML = "";

  try {
    const blob = await api.descargar("/reportes/incidencias");

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "reporte-incidencias.pdf";
    enlace.click();

    URL.revokeObjectURL(url);
  } catch (e) {
    zona.innerHTML = mensajeError(e.message);
  } finally {
    boton.disabled = false;
    boton.textContent = "Descargar reporte de incidencias (PDF)";
  }
}
