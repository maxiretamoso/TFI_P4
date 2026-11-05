# Gestión de Incidencias Municipales

Trabajo Final Integrador — Programación IV · UNER · Facultad de Ciencias de la Administración · Licenciatura en Sistemas · 2026

**Grupo 8** · Integrante: Retamoso Trotta, Maximo Felipe

Aplicación web para que el área de Sistemas de un municipio registre, asigne, resuelva y reporte incidencias sobre artículos. Un empleado municipal informa un problema, el Director lo asigna a un responsable de Sistemas, y éste lo finaliza describiendo la solución. Cada cambio de estado queda registrado en un historial y, al finalizar o cancelar una incidencia, se envía un correo de aviso.

## Funcionalidades

**Todos los roles**
- Inicio de sesión con token JWT.
- Mi perfil: datos del usuario, elección de un avatar predefinido o subida de una foto propia (que se puede ampliar), y cambio de contraseña.
- Lista de incidencias con búsqueda en vivo y filtros por estado, prioridad y fecha.
- Modo claro y oscuro, con la preferencia guardada en el navegador.
- Diseño responsivo: en el celular el menú lateral se pliega.

**Empleado Municipal**
- Listar los artículos, con buscador.
- Crear una incidencia sobre un artículo.
- Listar sus incidencias y cancelar las que siguen pendientes.

**Empleado del área de Sistemas**
- Listar las incidencias asignadas y finalizarlas con una descripción de la resolución.
- BREAD de categorías y artículos.

**Director del área de Sistemas**
- Dashboard con totales por estado, por fecha, por prioridad, por área y por categoría; indicadores generales; incidencias prioritarias abiertas; y carga de trabajo de cada empleado de Sistemas. Cada dato lleva a la lista de incidencias ya filtrada.
- Reporte de incidencias en PDF, completo o filtrado por pendientes, en proceso, resueltas o canceladas.
- Asignar incidencias a empleados de Sistemas y cancelar las pendientes.
- BREAD de usuarios, áreas, categorías y artículos.

## Stack

| Capa | Tecnología |
|---|---|
| Base de datos | PostgreSQL |
| Servidor | Node.js + Express 5 |
| Autenticación | JSON Web Token + bcryptjs |
| Validación | express-validator |
| Registro de solicitudes | Morgan |
| Carga de archivos | Multer |
| Documentación | Swagger (swagger-jsdoc + swagger-ui-express) |
| Reportes PDF | pdfkit |
| Correo | nodemailer |
| Seguridad | helmet + express-rate-limit |
| Cliente | HTML + CSS + JavaScript + Bootstrap 5 (servido con Vite) |

## Roles

Los valores salen de la tabla `usuarios` del script de la cátedra:

| rol | Quién es |
|---|---|
| 1 | Director del área de Sistemas |
| 2 | Empleado del área de Sistemas |
| 3 | Empleado Municipal |

## Estructura

```
server/
  index.js            arranque, middlewares globales y montaje de rutas
  config/             roles, estados, avatares predefinidos y definición de Swagger
  routes/             definición de endpoints y validaciones de entrada
  controllers/        traducen HTTP a llamadas al servicio
  services/           reglas de negocio (permisos, transiciones de estado, correo)
  datos/              acceso a la base: único lugar donde hay SQL
  middlewares/        verificación de token y de rol
  utils/              errores, transacciones, carga de archivos, reporte PDF y correo
  assets/             logo usado en el reporte PDF y en el correo
  publico/avatares/   fotos subidas por los usuarios y avatares predefinidos
client/
  index.html
  public/             logo de la Municipalidad
  src/
    api.js            cliente HTTP contra la API
    router.js         navegación, menú lateral y barra superior según el rol
    permisos.js       qué puede hacer cada rol en la interfaz
    session.js        token y datos del usuario en localStorage
    tema.js           interruptor de modo claro y oscuro
    avisos.js         avisos flotantes que se cierran solos
    ayudas.js         globos de ayuda al pasar el mouse
    confirmar.js      ventana de confirmación reutilizable
    ui.js             constantes y helpers de presentación
    styles.css        estilos propios sobre Bootstrap
    pages/            una pantalla por archivo
database/
  incidencias_db.sql  estructura y datos de prueba de la cátedra
```

## Decisiones de diseño

**División en capas.** El servidor separa rutas, controladores, servicios y datos. Las rutas solo declaran el endpoint y validan la entrada; los controladores traducen entre HTTP y el dominio; los servicios concentran las reglas de negocio; y la capa de datos es el único lugar del proyecto donde se escribe SQL. Cambiar una consulta no obliga a tocar las reglas, y al revés.

**Versionado del API.** Todos los endpoints cuelgan de `/api/v1`. No hay rutas sin versionar.

**Acciones como recursos.** Asignar, finalizar y cancelar una incidencia son `PATCH` sobre `/incidencias/{id}/asignacion`, `/resolucion` y `/cancelacion`, en lugar de verbos en la ruta.

**Autorización en el servidor, no en la interfaz.** El cliente esconde los botones que el usuario no puede usar, pero quien decide es el middleware `verificarRol` de cada ruta y las reglas de cada servicio. Pedir un endpoint prohibido con el token de otro rol devuelve 403 aunque el botón no estuviera en pantalla.

**Estados de solo lectura.** Los cuatro estados (Pendiente, En Proceso, Resuelta, Cancelada) se consultan pero no se crean, editan ni eliminan: todo el flujo de una incidencia depende de ellos.

**Protecciones en usuarios.** Nadie puede cambiarse su propio rol ni darse de baja a sí mismo, y un empleado de Sistemas con incidencias abiertas asignadas no puede ser dado de baja ni cambiar de rol hasta que se reasignen.

**Cambios de estado sin carreras.** Asignar, finalizar y cancelar actualizan la incidencia solo si sigue en un estado que lo permite (la condición va en el mismo `UPDATE`). Si dos personas actúan a la vez sobre la misma incidencia, la segunda recibe 409 en lugar de aplicar un segundo cambio.

**Sesión verificada en cada pedido.** Además de validar el token, el servidor comprueba que el usuario siga activo y toma su rol actual de la base: una baja o un cambio de rol se aplican de inmediato, sin esperar a que venza el token.

**Soft deletes.** Ninguna baja borra filas: se marca `activo = 0` y los listados filtran por `activo = 1`. Así las incidencias viejas siguen mostrando el artículo o la categoría con la que se crearon.

**Transacciones.** Crear una incidencia, asignarla, finalizarla y cancelarla escriben en dos tablas (`incidencias` y `incidencias_estados`). Las dos escrituras van en la misma transacción: o se confirman las dos o no se confirma ninguna, y el historial nunca queda desfasado del estado actual.

**Flujo de una incidencia.** Nace en estado Pendiente y a cargo del Director, porque `asignado_a` es `NOT NULL` en el diagrama de la cátedra y es el Director quien reparte el trabajo. Al asignarla a un empleado de Sistemas pasa a En Proceso; al finalizarla, a Resuelta; y una Pendiente se puede cancelar.

**Correo en segundo plano.** El aviso por correo al finalizar o cancelar se envía sin esperar la respuesta del servidor de correo, para no demorar la operación. Un fallo de envío queda registrado en la consola y no afecta a la incidencia. Los estilos del correo van escritos en cada etiqueta, porque los clientes de correo descartan los CSS externos.

**Contraseñas.** Los usuarios que trae el script de la cátedra tienen la contraseña en SHA-256, así que el login acepta ese formato. Toda contraseña que se cree o se cambie desde la aplicación se guarda con bcrypt. La contraseña solo se cambia desde `PATCH /auth/contrasenia`, que exige la actual; editar un usuario no la modifica.

**Avatares.** Cada usuario puede elegir uno de los avatares predefinidos (SVG con una animación suave hecha con CSS) o subir una foto propia con Multer. Al cambiar de avatar se borra la foto subida anterior, pero nunca un predefinido.

**Cliente de una sola página.** El cliente es HTML, CSS, JavaScript y Bootstrap, sin framework. La navegación la resuelve `router.js` leyendo el `hash` de la URL y montando la pantalla correspondiente, así el menú, la barra superior y el manejo de sesión viven en un solo lugar. Cada pantalla es un módulo independiente en `src/pages/`.

**Modo oscuro.** Usa el atributo `data-bs-theme` de Bootstrap 5.3 y variables CSS propias para los colores de la app. La elección se aplica antes de pintar la página para que no parpadee.

**Gráficos sin librerías.** Los gráficos del dashboard están hechos con SVG y CSS a partir de los datos de la API, sin dependencias externas, y usan los mismos colores de estado que el resto de la app: pendiente en ámbar, en proceso en azul, resuelta en verde y cancelada en rojo.

**Middlewares de seguridad.** Además de lo que pide la consigna, el servidor usa `helmet` para las cabeceras HTTP y `express-rate-limit` para limitar los intentos de login.

## Endpoints

Todos cuelgan de `/api/v1`. La documentación completa, con cuerpos y códigos de respuesta, está en `/api-docs`.

| Método | Ruta | Quién |
|---|---|---|
| POST | `/auth/login` | público |
| PATCH | `/auth/contrasenia` | autenticado |
| GET | `/me` | autenticado |
| GET | `/health` | público |
| GET | `/incidencias` | autenticado (según el rol; filtros: buscar, estado, prioridad, desde, fecha, sin_asignar, area, categoria, asignado) |
| POST | `/incidencias` | Municipal |
| GET | `/incidencias/{id}` | autenticado (solo las que puede ver) |
| GET | `/incidencias/{id}/estados` | autenticado (solo las que puede ver) |
| PATCH | `/incidencias/{id}/asignacion` | Director |
| PATCH | `/incidencias/{id}/resolucion` | Sistemas |
| PATCH | `/incidencias/{id}/cancelacion` | Director y Municipal |
| GET | `/incidencias-estados` | Director |
| GET | `/dashboard` | Director (incluye totales por fecha) |
| GET | `/reportes/incidencias` | Director (filtro opcional: pendientes, en_proceso, resueltas, canceladas) |
| GET | `/categorias`, `/articulos`, `/areas`, `/estados` | autenticado |
| POST, PUT, DELETE | `/categorias`, `/articulos` | Sistemas y Director |
| POST, PUT, DELETE | `/areas` | Director |
| BREAD | `/usuarios` | Director (cada uno puede ver y editar su propio perfil) |
| PATCH | `/usuarios/{id}/avatar` | el propio usuario o el Director |
| GET | `/avatares` | autenticado |

## Notas sobre la base

- En el diagrama de la cátedra la columna `incidencias_estados.fecha_hora_estado` es `time with time zone`, que guarda la hora de cada cambio pero no el día. En `database/incidencias_db.sql` se cambió a `timestamp with time zone` para que el historial tenga fecha y hora, y así poder mostrar cuándo se resolvió o canceló cada incidencia (en la lista y en el reporte PDF). Es el único cambio de tipo respecto del diagrama.
- En el script original de la cátedra el estado 3 figuraba como "Resuela"; en `database/incidencias_db.sql` se corrigió a "Resuelta".
