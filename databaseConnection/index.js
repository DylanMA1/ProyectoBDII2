const express = require('express');
const cors = require('cors');
const { pgPool, mysqlPool } = require('./databases');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/search/:key", async (req, res) => {
  const searchKey = req.params.key;
  console.log("Clave de búsqueda:", searchKey);
  try {

    const result = await pgPool.query(
      `SELECT * FROM clientes WHERE 
      cedula::text ILIKE $1 OR 
      nombre ILIKE $1`,
      [`%${searchKey}%`]
    );

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching clientes:", error);
    res.status(500).json({ message: "Error fetching clientes", error });
  }
});

app.post('/comprar-producto', async (req, res) => {
  const { compras, cliente_id } = req.body; // Cambia para recibir una lista de compras
  let mysqlConnection;

  try {
    // Iniciar transacción en MySQL (nodo local)
    mysqlConnection = await mysqlPool.getConnection();
    await mysqlConnection.beginTransaction();

    // Inicializar variables para el total y balance del cliente
    let totalCosto = 0;

    // Iterar sobre cada compra
    for (const { id_producto, cantidad } of compras) {
      // Obtener el precio y la cantidad disponible del producto en MySQL
      const [producto] = await mysqlConnection.query(
        'SELECT precio, cantidad_disponible FROM Productos WHERE id_producto = ?',
        [id_producto]
      );

      if (producto.length === 0) {
        throw new Error(`Producto no encontrado: ${id_producto}`);
      }

      const precio = producto[0].precio;
      const cantidad_disponible = producto[0].cantidad_disponible;

      // Verificar si hay suficiente cantidad disponible
      if (cantidad > cantidad_disponible) {
        throw new Error(`No hay suficiente cantidad disponible para el producto: ${id_producto}`);
      }

      // Sumar al total costo
      totalCosto += precio * cantidad;

      // Actualizar la cantidad disponible del producto en MySQL
      await mysqlConnection.query(
        'UPDATE Productos SET cantidad_disponible = cantidad_disponible - ? WHERE id_producto = ?',
        [cantidad, id_producto]
      );
    }

    // Consultar el balance del cliente en PostgreSQL usando el código QR como cliente_id (varchar)
    const pgResult = await pgPool.query(
      'SELECT balance_monedero FROM clientes WHERE codigo_qr = $1',
      [cliente_id]  // El cliente_id ahora es el código QR
    );

    const balance = pgResult.rows[0]?.balance_monedero;

    if (!balance) {
      throw new Error('Cliente no encontrado en el nodo central');
    }

    // Verificar si el cliente tiene suficiente saldo
    if (balance < totalCosto) {
      throw new Error('Saldo insuficiente');
    }

    // Actualizar el balance del cliente en PostgreSQL
    await pgPool.query(
      'UPDATE clientes SET balance_monedero = balance_monedero - $1 WHERE codigo_qr = $2',
      [totalCosto, cliente_id]  // Usar el código QR
    );

    // Confirmar transacción en ambos nodos
    await mysqlConnection.commit();
    mysqlConnection.release();

    res.json({
      message: 'Compra realizada con éxito',
      total_costo: totalCosto,
      nuevo_balance: balance - totalCosto,
      compras,  // Devuelve las compras realizadas
    });

  } catch (error) {
    console.error('Error en la transacción:', error);

    // Si ocurre un error, revertir la transacción en el nodo local (MySQL)
    if (mysqlConnection) {
      await mysqlConnection.rollback();
      mysqlConnection.release();
    }

    res.status(500).json({ message: 'Error en la operación', error: error.message });
  }
});


app.get('/productos', async (req, res) => {
  try {
    const [productos] = await mysqlPool.query('SELECT * FROM Productos');
    
    res.json(productos);
  } catch (error) {
    console.error("Error fetching productos:", error);
    res.status(500).json({ message: "Error fetching productos", error });
  }
});

app.post("/agregar-producto", async (req, res) => {
  const { nombre, descripcion, precio, cantidad, id_nodo } = req.body;
  console.log("nombre:", nombre, "descripcion: ", descripcion, "precio: ", precio, "cantidad: ", cantidad, "id_nodo", id_nodo)
  try {
    const result = await mysqlPool.query(
      'CALL registrar_producto(?, ?, ?, ?, ?);', 
      [nombre, descripcion, precio, cantidad, id_nodo]
    );
    res.status(200).json({ message: "Producto agregado exitosamente", result });
  } catch (error) {
    console.error("Error al agregar producto:", error);
    res.status(500).json({ message: "Error al agregar producto", error: error.message });
  }
});


app.post("/register", async (req, res) => {
  const { nombre, email, num_telefono } = req.body;

  try {
    // Insertar el nuevo cliente en la tabla clientes
    const result = await pgPool.query(
      `INSERT INTO clientes (nombre, email, num_telefono)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [nombre, email, num_telefono]
    );

    // Devolver los datos del cliente insertado
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    res.status(500).json({ message: "Error al registrar cliente", error });
  }
});

app.get("/clientes", async (req, res) => {
  try {
    const { rows: clientes } = await pgPool.query(`SELECT cedula, nombre FROM clientes`);
    console.log(clientes)
    res.json(clientes);
  } catch (error) {
    console.error("Error fetching clientes:", error);
    res.status(500).json({ message: "Error fetching clientes", error });
  }
});

app.post("/recargar-monedero", async (req, res) => {
  const { cliente_id, cantidad } = req.body;
  try {
      const result = await pgPool.query(
          'SELECT recargaMonedero($1, $2)',
          [cliente_id, cantidad]
      );

      res.json({
          message: 'Monedero recargado con éxito',
          cliente_id,
          cantidad,
          nuevo_balance: result.rows[0].recargamoneder 
      });
  } catch (error) {
      console.error("Error al recargar el monedero:", error);
      res.status(500).json({ message: "Error al recargar el monedero", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});