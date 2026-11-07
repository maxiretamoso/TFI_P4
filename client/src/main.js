import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles.css";
import { enrutar } from "./router.js";
import { activarCierreDeAvisos } from "./avisos.js";
import { activarAyudas } from "./ayudas.js";

activarCierreDeAvisos();
activarAyudas();
window.addEventListener("hashchange", enrutar);

// Las rutas van después del #: localhost:5173/catalogos pasa a localhost:5173/#/catalogos.
if (window.location.pathname !== "/") {
  const ruta = window.location.hash || `#${window.location.pathname.replace(/\/+$/, "")}`;
  history.replaceState(null, "", `/${ruta}`);
}

enrutar();
