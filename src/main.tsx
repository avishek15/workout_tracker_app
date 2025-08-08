import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convex } from "./lib/convexClient";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
    <ConvexAuthProvider client={convex}>
        <App />
    </ConvexAuthProvider>
);
