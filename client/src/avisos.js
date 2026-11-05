const DURACION_MS = 5000;
const DURACION_SALIDA_MS = 400;
const SELECTOR = ".mensaje-error:not(.mensaje-fijo), .mensaje-ok";

function contenedorFlotante() {
  let contenedor = document.getElementById("avisos-flotantes");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "avisos-flotantes";
    contenedor.className = "avisos-flotantes";
    document.body.appendChild(contenedor);
  }
  return contenedor;
}

function cerrar(aviso) {
  aviso.classList.add("desapareciendo");
  setTimeout(() => aviso.remove(), DURACION_SALIDA_MS);
}

function mostrarFlotante(aviso) {
  if (aviso.dataset.flotante) return;
  aviso.dataset.flotante = "1";
  aviso.title = "Tocá para cerrar";
  aviso.addEventListener("click", () => cerrar(aviso));

  // Se saca del formulario donde lo puso la pantalla para que no mueva el resto.
  contenedorFlotante().appendChild(aviso);

  setTimeout(() => aviso.classList.add("desapareciendo"), DURACION_MS);
  setTimeout(() => aviso.remove(), DURACION_MS + DURACION_SALIDA_MS);
}

export function activarCierreDeAvisos() {
  new MutationObserver((cambios) => {
    for (const cambio of cambios) {
      for (const nodo of cambio.addedNodes) {
        if (!(nodo instanceof HTMLElement)) continue;
        if (nodo.matches(SELECTOR)) mostrarFlotante(nodo);
        nodo.querySelectorAll(SELECTOR).forEach(mostrarFlotante);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}
