import { createBrowserRouter, Navigate } from "react-router";
import Login from "../pages/login/Login";
import Register from "../pages/register/Register";
import Landing from "../pages/landing/Landing";
import Dashboard from "../pages/dashboard/Dashboard";
import AuthLayout from "../layouts/AuthLayout";
import AlreadyLoggedLayout from "../layouts/AlreadyLoggedLayout";
import { AppLayout } from "./components/AppLayout";

export const router = createBrowserRouter([
  // Landing pública — si ya está logueado, AlreadyLoggedLayout lo redirige a /app
  {
    element: <AlreadyLoggedLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },

  // Zona autenticada
  {
    path: "/app",
    element: <AuthLayout />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/app/dashboard" replace /> },
          { path: "dashboard", element: <Dashboard /> },
          // Próximas páginas: portfolio, transactions, watchlist, search, stock/:ticker
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);
