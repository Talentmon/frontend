import React from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { CurrentUserProvider } from "./lib/CurrentUserContext";
import Routes from "./Routes";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <CurrentUserProvider>
        <Routes />
      </CurrentUserProvider>
    </ClerkProvider>
  );
}

export default App;
