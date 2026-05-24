// src/app/App.tsx
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SavedProvider } from "./contexts/SavedContext";

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SavedProvider>
          {" "}
          {/* ← добавить вокруг RouterProvider */}
          <RouterProvider router={router} />
        </SavedProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
