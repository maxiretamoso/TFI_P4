import { api } from "../api.js";
import { guardarSesion } from "../session.js";
import { mensajeError } from "../ui.js";
import { botonTema, activarBotonTema } from "../tema.js";

let contenedor = null;

export async function pintar(zona) {
  contenedor = zona;

  contenedor.innerHTML = `
    <main class="pantalla-login">
      <section class="login-marca">
        <img src="/logo-muni.png" alt="Municipalidad de Concordia">
        <h1>Gestión de Incidencias Municipales</h1>
      </section>

      <section class="login-formulario">
        <div class="login-tema">${botonTema()}</div>
        <form novalidate>
          <h2>Ingresá a tu cuenta</h2>

          <div class="mb-3">
            <label class="form-label" for="usuario">Usuario</label>
            <input class="form-control" type="text" id="usuario" name="usuario" placeholder="usuario@correo.com" autocomplete="username">
          </div>

          <div class="mb-3">
            <label class="form-label" for="contrasenia">Contraseña</label>
            <input class="form-control" type="password" id="contrasenia" name="contrasenia" placeholder="Contraseña" autocomplete="current-password">
          </div>

          <button class="btn btn-gim w-100" type="submit" id="boton-ingresar">Ingresar</button>
          <div class="zona-error"></div>
        </form>
      </section>
    </main>`;

  activarBotonTema(contenedor);
  contenedor.querySelector("form").addEventListener("submit", manejarEnvio);
  contenedor.querySelector("#usuario").focus();
}

async function manejarEnvio(evento) {
  evento.preventDefault();

  const campoUsuario = contenedor.querySelector("#usuario");
  const campoContrasenia = contenedor.querySelector("#contrasenia");
  const zona = contenedor.querySelector(".zona-error");
  const boton = contenedor.querySelector("#boton-ingresar");

  if (!campoUsuario.value.trim() || !campoContrasenia.value.trim()) {
    zona.innerHTML = mensajeError("Completá usuario y contraseña");
    return;
  }

  zona.innerHTML = "";
  boton.disabled = true;
  boton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Ingresando...`;

  try {
    const datos = await api.post("/auth/login", {
      usuario: campoUsuario.value,
      contrasenia: campoContrasenia.value,
    });
    guardarSesion(datos);
    window.location.hash = "#/";
  } catch (e) {
    zona.innerHTML = mensajeError(e.message);
    boton.disabled = false;
    boton.textContent = "Ingresar";
  }
}
