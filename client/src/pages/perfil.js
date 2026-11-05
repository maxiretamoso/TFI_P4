import { api } from "../api.js";
import { leerUsuario, actualizarUsuarioGuardado } from "../session.js";
import { NOMBRES_ROL, esc, cargando, mensajeError } from "../ui.js";

const URL_SERVIDOR = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(
  /\/api\/v1\/?$/,
  ""
);

let contenedor = null;
let perfil = null;

function urlDelAvatar(nombreArchivo) {
  return nombreArchivo ? `${URL_SERVIDOR}/publico/avatares/${nombreArchivo}` : "";
}

export async function pintar(zona) {
  contenedor = zona;
  contenedor.innerHTML = `<div class="tarjeta-lista">${cargando("Cargando perfil...")}</div>`;

  try {
    perfil = await api.get("/me");
  } catch (e) {
    contenedor.innerHTML = `<div class="tarjeta-lista">${mensajeError(e.message)}</div>`;
    return;
  }

  const avatar = urlDelAvatar(perfil.avatar);

  contenedor.innerHTML = `
    <div class="tarjeta-lista">
      <h2>Mi perfil</h2>

      <div class="perfil-datos">
        <img class="perfil-avatar" id="vista-avatar"
             src="${avatar || ""}"
             alt="Foto de perfil de ${esc(perfil.nombres)} ${esc(perfil.apellidos)}"
             ${avatar ? "" : 'style="display:none"'}>
        <dl>
          <dt>Nombre</dt><dd>${esc(perfil.nombres)} ${esc(perfil.apellidos)}</dd>
          <dt>Usuario</dt><dd>${esc(perfil.usuario)}</dd>
          <dt>Área</dt><dd>${esc(perfil.area)}</dd>
          <dt>Rol</dt><dd>${esc(NOMBRES_ROL[perfil.rol] ?? perfil.rol)}</dd>
        </dl>
      </div>

      <h3>Cambiar la foto de perfil</h3>
      <form class="row g-2 align-items-end" id="form-avatar">
        <div class="col-12 col-md-8">
          <label class="form-label" for="campo-avatar">Imagen (jpg, png o webp, hasta 2 MB):</label>
          <input class="form-control" type="file" id="campo-avatar" accept="image/jpeg,image/png,image/webp" required>
        </div>
        <div class="col-12 col-md-4">
          <button class="btn btn-gim w-100" type="submit" id="boton-avatar">Subir foto</button>
        </div>
        <div class="col-12"><div class="zona-avatar"></div></div>
      </form>

      <h3>Cambiar la contraseña</h3>
      <form class="row g-2 align-items-end" id="form-contrasenia">
        <div class="col-12 col-md-4">
          <label class="form-label" for="campo-actual">Contraseña actual:</label>
          <input class="form-control" type="password" id="campo-actual" autocomplete="current-password" required>
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label" for="campo-nueva">Contraseña nueva:</label>
          <input class="form-control" type="password" id="campo-nueva" minlength="6" maxlength="100" autocomplete="new-password" required>
        </div>
        <div class="col-12 col-md-4">
          <button class="btn btn-gim w-100" type="submit" id="boton-contrasenia">Cambiar</button>
        </div>
        <div class="col-12"><div class="zona-contrasenia"></div></div>
      </form>
    </div>`;

  contenedor.querySelector("#form-avatar").addEventListener("submit", subirAvatar);
  contenedor.querySelector("#form-contrasenia").addEventListener("submit", cambiarContrasenia);
}

function avisar(selector, texto, esError) {
  contenedor.querySelector(selector).innerHTML = esError
    ? mensajeError(texto)
    : `<p class="mensaje-ok" role="status">${esc(texto)}</p>`;
}

async function subirAvatar(evento) {
  evento.preventDefault();

  const campo = contenedor.querySelector("#campo-avatar");
  const boton = contenedor.querySelector("#boton-avatar");

  if (!campo.files[0]) {
    avisar(".zona-avatar", "Elegí una imagen.", true);
    return;
  }

  const datos = new FormData();
  datos.append("avatar", campo.files[0]);

  boton.disabled = true;
  try {
    const actualizado = await api.patch(`/usuarios/${perfil.id_usuario}/avatar`, datos);
    perfil.avatar = actualizado.avatar;
    actualizarUsuarioGuardado({ avatar: actualizado.avatar });

    const vista = contenedor.querySelector("#vista-avatar");
    vista.src = `${urlDelAvatar(actualizado.avatar)}?t=${Date.now()}`;
    vista.style.display = "";
    campo.value = "";
    avisar(".zona-avatar", "Foto actualizada.", false);
  } catch (e) {
    avisar(".zona-avatar", e.message, true);
  } finally {
    boton.disabled = false;
  }
}

async function cambiarContrasenia(evento) {
  evento.preventDefault();

  const actual = contenedor.querySelector("#campo-actual");
  const nueva = contenedor.querySelector("#campo-nueva");
  const boton = contenedor.querySelector("#boton-contrasenia");

  boton.disabled = true;
  try {
    await api.patch("/auth/contrasenia", {
      contrasenia_actual: actual.value,
      contrasenia_nueva: nueva.value,
    });
    actual.value = "";
    nueva.value = "";
    avisar(".zona-contrasenia", "Contraseña actualizada.", false);
  } catch (e) {
    avisar(".zona-contrasenia", e.message, true);
  } finally {
    boton.disabled = false;
  }
}
