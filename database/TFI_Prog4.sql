--
-- DB - Sistema de Incidencias
--

CREATE SCHEMA IF NOT EXISTS public;

--
-- Tabla: areas
--
CREATE TABLE public.areas (
    id_area integer NOT NULL,
    descripcion character varying(250) NOT NULL,
    activo smallint DEFAULT 1 NOT NULL
);

CREATE SEQUENCE public.areas_id_area_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.areas_id_area_seq OWNED BY public.areas.id_area;

--
-- Tabla: articulos
--
CREATE TABLE public.articulos (
    id_articulo integer NOT NULL,
    id_area integer NOT NULL,
    id_categoria integer NOT NULL,
    descripcion character varying(250) NOT NULL,
    activo smallint DEFAULT 1 NOT NULL
);

CREATE SEQUENCE public.articulos_id_articulo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.articulos_id_articulo_seq OWNED BY public.articulos.id_articulo;

--
-- Tabla: categorias
--
CREATE TABLE public.categorias (
    id_categoria integer NOT NULL,
    descripcion character varying(255) NOT NULL,
    activo smallint DEFAULT 1 NOT NULL
);

CREATE SEQUENCE public.categorias_id_categoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.categorias_id_categoria_seq OWNED BY public.categorias.id_categoria;

--
-- Tabla: estados
--
CREATE TABLE public.estados (
    id_estado integer NOT NULL,
    descripcion character varying(255) NOT NULL,
    activo smallint DEFAULT 1 NOT NULL
);

CREATE SEQUENCE public.estados_id_estado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.estados_id_estado_seq OWNED BY public.estados.id_estado;

--
-- Tabla: incidencias
--
CREATE TABLE public.incidencias (
    id_incidencia integer NOT NULL,
    id_articulo integer NOT NULL,
    id_estado integer NOT NULL,
    creado_por integer NOT NULL,
    asignado_a integer NOT NULL,
    creado timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    prioridad integer DEFAULT 1 NOT NULL,
    descripcion_pedido character varying(250),
    descripcion_resolucion character varying(250)
);

CREATE SEQUENCE public.incidencias_id_incidencia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.incidencias_id_incidencia_seq OWNED BY public.incidencias.id_incidencia;

--
-- Tabla: incidencias_estados
--
CREATE TABLE public.incidencias_estados (
    id_pedidos_estados integer NOT NULL,
    id_incidencia integer NOT NULL,
    id_estado integer NOT NULL,
    fecha_hora_estado time with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE public.incidencias_estados_id_pedidos_estados_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.incidencias_estados_id_pedidos_estados_seq OWNED BY public.incidencias_estados.id_pedidos_estados;

--
-- Tabla: usuarios
--
CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    id_area integer NOT NULL,
    nombres character varying(250) NOT NULL,
    apellidos character varying(250) NOT NULL,
    usuario character varying(255) NOT NULL,
    contrasenia character varying(255) NOT NULL,
    avatar character varying(255) NOT NULL,
    rol integer NOT NULL,
    activo smallint DEFAULT 1 NOT NULL
);

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;

--
-- Defaults (secuencias conectadas a cada PK)
--
ALTER TABLE ONLY public.areas ALTER COLUMN id_area SET DEFAULT nextval('public.areas_id_area_seq'::regclass);
ALTER TABLE ONLY public.articulos ALTER COLUMN id_articulo SET DEFAULT nextval('public.articulos_id_articulo_seq'::regclass);
ALTER TABLE ONLY public.categorias ALTER COLUMN id_categoria SET DEFAULT nextval('public.categorias_id_categoria_seq'::regclass);
ALTER TABLE ONLY public.estados ALTER COLUMN id_estado SET DEFAULT nextval('public.estados_id_estado_seq'::regclass);
ALTER TABLE ONLY public.incidencias ALTER COLUMN id_incidencia SET DEFAULT nextval('public.incidencias_id_incidencia_seq'::regclass);
ALTER TABLE ONLY public.incidencias_estados ALTER COLUMN id_pedidos_estados SET DEFAULT nextval('public.incidencias_estados_id_pedidos_estados_seq'::regclass);
ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);

--
-- Datos: areas
--
INSERT INTO public.areas VALUES (1, 'Legales', 1);
INSERT INTO public.areas VALUES (2, 'Personal', 1);
INSERT INTO public.areas VALUES (3, 'Sistemas', 1);
INSERT INTO public.areas VALUES (4, 'Hacienda', 1);
INSERT INTO public.areas VALUES (5, 'Finanzas', 1);
INSERT INTO public.areas VALUES (6, 'Salud y Accion Social', 1);
INSERT INTO public.areas VALUES (7, 'Desarrollo Urbano', 0);

--
-- Datos: articulos
--
INSERT INTO public.articulos VALUES (1, 1, 1, 'Mouse sin pilas', 1);
INSERT INTO public.articulos VALUES (2, 1, 1, 'Monitor LG', 1);
INSERT INTO public.articulos VALUES (3, 1, 1, 'Notebook HP', 1);

--
-- Datos: categorias
--
INSERT INTO public.categorias VALUES (1, 'Perifericos', 1);
INSERT INTO public.categorias VALUES (2, 'Notebooks', 1);
INSERT INTO public.categorias VALUES (3, 'PC Escritorio', 1);
INSERT INTO public.categorias VALUES (4, 'CPU', 1);
INSERT INTO public.categorias VALUES (5, 'Almacenamiento', 1);
INSERT INTO public.categorias VALUES (6, 'Equipos de Red', 1);
INSERT INTO public.categorias VALUES (7, 'nueva', 0);
INSERT INTO public.categorias VALUES (8, 'test', 0);
INSERT INTO public.categorias VALUES (9, 'otra', 0);
INSERT INTO public.categorias VALUES (10, 'daw', 1);
INSERT INTO public.categorias VALUES (11, 'daw', 1);
INSERT INTO public.categorias VALUES (12, 'daw', 1);
INSERT INTO public.categorias VALUES (13, 'daw', 1);
INSERT INTO public.categorias VALUES (14, 'ocho', 1);

--
-- Datos: estados
--
INSERT INTO public.estados VALUES (1, 'Pendiente', 1);
INSERT INTO public.estados VALUES (2, 'En Proceso', 1);
INSERT INTO public.estados VALUES (3, 'Resuela', 1);
INSERT INTO public.estados VALUES (4, 'Cancelada', 1);

--
-- Datos: incidencias
--
INSERT INTO public.incidencias VALUES (1, 1, 1, 4, 1, '2026-09-11 18:47:38.751684+00', 1, 'descripción pedido', '');
INSERT INTO public.incidencias VALUES (2, 1, 1, 4, 2, '2026-09-11 18:50:08.269506+00', 1, 'descripción pedido', '');
INSERT INTO public.incidencias VALUES (3, 2, 1, 4, 1, '2026-09-13 18:52:15.532034+00', 1, 'No enciende', '');
INSERT INTO public.incidencias VALUES (4, 3, 1, 4, 2, '2026-09-13 18:52:51.346357+00', 1, 'No carga la batería', '');

--
-- Datos: incidencias_estados (vacía en el dump original)
--

--
-- Datos: usuarios
--
INSERT INTO public.usuarios VALUES (1, 3, 'Carlos', 'Perez', 'carper@correo.com', 'fcaddfce9c7c894c376cf085b51ee37b851e89477a2986d2a26b8cc1f484eaf8', '', 2, 1);
INSERT INTO public.usuarios VALUES (2, 3, 'Carmen', 'Gomez', 'cargom@correo.com', 'be4288567c04f9b827ff17cad92f29fc8ab6667bf235e7ebba558588e2606ee2', '', 2, 1);
INSERT INTO public.usuarios VALUES (3, 3, 'Pamela', 'Almeida', 'pamalm@correo.com', 'be39221afb177a35f41e3dc590cc630ed8e58773dbb11a29d7a332b9e1eeaad1', '', 1, 1);
INSERT INTO public.usuarios VALUES (4, 1, 'Esteban', 'Reniero', 'estren@correo.com', '31c1a3f84de963879b6e6b88e08297fcdeb419133989acf5e91cf5b75db1923f', '', 3, 1);

--
-- Ajuste de secuencias (para que el próximo INSERT sin ID continúe desde el número correcto)
--
SELECT pg_catalog.setval('public.areas_id_area_seq', 7, true);
SELECT pg_catalog.setval('public.articulos_id_articulo_seq', 3, true);
SELECT pg_catalog.setval('public.categorias_id_categoria_seq', 14, true);
SELECT pg_catalog.setval('public.estados_id_estado_seq', 4, true);
SELECT pg_catalog.setval('public.incidencias_estados_id_pedidos_estados_seq', 1, false);
SELECT pg_catalog.setval('public.incidencias_id_incidencia_seq', 4, true);
SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 4, true);

--
-- Primary Keys
--
ALTER TABLE ONLY public.areas ADD CONSTRAINT areas_pkey PRIMARY KEY (id_area);
ALTER TABLE ONLY public.articulos ADD CONSTRAINT articulos_pkey PRIMARY KEY (id_articulo);
ALTER TABLE ONLY public.categorias ADD CONSTRAINT categorias_pkey PRIMARY KEY (id_categoria);
ALTER TABLE ONLY public.estados ADD CONSTRAINT estados_pkey PRIMARY KEY (id_estado);
ALTER TABLE ONLY public.incidencias_estados ADD CONSTRAINT incidencias_estados_pkey PRIMARY KEY (id_pedidos_estados);
ALTER TABLE ONLY public.incidencias ADD CONSTRAINT incidencias_pkey PRIMARY KEY (id_incidencia);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);

--
-- Constraint adicional: nombre de usuario único
--
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);