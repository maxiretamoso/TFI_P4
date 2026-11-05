const path = require("path");
const PDFDocument = require("pdfkit");
const { ESTADOS } = require("../config/estados");

const LOGO = path.join(__dirname, "..", "assets", "logo-muni.png");

const COLOR = {
  verde: "#5e8c3a",
  verdeOscuro: "#3d6326",
  verdeSuave: "#e8efe1",
  texto: "#26261f",
  textoSuave: "#6b6f63",
  borde: "#d6d7cc",
  fila: "#f6f6f0",
};

const COLOR_ESTADO = {
  [ESTADOS.PENDIENTE]: "#d98e04",
  [ESTADOS.EN_PROCESO]: "#3a7bd5",
  [ESTADOS.RESUELTA]: "#5e8c3a",
  [ESTADOS.CANCELADA]: "#d64541",
};

const PRIORIDADES = { 1: "Baja", 2: "Media", 3: "Alta" };

// Hora de Argentina en 24 h, sin segundos, sin depender de la zona del servidor.
const FORMATO_FECHA = { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "numeric" };
const formatoFecha = new Intl.DateTimeFormat("es-AR", FORMATO_FECHA);
const formatoFechaHora = new Intl.DateTimeFormat("es-AR", {
  ...FORMATO_FECHA,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const MARGEN = 45;
const ALTO_FILA = 24;
const SEPARACION_COLUMNAS = 24;

function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

function anchoUtil(doc) {
  return doc.page.width - MARGEN * 2;
}

function encabezado(doc) {
  const ancho = doc.page.width;
  doc.rect(0, 0, ancho, 96).fill(COLOR.verde);
  doc.image(LOGO, MARGEN, 26, { height: 44 });

  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20)
    .text("Reporte de incidencias", 0, 30, { width: ancho - MARGEN, align: "right" });
  doc.font("Helvetica").fontSize(9.5)
    .text("Gestión de Incidencias Municipales", 0, 56, { width: ancho - MARGEN, align: "right" })
    .text(`Generado el ${formatoFechaHora.format(new Date())}`, 0, 70, { width: ancho - MARGEN, align: "right" });

  doc.y = 96;
}

// Título de sección en verde con una línea fina debajo. "espacioAntes" separa del bloque anterior.
function titulo(doc, texto, { x = MARGEN, ancho = anchoUtil(doc), tamanio = 13, espacioAntes = 30 } = {}) {
  asegurarEspacio(doc, espacioAntes + 90);
  const y = doc.y + espacioAntes;
  doc.fillColor(COLOR.verdeOscuro).font("Helvetica-Bold").fontSize(tamanio).text(texto, x, y, { width: ancho });
  const linea = y + tamanio + 6;
  doc.moveTo(x, linea).lineTo(x + ancho, linea).lineWidth(0.75).stroke(COLOR.borde);
  doc.y = linea + 10;
}

function asegurarEspacio(doc, alto) {
  if (doc.y + alto > doc.page.height - MARGEN - 20) {
    doc.addPage();
    doc.y = MARGEN;
  }
}

// Dibuja una tabla con encabezado verde y filas alternadas; si no entra, sigue en otra página
// repitiendo el encabezado. Cada columna puede dibujar su celda a mano con "dibujar".
function tabla(doc, columnas, filas, { x: xTabla = MARGEN, ancho: anchoTotal = anchoUtil(doc) } = {}) {
  const anchos = columnas.map((c) => c.ancho * anchoTotal);

  const dibujarEncabezado = () => {
    const y = doc.y;
    doc.rect(xTabla, y, anchoTotal, ALTO_FILA).fill(COLOR.verdeSuave);
    let x = xTabla;
    columnas.forEach((c, i) => {
      doc.fillColor(COLOR.verdeOscuro).font("Helvetica-Bold").fontSize(9)
        .text(c.titulo, x + 8, y + 8, { width: anchos[i] - 16, align: c.alinear ?? "left", height: 11, ellipsis: true });
      x += anchos[i];
    });
    doc.y = y + ALTO_FILA;
  };

  dibujarEncabezado();

  if (filas.length === 0) {
    doc.fillColor(COLOR.textoSuave).font("Helvetica").fontSize(9).text("Sin datos.", xTabla + 8, doc.y + 8);
    doc.y += ALTO_FILA;
    return;
  }

  filas.forEach((fila, indice) => {
    if (doc.y + ALTO_FILA > doc.page.height - MARGEN - 20) {
      doc.addPage();
      doc.y = MARGEN;
      dibujarEncabezado();
    }
    const y = doc.y;
    if (indice % 2 === 1) doc.rect(xTabla, y, anchoTotal, ALTO_FILA).fill(COLOR.fila);
    doc.moveTo(xTabla, y + ALTO_FILA).lineTo(xTabla + anchoTotal, y + ALTO_FILA).lineWidth(0.5).stroke(COLOR.borde);

    let x = xTabla;
    columnas.forEach((c, i) => {
      if (c.dibujar) {
        c.dibujar(doc, fila, x, y, anchos[i]);
      } else {
        doc.fillColor(COLOR.texto).font("Helvetica").fontSize(9)
          .text(String(fila[c.campo] ?? ""), x + 8, y + 8, {
            width: anchos[i] - 16,
            align: c.alinear ?? "left",
            height: 11,
            ellipsis: true,
          });
      }
      x += anchos[i];
    });
    doc.y = y + ALTO_FILA;
  });
  doc.x = MARGEN;
}

function celdaConPunto(color, texto) {
  return (doc, fila, x, y, ancho) => {
    doc.circle(x + 13, y + ALTO_FILA / 2, 3.5).fill(color(fila));
    doc.fillColor(COLOR.texto).font("Helvetica").fontSize(9)
      .text(texto(fila), x + 22, y + 8, { width: ancho - 30, height: 11, ellipsis: true });
  };
}

function tablaDeTotales(doc, { titulo: textoTitulo, columna, filas, total, color, x, ancho }) {
  const yInicio = doc.y;
  titulo(doc, textoTitulo, { x, ancho, tamanio: 11, espacioAntes: 0 });
  tabla(
    doc,
    [
      { titulo: columna, ancho: 0.52, dibujar: celdaConPunto(color, (f) => f.nombre) },
      { titulo: "Cantidad", ancho: 0.26, campo: "total", alinear: "right" },
      { titulo: "%", ancho: 0.22, campo: "porcentaje", alinear: "right" },
    ],
    filas.map((f) => ({ ...f, porcentaje: `${porcentaje(f.total, total)}%` })),
    { x, ancho }
  );
  const yFin = doc.y;
  doc.y = yInicio;
  return yFin;
}

// Dos tablas de totales lado a lado; deja el cursor debajo de la más alta.
function totalesEnColumnas(doc, izquierda, derecha) {
  const ancho = (anchoUtil(doc) - SEPARACION_COLUMNAS) / 2;
  const filas = Math.max(izquierda.filas.length, derecha?.filas.length ?? 0);
  asegurarEspacio(doc, 40 + (filas + 1) * ALTO_FILA);

  const finIzquierda = tablaDeTotales(doc, { ...izquierda, x: MARGEN, ancho });
  const finDerecha = derecha
    ? tablaDeTotales(doc, { ...derecha, x: MARGEN + ancho + SEPARACION_COLUMNAS, ancho })
    : finIzquierda;
  doc.y = Math.max(finIzquierda, finDerecha) + 22;
  doc.x = MARGEN;
}

function pieDePagina(doc) {
  const rango = doc.bufferedPageRange();
  for (let i = rango.start; i < rango.start + rango.count; i++) {
    doc.switchToPage(i);
    // Sin margen inferior, para que el pie no fuerce una página nueva.
    doc.page.margins.bottom = 0;
    const y = doc.page.height - MARGEN + 10;
    doc.moveTo(MARGEN, y - 6).lineTo(doc.page.width - MARGEN, y - 6).lineWidth(0.5).stroke(COLOR.borde);
    doc.fillColor(COLOR.textoSuave).font("Helvetica").fontSize(8)
      .text("Municipalidad de Concordia · Área de Sistemas", MARGEN, y, { lineBreak: false });
    doc
      .text(`Página ${i + 1} de ${rango.count}`, MARGEN, y, {
        width: anchoUtil(doc),
        align: "right",
        lineBreak: false,
      });
  }
}

function crearReporteIncidencias({ porEstado, porPrioridad, porArea, detalle }) {
  const doc = new PDFDocument({ margin: MARGEN, size: "A4", bufferPages: true });
  const total = detalle.length;

  encabezado(doc);

  titulo(doc, "Detalle de incidencias", { espacioAntes: 28 });
  tabla(
    doc,
    [
      { titulo: "#", ancho: 0.05, campo: "id_incidencia" },
      { titulo: "Fecha", ancho: 0.13, campo: "fecha" },
      { titulo: "Artículo", ancho: 0.16, campo: "articulo" },
      { titulo: "Pedido", ancho: 0.2, campo: "descripcion_pedido" },
      { titulo: "Prioridad", ancho: 0.11, campo: "prioridad_texto" },
      {
        titulo: "Estado",
        ancho: 0.16,
        dibujar: celdaConPunto((f) => COLOR_ESTADO[f.id_estado] ?? COLOR.verde, (f) => f.estado),
      },
      { titulo: "Asignada a", ancho: 0.19, campo: "asignado" },
    ],
    detalle.map((inc) => ({
      ...inc,
      fecha: formatoFecha.format(new Date(inc.creado)),
      prioridad_texto: PRIORIDADES[inc.prioridad] ?? inc.prioridad,
      asignado: `${inc.asignado_nombres} ${inc.asignado_apellidos}`,
    }))
  );

  titulo(doc, "Resumen", { espacioAntes: 36 });
  doc.y += 6;
  const porId = new Map(porPrioridad.map((f) => [f.prioridad, f.total]));
  totalesEnColumnas(
    doc,
    {
      titulo: "Por estado",
      columna: "Estado",
      filas: porEstado.map((f) => ({ nombre: f.estado, total: f.total, id_estado: f.id_estado })),
      total,
      color: (f) => COLOR_ESTADO[f.id_estado] ?? COLOR.verde,
    },
    {
      titulo: "Por prioridad",
      columna: "Prioridad",
      filas: [3, 2, 1].map((p) => ({ nombre: PRIORIDADES[p], total: porId.get(p) ?? 0 })),
      total,
      color: () => COLOR.verde,
    }
  );
  totalesEnColumnas(doc, {
    titulo: "Por área del artículo",
    columna: "Área",
    filas: porArea.map((f) => ({ nombre: f.area, total: f.total })),
    total,
    color: () => COLOR.verde,
  });

  pieDePagina(doc);
  return doc;
}

module.exports = { crearReporteIncidencias };
