import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles.css";
import { enrutar } from "./router.js";
import { activarCierreDeAvisos } from "./avisos.js";

activarCierreDeAvisos();
window.addEventListener("hashchange", enrutar);

enrutar();
