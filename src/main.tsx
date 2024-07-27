import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import {ImmutableZkevmTestnet} from "@thirdweb-dev/chains";
import "./styles/globals.css";
import { Toaster } from "./components/ui/Toaster";

import {
  clientIdConst,
} from "./consts/parameters";


const container = document.getElementById("root");
const root = createRoot(container!);
const urlParams = new URL(window.location.toString()).searchParams;

const clientId = urlParams.get("clientId") || clientIdConst || "";

root.render(
  <React.StrictMode>
    {
    //<ThirdwebProvider activeChain={ImmutableZkevmTestnet} clientId={clientId}>
    }
    {
      //<ThirdwebProvider activeChain="localhost" clientId={clientId} >
    }
    <ThirdwebProvider activeChain={ImmutableZkevmTestnet} clientId={clientId}>
      <Toaster />
      <App />
    </ThirdwebProvider>
  </React.StrictMode>,
);
