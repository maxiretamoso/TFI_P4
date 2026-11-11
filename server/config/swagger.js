import swaggerJsdoc from "swagger-jsdoc";

import { PREFIJO_API, FILTROS_DE_REPORTE } from "../../shared/constantes.js";

const definicion = {
  openapi: "3.0.0",
  info: {
    title: "API de Gestión de Incidencias",
    version: "1.0.0",
    description:
      "Trabajo Final Integrador — Programación IV. " +
      "Roles: 1 Director del área de Sistemas, 2 Empleado del área de Sistemas, 3 Empleado Municipal.",
  },
  servers: [{ url: `http://localhost:${process.env.PORT || 3000}${PREFIJO_API}` }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      Usuario: {
        type: "object",
        properties: {
          id_usuario: { type: "integer" },
          id_area: { type: "integer" },
          nombres: { type: "string" },
          apellidos: { type: "string" },
          usuario: { type: "string", format: "email" },
          avatar: { type: "string" },
          rol: { type: "integer", enum: [1, 2, 3] },
          activo: { type: "integer", enum: [0, 1] },
        },
      },
      Articulo: {
        type: "object",
        properties: {
          id_articulo: { type: "integer" },
          id_area: { type: "integer" },
          id_categoria: { type: "integer" },
          descripcion: { type: "string" },
          area: { type: "string" },
          categoria: { type: "string" },
          activo: { type: "integer", enum: [0, 1] },
        },
      },
      Incidencia: {
        type: "object",
        properties: {
          id_incidencia: { type: "integer" },
          id_articulo: { type: "integer" },
          id_estado: { type: "integer" },
          estado: { type: "string" },
          articulo_descripcion: { type: "string" },
          creado_por: { type: "integer" },
          creado_por_nombre: { type: "string" },
          creado_por_apellido: { type: "string" },
          asignado_a: {
            type: "integer",
            nullable: true,
            description: "id_usuario del empleado de Sistemas a cargo; null mientras no se asignó",
          },
          asignado_a_nombre: { type: "string", nullable: true },
          asignado_a_apellido: { type: "string", nullable: true },
          creado: { type: "string", format: "date-time" },
          prioridad: { type: "integer", enum: [1, 2, 3] },
          descripcion_pedido: { type: "string" },
          descripcion_resolucion: { type: "string", nullable: true },
          fecha_estado: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Fecha y hora en que pasó al estado actual (en una resuelta o cancelada, la fecha de cierre)",
          },
        },
      },
    },
    responses: {
      DatosInvalidos: {
        description: "Datos inválidos: errores de validación o de reglas de negocio",
        content: {
          "application/json": {
            schema: {
              oneOf: [
                { type: "object", required: ["errors"], properties: { errors: { type: "array", items: { type: "object" } } } },
                { type: "object", required: ["error"], properties: { error: { type: "string" } } },
              ],
            },
          },
        },
      },
      NoAutenticado: {
        description: "Falta el token o no es válido",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      SinPermiso: {
        description: "El rol del usuario no habilita esta operación",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NoEncontrado: {
        description: "El recurso no existe",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const especificacion = swaggerJsdoc({
  definition: definicion,
  failOnErrors: true,
  apis: [`${import.meta.dirname.replaceAll("\\", "/")}/../routes/*.js`],
});

especificacion.paths["/reportes/incidencias"].get.parameters.find((p) => p.name === "filtro").schema.enum = [...FILTROS_DE_REPORTE];

export { especificacion };
