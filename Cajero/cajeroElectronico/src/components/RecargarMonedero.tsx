import { useState } from "react";
import {
  VStack,
  FormControl,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  useToast,
  Card,
} from "@chakra-ui/react";

interface Cliente {
  cedula: number;
  nombre: string;
}

interface RecargarMonederoProps {
  clientes: Cliente[];
}

const RecargarMonedero: React.FC<RecargarMonederoProps> = ({ clientes }) => {
  const [clienteId, setClienteId] = useState<number | undefined>(undefined);
  const [cantidadRecarga, setCantidadRecarga] = useState<number>(0);
  const [mensaje, setMensaje] = useState<string>("");
  const toast = useToast();

  const handleRecargarMonedero = async () => {
    if (clienteId === undefined || cantidadRecarga <= 0) {
      setMensaje(
        "Por favor, selecciona un cliente y una cantidad válida para recargar."
      );
      return;
    }

    const data = {
      cliente_id: clienteId,
      cantidad: cantidadRecarga,
    };

    try {
      const response = await fetch("http://localhost:3000/recargar-monedero", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error en la solicitud");
      }

      toast({
        title: "Recarga exitosa.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setClienteId(undefined);
      setCantidadRecarga(0);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? `Error en la recarga: ${error.message}`
          : "Ocurrió un error inesperado"
      );
    }
  };

  return (
    <Card padding={4} width="100%" mt={4} bg="gray.800">
      <VStack spacing={4} width="100%">
        <FormControl>
          <Select
            placeholder="Seleccionar cliente"
            onChange={(e) => setClienteId(Number(e.target.value))}
          >
            {clientes.map((cliente) => (
              <option key={cliente.cedula} value={cliente.cedula}>
                {cliente.nombre}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <NumberInput
            min={0}
            value={cantidadRecarga}
            onChange={(_, value) => setCantidadRecarga(value)}
          >
            <NumberInputField placeholder="Cantidad a recargar" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <Button onClick={handleRecargarMonedero} colorScheme="green">
          Recargar Monedero
        </Button>

        {mensaje && <p>{mensaje}</p>}
      </VStack>
    </Card>
  );
};

export default RecargarMonedero;
