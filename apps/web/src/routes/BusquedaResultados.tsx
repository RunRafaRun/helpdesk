import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { LuSearch, LuLoader, LuArrowLeft, LuMessageSquare } from "react-icons/lu";
import { buscarTextoEnTareas, TextSearchResult } from "../lib/api";

export default function BusquedaResultados() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [results, setResults] = useState<TextSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);

  // Search when query changes
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const data = await buscarTextoEnTareas(query, limit);
        setResults(data);
      } catch (error) {
        console.error("Error searching:", error);
        setResults(null);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [query, limit]);

  // Handle search form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length >= 2) {
      setQuery(trimmed);
      setSearchParams({ q: trimmed });
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="search-page-highlight">{part}</mark> : part
    );
  };

  // Strip HTML tags from text
  const stripHtml = (text: string) => {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, "");
  };

  // Truncate text with ellipsis around match, but show more text
  const truncateAroundMatch = (text: string, maxLength = 200) => {
    if (!text) return "";
    
    // Strip HTML tags first
    const cleanText = stripHtml(text);
    
    const lowerText = cleanText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);
    
    if (matchIndex === -1 || cleanText.length <= maxLength) {
      return cleanText.length > maxLength ? cleanText.substring(0, maxLength) + "..." : cleanText;
    }
    
    const start = Math.max(0, matchIndex - 60);
    const end = Math.min(cleanText.length, matchIndex + query.length + 140);
    
    let result = cleanText.substring(start, end);
    if (start > 0) result = "..." + result;
    if (end < cleanText.length) result = result + "...";
    
    return result;
  };

  return (
    <div className="search-results-page">
      <div className="search-results-header-bar">
        <button onClick={() => navigate(-1)} className="back-btn">
          <LuArrowLeft size={18} />
        </button>
        
        <form onSubmit={handleSubmit} className="search-results-form">
          <LuSearch className="search-form-icon" size={18} />
          <input
            type="text"
            placeholder="Buscar en tareas y comentarios..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="search-results-input"
            autoFocus
          />
          <button type="submit" className="search-submit-btn">
            Buscar
          </button>
        </form>
      </div>

      <div className="search-results-content">
        {loading ? (
          <div className="search-results-loading">
            <LuLoader className="spin" size={24} />
            <span>Buscando...</span>
          </div>
        ) : !query || query.length < 2 ? (
          <div className="search-results-empty">
            <LuSearch size={48} />
            <p>Ingresa al menos 2 caracteres para buscar</p>
          </div>
        ) : results && results.items.length === 0 ? (
          <div className="search-results-empty">
            <LuSearch size={48} />
            <p>No se encontraron resultados para "{query}"</p>
          </div>
        ) : results ? (
          <>
            <div className="search-results-summary">
              <span className="results-count">
                {results.total} resultado{results.total !== 1 ? "s" : ""} para "{query}"
              </span>
              {results.total > limit && (
                <button 
                  onClick={() => setLimit(limit + 50)} 
                  className="load-more-btn"
                >
                  Cargar mas resultados
                </button>
              )}
            </div>

            <div className="search-results-list-page">
              {results.items.map((item) => (
                <div key={item.tarea.id} className="search-result-card">
                  <Link to={`/tareas/${item.tarea.id}`} className="search-result-task-link">
                    <div className="search-result-task-header">
                      <span className="task-numero-badge">{item.tarea.numero}</span>
                      <span className="task-cliente-badge">{item.tarea.cliente.codigo}</span>
                      {item.tarea.estado && (
                        <span className="task-estado-badge">{item.tarea.estado.codigo}</span>
                      )}
                      {item.tarea.prioridad && (
                        <span 
                          className="task-prioridad-badge"
                          style={{ 
                            backgroundColor: item.tarea.prioridad.color || undefined 
                          }}
                        >
                          {item.tarea.prioridad.codigo}
                        </span>
                      )}
                    </div>
                    <h3 className="search-result-titulo">
                      {highlightMatch(item.tarea.titulo)}
                    </h3>
                  </Link>

                  {item.comentarios.length > 0 && (
                    <div className="search-result-comments-list">
                      <div className="comments-header">
                        <LuMessageSquare size={14} />
                        <span>{item.comentarios.length} comentario{item.comentarios.length !== 1 ? "s" : ""} con coincidencias</span>
                      </div>
                      {item.comentarios.map((comentario) => (
                        <Link
                          key={comentario.id}
                          to={`/tareas/${item.tarea.id}#comment-${comentario.id}`}
                          className="search-result-comment-card"
                        >
                          <div className="comment-meta">
                            <span className="comment-author">
                              {comentario.creadoPorAgente?.nombre || "Cliente"}
                            </span>
                            <span className="comment-date">
                              {new Date(comentario.createdAt).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <p className="comment-body">
                            {highlightMatch(truncateAroundMatch(comentario.cuerpo || ""))}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {results.total > results.items.length && (
              <div className="search-results-footer">
                <button 
                  onClick={() => setLimit(limit + 50)} 
                  className="load-more-btn"
                >
                  Cargar mas resultados ({results.items.length} de {results.total})
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
