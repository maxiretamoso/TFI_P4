import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles.css";
import { enrutar } from "./router.js";

window.addEventListener("hashchange", enrutar);

enrutar();
