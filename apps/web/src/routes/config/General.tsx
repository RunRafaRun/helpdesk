import React, { useState, useEffect } from "react";
import { getSiteConfig, updateSiteConfig, SiteConfig } from "../../lib/api";

export default function General() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteName: "",
    siteUrl: "",
    siteLogo: "",
    sslCertificate: "",
    sslKey: "",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSiteConfig();
      setConfig(data);
      setForm({
        siteName: data.siteName || "",
        siteUrl: data.siteUrl || "",
        siteLogo: data.siteLogo || "",
        sslCertificate: data.sslCertificate || "",
        sslKey: data.sslKey || "",
      });
    } catch (e: any) {
      setError(e?.message || "Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateSiteConfig(form);
      setConfig(updated);
      setSuccess("Configuración guardada correctamente");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || "Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid">
        <div style={{ padding: 24, textAlign: "center" }}>Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="topbar">
        <div>
          <div className="h1">Configuración General</div>
          <div className="h2">Ajustes del sitio, logo y certificados</div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FEE2E2", color: "#DC2626", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: "#D1FAE5", color: "#059669", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {success}
        </div>
      )}

      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Información del Sitio</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="field">
            <label className="label">Nombre del Sitio</label>
            <input
              className="input"
              type="text"
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              placeholder="Helpdesk"
            />
            <div className="small" style={{ marginTop: 4, color: "var(--muted)" }}>
              Este nombre aparecerá en el título del navegador y en el header
            </div>
          </div>

          <div className="field">
            <label className="label">URL Base del Sitio</label>
            <input
              className="input"
              type="url"
              value={form.siteUrl}
              onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
              placeholder="https://helpdesk.ejemplo.com"
            />
            <div className="small" style={{ marginTop: 4, color: "var(--muted)" }}>
              URL completa incluyendo protocolo (https://)
            </div>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label className="label">Logo del Sitio (URL)</label>
            <input
              className="input"
              type="text"
              value={form.siteLogo}
              onChange={(e) => setForm({ ...form, siteLogo: e.target.value })}
              placeholder="https://ejemplo.com/logo.png o data:image/png;base64,..."
            />
            <div className="small" style={{ marginTop: 4, color: "var(--muted)" }}>
              URL del logo o imagen en formato base64
            </div>
            {form.siteLogo && form.siteLogo.startsWith("http") && (
              <div style={{ marginTop: 8 }}>
                <img src={form.siteLogo} alt="Logo preview" style={{ maxHeight: 60, maxWidth: 200 }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Certificados SSL (Opcional)</div>
        <div className="small" style={{ marginBottom: 16, color: "var(--muted)" }}>
          Solo necesario si desea configurar SSL personalizado. Deje vacío para usar la configuración por defecto del servidor.
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div className="field">
            <label className="label">Certificado SSL (PEM)</label>
            <textarea
              className="input"
              rows={4}
              value={form.sslCertificate}
              onChange={(e) => setForm({ ...form, sslCertificate: e.target.value })}
              placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </div>

          <div className="field">
            <label className="label">Clave Privada SSL (PEM)</label>
            <textarea
              className="input"
              rows={4}
              value={form.sslKey}
              onChange={(e) => setForm({ ...form, sslKey: e.target.value })}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
            <div className="small" style={{ marginTop: 4, color: "#F59E0B" }}>
              Nota: La clave privada se almacenará de forma segura
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn primary" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>
        <button className="btn" onClick={loadConfig} disabled={loading}>
          Recargar
        </button>
      </div>
    </div>
  );
}
