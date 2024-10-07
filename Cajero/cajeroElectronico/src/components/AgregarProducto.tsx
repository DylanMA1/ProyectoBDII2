import { useState } from "react";
import {
  VStack,
  FormControl,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Heading,
  useToast,
  Card,
} from "@chakra-ui/react";

interface AgregarProductoProps {
  onProductoAgregado: () => void;
}

const AgregarProducto: React.FC<AgregarProductoProps> = ({
  onProductoAgregado,
}) => {
  const [nombreProducto, setNombreProducto] = useState<string>("");
  const [descripcionProducto, setDescripcionProducto] = useState<string>("");
  const [precioProducto, setPrecioProducto] = useState<number>(0);
  const [cantidadProducto, setCantidadProducto] = useState<number>(0);
  const [idNodo, setIdNodo] = useState<number | string>(""); // Nuevo estado para id_nodo
  const [mensaje, setMensaje] = useState("");
  const toast = useToast();

  const handleAgregarProducto = async () => {
    if (
      !nombreProducto ||
      !descripcionProducto ||
      precioProducto <= 0 ||
      cantidadProducto <= 0 ||
      !idNodo // Verifica que id_nodo esté completo
    ) {
      setMensaje("Por favor, completa todos los campos con valores válidos.");
      return;
    }

    const data = {
      nombre: nombreProducto,
      descripcion: descripcionProducto,
      precio: precioProducto,
      cantidad: cantidadProducto,
      id_nodo: idNodo, // Incluye id_nodo en los datos
    };

    // Imprimir los datos en consola
    console.log("Datos a agregar:", data);

    try {
      const response = await fetch("http://localhost:3000/agregar-producto", {
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
      setMensaje(`Producto agregado exitosamente: ${result.message}`);

      // Mostrar toast de éxito
      toast({
        title: "Producto agregado.",
        description: "El producto ha sido agregado exitosamente.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Limpiar los campos del formulario
      setNombreProducto("");
      setDescripcionProducto("");
      setPrecioProducto(0);
      setCantidadProducto(0);
      setIdNodo(""); // Limpiar id_nodo

      // Llamar al callback para recargar la lista de productos
      onProductoAgregado();
    } catch (error) {
      if (error instanceof Error) {
        setMensaje(`Error al agregar producto: ${error.message}`);
      } else {
        setMensaje("Ocurrió un error inesperado.");
      }
    }
  };

  return (
    <Card padding={4} width="100%" mt={4}>
      <VStack spacing={4} marginY={4} width="100%">
        <Heading size="md" alignSelf="flex-start">
          Agregar Producto
        </Heading>

        <FormControl>
          <Input
            value={nombreProducto}
            onChange={(e) => setNombreProducto(e.target.value)}
            placeholder="Nombre del producto"
          />
        </FormControl>

        <FormControl>
          <Input
            value={descripcionProducto}
            onChange={(e) => setDescripcionProducto(e.target.value)}
            placeholder="Descripción del producto"
          />
        </FormControl>

        <FormControl>
          <NumberInput
            value={precioProducto}
            onChange={(_, value) => setPrecioProducto(value)}
          >
            <NumberInputField placeholder="Precio del producto" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <NumberInput
            value={cantidadProducto}
            onChange={(_, value) => setCantidadProducto(value)}
          >
            <NumberInputField placeholder="Cantidad disponible" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        {/* Nuevo campo para id_nodo */}
        <FormControl>
          <Input
            value={idNodo}
            onChange={(e) => setIdNodo(e.target.value)}
            placeholder="ID del nodo"
          />
        </FormControl>

        <Button onClick={handleAgregarProducto} colorScheme="teal" width="50%">
          Agregar Producto
        </Button>

        {mensaje && <p style={{ color: "red" }}>{mensaje}</p>}
      </VStack>
    </Card>
  );
};

export default AgregarProducto;
