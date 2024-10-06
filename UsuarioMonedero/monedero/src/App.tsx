import { useState } from "react";
import {
  Input,
  Button,
  Box,
  Text,
  Center,
  VStack,
  Spacer,
  //useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { QRCodeCanvas } from "qrcode.react";

// Definición de la interfaz Cliente para tipar los datos que se recibirán del servidor.
interface Cliente {
  cedula: number;
  nombre: string;
  email: string;
  num_telefono: string;
  codigo_qr: string;
  balance_monedero: number;
}

function App() {
  // Estados para manejar los datos del cliente
  const [cedula, setCedula] = useState<number | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [error, setError] = useState("");
  const [mostrarQR, setMostrarQR] = useState(false); // Para mostrar u ocultar el QR

  // Estados para manejar el registro de un nuevo cliente
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [numTelefono, setNumTelefono] = useState("");

  //const { toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue("gray.800", "gray.900");
  const boxBg = useColorModeValue("gray.700", "gray.800");
  const textColor = useColorModeValue("gray.100", "gray.300");

  // Función para buscar la información del cliente
  const buscarCliente = async () => {
    if (cedula === null || isNaN(cedula)) {
      setError("Por favor ingrese un número de cédula válido");
      return;
    }

    try {
      setError("");
      const response = await fetch(`http://localhost:3000/search/${cedula}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, Response: ${errorText}`
        );
      }

      const data = await response.json();
      if (data.length > 0) {
        setCliente(data[0]);
        setMostrarQR(false); // Reinicia la visualización del QR al buscar
      } else {
        setCliente(null);
        setError("Cliente no encontrado");
      }
    } catch (error) {
      setError("Error al buscar cliente: " + error);
      console.error(error);
    }
  };

  // Función para registrar un nuevo cliente
  const registrarCliente = async () => {
    if (!nombre || !email || !numTelefono) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          email,
          num_telefono: numTelefono,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error registrando cliente: ${errorText}`);
      }

      const data = await response.json();
      setCliente(data); // Cliente registrado exitosamente
      setMostrarQR(false); // Reinicia la visualización del QR
    } catch (error) {
      //setError("Error al registrar cliente: " + error.message);
    }
  };

  return (
    <Center height="100vh" bg={bgColor} color={textColor}>
      <Box
        maxW="400px"
        width="90%"
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        bg={boxBg}
        shadow="lg"
        minHeight={450}
        textAlign="center"
      >
        <VStack spacing={5}>
          {/* Si hay un cliente, mostrar los detalles */}
          {cliente ? (
            <>
              <Text fontSize="lg" fontWeight="bold">
                Cliente Encontrado/Registrado:
              </Text>
              <Text>Cédula: {cliente.cedula}</Text>
              <Text>Nombre: {cliente.nombre}</Text>
              <Text>Balance del Monedero: {cliente.balance_monedero}</Text>

              {/* Botón para mostrar el código QR */}
              <Button
                colorScheme="teal"
                variant="outline"
                onClick={() => setMostrarQR(!mostrarQR)}
              >
                {mostrarQR ? "Ocultar Código QR" : "Mostrar Código QR"}
              </Button>

              {mostrarQR && (
                <>
                  <Text mt={3}>Código QR:</Text>
                  <QRCodeCanvas value={cliente.codigo_qr} />
                </>
              )}

              <Spacer />
              <Button colorScheme="red" onClick={() => setCliente(null)}>
                Registrar o Buscar otro Cliente
              </Button>
            </>
          ) : (
            <>
              {/* Formulario para buscar cliente */}
              <Text fontSize="lg" fontWeight="bold">
                Buscar Cliente por Cédula:
              </Text>
              <Input
                placeholder="Cédula"
                type="number"
                value={cedula !== null ? cedula : ""}
                onChange={(e) => setCedula(parseInt(e.target.value))}
                bg="gray.600"
                color="gray.200"
              />
              <Button colorScheme="green" onClick={buscarCliente}>
                Buscar Cliente
              </Button>

              {error && <Text color="red.300">{error}</Text>}

              <Spacer />

              {/* Formulario para registrar un nuevo cliente */}
              <Text fontSize="lg" fontWeight="bold">
                Registrar Nuevo Cliente:
              </Text>
              <Input
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                bg="gray.600"
                color="gray.200"
              />
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                bg="gray.600"
                color="gray.200"
              />
              <Input
                placeholder="Número de teléfono"
                value={numTelefono}
                onChange={(e) => setNumTelefono(e.target.value)}
                bg="gray.600"
                color="gray.200"
              />
              <Button colorScheme="blue" onClick={registrarCliente}>
                Registrar Cliente
              </Button>
            </>
          )}
        </VStack>
      </Box>
    </Center>
  );
}

export default App;

