/*import { useState, useEffect, FormEvent } from "react";
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
          {/* Campo de selección de productos 
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

          {/* Campo de entrada para la cantidad 
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

export default App;*/

//#####################################################################################

import { useState, useEffect } from "react";
import { QrReader } from "react-qr-reader";
import {
  Box,
  Button,
  FormControl,
  Heading,
  Text,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  List,
  Card,
  GridItem,
  Grid,
  Divider,
  useToast,
} from "@chakra-ui/react";

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad_disponible: number;
}

function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: number]: number;
  }>({});
  const [mensaje, setMensaje] = useState("");
  const [qrVisible, setQrVisible] = useState(false);
  const [qrData, setQrData] = useState("");
  const toast = useToast();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch("http://localhost:3000/productos");
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        console.error("Error fetching productos:", error);
        setMensaje("Error al cargar productos.");
      }
    };

    fetchProductos();
  }, []);

  const handleComprar = async () => {
    if (!qrData) {
      setMensaje(
        "Por favor, escanea el código QR del cliente antes de realizar la compra."
      );
      return;
    }

    const compras = Object.entries(selectedProducts)
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([id_producto, cantidad]) => ({
        id_producto: parseInt(id_producto),
        cantidad,
      }));

    if (compras.length === 0) {
      setMensaje("Por favor, selecciona al menos un producto para comprar.");
      return;
    }

    const data = {
      compras,
      cliente_id: qrData,
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
        Compra exitosa. Total costo: $${result.total_costo}. Nuevo balance: $${result.nuevo_balance}.
      );

      // Mostrar el toast de éxito
      toast({
        title: "Compra exitosa.",
        description: Total costo: $${result.total_costo}. Nuevo balance: $${result.nuevo_balance}.,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setSelectedProducts({});
      setQrData("");
    } catch (error) {
      if (error instanceof Error) {
        setMensaje(Error en la compra: ${error.message});
      } else {
        setMensaje("Ocurrió un error inesperado");
      }
    }
  };

  const handleScan = (result: any | null) => {
    if (result?.text) {
      setQrData(result.text);
      setQrVisible(false);
      handleComprar();
    }
  };

  const handleCantidadChange = (id: number, value: number) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const calcularTotalCompra = () => {
    return Object.entries(selectedProducts).reduce(
      (total, [id_producto, cantidad]) => {
        const producto = productos.find(
          (p) => p.id_producto === parseInt(id_producto)
        );
        return producto ? total + producto.precio * cantidad : total;
      },
      0
    );
  };

  return (
    <Grid
      templateAreas={"header header" "nav main"}
      gridTemplateRows={"70px 1fr 30px"}
      gridTemplateColumns={"1fr 550px"}
      width="100%"
      h="100vh"
      gap="1"
      color="blackAlpha.700"
      fontWeight="bold"
      padding={1}
    >
      <GridItem
        pl="2"
        area={"header"}
        padding={4}
        alignContent="center"
      >
        <Heading as="h1" mb={6}>
          Cajero electronico
        </Heading>
      </GridItem>
      <GridItem pl="2" bg="green.300" area={"nav"}>
        <Box className="App" textAlign="center" p={5} maxWidth={1000}>
          {qrVisible && (
            <Box mt={5} w="300px" mx="auto">
              <QrReader
                onResult={handleScan}
                constraints={{ facingMode: "environment" }}
              />
            </Box>
          )}

          {mensaje && (
            <Text mt={3} color="red.500">
              {mensaje}
            </Text>
          )}
        </Box>
      </GridItem>

      <GridItem pl="2" bg="pink.300" area={"main"} padding={4}>
        <Box padding={2}>
          <Heading marginBottom={2}>Lista de productos</Heading>
          <List
            spacing={2}
            overflow="scroll"
            maxHeight={430}
            marginBottom={4}
            css={{
              "&::-webkit-scrollbar": { display: "none" },
              "&": { msOverflowStyle: "none", scrollbarWidth: "none" },
            }}
          >
            {productos.map((producto) => (
              <Card key={producto.id_producto} p={2} width="100%">
                <HStack width="100%">
                  <VStack align="start" spacing={1} width="100%" flex="1">
                    <Text fontWeight="bold">{producto.nombre}</Text>
                    <Text fontWeight="normal">{producto.descripcion}</Text>
                    <Text fontWeight="normal">
                      Cantidad disponible: {producto.cantidad_disponible}
                    </Text>
                    <Text fontWeight="normal">Precio: {producto.precio}</Text>
                  </VStack>
                  <FormControl
                    id={cantidad-${producto.id_producto}}
                    isRequired
                    flex="0 0 80px"
                  >
                    <NumberInput
                      min={0}
                      value={selectedProducts[producto.id_producto] || 0}
                      max={producto.cantidad_disponible}
                      onChange={(_, value) =>
                        handleCantidadChange(producto.id_producto, value)
                      }
                      width="100%"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </HStack>
              </Card>
            ))}
          </List>
          <Divider bgColor="black" marginY={3} height={0.5} />
          <Text fontWeight="bold" fontSize={25}>
            Total a pagar: ${calcularTotalCompra()}
          </Text>
          <Button onClick={() => setQrVisible(true)} colorScheme="blue" mt={4}>
            Realizar cobro
          </Button>
        </Box>
      </GridItem>
    </Grid>
  );
}

export default App;
