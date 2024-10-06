const express = require('express');
const cors = require('cors');
const { pgPool, mysqlPool } = require('./databases');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());  // Middleware para parsear JSON

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
  const { id_producto, cantidad, cliente_id } = req.body;

  let mysqlConnection;

  try {
    // Iniciar transacción en MySQL (nodo local)
    mysqlConnection = await mysqlPool.getConnection();
    await mysqlConnection.beginTransaction();

    // Obtener el precio y la cantidad disponible del producto en MySQL
    const [producto] = await mysqlConnection.query(
      'SELECT precio, cantidad_disponible FROM Productos WHERE id_producto = ?',
      [id_producto]
    );

    if (producto.length === 0) {
      throw new Error('Producto no encontrado');
    }

    const precio = producto[0].precio;
    const cantidad_disponible = producto[0].cantidad_disponible;

    // Verificar si hay suficiente cantidad disponible
    if (cantidad > cantidad_disponible) {
      throw new Error('No hay suficiente cantidad disponible');
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
    const total_costo = precio * cantidad;
    if (balance < total_costo) {
      throw new Error('Saldo insuficiente');
    }

    // Actualizar el balance del cliente en PostgreSQL
    await pgPool.query(
      'UPDATE clientes SET balance_monedero = balance_monedero - $1 WHERE codigo_qr = $2',
      [total_costo, cliente_id]  // Usar el código QR
    );

    // Actualizar la cantidad disponible del producto en MySQL
    await mysqlConnection.query(
      'UPDATE Productos SET cantidad_disponible = cantidad_disponible - ? WHERE id_producto = ?',
      [cantidad, id_producto]
    );

    // Confirmar transacción en ambos nodos
    await mysqlConnection.commit();
    mysqlConnection.release();

    res.json({
      message: 'Compra realizada con éxito',
      total_costo: total_costo,
      nuevo_balance: balance - total_costo,
      cantidad_comprada: cantidad,
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});