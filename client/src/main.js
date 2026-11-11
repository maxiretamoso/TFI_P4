import "bootstrap/dist/css/bootstrap.min.css";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/styles.css";
import { enrutar } from "./router.js";
import { activarCierreDeAvisos } from "./ui/avisos.js";

activarCierreDeAvisos();

document.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-ruta]");
  if (boton) window.location.hash = boton.dataset.ruta;
});

let tooltipPedido;

function cerrarTooltipPedido() {
  tooltipPedido?.dispose();
  tooltipPedido = undefined;
}

document.addEventListener("pointerover", (evento) => {
  const celda = evento.target.closest(".celda-pedido");
  if (!celda || celda.scrollWidth <= celda.clientWidth) return;

  cerrarTooltipPedido();
  tooltipPedido = new bootstrap.Tooltip(celda, {
    title: celda.textContent,
    customClass: "tooltip-pedido",
    trigger: "manual",
    container: document.body,
  });
  tooltipPedido.show();
});

document.addEventListener("pointerout", cerrarTooltipPedido);
window.addEventListener("scroll", cerrarTooltipPedido, true);
window.addEventListener("resize", cerrarTooltipPedido);
window.addEventListener("hashchange", cerrarTooltipPedido);
window.addEventListener("hashchange", enrutar);

// Las rutas van después del #: localhost:5173/catalogos pasa a localhost:5173/#/catalogos.
if (window.location.pathname !== "/") {
  const ruta = window.location.hash || `#${window.location.pathname.replace(/\/+$/, "")}`;
  history.replaceState(null, "", `/${ruta}`);
}

enrutar();
