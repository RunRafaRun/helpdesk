export default function Dashboard() {
  return (
    <div className="grid">
      <div className="topbar">
        <div>
          <div className="h1">Panel principal</div>
          <div className="h2">Acceso rápido a configuración y maestros</div>
        </div>
      </div>

      <div className="card">
        <div className="h1">Configuración</div>
        <div className="small" style={{ marginTop: 6 }}>
          Desde el menú lateral podrás gestionar los maestros (Agentes, Clientes, Unidades comerciales).
        </div>
      </div>
    </div>
  );
}
