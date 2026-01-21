import React from "react";
import "../../styles/collapsible.css";
import { createAgente, listAgentes, listRoles, setAgenteRoles } from "../../lib/api";

export default function Agentes() {
  const [items, setItems] = React.useState<any[]>([]);
  const [allRoles, setAllRoles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({ nombre: "", usuario: "", password: "", role: "AGENTE", email: "" });
  const [saving, setSaving] = React.useState(false);

  // Role assignment modal state
  const [editingAgente, setEditingAgente] = React.useState<any>(null);
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<string[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [agentes, roles] = await Promise.all([listAgentes(), listRoles()]);
      setItems(agentes);
      setAllRoles(roles);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  function openRoleModal(agente: any) {
    setEditingAgente(agente);
    const currentRoleIds = (agente.roles || []).map((r: any) => r.role.id);
    setSelectedRoleIds(currentRoleIds);
  }

  async function saveRoles() {
    if (!editingAgente) return;
    setSaving(true);
    setError(null);
    try {
      await setAgenteRoles(editingAgente.id, selectedRoleIds);
      setEditingAgente(null);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  function toggleRole(roleId: string) {
    setSelectedRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createAgente({
        nombre: form.nombre,
        usuario: form.usuario,
        password: form.password,
        role: form.role as any,
        email: form.email || undefined,
      });
      setForm({ nombre: "", usuario: "", password: "", role: "AGENTE", email: "" });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este agente?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await fetch(`http://localhost:8080/admin/agentes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error al eliminar");
    }
  }

return (
  <div className="grid">
    <div className="topbar">
      <div className="h1">Agentes</div>
      <button className="btn icon" onClick={load} disabled={loading} title="Refrescar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
    </div>

    <details className="card cardDetails collapsible">
      <summary className="cardSummary">
        <div className="h1">Crear agente</div>
      </summary>
      <div className="cardContent">
        <form className="form" onSubmit={onCreate}>
          <div className="field">
            <div className="label">Nombre</div>
            <input className="input" value={form.nombre} onChange={(e)=>setForm({...form,nombre:e.target.value})}/>
          </div>
          <div className="field">
            <div className="label">Usuario</div>
            <input className="input" value={form.usuario} onChange={(e)=>setForm({...form,usuario:e.target.value})}/>
          </div>
          <div className="field">
            <div className="label">Password</div>
            <input className="input" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/>
          </div>
          <div className="field">
            <div className="label">Email</div>
            <input className="input" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/>
          </div>
          <div className="field">
            <div className="label">Rol</div>
            <select className="input" value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})}>
              <option value="AGENTE">AGENTE</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="field full">
            <button className="btn primary" disabled={saving}>Crear agente</button>
          </div>
        </form>
      </div>
    </details>

    <details className="card cardDetails collapsible" open>
      <summary className="cardSummary">
        <div>
          <div className="h1">Lista de agentes</div>
          <div className="small" style={{ marginTop: 6 }}>{loading ? "Cargando..." : `${items.length} agente(s)`}</div>
        </div>
      </summary>
      <div className="cardContent">
        {error && <div className="small" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Roles RBAC</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.usuario}</td>
                <td>{a.nombre}</td>
                <td>{a.email ?? "-"}</td>
                <td>
                  {(a.roles || []).length > 0
                    ? (a.roles || []).map((r: any) => r.role.codigo).join(", ")
                    : <span style={{ color: "#9CA3AF" }}>Sin roles</span>
                  }
                </td>
                <td style={{ width: 200 }}>
                  <button className="btn" style={{ marginRight: 8 }} onClick={() => openRoleModal(a)}>Roles</button>
                  <button className="btn" onClick={() => onDelete(a.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>

    {/* Role assignment modal */}
    {editingAgente && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '500px', width: '100%', margin: '16px' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
              Asignar roles a {editingAgente.nombre}
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
              Selecciona los roles RBAC que tendrá este agente:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allRoles.map((role) => (
                <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', backgroundColor: selectedRoleIds.includes(role.id) ? '#EFF6FF' : 'white' }}>
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{role.codigo}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{role.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                      Permisos: {(role.permisos || []).map((p: any) => p.permission.codigo).join(", ") || "Ninguno"}
                    </div>
                  </div>
                </label>
              ))}
              {allRoles.length === 0 && (
                <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '20px' }}>No hay roles definidos</p>
              )}
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={() => setEditingAgente(null)}
              style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: '#374151', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={saveRoles}
              disabled={saving}
              style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
