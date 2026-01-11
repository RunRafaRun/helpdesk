import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/collapsible.css";
import { createCliente, listClientes } from "../../lib/api";

type Cliente = {
  id: string;
  codigo: string;
  descripcion?: string | null;
};

export default function Clientes() {
  const navigate = useNavigate();
  const [items, setItems] = React.useState<Cliente[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [clienteForm, setClienteForm] = React.useState({ codigo: "", descripcion: "" });
  const [savingCliente, setSavingCliente] = React.useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listClientes();
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function onCreateCliente(e: React.FormEvent) {
    e.preventDefault();
    setSavingCliente(true);
    setError(null);
    try {
      await createCliente({ codigo: clienteForm.codigo, descripcion: clienteForm.descripcion });
      setClienteForm({ codigo: "", descripcion: "" });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSavingCliente(false);
    }
  }

  return (
    <div className="grid">
      <div className="topbar">
        <div>
          <div className="h1">Clientes</div>
          <div className="h2">Catálogo de clientes y unidades comerciales</div>
        </div>
        <button className="btn" onClick={load} disabled={loading}>Refrescar</button>
      </div>

      {/* Crear arriba (colapsado al entrar) */}
      <details className="card cardDetails collapsible">
        <summary className="cardSummary">
          <div className="h1">Crear cliente</div>
        </summary>
        <div className="cardContent">
          <form className="form" onSubmit={onCreateCliente}>
            <div className="field">
              <div className="label">Código</div>
              <input className="input" value={clienteForm.codigo} onChange={(e)=>setClienteForm({ ...clienteForm, codigo: e.target.value })} />
            </div>
            <div className="field full">
              <div className="label">Descripción</div>
              <input className="input" value={clienteForm.descripcion} onChange={(e)=>setClienteForm({ ...clienteForm, descripcion: e.target.value })} />
            </div>
            <div className="field full">
              <button className="btn primary" disabled={savingCliente}>Crear cliente</button>
            </div>
          </form>
        </div>
      </details>

      {/* Lista debajo (abierta al entrar) */}
      <details className="card cardDetails collapsible" open>
        <summary className="cardSummary">
          <div>
            <div className="h1">Lista</div>
            <div className="small" style={{ marginTop: 6 }}>{loading ? "Cargando..." : `${items.length} cliente(s)`}</div>
          </div>
        </summary>
        <div className="cardContent">
          {error && <div className="small" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}

          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.codigo}</td>
                  <td>{c.descripcion ?? "-"}</td>
                  <td style={{ width: 240 }}>
                    <button className="btn" onClick={() => navigate(`/config/clientes/${c.id}`)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
