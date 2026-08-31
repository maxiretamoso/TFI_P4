--Tablas
CREATE TABLE areas (
    id_area integer NOT NULL,
    descripcion varchar(100) NOT NULL,
    activo smallint NOT NULL DEFAULT 1
);

ALTER TABLE areas ADD CONSTRAINT areas_pkey PRIMARY KEY (id_area);
------
CREATE TABLE categorias (
    id_categoria integer NOT NULL,
    descripcion varchar(100) NOT NULL,
    activo smallint NOT NULL DEFAULT 1
);

ALTER TABLE categorias ADD CONSTRAINT categorias_pkey PRIMARY KEY (id_categoria);
------
CREATE TABLE estados (
    id_estado integer NOT NULL,
    descripcion varchar(100) NOT NULL,
    activo smallint NOT NULL DEFAULT 1
);

ALTER TABLE estados ADD CONSTRAINT estados_pkey PRIMARY KEY (id_estado);
------
CREATE TABLE articulos (
    id_articulo integer NOT NULL,
    id_area integer NOT NULL,
    descripcion varchar(150) NOT NULL,
    categoria integer NOT NULL,
    activo smallint NOT NULL DEFAULT 1
);

ALTER TABLE articulos ADD CONSTRAINT articulos_pkey PRIMARY KEY (id_articulo);

ALTER TABLE articulos
    ADD CONSTRAINT fk_articulos_areas
    FOREIGN KEY (id_area) REFERENCES areas(id_area);

ALTER TABLE articulos
    ADD CONSTRAINT fk_articulos_categorias
    FOREIGN KEY (categoria) REFERENCES categorias(id_categoria);
-----
CREATE TABLE usuarios (
    id_usuario integer NOT NULL,
    id_area integer NOT NULL,
	nombres varchar(100) NOT NULL,
	apellidos varchar(100) NOT NULL,
	usuario varchar(100) NOT NULL,
	contrasenia varchar(100) NOT NULL,
	avatar varchar(255),
	rol integer NOT NULL,
    activo smallint NOT NULL DEFAULT 1
);

ALTER TABLE usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);

ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuarios_areas
    FOREIGN KEY (id_area) REFERENCES areas(id_area);
-----
CREATE TABLE incidencias (
    id_incidencia integer NOT NULL,
    id_estado integer NOT NULL,
	creado_por integer NOT NULL,
	asignado_a integer,
	creado timestamp with time zone NOT NULL,
	prioridad integer NOT NULL,
	articulo integer NOT NULL,
	descripcion_pedido varchar(255) NOT NULL,
	descripcion_resolucion varchar(255)
);

ALTER TABLE incidencias ADD CONSTRAINT incidencias_pkey PRIMARY KEY (id_incidencia);

ALTER TABLE incidencias
    ADD CONSTRAINT fk_incidencias_creado_por
    FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario);

ALTER TABLE incidencias
    ADD CONSTRAINT fk_incidencias_asignado_a
    FOREIGN KEY (asignado_a) REFERENCES usuarios(id_usuario);

ALTER TABLE incidencias
    ADD CONSTRAINT fk_incidencias_articulos
    FOREIGN KEY (articulo) REFERENCES articulos(id_articulo);

ALTER TABLE incidencias
    ADD CONSTRAINT fk_incidencias_estados
    FOREIGN KEY (id_estado) REFERENCES estados(id_estado);
-----
CREATE TABLE incidencias_estados (
    id_pedidos_estados integer NOT NULL,
    id_incidencia integer NOT NULL,
	id_estado integer NOT NULL,
	fecha_hora_estado timestamp with time zone NOT NULL
);

ALTER TABLE incidencias_estados ADD CONSTRAINT incidencias_estados_pkey PRIMARY KEY (id_pedidos_estados);

ALTER TABLE incidencias_estados 
	ADD CONSTRAINT fk_incidencias_estados_incidencias
	FOREIGN KEY (id_incidencia) REFERENCES incidencias(id_incidencia);

ALTER TABLE incidencias_estados
	ADD CONSTRAINT fk_incidencias_estados_estados
	FOREIGN KEY (id_estado) REFERENCES estados(id_estado);
----secuencias
CREATE SEQUENCE areas_id_area_seq AS integer START WITH 1 INCREMENT BY 1;
ALTER TABLE areas ALTER COLUMN id_area SET DEFAULT nextval('areas_id_area_seq');

CREATE SEQUENCE categorias_id_categoria_seq AS integer START WITH 1 INCREMENT BY 1;
ALTER TABLE categorias ALTER COLUMN id_categoria SET DEFAULT nextval('categorias_id_categoria_seq');

CREATE SEQUENCE estados_id_estado_seq AS integer START WITH 1 INCREMENT BY 1;
ALTER TABLE estados ALTER COLUMN id_estado SET DEFAULT nextval('estados_id_estado_seq');

CREATE SEQUENCE articulos_id_articulo_seq AS integer START WITH 1 INCREMENT BY 1;
ALTER TABLE articulos ALTER COLUMN id_articulo SET DEFAULT nextval('articulos_id_articulo_seq');

CREATE SEQUENCE usuarios_id_usuario_seq AS integer START WITH 1 INCREMENT BY 1;
ALTER TABLE usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('usuarios_id_usuario_seq');

CREATE SEQUENCE incidencias_id_incidencia_seq AS integer START WITH 1 INCREMENT BY 1;
ALTER TABLE incidencias ALTER COLUMN id_incidencia SET DEFAULT nextval('incidencias_id_incidencia_seq');

CREATE SEQUENCE incidencias_estados_id_pedidos_estados_seq AS integer START WITH 1 INCREMENT BY 1;
ALTER TABLE incidencias_estados ALTER COLUMN id_pedidos_estados SET DEFAULT nextval('incidencias_estados_id_pedidos_estados_seq');

----- poblar tablas
INSERT INTO areas (descripcion, activo) VALUES
('Sistemas', 1),
('Obras Públicas', 1),
('Recursos Humanos', 1),
('Hacienda', 1);
-----
INSERT INTO categorias (descripcion, activo) VALUES
('Hardware', 1),
('Software', 1),
('Redes', 1);
-----
INSERT INTO estados (descripcion, activo) VALUES
('PENDIENTE', 1),
('ASIGNADA', 1),
('FINALIZADA', 1),
('CANCELADA', 1);
-----
SELECT * FROM areas;
SELECT * FROM categorias;
INSERT INTO articulos (id_area, descripcion, categoria, activo) VALUES
(2, 'PC Escritorio - Obras Públicas 01', 1, 1),
(3, 'Notebook - RRHH 03', 1, 1),
(4, 'Impresora Multifunción - Hacienda', 1, 1),
(1, 'Switch de Red - Piso 2', 3, 1);
-----
SELECT id_usuario, nombres, apellidos, rol FROM usuarios;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
INSERT INTO usuarios (id_area, nombres, apellidos, usuario, contrasenia, avatar, rol, activo) VALUES
(1, 'Carla', 'Ibarra', 'cibarra', encode(digest('Usuario.1', 'sha256'), 'hex'), NULL, 1, 1),
(1, 'Marina', 'López', 'mlopez', encode(digest('Usuario.2', 'sha256'), 'hex'), NULL, 2, 1),
(1, 'Romina', 'Aguirre', 'raguirre', encode(digest('Usuario.3', 'sha256'), 'hex'), NULL, 3, 1);
-----
INSERT INTO incidencias (id_estado, creado_por, asignado_a, creado, prioridad, articulo, descripcion_pedido, descripcion_resolucion) VALUES
(1, 1, NULL, now(), 2, 1, 'La PC no enciende, se cortó la luz mientras estaba prendida.', NULL),
(2, 1, 2, now(), 3, 3, 'La impresora no responde y tira error de papel atascado.', NULL),
(3, 1, 2, now(), 1, 2, 'La notebook no conecta al WiFi de la oficina.', 'Se reinstaló el driver de red y se probó la conexión.');
-----
INSERT INTO incidencias_estados (id_incidencia, id_estado, fecha_hora_estado) VALUES
(1, 1, now()),
(2, 1, now() - interval '1 day'),
(2, 2, now()),
(3, 1, now() - interval '2 days'),
(3, 2, now() - interval '1 day'),
(3, 3, now());