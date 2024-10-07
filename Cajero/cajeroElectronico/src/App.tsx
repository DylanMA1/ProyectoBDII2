import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  List,
  Card,
  GridItem,
  Grid,
  Divider,
  FormControl,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
} from "@chakra-ui/react";
import RecargarMonedero from "./components/RecargarMonedero";
import AgregarProducto from "./components/AgregarProducto";
import { QrReader } from "react-qr-reader";

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad_disponible: number;
}

interface Cliente {
  cedula: number;
  nombre: string;
}

function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: number]: number;
  }>({});
  const [mensaje, setMensaje] = useState("");
  const [qrVisible, setQrVisible] = useState(false);
  const [qrData, setQrData] = useState("");
  const toast = useToast();

  useEffect(() => {
    fetchProductos();
    fetchClientes();
  }, []);

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

  const fetchClientes = async () => {
    try {
      const response = await fetch("http://localhost:3000/clientes");
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error("Error fetching clientes:", error);
      setMensaje("Error al cargar clientes.");
    }
  };

  const handleScan = (result: any | null) => {
    if (result?.text) {
      setQrData(result.text);
      setQrVisible(false);
      handleComprar();
    }
  };

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
        `Compra exitosa. Total costo: $${result.total_costo}. Nuevo balance: $${result.nuevo_balance}.`
      );

      // Mostrar el toast de éxito
      toast({
        title: "Compra exitosa.",
        description: `Total costo: $${result.total_costo}. Nuevo balance: $${result.nuevo_balance}.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setSelectedProducts({});
      setQrData("");
    } catch (error) {
      if (error instanceof Error) {
        setMensaje(`Error en la compra: ${error.message}`);
      } else {
        setMensaje("Ocurrió un error inesperado");
      }
    }
  };

  return (
    <Grid
      templateAreas={`"header header" "nav main"`}
      gridTemplateRows={"70px 1fr 30px"}
      gridTemplateColumns={"1fr 550px"}
      width="100%"
      h="100vh"
      gap="1"
      color="blackAlpha.700"
      fontWeight="bold"
      padding={1}
    >
      <GridItem pl="2" area={"header"} padding={4} alignContent="center">
        <Heading as="h1" mb={6}>
          Cajero electronico
        </Heading>
      </GridItem>

      <GridItem pl="2" bg="green.300" area={"nav"} padding={4}>
        <HStack width="100%" spacing={4} alignItems="stretch">
          <RecargarMonedero
            clientes={clientes}
            onRecargaExitosa={() => console.log("Recarga exitosa")}
          />
          <AgregarProducto onProductoAgregado={fetchProductos} />
        </HStack>

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
                  <FormControl isRequired flex="0 0 80px">
                    <NumberInput
                      min={0}
                      value={selectedProducts[producto.id_producto] || 0}
                      max={producto.cantidad_disponible}
                      onChange={(_, value) =>
                        setSelectedProducts((prev) => ({
                          ...prev,
                          [producto.id_producto]: value,
                        }))
                      }
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </HStack>
                <Divider />
              </Card>
            ))}
          </List>

          <Button
            colorScheme="teal"
            marginY={4}
            onClick={() => setQrVisible(!qrVisible)}
          >
            {qrVisible ? "Ocultar" : "Mostrar"} QR
          </Button>
        </Box>
      </GridItem>
    </Grid>
  );
}

export default App;