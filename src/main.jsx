import React from 'react';
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import { AppContextProvider } from "./context/AppContext.jsx";
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Clerk Publishable Key. Please check your .env file.");
}

console.log("Initializing Clerk with key:", PUBLISHABLE_KEY ? `${PUBLISHABLE_KEY.substring(0, 10)}...` : 'No key provided');

const clerkAppearance = {
  variables: {
    colorPrimary: '#6c47ff',
    colorText: '#111827',
    colorBackground: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  elements: {
    formButtonPrimary: {
      backgroundColor: '#6c47ff',
      '&:hover': {
        backgroundColor: '#5a3bd9'
      }
    },
    footerActionLink: {
      color: '#6c47ff',
      '&:hover': {
        color: '#5a3bd9'
      }
    }
  }
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={clerkAppearance}
      {...(import.meta.env.DEV && {
        debug: true,
        domain: window.location.hostname,
        signInUrl: '/sign-in',
        signUpUrl: '/sign-up',
        fallbackRedirectUrl: '/dashboard',
        forceRedirectUrl: '/dashboard'
      })}
    >
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </ClerkProvider>
  </React.StrictMode>
);
