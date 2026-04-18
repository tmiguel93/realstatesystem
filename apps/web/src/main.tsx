import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/app/router";
import "@/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          className: "font-sans"
        }}
      />
    </AppProviders>
  </React.StrictMode>,
);

