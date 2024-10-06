/**
 * Componente App: Formulario de compra de productos integrado con funcionalidad de escaneo de códigos QR.
 * El formulario recolecta el ID del producto y la cantidad, y requiere escanear un código QR del cliente antes de enviar la compra.
 *
 * Funcionalidades:
 * - Lector de códigos QR para obtener la información del cliente.
 * - Campos de entrada para el ID del producto y la cantidad.
 * - Integración con una API de backend para procesar la compra.
 *
 * Dependencias:
 * - React hooks para manejo de estado.
 * - Chakra UI para los componentes de UI.
 * - Componente QrReader para leer códigos QR.
 */

import { useState, FormEvent } from "react"; // Importaciones de React para manejo de estado y formularios
import { QrReader } from "react-qr-reader"; // Componente para lectura de códigos QR
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  VStack,
  Center,
} from "@chakra-ui/react"; // Componentes de Chakra UI para estructura y estilos

/**
 * Componente principal que renderiza un formulario para manejar la compra de productos.
 * Incluye campos de entrada para el ID del producto y la cantidad, un lector de códigos QR para los datos del cliente,
 * y un botón de envío para procesar la compra.
 */
function App() {
  // Hooks de estado para los inputs del formulario y el manejo de datos del QR
  const [idProducto, setIdProducto] = useState(""); // ID del producto ingresado por el usuario
  const [cantidad, setCantidad] = useState(""); // Cantidad del producto ingresada por el usuario
  const [mensaje, setMensaje] = useState(""); // Mensaje para retroalimentación de éxito/error
  const [qrVisible, setQrVisible] = useState(false); // Controla la visibilidad del lector de QR
  const [qrData, setQrData] = useState(""); // Datos extraídos del código QR escaneado

  /**
   * Maneja el envío del formulario para la compra de productos.
   * Evita el comportamiento por defecto del formulario, valida la presencia de datos del QR,
   * y envía una solicitud POST al servidor para procesar la compra.
   *
   * @param event - Evento de envío del formulario
   */
  const handleComprar = async (event: FormEvent) => {
    event.preventDefault(); // Evita el comportamiento por defecto del formulario

    // Verifica si el código QR ha sido escaneado antes de continuar
    if (!qrData) {
      setMensaje(
        "Por favor, escanea el código QR del cliente antes de realizar la compra."
      );
      return;
    }

    // Objeto de datos que se enviará al backend
    const data = {
      id_producto: parseInt(idProducto), // Convierte el ID del producto a entero
      cantidad: parseInt(cantidad), // Convierte la cantidad a entero
      cliente_id: qrData, // ID del cliente obtenido del código QR
    };

    try {
      // Solicitud POST al backend para procesar la compra
      const response = await fetch("http://localhost:3000/comprar-producto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Establece los headers para solicitud JSON
        },
        body: JSON.stringify(data), // Convierte el objeto de datos a una cadena JSON
      });

      // Verifica si la solicitud fue exitosa
      if (!response.ok) {
        throw new Error("Error en la solicitud"); // Lanza un error si la respuesta no es exitosa
      }

      // Analiza la respuesta del servidor
      const result = await response.json();
      // Actualiza el mensaje de éxito con detalles de la respuesta
      setMensaje(
        `Compra exitosa. Total costo: $${result.total_costo}. Nuevo balance: $${result.nuevo_balance}.`
      );
    } catch (error) {
      // Maneja y muestra cualquier error que ocurra durante la solicitud
      if (error instanceof Error) {
        setMensaje(`Error en la compra: ${error.message}`);
      } else {
        setMensaje("Ocurrió un error inesperado");
      }
    }
  };

  /**
   * Callback para manejar el resultado del escaneo del código QR.
   * Guarda los datos del QR en el estado y oculta el lector de QR después de un escaneo exitoso.
   *
   * @param result - El resultado del escaneo del QR que contiene la información del cliente
   */
  const handleScan = (result: any | null) => {
    if (result?.text) {
      setQrData(result.text); // Guarda los datos del QR escaneado en el estado
      setQrVisible(false); // Oculta el lector de QR después de escanear
    }
  };

  return (
    <Center height="100vh">
      {/* Contenedor principal con contenido centrado */}
      <Box className="App" textAlign="center" p={5} maxWidth={1000}>
        {/* Título del formulario */}
        <Heading as="h1" mb={6}>
          Comprar Productos
        </Heading>

        {/* Formulario para la compra de productos */}
        <VStack as="form" onSubmit={handleComprar} spacing={5}>
          {/* Campo de entrada para el ID del producto */}
          <FormControl id="idProducto" isRequired>
            <FormLabel>ID del Producto</FormLabel>
            <Input
              type="text"
              value={idProducto}
              onChange={(e) => setIdProducto(e.target.value)}
            />
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

          {/* Botón de envío del formulario */}
          <Button type="submit" colorScheme="blue">
            Comprar
          </Button>
        </VStack>

        {/* Botón para mostrar el lector de QR */}
        <Button mt={5} onClick={() => setQrVisible(true)} colorScheme="teal">
          Leer QR
        </Button>

        {/* Componente lector de QR, visible solo cuando qrVisible es true */}
        {qrVisible && (
          <Box mt={5} w="300px" mx="auto">
            <QrReader
              onResult={handleScan} // Callback para el resultado del escaneo del QR
              constraints={{ facingMode: "environment" }} // Usa la cámara trasera en dispositivos móviles
            />
          </Box>
        )}

        {/* Muestra los datos escaneados del QR */}
        {qrData && <Text mt={3}>Datos del QR: {qrData}</Text>}

        {/* Muestra mensajes de error o éxito */}
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
