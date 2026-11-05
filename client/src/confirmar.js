import { esc } from "./ui.js";

let resolver = null;

function asegurarVentana() {
  let ventana = document.getElementById("modal-confirmar");
  if (ventana) return ventana;

  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="modal fade" id="modal-confirmar" tabindex="-1" aria-labelledby="titulo-confirmar" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body">
            <h2 class="fs-5 mb-2" id="titulo-confirmar"></h2>
            <p class="mb-0 texto-confirmar"></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger boton-confirmar"></button>
          </div>
        </div>
      </div>
    </div>
    <button type="button" id="abrir-confirmar" data-bs-toggle="modal" data-bs-target="#modal-confirmar" hidden></button>`
  );

  ventana = document.getElementById("modal-confirmar");
  ventana.querySelector(".boton-confirmar").addEventListener("click", () => {
    const responder = resolver;
    resolver = null;
    ventana.querySelector('[data-bs-dismiss="modal"]').click();
    responder?.(true);
  });
  // hide (no hidden): se resuelve al empezar a cerrar, antes de que se pueda abrir otra confirmación.
  ventana.addEventListener("hide.bs.modal", () => {
    resolver?.(false);
    resolver = null;
  });
  return ventana;
}

// Reemplaza a window.confirm con una ventana de Bootstrap; resuelve true si se confirma.
export function confirmar({ titulo, mensaje, textoBoton = "Eliminar" }) {
  const ventana = asegurarVentana();
  ventana.querySelector("#titulo-confirmar").textContent = titulo;
  ventana.querySelector(".texto-confirmar").innerHTML = esc(mensaje);
  ventana.querySelector(".boton-confirmar").textContent = textoBoton;
  document.getElementById("abrir-confirmar").click();
  return new Promise((resolve) => {
    resolver = resolve;
  });
}
