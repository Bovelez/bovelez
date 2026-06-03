import { createBrowserRouter, Navigate } from "react-router";
import Login from "../pages/login/Login";
import Register from "../pages/register/Register";
import Landing from "../pages/landing/Landing";
import Dashboard from "../pages/dashboard/Dashboard";
import Portfolio from "../pages/portfolio/Portfolio";
import Transactions from "../pages/transactions/Transactions";
import AuthLayout from "../layouts/AuthLayout";
import AlreadyLoggedLayout from "../layouts/AlreadyLoggedLayout";
import { AppLayout } from "./components/AppLayout";

export const router = createBrowserRouter([
  {
    element: <AlreadyLoggedLayout />,
    children: [
      { path: "/",         element: <Landing />  },
      { path: "/login",    element: <Login />    },
      { path: "/register", element: <Register /> },
    ],
  },
  {
    path: "/app",
    element: <AuthLayout />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true,           element: <Navigate to="/app/dashboard" replace /> },
          { path: "dashboard",     element: <Dashboard />    },
          { path: "portfolio",     element: <Portfolio />    },
          { path: "transactions",  element: <Transactions /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
