import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Login from "./Login";
import Shell from "./Shell";
import Dashboard from "./Dashboard";
import Agentes from "./config/Agentes";
import Clientes from "./config/Clientes";
import ClienteEdit from "./config/ClienteEdit";
import Modulos from "./config/Modulos";
import Roles from "./config/Roles";

function Protected({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  if (loading) return <div className="login-wrap"><div className="login-card">Cargando…</div></div>;
  if (!me) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Shell /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="config/agentes" element={<Agentes />} />
        <Route path="config/clientes" element={<Clientes />} />
        <Route path="config/clientes/:id" element={<ClienteEdit />} />
        <Route path="config/modulos" element={<Modulos />} />
        <Route path="config/roles" element={<Roles />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
