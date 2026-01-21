import React from "react";
import {
  getMailConfig,
  updateMailConfig,
  testMailConnection,
  connectAzure,
  TipoSeguridad,
  MailConfig,
} from "../../lib/api";

export default function Configuracion() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Mail config
  const [config, setConfig] = React.useState<MailConfig>({
    id: null,
    tipoSeguridad: "NINGUNO",
    urlServidor: null,
    puerto: null,
    cuentaMail: null,
    usuarioMail: null,
    passwordMail: null,
    azureClientId: null,
    azureTenantId: null,
    azureClientSecret: null,
    azureConnected: false,
  });

  async function loadMailConfig() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMailConfig();
      setConfig(data);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadMailConfig();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateMailConfig({
        tipoSeguridad: config.tipoSeguridad,
        urlServidor: config.urlServidor || undefined,
        puerto: config.puerto || undefined,
        cuentaMail: config.cuentaMail || undefined,
        usuarioMail: config.usuarioMail || undefined,
        passwordMail: config.passwordMail || undefined,
        azureClientId: config.azureClientId || undefined,
        azureTenantId: config.azureTenantId || undefined,
        azureClientSecret: config.azureClientSecret || undefined,
      });
      setSuccess("Configuración guardada correctamente");
      await loadMailConfig();
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await testMailConnection();
      if (result.success) {
        setSuccess("Conexión exitosa");
      } else {
        setError(result.error || "Error de conexión");
      }
    } catch (e: any) {
      setError(e?.message ?? "Error al probar conexión");
    } finally {
      setTesting(false);
    }
  }

  async function handleAzureConnect() {
    setConnecting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await connectAzure();
      if (result.success) {
        setSuccess(result.message || "Conexión Azure establecida");
        await loadMailConfig();
      } else {
        setError(result.error || "Error al conectar con Azure");
      }
    } catch (e: any) {
      setError(e?.message ?? "Error al conectar con Azure");
    } finally {
      setConnecting(false);
    }
  }

  const isAzure = config.tipoSeguridad === "AZURE";

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Configuración Notificaciones</div>
        <button className="btn icon" onClick={loadMailConfig} disabled={loading} title="Refrescar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="small">Cargando...</div>
      ) : (
        <>
          {error && (
            <div style={{ padding: "12px", background: "#FEE2E2", color: "#DC2626", borderRadius: "8px", marginBottom: "16px" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: "12px", background: "#D1FAE5", color: "#059669", borderRadius: "8px", marginBottom: "16px" }}>
              {success}
            </div>
          )}

          <div className="card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>
              Configuración de Correo
            </h2>

            <form className="form" onSubmit={handleSave}>
              <div className="field">
                <div className="label">Tipo de Seguridad</div>
                <select
                  className="input"
                  value={config.tipoSeguridad}
                  onChange={(e) => setConfig({ ...config, tipoSeguridad: e.target.value as TipoSeguridad })}
                >
                  <option value="NINGUNO">Ninguno</option>
                  <option value="TLS">TLS</option>
                  <option value="SSL">SSL</option>
                  <option value="AZURE">Azure (Microsoft 365)</option>
                </select>
              </div>

              {!isAzure && (
                <>
                  <div className="field">
                    <div className="label">URL Servidor SMTP</div>
                    <input
                      className="input"
                      placeholder="smtp.example.com"
                      value={config.urlServidor || ""}
                      onChange={(e) => setConfig({ ...config, urlServidor: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <div className="label">Puerto</div>
                    <input
                      className="input"
                      type="number"
                      placeholder="587"
                      value={config.puerto || ""}
                      onChange={(e) => setConfig({ ...config, puerto: parseInt(e.target.value) || null })}
                    />
                  </div>
                </>
              )}

              <div className="field">
                <div className="label">Cuenta de Correo (From)</div>
                <input
                  className="input"
                  placeholder="noreply@example.com"
                  value={config.cuentaMail || ""}
                  onChange={(e) => setConfig({ ...config, cuentaMail: e.target.value })}
                />
              </div>

              {!isAzure && (
                <>
                  <div className="field">
                    <div className="label">Usuario</div>
                    <input
                      className="input"
                      placeholder="usuario"
                      value={config.usuarioMail || ""}
                      onChange={(e) => setConfig({ ...config, usuarioMail: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <div className="label">Password</div>
                    <input
                      className="input"
                      type="password"
                      placeholder="••••••••"
                      value={config.passwordMail || ""}
                      onChange={(e) => setConfig({ ...config, passwordMail: e.target.value })}
                    />
                  </div>
                </>
              )}

              {isAzure && (
                <>
                  <div className="field full" style={{ marginTop: "16px", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>
                      Configuración Azure / EntraID
                    </h3>
                  </div>

                  <div className="field">
                    <div className="label">Client ID</div>
                    <input
                      className="input"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={config.azureClientId || ""}
                      onChange={(e) => setConfig({ ...config, azureClientId: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <div className="label">Tenant ID</div>
                    <input
                      className="input"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={config.azureTenantId || ""}
                      onChange={(e) => setConfig({ ...config, azureTenantId: e.target.value })}
                    />
                  </div>

                  <div className="field full">
                    <div className="label">Client Secret</div>
                    <input
                      className="input"
                      type="password"
                      placeholder="••••••••"
                      value={config.azureClientSecret || ""}
                      onChange={(e) => setConfig({ ...config, azureClientSecret: e.target.value })}
                    />
                  </div>

                  <div className="field full" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleAzureConnect}
                      disabled={connecting || !config.azureClientId || !config.azureTenantId}
                    >
                      {connecting ? "Conectando..." : "Conectar con Azure"}
                    </button>
                    {config.azureConnected && (
                      <span style={{ color: "#059669", fontSize: "14px" }}>
                        Conectado
                      </span>
                    )}
                    {!config.azureConnected && config.id && (
                      <span style={{ color: "#B45309", fontSize: "14px" }}>
                        No conectado
                      </span>
                    )}
                  </div>
                </>
              )}

              <div className="field full" style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button className="btn primary" type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar configuración"}
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !config.id}
                >
                  {testing ? "Probando..." : "Probar conexión"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
