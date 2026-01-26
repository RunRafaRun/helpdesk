import ClienteFichaView from "../pages/ClienteFichaView";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Login from "./Login";
import Shell from "./Shell";
import Dashboard from "./Dashboard";
import Tareas from "./Tareas";
import TareaFicha from "./TareaFicha";
import NuevaTarea from "./NuevaTarea";
import Agentes from "./config/Agentes";
import Clientes from "./config/Clientes";
import ClienteEdit from "./config/ClienteEdit";
import Modulos from "./config/Modulos";
import Releases from "./config/Releases";
import Roles from "./config/Roles";
import TiposTarea from "./config/TiposTarea";
import EstadosTarea from "./config/EstadosTarea";
import PrioridadesTarea from "./config/PrioridadesTarea";
import Plantillas from "./config/Plantillas";
import Configuracion from "./config/Configuracion";
import General from "./config/General";
import NotificacionesMasivas from "./NotificacionesMasivas";

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
        <Route path="tareas" element={<Tareas />} />
        <Route path="tareas/nueva" element={<NuevaTarea />} />
        <Route path="tareas/:id" element={<TareaFicha />} />
        <Route path="config/general" element={<General />} />
        <Route path="config/agentes" element={<Agentes />} />
        <Route path="config/clientes" element={<Clientes />} />
        <Route path="config/clientes/:id" element={<ClienteEdit />} />
        <Route path="config/modulos" element={<Modulos />} />
        <Route path="config/releases" element={<Releases />} />
        <Route path="config/roles" element={<Roles />} />
        <Route path="config/tipos-tarea" element={<TiposTarea />} />
        <Route path="config/estados-tarea" element={<EstadosTarea />} />
        <Route path="config/prioridades-tarea" element={<PrioridadesTarea />} />
        <Route path="config/plantillas" element={<Plantillas />} />
        <Route path="config/notificaciones" element={<Configuracion />} />
        <Route path="notificaciones" element={<NotificacionesMasivas />} />
        <Route path="clientes/:clienteCodigo/ficha" element={<ClienteFichaView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
