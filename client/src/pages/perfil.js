import { api } from "../api.js";
import { leerUsuario, actualizarUsuarioGuardado } from "../session.js";
import { NOMBRES_ROL, esc, cargando, mensajeError, urlDelAvatar, avatarHtml } from "../ui.js";

let contenedor = null;
let perfil = null;
let predefinidos = [];

export async function pintar(zona) {
  contenedor = zona;
  contenedor.innerHTML = `<div class="tarjeta-lista">${cargando("Cargando perfil...")}</div>`;

  try {
    [perfil, predefinidos] = await Promise.all([api.get("/me"), api.get("/avatares")]);
  } catch (e) {
    contenedor.innerHTML = `<div class="tarjeta-lista">${mensajeError(e.message)}</div>`;
    return;
  }

  contenedor.innerHTML = `
    <div class="tarjeta-lista">
      <h2>Mi perfil</h2>

      <div class="perfil-datos">
        <div class="zona-vista-avatar">${avatarHtml(perfil, "perfil-avatar")}</div>
        <dl>
          <dt>Nombre</dt><dd>${esc(perfil.nombres)} ${esc(perfil.apellidos)}</dd>
          <dt>Usuario</dt><dd>${esc(perfil.usuario)}</dd>
          <dt>Área</dt><dd>${esc(perfil.area)}</dd>
          <dt>Rol</dt><dd>${esc(NOMBRES_ROL[perfil.rol] ?? perfil.rol)}</dd>
        </dl>
      </div>

      <h3>Elegí un avatar</h3>
      <div class="grilla-avatares" role="group" aria-label="Avatares disponibles">${botonesDeAvatares()}</div>
      <div class="zona-predefinido"></div>

      <h3>O subí una foto propia</h3>
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
  contenedor.querySelector(".grilla-avatares").addEventListener("click", elegirPredefinido);
  contenedor.querySelector("#form-contrasenia").addEventListener("submit", cambiarContrasenia);
}

function botonesDeAvatares() {
  return predefinidos
    .map((p, i) => {
      const elegido = p.avatar === perfil.avatar;
      return `<button type="button" class="opcion-avatar${elegido ? " elegido" : ""}" data-predefinido="${esc(p.id)}"
        aria-pressed="${elegido}" aria-label="Avatar ${i + 1}">
        <img src="${urlDelAvatar(p.avatar)}" alt="">
      </button>`;
    })
    .join("");
}

function mostrarAvatar(archivo) {
  perfil.avatar = archivo;
  actualizarUsuarioGuardado({ avatar: archivo });
  contenedor.querySelector(".zona-vista-avatar").innerHTML = avatarHtml(perfil, "perfil-avatar");
  contenedor.querySelector(".grilla-avatares").innerHTML = botonesDeAvatares();
  const enLaBarra = document.querySelector(".barra-superior .avatar");
  if (enLaBarra) enLaBarra.outerHTML = avatarHtml(perfil, "avatar-barra");
}

async function elegirPredefinido(evento) {
  const boton = evento.target.closest("button[data-predefinido]");
  if (!boton || boton.classList.contains("elegido")) return;

  contenedor.querySelectorAll(".opcion-avatar").forEach((b) => (b.disabled = true));
  try {
    const actualizado = await api.patch(`/usuarios/${perfil.id_usuario}/avatar`, {
      predefinido: boton.dataset.predefinido,
    });
    mostrarAvatar(actualizado.avatar);
    avisar(".zona-predefinido", "Avatar actualizado.", false);
  } catch (e) {
    contenedor.querySelectorAll(".opcion-avatar").forEach((b) => (b.disabled = false));
    avisar(".zona-predefinido", e.message, true);
  }
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
    mostrarAvatar(actualizado.avatar);
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
