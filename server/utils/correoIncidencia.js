import path from "path";

// Los clientes de correo ignoran <style> y CSS moderno: todo va en línea y con tablas.
const LOGO = path.join(import.meta.dirname, "..", "assets", "logo-muni.png");
const CID_LOGO = "logo-municipalidad";
const PRIORIDADES = { 1: "Baja", 2: "Media", 3: "Alta" };

const CIERRES = {
  finalizada: { verbo: "fue resuelta", etiqueta: "Resuelta", fondo: "#e6f0dc", texto: "#3d6326" },
  cancelada: { verbo: "fue cancelada", etiqueta: "Cancelada", fondo: "#fbe3e1", texto: "#a12a22" },
};

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function escapar(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fila(etiqueta, valor) {
  return `<tr>
    <td style="padding:9px 0;border-bottom:1px solid #e6e8e0;color:#6b6f63;width:130px;vertical-align:top">${etiqueta}</td>
    <td style="padding:9px 0;border-bottom:1px solid #e6e8e0;color:#26261f">${valor}</td>
  </tr>`;
}

function armarCorreoDeCierre({ incidencia, estado, resolucion }) {
  const cierre = CIERRES[estado];
  const numero = incidencia.id_incidencia;
  const nombre = escapar(incidencia.creado_por_nombre);

  const filas = [
    fila("Artículo", escapar(incidencia.articulo_descripcion)),
    fila("Pedido", escapar(incidencia.descripcion_pedido)),
    fila("Prioridad", PRIORIDADES[incidencia.prioridad] ?? incidencia.prioridad),
    fila("Creada", formatoFecha.format(new Date(incidencia.creado))),
  ];
  if (incidencia.asignado_a_nombre) {
    filas.push(fila("Responsable", escapar(`${incidencia.asignado_a_nombre} ${incidencia.asignado_a_apellido}`)));
  }
  if (estado === "finalizada" && resolucion) filas.push(fila("Resolución", escapar(resolucion)));

  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8e9e1;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
      <tr>
        <td style="background:#5e8c3a;padding:20px 28px">
          <img src="cid:${CID_LOGO}" alt="Municipalidad de Concordia" height="38" style="display:block;height:38px">
        </td>
      </tr>
      <tr>
        <td style="padding:28px 28px 8px">
          <p style="margin:0 0 6px;font-size:15px;color:#26261f">Hola, ${nombre}:</p>
          <h1 style="margin:0 0 14px;font-size:21px;color:#3d6326">Tu incidencia #${numero} ${cierre.verbo}</h1>
          <span style="display:inline-block;padding:4px 12px;border-radius:12px;background:${cierre.fondo};color:${cierre.texto};font-size:13px;font-weight:bold">${cierre.etiqueta}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 28px 24px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
            ${filas.join("\n")}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;background:#f6f6f0;font-size:12px;color:#6b6f63">
          Gestión de Incidencias Municipales · Área de Sistemas<br>
          Este es un mensaje automático, no hace falta responderlo.
        </td>
      </tr>
    </table>
  </td></tr>
</table>`;

  return {
    asunto: `Tu incidencia #${numero} ${cierre.verbo}`,
    html,
    adjuntos: [{ filename: "logo-muni.png", path: LOGO, cid: CID_LOGO }],
  };
}

export { armarCorreoDeCierre };
