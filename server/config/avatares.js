const CARPETA_PREDEFINIDOS = "predefinidos";

const AVATARES_PREDEFINIDOS = Object.freeze(
  Array.from({ length: 12 }, (_, i) => `caricatura-${String(i + 1).padStart(2, "0")}`)
);

function archivoDelPredefinido(id) {
  return `${CARPETA_PREDEFINIDOS}/${id}.svg`;
}

function esPredefinido(archivo) {
  return Boolean(archivo) && archivo.startsWith(`${CARPETA_PREDEFINIDOS}/`);
}

module.exports = { AVATARES_PREDEFINIDOS, archivoDelPredefinido, esPredefinido };
