import React from "react";
import { getWildcardsByCategory, Wildcard } from "../lib/wildcards";

interface WildcardPickerProps {
  onSelect: (token: string) => void;
  onClose: () => void;
  position?: "left" | "right";
  maxHeight?: number;
}

export default function WildcardPicker({
  onSelect,
  onClose,
  position = "right",
  maxHeight = 400,
}: WildcardPickerProps) {
  const wildcardsByCategory = getWildcardsByCategory();
  const [search, setSearch] = React.useState("");
  const [filteredCategories, setFilteredCategories] = React.useState(wildcardsByCategory);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Focus search input when opened
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!search.trim()) {
      setFilteredCategories(wildcardsByCategory);
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered: Record<string, Wildcard[]> = {};

    for (const [category, wildcards] of Object.entries(wildcardsByCategory)) {
      const matchingWildcards = wildcards.filter(
        (w) =>
          w.label.toLowerCase().includes(searchLower) ||
          w.token.toLowerCase().includes(searchLower) ||
          w.description.toLowerCase().includes(searchLower)
      );
      if (matchingWildcards.length > 0) {
        filtered[category] = matchingWildcards;
      }
    }

    setFilteredCategories(filtered);
  }, [search, wildcardsByCategory]);

  // Close on escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        [position]: 0,
        marginTop: 4,
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 100,
        width: 340,
        maxHeight,
        display: "flex",
        flexDirection: "column",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search box */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
        <input
          ref={inputRef}
          type="text"
          className="input"
          placeholder="Buscar variable..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", fontSize: 13, padding: "6px 10px" }}
        />
      </div>

      {/* Wildcards list */}
      <div style={{ overflow: "auto", flex: 1 }}>
        {Object.keys(filteredCategories).length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: 13,
            }}
          >
            No se encontraron variables
          </div>
        ) : (
          Object.entries(filteredCategories).map(([category, wildcards]) => (
            <div key={category}>
              <div
                style={{
                  padding: "8px 12px",
                  background: "var(--bg-secondary)",
                  fontWeight: 600,
                  fontSize: 12,
                  color: "var(--muted)",
                  position: "sticky",
                  top: 0,
                }}
              >
                {category}
              </div>
              {wildcards.map((w) => (
                <button
                  key={w.token}
                  type="button"
                  onClick={() => {
                    onSelect(w.token);
                    onClose();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontWeight: 500 }}>{w.label}</div>
                  <code style={{ fontSize: 11, color: "var(--muted)" }}>{w.token}</code>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
