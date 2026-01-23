import React from "react";
import "../../styles/collapsible.css";
import { createAgente, updateAgente, listAgentes, listRoles, setAgenteRoles } from "../../lib/api";

export default function Agentes() {
  const [items, setItems] = React.useState<any[]>([]);
  const [allRoles, setAllRoles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({ nombre: "", usuario: "", password: "", role: "AGENTE", email: "" });
  const [saving, setSaving] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

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

  function resetForm() {
    setForm({ nombre: "", usuario: "", password: "", role: "AGENTE", email: "" });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(item: any) {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre,
      usuario: item.usuario,
      password: "", // Don't populate password for security
      role: item.role,
      email: item.email || ""
    });
    setShowForm(true);
    setError(null);
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.usuario.trim()) {
      setError("Nombre y usuario son obligatorios");
      return;
    }
    if (!editingId && !form.password.trim()) {
      setError("La contraseña es obligatoria para nuevos agentes");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateAgente(editingId, {
          nombre: form.nombre.trim(),
          usuario: form.usuario.trim(),
          role: form.role as any,
          email: form.email.trim() || null,
          ...(form.password.trim() && { password: form.password.trim() }),
        });
      } else {
        await createAgente({
          nombre: form.nombre.trim(),
          usuario: form.usuario.trim(),
          password: form.password.trim(),
          role: form.role as any,
          email: form.email.trim() || undefined,
        });
      }
      resetForm();
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

     <div className="card" style={{ padding: 24 }}>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
         <h2 style={{ fontSize: 18, fontWeight: 600 }}>Gestión de Agentes</h2>
         {!showForm && (
           <button className="btn primary" onClick={() => setShowForm(true)}>
             + Nuevo
           </button>
         )}
       </div>

       {showForm && (
         <form onSubmit={handleSubmit} style={{ padding: 16, background: "var(--bg-secondary)", borderRadius: 8, marginBottom: 16 }}>
           {error && (
             <div style={{ padding: 8, background: "#FEE2E2", color: "#DC2626", borderRadius: 4, marginBottom: 12, fontSize: 13 }}>
               {error}
             </div>
           )}
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
             <div className="field">
               <div className="label">Nombre *</div>
               <input
                 className="input"
                 value={form.nombre}
                 onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                 placeholder="Nombre completo"
               />
             </div>
             <div className="field">
               <div className="label">Usuario *</div>
               <input
                 className="input"
                 value={form.usuario}
                 onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                 placeholder="usuario123"
               />
             </div>
             <div className="field">
               <div className="label">Email</div>
               <input
                 className="input"
                 type="email"
                 value={form.email}
                 onChange={(e) => setForm({ ...form, email: e.target.value })}
                 placeholder="usuario@empresa.com"
               />
             </div>
             <div className="field">
               <div className="label">Rol</div>
               <select
                 className="input"
                 value={form.role}
                 onChange={(e) => setForm({ ...form, role: e.target.value })}
               >
                 <option value="AGENTE">AGENTE</option>
                 <option value="ADMIN">ADMIN</option>
               </select>
             </div>
           </div>
           <div className="field" style={{ marginBottom: 12 }}>
             <div className="label">
               {editingId ? "Nueva Contraseña (opcional)" : "Contraseña *"}
             </div>
             <input
               className="input"
               type="password"
               value={form.password}
               onChange={(e) => setForm({ ...form, password: e.target.value })}
               placeholder={editingId ? "Dejar vacío para mantener la actual" : "Contraseña segura"}
             />
           </div>
           <div style={{ display: "flex", gap: 8 }}>
             <button type="submit" className="btn primary" disabled={saving}>
               {saving ? "Guardando..." : editingId ? "Guardar" : "Crear"}
             </button>
             <button type="button" className="btn" onClick={resetForm} disabled={saving}>
               Cancelar
             </button>
           </div>
         </form>
       )}
     </div>

     <div className="card" style={{ padding: 24 }}>
       <div style={{ marginBottom: 16 }}>
         <h2 style={{ fontSize: 18, fontWeight: 600 }}>Lista de Agentes</h2>
         <div className="small" style={{ marginTop: 6, color: "var(--muted)" }}>{loading ? "Cargando..." : `${items.length} agente(s)`}</div>
       </div>
       {error && (
         <div style={{ padding: 8, background: "#FEE2E2", color: "#DC2626", borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
           {error}
         </div>
       )}
       {loading ? (
         <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
           Cargando agentes...
         </div>
       ) : (
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
                 <td style={{ width: 250 }}>
                   <div style={{ display: "flex", gap: 6 }}>
                     <button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => startEdit(a)}>
                       Editar
                     </button>
                     <button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openRoleModal(a)}>
                       Roles
                     </button>
                     <button
                       className="btn"
                       style={{ padding: "4px 8px", fontSize: 12, color: "var(--danger)" }}
                       onClick={() => onDelete(a.id)}
                     >
                       Eliminar
                     </button>
                   </div>
                 </td>
              </tr>
            ))}
          </tbody>
         </table>
       )}
     </div>

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
