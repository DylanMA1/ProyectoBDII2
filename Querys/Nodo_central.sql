CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creación de tablas

CREATE TABLE clientes (
    cedula SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    num_telefono VARCHAR(20) NOT NULL,
    codigo_qr VARCHAR(255) UNIQUE NOT NULL,
    balance_monedero DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE promociones (
    id SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    porcentaje_descuento DECIMAL(5, 2) NOT NULL CHECK (porcentaje_descuento BETWEEN 0 AND 100),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE nodos (
    id SERIAL PRIMARY KEY,
    nombre_establecimiento VARCHAR(100) NOT NULL,
    direccion_ip VARCHAR(45) UNIQUE NOT NULL,
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
    direccion_ip VARCHAR(45) NOT NULL
);

CREATE TABLE codigos_transacciones (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(cedula),
    codigo_qr VARCHAR(255) UNIQUE NOT NULL,
    codigo_transaccion VARCHAR(100) UNIQUE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    usado BOOLEAN DEFAULT FALSE
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

-- Creación de funciones

CREATE FUNCTION registrar_nodo(
    p_nombre_establecimiento VARCHAR,
    p_direccion_ip VARCHAR
) RETURNS VOID AS $$
BEGIN
    INSERT INTO nodos (nombre_establecimiento, direccion_ip)
    VALUES (p_nombre_establecimiento, p_direccion_ip);
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
    v_uuid := uuid_generate_v4();
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
    v_uuid := uuid_generate_v4();
    v_qr_code := CONCAT('QR-', v_uuid);
    RETURN v_qr_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar código QR antes de insertar un cliente
CREATE OR REPLACE FUNCTION generar_qr_cliente()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_qr IS NULL THEN
        NEW.codigo_qr := generate_unique_qr();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_qr
BEFORE INSERT ON clientes
FOR EACH ROW
EXECUTE FUNCTION generar_qr_cliente();

CREATE FUNCTION crear_codigo_transaccion(
    p_id_cliente INT
) RETURNS TEXT AS $$
DECLARE
    v_codigo_transaccion VARCHAR := generar_codigo_unico_transaccion();
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
    IF NOT EXISTS (
        SELECT 1 
        FROM promociones 
        WHERE id = p_id_promocion 
        AND activo 
        AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin
    ) THEN
        RAISE EXCEPTION 'La promoción no está activa o no está vigente';
    END IF;

    INSERT INTO uso_promociones (id_promocion, id_cliente, id_transaccion)
    VALUES (p_id_promocion, p_id_cliente, p_id_transaccion);
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION validar_transaccion(
    p_codigo_transaccion VARCHAR,
    p_id_cliente INT
) RETURNS VOID AS $$
DECLARE
    v_id INT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM codigos_transacciones 
        WHERE codigo_transaccion = p_codigo_transaccion 
        AND cliente_id = p_id_cliente 
        AND usado = FALSE
    ) THEN
        RAISE EXCEPTION 'El código de transacción es inválido o ya ha sido usado';
    END IF;

    UPDATE codigos_transacciones
    SET usado = TRUE
    WHERE codigo_transaccion = p_codigo_transaccion 
    AND cliente_id = p_id_cliente 
    AND usado = FALSE
    RETURNING id INTO v_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El código de transacción es inválido o ya ha sido usado';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Validar la IP del nodo en las transacciones
CREATE OR REPLACE FUNCTION validar_ip_nodo()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM nodos 
        WHERE id = NEW.id_nodo 
        AND direccion_ip = NEW.direccion_ip
    ) THEN
        RAISE EXCEPTION 'La direccion_ip no coincide con la del nodo %', NEW.id_nodo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear usuario y asignar permisos
CREATE USER usuario_nodo_local WITH PASSWORD '12345678';

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO usuario_nodo_local;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO usuario_nodo_local;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO usuario_nodo_local;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO usuario_nodo_local;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE ON SEQUENCES TO usuario_nodo_local;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO usuario_nodo_local;