# Sistema de Registro de Incidencias

Trabajo Práctico Integrador — Programación IV · UNER · Facultad de Ciencias de la Administración · Licenciatura en Sistemas · 2026

## Sobre el proyecto

Sistema para que un municipio registre, asigne, resuelva y reporte incidencias: un empleado municipal informa un problema, el Director lo asigna a un responsable de Sistemas, quien lo finaliza con una descripción de la solución — y cada paso queda guardado en un historial. Expone una API REST documentada con Swagger, genera reportes en PDF, envía notificaciones por email y controla el acceso con tres roles de usuario sobre tokens JWT.

## Características

- Tres roles con permisos distintos (Municipal, Empleado de Sistemas y Director); el filtrado de incidencias ocurre en el servidor, no en la interfaz.
- Flujo completo de incidencias: Pendiente → En proceso → Resuelta / Cancelada, con historial de cada cambio.
- Autenticación JWT con tokens de 8 horas y contraseñas con bcrypt.
- Reportes en PDF con totales por estado, fecha e incidencias prioritarias.
- Notificación por email al finalizar o cancelar; si en el `.env` no hay correo configurado, el mensaje se imprime en la consola del servidor.
- Documentación Swagger interactiva de todos los endpoints.
- Soft delete en todas las tablas (columna `activo`): nunca se borran datos físicamente.
- API versionada bajo `/api/v1/...`, con compatibilidad para `/api/...`.

## Stack

| Área | Tecnología |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Base de datos | PostgreSQL en Supabase (Pool con SSL) |
| Autenticación | JSON Web Token + bcrypt |
| Reportes | pdfkit |
| Email | nodemailer (con fallback a consola) |
| Documentación | Swagger (swagger-jsdoc + swagger-ui-express) |
| Frontend | Vite + React |

## Puesta en marcha

### Requisitos

- Node.js 20 o superior
- Una base PostgreSQL (el equipo usa Supabase)

### 1) Instalación

```bash
git clone https://github.com/maxiretamoso/TFI_P4.git
cd TFI_P4/server
npm install
```

### 2) Variables de entorno

```bash
cp .env.example .env
# completar server/.env con tus datos
```

El archivo real `.env` nunca se sube al repo (lo bloquea `.gitignore`). La plantilla [`server/.env.example`](server/.env.example) explica variable por variable. Las credenciales de Supabase y el `JWT_SECRET` se comparten por privado dentro del equipo, nunca por GitHub.

### 3) Base de datos

El script completo de la cátedra (estructura y datos de prueba) está en [`database/TFI_Prog4.sql`](database/TFI_Prog4.sql). En el proyecto de Supabase compartido ya está cargado: si usás esa base, solo necesitás completar tu `.env`.

Para cargarlo en una base nueva:

1. Supabase → SQL Editor
2. Ejecutar primero: `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (necesaria para las contraseñas)
3. Correr el script `TFI_Prog4.sql` completo

### 4) Usuarios de prueba

La contraseña de cada usuario son las 3 primeras letras del nombre más las 3 del apellido, en minúscula:

| Usuario (login) | Contraseña | Rol |
|---|---|---|
| `pamalm@correo.com` | `pamalm` | Empleado Municipal (1) |
| `carper@correo.com` | `carper` | Empleado de Sistemas (2) |
| `cargom@correo.com` | `cargom` | Empleado de Sistemas (2) |
| `estren@correo.com` | `estren` | Director (3) |

Las contraseñas del seed vienen en SHA-256 (formato original de la cátedra): en el primer login se migran solas a bcrypt, no hay que hacer nada.

### 5) Levantar el servidor

```bash
npm run dev    # desarrollo: reinicia solo al guardar
npm start      # producción

# Servidor: http://localhost:3000
# Swagger:  http://localhost:3000/api-docs
```

## Roles y permisos

| Rol | Qué puede hacer |
|---|---|
| Empleado Municipal (1) | Crear incidencias; ver solo las suyas; cancelarlas mientras estén pendientes |
| Empleado de Sistemas (2) | Ver las incidencias asignadas; finalizarlas con descripción de la solución; gestionar categorías y artículos |
| Director (3) | Ver todas las incidencias; asignarlas; dashboard y reportes en PDF; gestionar usuarios |

## API

Documentación interactiva: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Todas las rutas viven bajo `/api/v1/...` (versión pedida por la consigna) y responden también bajo `/api/...` sin versión, por compatibilidad.

### Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | Devuelve un JWT |
| POST | `/api/v1/auth/register` | Alta de usuario (solo Director) |
| GET | `/api/v1/me` | Datos del usuario logueado |
| GET | `/api/v1/incidencias` | Lista filtrada automáticamente por rol |
| POST | `/api/v1/incidencias` | Crear una incidencia |
| PATCH | `/api/v1/incidencias/:id/asignar` | Asignar a un empleado (Director) |
| PATCH | `/api/v1/incidencias/:id/finalizar` | Marcar como resuelta (Sistemas) |
| PATCH | `/api/v1/incidencias/:id/cancelar` | Cancelar (Municipal o Director) |
| GET | `/api/v1/dashboard` | Totales por estado, fecha y prioridades |
| GET | `/api/v1/reportes/incidencias` | Reporte general en PDF |
| GET | `/api/v1/health` | Estado del servidor y de la base |
| PATCH | `/api/v1/usuarios/:id/avatar` | Subir avatar (máx. 2 MB, Multer) |

Además hay BREAD completo de áreas, artículos, categorías, estados y usuarios.

### Ejemplo rápido

```bash
# 1) Loguearse (como Director)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"estren@correo.com","contrasenia":"estren"}'

# 2) Usar el token devuelto en el resto de las requests
curl http://localhost:3000/api/v1/incidencias \
  -H "Authorization: Bearer PEGAR_TOKEN_ACA"
```

## Estructura del proyecto

```
TFI_P4/
├── client/                # frontend (Vite + React)
├── database/
│   └── TFI_Prog4.sql      # script de la base: estructura, datos y claves foráneas
├── server/
│   ├── controllers/       # reciben req/res y delegan en los services
│   ├── services/          # lógica de negocio y acceso a la base
│   ├── routes/            # un archivo por entidad: los endpoints REST
│   ├── middlewares/       # verificarToken (JWT) y verificarRol
│   ├── db/                # conexión a PostgreSQL (Pool con SSL)
│   ├── dtos/              # forma de los datos que viajan
│   ├── utils/             # email, validaciones, transacciones y errores HTTP
│   ├── uploads/           # avatares subidos
│   ├── index.js           # arma el servidor y monta todas las rutas
│   ├── .env.example       # plantilla de variables de entorno
│   └── package.json
├── README.md
└── .gitignore
```

## Notas técnicas

- `incidencias.asignado_a` es NOT NULL en el script de la cátedra: al crear una incidencia se autoasigna a quien la creó, hasta que el Director la reasigna a un empleado de Sistemas.
- La conexión a Supabase requiere SSL (`ssl: { rejectUnauthorized: false }` en `db/index.js`): sin eso falla aunque las credenciales sean correctas.
- La extensión `pgcrypto` es la que verifica las contraseñas viejas (SHA-256) y las migra a bcrypt en el primer login.

## Integrantes del proyecto

- Retamoso Máximo
- Francia Maira
- Gonzalez Paz

Programación IV — UNER, 2026.
