import { createBrowserRouter, Navigate } from "react-router";
import Login from "../pages/login/Login";
import Register from "../pages/register/Register";
import AuthLayout from "../layouts/AuthLayout";
import AlreadyLoggedLayout from "../layouts/AlreadyLoggedLayout";
import { AppLayout } from "./components/AppLayout";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app" replace /> },
  {
    element: <AlreadyLoggedLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },

  {
    path: "/app",
    element: <AuthLayout />,
    children: [
      { index: true, element: <AppLayout /> },
    ],
  },

  { path: "*", element: <Navigate to="/app" replace /> },
]);
