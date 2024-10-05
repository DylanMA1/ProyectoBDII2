CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creacion de tablas

CREATE TABLE clientes (
    cedula SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    num_telefono VARCHAR(20) NOT NULL,
    codigo_qr VARCHAR(255) UNIQUE NOT NULL,
    balance_monedero DECIMAL(10, 2) DEFAULT 0.00 -- Balance del monedero
);

CREATE TABLE promociones (
    id SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    porcentaje_descuento DECIMAL(5, 2) NOT NULL CHECK (porcentaje_descuento BETWEEN 0 AND 100), -- Porcentaje de descuento
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE nodos (
    id SERIAL PRIMARY KEY,
    nombre_establecimiento VARCHAR(100) NOT NULL,
    dirrecion_ip VARCHAR(45) UNIQUE NOT NULL, -- Para IPv4 e IPv6
    fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recargas_monedero (
    id SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES clientes(cedula),
    id_nodo INT REFERENCES nodos(id),
    cantidad DECIMAL(10, 2) NOT NULL CHECK (cantidad > 0),
    fecha_recarga TIMESTAMP DEFAULT NOW()
);

CREATE TABLE descargas_monedero (
    id SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES clientes(cedula),
    id_nodo INT REFERENCES nodos(id),
    cantidad DECIMAL(10, 2) NOT NULL CHECK (cantidad > 0),
    fecha_descarga TIMESTAMP DEFAULT NOW(),
    direccion_ip VARCHAR(45) NOT NULL -- IP del nodo que solicita el débito
);

CREATE TABLE codigos_transacciones (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(cedula),
    codigo_qr VARCHAR(255) UNIQUE NOT NULL, -- Código QR para validar la compra
    codigo_transaccion VARCHAR(100) UNIQUE NOT NULL, -- Código único para la transacción
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    usado BOOLEAN DEFAULT FALSE -- Se marca como usada cuando se procesa la compra
);

CREATE TABLE nodos_promocion (
    id_promocion INT REFERENCES promociones(id),
    id_nodo INT REFERENCES nodos(id),
    PRIMARY KEY (id_promocion, id_nodo)
);

CREATE TABLE uso_promociones (
    id SERIAL PRIMARY KEY,
    id_promocion INT REFERENCES promociones(id),
    id_cliente INT REFERENCES clientes(cedula),
    id_transaccion INT REFERENCES codigos_transacciones(id),
    fecha_uso TIMESTAMP DEFAULT NOW()
);

-- Funciones
CREATE FUNCTION registrar_cliente(
    p_nombre_establecimiento VARCHAR,
    p_dirrecion_ip VARCHAR
) RETURNS VOID AS $$
BEGIN
    INSERT INTO nodos (nombre_establecimiento, dirrecion_ip)
    VALUES (p_nombre_establecimiento, p_dirrecion_ip);
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION recargar_monedero(
    p_id_cliente INT,
    p_id_nodo INT,
    p_cantidad DECIMAL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO recargas_monedero (id_cliente, id_nodo, cantidad)
    VALUES (p_id_cliente, p_id_nodo, p_cantidad);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION generar_codigo_unico_transaccion()
RETURNS TEXT AS $$
DECLARE
    v_uuid UUID;
    v_code TEXT;
BEGIN
    -- Genera un UUID
    v_uuid := uuid_generate_v4();

    -- Combina el UUID con la fecha y hora actual para crear un código más legible
    v_code := CONCAT(TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'), '-', v_uuid);

    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_unique_qr()
RETURNS TEXT AS $$
DECLARE
    v_uuid UUID;
    v_qr_code TEXT;
BEGIN
    -- Genera un UUID que simula el código QR
    v_uuid := uuid_generate_v4();

    -- Convierte el UUID en una cadena de texto que simule el código QR
    v_qr_code := CONCAT('QR-', v_uuid);

    RETURN v_qr_code;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION crear_codigo_transaccion(
    p_id_cliente INT
) RETURNS TEXT AS $$
DECLARE
    v_codigo_transaccion VARCHAR := generar_codigo_unico_transaccion(); -- Asume que existe una función para generar el código único
BEGIN
    INSERT INTO codigos_transacciones (cliente_id, codigo_qr, codigo_transaccion)
    VALUES (p_id_cliente, generate_unique_qr(), v_codigo_transaccion);

    RETURN v_codigo_transaccion;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION usar_promocion(
    p_id_cliente INT,
    p_id_promocion INT,
    p_id_transaccion INT
) RETURNS VOID AS $$
BEGIN
    -- Verificar que la promoción esté activa y dentro del periodo de vigencia
    IF NOT EXISTS (
        SELECT 1 
        FROM promociones 
        WHERE id = p_id_promocion 
          AND activo 
          AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin
    ) THEN
        RAISE EXCEPTION 'La promoción no está activa o no está vigente';
    END IF;

    -- Registrar el uso de la promoción
    INSERT INTO uso_promociones (id_promocion, id_cliente, id_transaccion)
    VALUES (p_id_promocion, p_id_cliente, p_id_transaccion);
END;
$$ LANGUAGE plpgsql;



CREATE FUNCTION validar_transaccion(
    p_codigo_transaccion VARCHAR,
    p_id_cliente INT
) RETURNS VOID AS $$
DECLARE
    v_id INT; -- Declaración de la variable para almacenar el ID
BEGIN
    -- Validar que el código de transacción no haya sido usado
    IF NOT EXISTS (SELECT 1 FROM codigos_transacciones WHERE codigo_transaccion = p_codigo_transaccion AND cliente_id = p_id_cliente AND usado = FALSE) THEN
        RAISE EXCEPTION 'El código de transacción es inválido o ya ha sido usado';
    END IF;

    -- Marcar la transacción como usada y obtener el ID de la transacción
    UPDATE codigos_transacciones
    SET usado = TRUE
    WHERE codigo_transaccion = p_codigo_transaccion AND cliente_id = p_id_cliente AND usado = FALSE
    RETURNING id INTO v_id;

    -- Si no se actualiza ningún registro, lanzar excepción
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El código de transacción es inválido o ya ha sido usado';
    END IF;

END;
$$ LANGUAGE plpgsql;


-- triggers
CREATE OR REPLACE FUNCTION validar_ip_nodo()
RETURNS TRIGGER AS $$
BEGIN
    -- Comprobar que la direccion_ip coincide con la IP del nodo correspondiente
    IF NOT EXISTS (
        SELECT 1 
        FROM nodos 
        WHERE id = NEW.id_nodo AND direccion_ip = NEW.direccion_ip
    ) THEN
        RAISE EXCEPTION 'La direccion_ip no coincide con la del nodo %', NEW.id_nodo;
    END IF;

    -- Si pasa la validación, continuar con la inserción
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Pruebas

INSERT INTO clientes (nombre, email, num_telefono, codigo_qr, balance_monedero)
VALUES ('Juan Pérez', 'juan.perez@example.com', '555-1234', 'QR_CODE_12345', 100.00);


SELECT registrar_cliente('Establecimiento 1', '192.168.0.10');

select * from nodos
select * from clientes
select * from recargas_monedero
select * from promociones
select * from codigos_transacciones
select * from descargas_monedero

-- Aplicar la promoción con ID 1 al cliente con ID 1 en la transacción con ID 1
SELECT usar_promocion(2, 1, 1);

SELECT recargar_monedero(2, 1, 100.50);

-- Genera un código de transacción para el cliente con ID 1
SELECT crear_codigo_transaccion(2);

-- Validar y marcar como usado el código de transacción '20231003123456-550e8400-e29b-41d4-a716-446655440000'
SELECT validar_transaccion('20241004033554-09210cba-92d5-4373-a3e6-21e47bddecbd', 2);

-- Insertar una descarga de 50 unidades desde el nodo con ID 1 para el cliente con ID 1
INSERT INTO descargas_monedero (id_cliente, id_nodo, cantidad, direccion_ip) 
VALUES (2, 1, 50.00, '192.168.0.10');


-- Crear usuario_nodo_local
CREATE USER usuario_nodo_local WITH PASSWORD '12345678';

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO usuario_nodo_local;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO usuario_nodo_local;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO usuario_nodo_local;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO usuario_nodo_local;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO usuario_nodo_local;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO usuario_nodo_local;

