import Catalogo from "./Catalogo.jsx";
import Articulos from "./Articulos.jsx";

// Pantalla Catálogos: las tablas de referencia del sistema, una debajo de otra.
// Artículos va primero porque es el BREAD obligatorio de la consigna.
function Catalogos() {
  return (
    <>
      <Articulos />

      <Catalogo
        titulo="Categorías"
        ruta="/categorias"
        campoId="id_categoria"
        placeholderBuscar="Buscar categoría..."
      />

      <Catalogo
        titulo="Áreas"
        ruta="/areas"
        campoId="id_area"
        placeholderBuscar="Buscar área..."
      />

      <Catalogo
        titulo="Estados"
        ruta="/estados"
        campoId="id_estado"
        placeholderBuscar="Buscar estado..."
      />
    </>
  );
}

export default Catalogos;
