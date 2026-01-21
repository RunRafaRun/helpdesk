import React, { useEffect, useRef, useState } from "react";
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
  const navRef = useRef<HTMLElement>(null);

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        // Close other menus when opening a new one
        newSet.clear();
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const closeAllMenus = () => {
    setExpandedSections(new Set());
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        closeAllMenus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

        <nav className="nav" ref={navRef}>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/tareas">Tareas</NavLink>

          {hasPerm("CONFIG_NOTIFICACIONES") && (
            <NavLink to="/notificaciones">Notificaciones Masivas</NavLink>
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
                  {hasPerm("CONFIG_GENERAL") && <NavLink to="/config/general" onClick={closeAllMenus}>General</NavLink>}
                  {hasPerm("CONFIG_AGENTES") && <NavLink to="/config/agentes" onClick={closeAllMenus}>Agentes</NavLink>}
                  {(hasPerm("CONFIG_CLIENTES") || hasPerm("CONFIG_CLIENTES_READ")) && <NavLink to="/config/clientes" onClick={closeAllMenus}>Clientes</NavLink>}
                  {hasPerm("CONFIG_MODULOS") && <NavLink to="/config/modulos" onClick={closeAllMenus}>Módulos</NavLink>}
                  {hasPerm("CONFIG_RELEASES") && <NavLink to="/config/releases" onClick={closeAllMenus}>Releases</NavLink>}
                  {hasPerm("CONFIG_RBAC") && <NavLink to="/config/roles" onClick={closeAllMenus}>Roles y permisos</NavLink>}
                  {hasPerm("CONFIG_MAESTROS") && <NavLink to="/config/tipos-tarea" onClick={closeAllMenus}>Tipos Tarea</NavLink>}
                  {hasPerm("CONFIG_MAESTROS") && <NavLink to="/config/estados-tarea" onClick={closeAllMenus}>Estados Tarea</NavLink>}
                  {hasPerm("CONFIG_MAESTROS") && <NavLink to="/config/prioridades-tarea" onClick={closeAllMenus}>Prioridades Tarea</NavLink>}
                  {hasPerm("CONFIG_NOTIFICACIONES") && <NavLink to="/config/notificaciones" onClick={closeAllMenus}>Configuración Notificaciones</NavLink>}
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