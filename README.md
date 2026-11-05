# GIM — Gestión de Incidencias Municipales

Trabajo Final Integrador — Programación IV · UNER · Facultad de Ciencias de la Administración · Licenciatura en Sistemas · 2026

Aplicación web para que el área de Sistemas de un municipio registre, asigne, resuelva y reporte incidencias sobre artículos. Un empleado municipal informa un problema, el Director lo asigna a un responsable de Sistemas, y éste lo finaliza describiendo la solución. Cada cambio de estado queda registrado en un historial.

## Stack

| Capa | Tecnología |
|---|---|
| Base de datos | PostgreSQL |
| Servidor | Node.js + Express 5 |
| Autenticación | JSON Web Token |
| Validación | express-validator |
| Registro de solicitudes | Morgan |
| Carga de archivos | Multer |
| Documentación | Swagger (swagger-jsdoc + swagger-ui-express) |
| Reportes PDF | pdfkit |
| Correo | nodemailer |
| Cliente | HTML + CSS + JavaScript + Bootstrap 5 (servido con Vite) |

## Roles

Los valores salen de la tabla `usuarios` del script de la cátedra:

| rol | Quién es | Qué puede hacer |
|---|---|---|
| 1 | Director del área de Sistemas | Dashboard, reportes en PDF, asignar incidencias, cancelar pendientes, gestionar usuarios y áreas |
| 2 | Empleado del área de Sistemas | Ver las incidencias asignadas, finalizarlas, BREAD de categorías y artículos |
| 3 | Empleado Municipal | Listar artículos, crear incidencias, ver las propias y cancelar las pendientes |

## Puesta en marcha

Requisitos: Node.js 20 o superior y PostgreSQL instalado localmente (con pgAdmin 4 o DBeaver como cliente).

### 1. Crear e importar la base

1. En pgAdmin 4, crear una base llamada **`incidencias_db`**.
2. Abrir el *Query Tool* sobre esa base y ejecutar [`database/incidencias_db.sql`](database/incidencias_db.sql).

El script crea las siete tablas del diagrama de la consigna y carga los datos de prueba.

### 2. Levantar el servidor

```bash
cd server
npm install
cp .env.example .env
```

Completar `server/.env` con los datos de la instalación local de PostgreSQL y una clave para firmar los tokens:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
npm run dev
```

La API queda en `http://localhost:3000/api/v1` y la documentación en `http://localhost:3000/api-docs`.

### 3. Levantar el cliente

```bash
cd client
npm install
npm run dev
```

El cliente abre en `http://localhost:5174`. Si se cambia ese puerto, hay que actualizar `CLIENT_URL` en `server/.env`, porque es el origen que la API habilita por CORS.

### 4. Usuarios de prueba

La contraseña de cada uno son las 3 primeras letras del nombre más las 3 del apellido:

| Usuario | Contraseña | Rol |
|---|---|---|
| pamalm@correo.com | pamalm | Director |
| carper@correo.com | carper | Empleado de Sistemas |
| cargom@correo.com | cargom | Empleado de Sistemas |
| estren@correo.com | estren | Empleado Municipal |

## Estructura

```
server/
  index.js            arranque, middlewares globales y montaje de rutas
  config/             roles, estados y definición de Swagger
  routes/             definición de endpoints y validaciones de entrada
  controllers/        traducen HTTP a llamadas al servicio
  services/           reglas de negocio (permisos, transiciones de estado, correo)
  datos/              acceso a la base: único lugar donde hay SQL
  middlewares/        verificación de token y de rol
  utils/              helpers de errores, transacciones y carga de archivos
  publico/avatares/   fotos de perfil subidas por los usuarios
client/
  index.html
  src/
    api.js            cliente HTTP contra la API
    router.js         navegación y armado del menú según el rol
    permisos.js       qué puede hacer cada rol en la interfaz
    session.js        token y datos del usuario en localStorage
    ui.js             constantes y helpers de presentación
    pages/            una pantalla por archivo
database/
  incidencias_db.sql  estructura y datos de prueba
```

## Decisiones de diseño

**División en capas.** El servidor separa rutas, controladores, servicios y datos. Las rutas solo declaran el endpoint y validan la entrada; los controladores traducen entre HTTP y el dominio; los servicios concentran las reglas de negocio; y la capa de datos es el único lugar del proyecto donde se escribe SQL. Cambiar una consulta no obliga a tocar las reglas, y al revés.

**Versionado del API.** Todos los endpoints cuelgan de `/api/v1`. No hay rutas sin versionar.

**Autorización en el servidor, no en la interfaz.** El cliente esconde los botones que el usuario no puede usar, pero quien decide es el middleware `verificarRol` de cada ruta. Pedir un endpoint prohibido con el token de otro rol devuelve 403 aunque el botón no estuviera en pantalla.

**Soft deletes.** Ninguna baja borra filas: se marca `activo = 0` y los listados filtran por `activo = 1`. Así las incidencias viejas siguen mostrando el artículo o la categoría con la que se crearon.

**Transacciones.** Crear una incidencia, asignarla, finalizarla y cancelarla escriben en dos tablas (`incidencias` y `incidencias_estados`). Las dos escrituras van en la misma transacción: o se confirman las dos o no se confirma ninguna, y el historial nunca queda desfasado del estado actual.

**Flujo de una incidencia.** Nace en estado Pendiente y a cargo del Director, porque `asignado_a` es `NOT NULL` en el diagrama de la cátedra y es el Director quien reparte el trabajo. Al asignarla a un empleado de Sistemas pasa a En Proceso; al finalizarla, a Resuelta; y una Pendiente se puede cancelar.

**Contraseñas.** Los usuarios que trae el script de la cátedra tienen la contraseña en SHA-256, así que el login acepta ese formato. Toda contraseña que se cree o se cambie desde la aplicación se guarda con bcrypt, que agrega salt y es mucho más caro de atacar por fuerza bruta. Los dos formatos conviven sin tocar los datos originales.

**Cliente de una sola página.** El cliente es HTML, CSS, JavaScript y Bootstrap, sin framework ni dependencias de interfaz. La navegación entre pantallas la resuelve `router.js` leyendo el `hash` de la URL y montando la pantalla correspondiente. Se eligió así para no repetir el encabezado, el menú y el manejo de sesión en cada documento: el menú se arma en un solo lugar a partir del rol, y la lógica de token y de errores vive en `api.js` y `session.js`. Cada pantalla es un módulo independiente en `src/pages/`.

**Correo con estilos en línea.** Los estilos del correo van escritos en cada etiqueta, no en una hoja aparte: los clientes de correo descartan los CSS externos y buena parte de lo que venga en un `<style>`.

**Middlewares de seguridad.** Además de lo que pide la consigna, el servidor usa `helmet` para las cabeceras HTTP y `express-rate-limit` para limitar los intentos de login. Son middlewares del mismo Express, no tecnologías adicionales.

## Endpoints

Todos cuelgan de `/api/v1`. La documentación completa, con cuerpos y códigos de respuesta, está en `/api-docs`.

| Método | Ruta | Quién |
|---|---|---|
| POST | `/auth/login` | público |
| PATCH | `/auth/contrasenia` | autenticado |
| GET | `/me` | autenticado |
| GET | `/health` | público |
| GET | `/incidencias` | autenticado (filtra según el rol) |
| POST | `/incidencias` | Municipal |
| GET | `/incidencias/{id}` | autenticado |
| GET | `/incidencias/{id}/estados` | autenticado |
| PATCH | `/incidencias/{id}/asignacion` | Director |
| PATCH | `/incidencias/{id}/resolucion` | Sistemas |
| PATCH | `/incidencias/{id}/cancelacion` | Director y Municipal |
| GET | `/incidencias-estados` | Director |
| GET | `/dashboard` | Director |
| GET | `/reportes/incidencias` | Director |
| BREAD | `/categorias`, `/articulos` | Sistemas y Director |
| BREAD | `/areas`, `/estados` | Director |
| BREAD | `/usuarios` | Director (cada uno edita su perfil) |
| PATCH | `/usuarios/{id}/avatar` | el propio usuario o el Director |

## Notas

- Si en el `.env` no hay servidor de correo configurado, las notificaciones se imprimen en la consola del servidor en vez de enviarse. La aplicación funciona igual.
- `MAIL_TO_TEST` redirige todos los correos a una sola casilla, para probar sin molestar a nadie.
- La columna `incidencias_estados.fecha_hora_estado` es de tipo `time with time zone` en el diagrama de la cátedra, así que el historial guarda la hora del cambio pero no la fecha.
