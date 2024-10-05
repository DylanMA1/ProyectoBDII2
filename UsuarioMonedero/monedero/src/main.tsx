import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ChakraBaseProvider, theme } from "@chakra-ui/react";

createRoot(document.getElementById("root")!).render(
  <ChakraBaseProvider theme={theme}>
    <App />
  </ChakraBaseProvider>
);
