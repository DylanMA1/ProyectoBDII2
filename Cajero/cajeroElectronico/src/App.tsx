import { useState, useEffect, FormEvent } from "react";
import { QrReader } from "react-qr-reader";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  Heading,
  Text,
  VStack,
  Center,
  Input, // Asegúrate de importar Input
} from "@chakra-ui/react";

interface Producto {
  id_producto: number;
  nombre: string;
}

function App() {
  const [producto, setProducto] = useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]); // Cambia aquí para usar Producto[]
  const [idProducto, setIdProducto] = useState(""); // ID del producto seleccionado
  const [cantidad, setCantidad] = useState(""); // Cantidad del producto
  const [mensaje, setMensaje] = useState(""); // Mensaje para feedback
  const [qrVisible, setQrVisible] = useState(false); // Control de visibilidad del lector de QR
  const [qrData, setQrData] = useState(""); // Datos extraídos del QR

  // Efecto para cargar la lista de productos al montar el componente
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch("http://localhost:3000/productos");
        const data = await response.json();
        setProductos(data); // Asegúrate de que data sea un array de Producto
      } catch (error) {
        console.error("Error fetching productos:", error);
        setMensaje("Error al cargar productos.");
      }
    };

    fetchProductos();
  }, []);

  const handleComprar = async (event: FormEvent) => {
    event.preventDefault();

    if (!qrData) {
      setMensaje(
        "Por favor, escanea el código QR del cliente antes de realizar la compra."
      );
      return;
    }

    const data = {
      id_producto: parseInt(idProducto), // Convierte el ID del producto a entero
      cantidad: parseInt(cantidad), // Convierte la cantidad a entero
      cliente_id: qrData, // ID del cliente obtenido del código QR
    };

    try {
      const response = await fetch("http://localhost:3000/comprar-producto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error en la solicitud");
      }

      const result = await response.json();
      setMensaje(
        `Compra exitosa. Total costo: $${result.total_costo}. Nuevo balance: $${result.nuevo_balance}.`
      );
    } catch (error) {
      if (error instanceof Error) {
        setMensaje(`Error en la compra: ${error.message}`);
      } else {
        setMensaje("Ocurrió un error inesperado");
      }
    }
  };

  const handleScan = (result: any | null) => {
    if (result?.text) {
      setQrData(result.text);
      setQrVisible(false);
    }
  };

  return (
    <Center height="100vh">
      <Box className="App" textAlign="center" p={5} maxWidth={1000}>
        <Heading as="h1" mb={6}>
          Comprar Productos
        </Heading>

        <VStack as="form" onSubmit={handleComprar} spacing={5}>
          {/* Campo de selección de productos */}
          <FormControl id="idProducto" isRequired>
            <FormLabel>Selecciona un Producto</FormLabel>
            <Select
              value={idProducto}
              onChange={(e) => setIdProducto(e.target.value)}
              placeholder="Selecciona un producto"
            >
              {productos.map(
                (
                  producto: Producto // Especificar tipo aquí
                ) => (
                  <option
                    key={producto.id_producto}
                    value={producto.id_producto}
                  >
                    {producto.nombre}
                  </option>
                )
              )}
            </Select>
          </FormControl>

          {/* Campo de entrada para la cantidad */}
          <FormControl id="cantidad" isRequired>
            <FormLabel>Cantidad</FormLabel>
            <Input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </FormControl>

          <Button type="submit" colorScheme="blue">
            Comprar
          </Button>
        </VStack>

        <Button mt={5} onClick={() => setQrVisible(true)} colorScheme="teal">
          Leer QR
        </Button>

        {qrVisible && (
          <Box mt={5} w="300px" mx="auto">
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: "environment" }}
            />
          </Box>
        )}

        {qrData && <Text mt={3}>Datos del QR: {qrData}</Text>}

        {mensaje && (
          <Text mt={3} color="red.500">
            {mensaje}
          </Text>
        )}
      </Box>
    </Center>
  );
}

export default App;
