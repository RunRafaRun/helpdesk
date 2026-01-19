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

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const closeAllMenus = () => {
    setExpandedSections(new Set());
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hd_theme", theme);
  }, [theme]);


  return (
    <div className="container">
      <header className="topbar-nav">
        <div className="brand">
          <div className="logo">HD</div>
          <div>
            <h1>Helpdesk</h1>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end>Panel principal</NavLink>

          {hasPerm("CONFIG_NOTIFICACIONES") && (
            <div className="nav-section">
              <button
                className="nav-section-header"
                onClick={() => toggleSection("comunicaciones")}
              >
                <span>Comunicaciones</span>
                <span className={`nav-chevron ${expandedSections.has("comunicaciones") ? "expanded" : ""}`}>
                  ▼
                </span>
              </button>
              {expandedSections.has("comunicaciones") && (
                <div className="nav-submenu">
                  <NavLink to="/notificaciones" onClick={closeAllMenus}>Notificaciones Masivas</NavLink>
                </div>
              )}
            </div>
          )}

          {canConfig && (
            <div className="nav-section">
              <button
                className="nav-section-header"
                onClick={() => toggleSection("configuracion")}
              >
                <span>Configuración</span>
                <span className={`nav-chevron ${expandedSections.has("configuracion") ? "expanded" : ""}`}>
                  ▼
                </span>
              </button>
              {expandedSections.has("configuracion") && (
                <div className="nav-submenu">
                  {hasPerm("CONFIG_AGENTES") && <NavLink to="/config/agentes" onClick={closeAllMenus}>Agentes</NavLink>}
                  {(hasPerm("CONFIG_CLIENTES") || hasPerm("CONFIG_CLIENTES_READ")) && <NavLink to="/config/clientes" onClick={closeAllMenus}>Clientes</NavLink>}
                  {hasPerm("CONFIG_MODULOS") && <NavLink to="/config/modulos" onClick={closeAllMenus}>Módulos</NavLink>}
                  {hasPerm("CONFIG_RELEASES") && <NavLink to="/config/releases" onClick={closeAllMenus}>Releases</NavLink>}
                  {hasPerm("CONFIG_RBAC") && <NavLink to="/config/roles" onClick={closeAllMenus}>Roles y permisos</NavLink>}
                  {hasPerm("CONFIG_NOTIFICACIONES") && <NavLink to="/config/configuracion" onClick={closeAllMenus}>Configuración General</NavLink>}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="topbar-actions">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <button className="btn" onClick={() => { logout(); nav("/login"); }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}