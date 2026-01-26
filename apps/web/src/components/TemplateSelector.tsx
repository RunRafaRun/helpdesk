import React from "react";
import { listPlantillas, Plantilla } from "../lib/api";
import { resolveWildcards, WildcardContext } from "../lib/wildcards";

interface TemplateSelectorProps {
  context: WildcardContext;
  onSelect: (resolvedHtml: string) => void;
  buttonLabel?: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}

export default function TemplateSelector({
  context,
  onSelect,
  buttonLabel = "Plantilla",
  buttonClassName = "btn",
  buttonStyle,
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [plantillas, setPlantillas] = React.useState<Plantilla[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Load templates when dropdown opens
  React.useEffect(() => {
    if (isOpen && plantillas.length === 0) {
      loadPlantillas();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  async function loadPlantillas() {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlantillas();
      setPlantillas(data);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar plantillas");
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(plantilla: Plantilla) {
    const resolvedHtml = resolveWildcards(plantilla.texto, context);
    onSelect(resolvedHtml);
    setIsOpen(false);
  }

  // Group templates by category
  const grouped = React.useMemo(() => {
    const result: Record<string, Plantilla[]> = {};
    plantillas.forEach((p) => {
      const cat = p.categoria || "General";
      if (!result[cat]) result[cat] = [];
      result[cat].push(p);
    });
    return result;
  }, [plantillas]);

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className={buttonClassName}
        style={buttonStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            minWidth: 280,
            maxWidth: 400,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          {loading && (
            <div style={{ padding: 16, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              Cargando...
            </div>
          )}

          {error && (
            <div style={{ padding: 16, textAlign: "center", color: "var(--danger)", fontSize: 13 }}>
              {error}
            </div>
          )}

          {!loading && !error && plantillas.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              No hay plantillas disponibles
            </div>
          )}

          {!loading && !error && plantillas.length > 0 && (
            <>
              {Object.entries(grouped).map(([category, categoryPlantillas]) => (
                <div key={category}>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "var(--bg-secondary)",
                      fontWeight: 600,
                      fontSize: 11,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {category}
                  </div>
                  {categoryPlantillas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect(p)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 12px",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>
                        {p.codigo}
                      </div>
                      {p.descripcion && (
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {p.descripcion}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          marginTop: 4,
                          maxHeight: 40,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.texto.replace(/<[^>]*>/g, " ").substring(0, 80)}...
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
