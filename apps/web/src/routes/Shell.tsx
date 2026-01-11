import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Shell() {
  const { me, logout } = useAuth();
  const nav = useNavigate();
  const perms = new Set(me?.permisos ?? []);
  const canConfig = Array.from(perms).some((p) => p.startsWith("CONFIG_"));
  const hasPerm = (p: string) => perms.has(p);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("hd_theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hd_theme", theme);
  }, [theme]);


  return (
    <div className="container">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">HD</div>
          <div>
            <h1>Helpdesk</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <div className="badge">{me?.usuario} · {me?.role}</div>
              <button
                className="themeToggle"
                aria-label="Cambiar tema"
                title="Cambiar tema"
                onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              >
                <span className={theme === "light" ? "on" : ""}>☀</span>
                <span className={theme === "dark" ? "on" : ""}>🌙</span>
              </button>
            </div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end>Panel principal</NavLink>

          {canConfig && (
            <>
              <div className="small" style={{ marginTop: 10, padding: "0 10px" }}>Configuración</div>
              {hasPerm("CONFIG_AGENTES") && <NavLink to="/config/agentes">Agentes</NavLink>}
              {hasPerm("CONFIG_CLIENTES") && <NavLink to="/config/clientes">Clientes</NavLink>}
              {hasPerm("CONFIG_MODULOS") && <NavLink to="/config/modulos">Módulos</NavLink>}
              {hasPerm("CONFIG_RBAC") && <NavLink to="/config/roles">Roles & permisos</NavLink>}
            </>
          )}
        </nav>

        <div style={{ marginTop: "auto" }}>
<button className="btn" style={{ width: "100%", marginTop: 16 }}
            onClick={() => { logout(); nav("/login"); }}>
            Cerrar sesión
          </button>
          <div className="small" style={{ marginTop: 10 }}>
            UI moderna inicial (MVP). Seguiremos iterando.
          </div>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}