const express = require('express');
const cors = require('cors');
const { pgPool, mysqlPool } = require('./databases');

const app = express();
const port = 3000;

app.use(cors());

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});