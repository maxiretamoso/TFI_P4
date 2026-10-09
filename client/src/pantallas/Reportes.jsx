import { useState } from "react";
import { api } from "../api/cliente.js";
import "./Reportes.css";

// Descarga del reporte estadístico en PDF (rol 3, el backend lo verifica).
// Un <a href> no sirve: el endpoint pide el token en el header, y los links
// del navegador no mandan headers. Se usa fetch + blob + descarga en memoria.
function Reportes() {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");

  async function descargar() {
    setDescargando(true);
    setError("");

    try {
      // El backend responde con bytes de PDF, no con JSON
      const blob = await api.descargar("/reportes/incidencias");

      // URL en memoria con el archivo + clic programático = descarga normal
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "reporte-incidencias.pdf";
      enlace.click();

      // Liberamos la memoria de esa URL cuando ya no hace falta
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div className="tarjeta-reporte">
      <h2>Reportes</h2>

      <p>
        Reporte estadístico de incidencias en PDF: totales por estado, por
        prioridad y por área del artículo. Solo el director puede generarlo.
      </p>

      {error && <p className="mensaje-error">{error}</p>}

      <button
        type="button"
        className="boton-descargar"
        onClick={descargar}
        disabled={descargando}
      >
        {descargando ? "Generando..." : "Descargar reporte de incidencias (PDF)"}
      </button>
    </div>
  );
}

export default Reportes;
