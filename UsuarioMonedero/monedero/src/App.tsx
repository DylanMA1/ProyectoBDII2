/*import { useState } from "react";
import {
  Input,
  Button,
  Box,
  Text,
  Center,
  VStack,
  Spacer,
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
  // Estado para almacenar el número de cédula ingresado por el usuario.
  const [cedula, setCedula] = useState<number | null>(null);

  // Estado para almacenar los datos del cliente obtenidos del servidor.
  const [cliente, setCliente] = useState<Cliente | null>(null);

  // Estado para manejar mensajes de error durante la búsqueda del cliente.
  const [error, setError] = useState("");

  // Estado para controlar si el código QR se debe mostrar o no.
  const [mostrarQR, setMostrarQR] = useState(false);

  // Función para buscar la información del cliente en el servidor utilizando la cédula ingresada.
  const buscarCliente = async () => {
    // Validación de la cédula, se muestra un error si es inválida.
    if (cedula === null || isNaN(cedula)) {
      setError("Por favor ingrese un número de cédula válido");
      return;
    }

    try {
      // Se limpia cualquier error previo antes de realizar la solicitud.
      setError("");

      // Realiza la solicitud al servidor para obtener los datos del cliente.
      const response = await fetch(`http://localhost:3000/search/${cedula}`);

      // Si la respuesta del servidor no es correcta, lanza un error con el código y el mensaje del servidor.
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, Response: ${errorText}`
        );
      }

      // Procesa la respuesta del servidor en formato JSON.
      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      // Si el cliente fue encontrado, actualiza el estado con los datos del cliente y oculta el QR.
      if (data.length > 0) {
        setCliente(data[0]);
        setMostrarQR(false); // Reinicia la visualización del QR.
      } else {
        // Si no se encuentra el cliente, muestra un mensaje de error.
        setCliente(null);
        setError("Cliente no encontrado");
      }
    } catch (error) {
      // Manejo de errores durante la solicitud al servidor.
      setError("Error al buscar cliente: " + error);
      console.error(error);
    }
  };

  // Función para alternar entre mostrar y ocultar el código QR.
  const toggleCodigoQR = () => {
    setMostrarQR(!mostrarQR); // Cambia el estado entre true y false.
  };

  // Función para cerrar la sesión, limpiando el estado del cliente y la cédula ingresada.
  const cerrarSesion = () => {
    setCliente(null); // Limpia los datos del cliente.
    setCedula(null); // Limpia la cédula ingresada.
    setMostrarQR(false); // Oculta el código QR.
  };

  return (
    <Center height="100vh">
      <Box
        maxW="400px"
        width="90%"
        p={4}
        borderWidth="1px"
        borderRadius="md"
        minHeight={400}
        rounded="2xl"
        textAlign="center"
      >
        <VStack spacing={4}>
          {/* Mostrar el formulario para ingresar la cédula si no hay un cliente cargado 
          {!cliente && (
            <>
              {/* Campo de entrada para la cédula 
              <Input
                placeholder="Ingrese su cédula"
                type="number"
                value={cedula !== null ? cedula : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const numberValue = value ? parseInt(value, 10) : null;
                  setCedula(numberValue); // Actualiza el estado con el valor ingresado.
                  console.log(`Cédula actualizada: ${numberValue}`);
                }}
              />

              {/* Botón para buscar el cliente 
              <Button colorScheme="blue" onClick={buscarCliente}>
                Buscar Cliente
              </Button>
            </>
          )}

          {/* Si el cliente ha sido cargado, mostrar la información y opciones 
          {cliente && (
            <>
              {/* Mostrar los datos del cliente 
              <Box p={4} border="1px" borderRadius="md" borderColor="gray.200">
                <Text>Nombre: {cliente.nombre}</Text>
                <Text>Balance Monedero: {cliente.balance_monedero}</Text>
              </Box>

              <Spacer />

              {/* Botón para alternar la visualización del código QR 
              <Button colorScheme="green" onClick={toggleCodigoQR}>
                {mostrarQR ? "Ocultar QR" : "PAGAR"}
              </Button>

              {/* Contenedor para el código QR 
              <Box minHeight={128}>
                {mostrarQR && cliente.codigo_qr && (
                  <QRCodeCanvas
                    value={cliente.codigo_qr} // Código QR generado a partir del dato del cliente.
                    size={128} // Tamaño del código QR.
                    includeMargin={true} // Incluir margen en el QR.
                  />
                )}
              </Box>

              {/* Botón para actualizar los datos del cliente 
              <Button colorScheme="blue" onClick={buscarCliente}>
                Actualizar
              </Button>

              {/* Botón para cerrar sesión 
              <Button colorScheme="red" onClick={cerrarSesion} alignSelf="end">
                SALIR
              </Button>
            </>
          )}

          {/* Mensaje de error si existe algún problema durante la búsqueda 
          {error && <Text color="red.500">{error}</Text>}
        </VStack>
      </Box>
    </Center>
  );
}

export default App;*/

//###################################################################################################################

/*import { useState } from "react";
import {
  Input,
  Button,
  Box,
  Text,
  Center,
  VStack,
  Spacer,
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
  const [mostrarQR, setMostrarQR] = useState(false);

  // Estados para manejar el registro de un nuevo cliente
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [numTelefono, setNumTelefono] = useState("");

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
        setMostrarQR(true); // Mostrar el QR si se encuentra el cliente
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
    <Center height="100vh">
      <Box
        maxW="400px"
        width="90%"
        p={4}
        borderWidth="1px"
        borderRadius="md"
        minHeight={400}
        rounded="2xl"
        textAlign="center"
      >
        <VStack spacing={4}>
          {/* Si hay un cliente, mostrar los detalles 
          {cliente ? (
            <>
              <Text>Cliente Encontrado:</Text>
              <Text>Cédula: {cliente.cedula}</Text>
              <Text>Nombre: {cliente.nombre}</Text>
              <Text>Email: {cliente.email}</Text>
              <Text>Teléfono: {cliente.num_telefono}</Text>
              <Text>Balance del Monedero: {cliente.balance_monedero}</Text>

              {mostrarQR && (
                <>
                  <Text>Código QR:</Text>
                  <QRCodeCanvas value={cliente.codigo_qr} />
                </>
              )}

              <Spacer />
              <Button onClick={() => setCliente(null)}>
                Registrar o Buscar otro Cliente
              </Button>
            </>
          ) : (
            <>
              {/* Formulario para registrar un nuevo cliente 
              <Text>Registrar Nuevo Cliente:</Text>
              <Input
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Número de teléfono"
                value={numTelefono}
                onChange={(e) => setNumTelefono(e.target.value)}
              />
              <Button colorScheme="blue" onClick={registrarCliente}>
                Registrar Cliente
              </Button>

              <Spacer />

              {/* Formulario para buscar cliente 
              <Text>Buscar Cliente por Cédula:</Text>
              <Input
                placeholder="Cédula"
                type="number"
                value={cedula !== null ? cedula : ""}
                onChange={(e) => setCedula(parseInt(e.target.value))}
              />
              <Button colorScheme="green" onClick={buscarCliente}>
                Buscar Cliente
              </Button>

              {error && <Text color="red">{error}</Text>}
            </>
          )}
        </VStack>
      </Box>
    </Center>
  );
}

export default App;*/

//##################################################################################################################

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

