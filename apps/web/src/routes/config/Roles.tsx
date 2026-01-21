import React from "react";
import "../../styles/collapsible.css";
import { createRole, listPermisos, listRoles, setRolePermisos } from "../../lib/api";

export default function Roles() {
  const [roles, setRoles] = React.useState<any[]>([]);
  const [permisos, setPermisos] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [create, setCreate] = React.useState({ codigo: "", nombre: "", descripcion: "" });
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);
  const [selectedPerms, setSelectedPerms] = React.useState<Record<string, boolean>>({});
  const [saving, setSaving] = React.useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [r, p] = await Promise.all([listRoles(), listPermisos()]);
      setRoles(r);
      setPermisos(p.map((x) => x.codigo));
      if (!selectedRoleId && r?.[0]?.id) setSelectedRoleId(r[0].id);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  React.useEffect(() => {
    if (!selectedRoleId) return;
    const role = roles.find((x) => x.id === selectedRoleId);
    const current = new Set((role?.permisos ?? []).map((rp: any) => rp.permission.codigo));
    const next: Record<string, boolean> = {};
    for (const p of permisos) next[p] = current.has(p);
    setSelectedPerms(next);
  }, [selectedRoleId, roles, permisos]);

  async function onCreateRole(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createRole({ codigo: create.codigo, nombre: create.nombre, descripcion: create.descripcion || undefined });
      setCreate({ codigo: "", nombre: "", descripcion: "" });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  async function onSavePerms() {
    if (!selectedRoleId) return;
    setSaving(true);
    setError(null);
    try {
      const list = Object.entries(selectedPerms).filter(([_,v])=>v).map(([k])=>k);
      await setRolePermisos(selectedRoleId, list);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  
return (
  <div className="grid">
    <div className="topbar">
      <div className="h1">Roles y permisos</div>
      <button className="btn icon" onClick={load} disabled={loading} title="Refrescar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
    </div>

    <details className="card cardDetails collapsible">
      <summary className="cardSummary">
        <div className="h1">Crear rol</div>
      </summary>
      <div className="cardContent">
        <form className="form" onSubmit={onCreateRole}>
          <div className="field">
            <div className="label">Código</div>
            <input className="input" value={create.codigo} onChange={(e)=>setCreate({...create,codigo:e.target.value})}/>
          </div>
          <div className="field">
            <div className="label">Nombre</div>
            <input className="input" value={create.nombre} onChange={(e)=>setCreate({...create,nombre:e.target.value})}/>
          </div>
          <div className="field full">
            <div className="label">Descripción</div>
            <input className="input" value={create.descripcion} onChange={(e)=>setCreate({...create,descripcion:e.target.value})}/>
          </div>
          <div className="field full">
            <button className="btn primary" disabled={saving}>Crear rol</button>
          </div>
        </form>
      </div>
    </details>

    <details className="card cardDetails collapsible" open>
      <summary className="cardSummary">
        <div>
          <div className="h1">Lista de roles</div>
          <div className="small" style={{ marginTop: 6 }}>{loading ? "Cargando..." : `${roles.length} rol(es)`}</div>
        </div>
      </summary>
      <div className="cardContent">
        {error && <div className="small" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}
        <div className="form">
          <div className="field full">
            <div className="label">Seleccionar rol</div>
            <select className="input" value={selectedRoleId ?? ""} onChange={(e)=>setSelectedRoleId(e.target.value || null)}>
              <option value="">-- Selecciona --</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.codigo} — {r.nombre}</option>)}
            </select>
          </div>

          <div className="field full">
            <div className="label">Permisos del rol</div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {permisos.map((p) => (
                <label key={p} className="small" style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, border: "1px solid rgba(255,255,255,.08)", borderRadius: 10 }}>
                  <input type="checkbox" checked={!!selectedPerms[p]} onChange={(e)=>setSelectedPerms({ ...selectedPerms, [p]: e.target.checked })} />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field full">
            <button className="btn primary" disabled={saving || !selectedRoleId} onClick={onSavePerms} type="button">
              Guardar permisos del rol
            </button>
          </div>
        </div>
      </div>
    </details>
  </div>
);
}
