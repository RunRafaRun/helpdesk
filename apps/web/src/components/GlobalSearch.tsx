import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LuSearch, LuX, LuLoader } from "react-icons/lu";
import { buscarTextoEnTareas, buscarTareaPorNumero, TextSearchResult } from "../lib/api";

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const navigate = useNavigate();
  
  // Text search state
  const [textQuery, setTextQuery] = useState("");
  const [textResults, setTextResults] = useState<TextSearchResult | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textDropdownOpen, setTextDropdownOpen] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);
  const textDropdownRef = useRef<HTMLDivElement>(null);
  
  // Number search state
  const [numeroQuery, setNumeroQuery] = useState("");
  const [numeroLoading, setNumeroLoading] = useState(false);
  const [numeroError, setNumeroError] = useState<string | null>(null);
  const numeroInputRef = useRef<HTMLInputElement>(null);

  // Debounce timeout ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close text dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textDropdownRef.current &&
        !textDropdownRef.current.contains(event.target as Node) &&
        textInputRef.current &&
        !textInputRef.current.contains(event.target as Node)
      ) {
        setTextDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Text search with debounce
  const handleTextSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setTextResults(null);
      setTextDropdownOpen(false);
      return;
    }

    setTextLoading(true);
    try {
      const results = await buscarTextoEnTareas(query, 10);
      setTextResults(results);
      setTextDropdownOpen(true);
    } catch (error) {
      console.error("Error searching:", error);
      setTextResults(null);
    } finally {
      setTextLoading(false);
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTextQuery(value);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      handleTextSearch(value);
    }, 300);
  };

  const handleTextClear = () => {
    setTextQuery("");
    setTextResults(null);
    setTextDropdownOpen(false);
    textInputRef.current?.focus();
  };

  const handleTextResultClick = (tareaId: string, comentarioId?: string) => {
    setTextDropdownOpen(false);
    setTextQuery("");
    setTextResults(null);
    // Navigate to task with optional comment anchor
    navigate(`/tareas/${tareaId}${comentarioId ? `#comment-${comentarioId}` : ""}`);
  };

  // Number search on Enter
  const handleNumeroKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && numeroQuery.trim()) {
      e.preventDefault();
      setNumeroLoading(true);
      setNumeroError(null);
      
      try {
        const tarea = await buscarTareaPorNumero(numeroQuery.trim());
        if (tarea) {
          setNumeroQuery("");
          navigate(`/tareas/${tarea.id}`);
        } else {
          setNumeroError("Tarea no encontrada");
          setTimeout(() => setNumeroError(null), 3000);
        }
      } catch (error) {
        console.error("Error searching by number:", error);
        setNumeroError("Error en la busqueda");
        setTimeout(() => setNumeroError(null), 3000);
      } finally {
        setNumeroLoading(false);
      }
    }
  };

  const handleNumeroClear = () => {
    setNumeroQuery("");
    setNumeroError(null);
    numeroInputRef.current?.focus();
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  // Truncate text with ellipsis around match
  const truncateAroundMatch = (text: string, query: string, maxLength = 100) => {
    if (!text) return "";
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);
    
    if (matchIndex === -1 || text.length <= maxLength) {
      return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    }
    
    const start = Math.max(0, matchIndex - 30);
    const end = Math.min(text.length, matchIndex + query.length + 70);
    
    let result = text.substring(start, end);
    if (start > 0) result = "..." + result;
    if (end < text.length) result = result + "...";
    
    return result;
  };

  return (
    <div className={`global-search ${className || ""}`}>
      {/* Text Search Field */}
      <div className="search-field text-search">
        <div className="search-input-wrapper">
          <LuSearch className="search-icon" size={14} />
          <input
            ref={textInputRef}
            type="text"
            placeholder="Busqueda de texto..."
            value={textQuery}
            onChange={handleTextChange}
            onFocus={() => textResults && textResults.items.length > 0 && setTextDropdownOpen(true)}
            className="search-input"
          />
          {textLoading && <LuLoader className="search-loading" size={14} />}
          {textQuery && !textLoading && (
            <button onClick={handleTextClear} className="search-clear">
              <LuX size={14} />
            </button>
          )}
        </div>
        
        {/* Text Search Results Dropdown */}
        {textDropdownOpen && textResults && (
          <div ref={textDropdownRef} className="search-dropdown">
            {textResults.items.length === 0 ? (
              <div className="search-no-results">No se encontraron resultados</div>
            ) : (
              <>
                <div className="search-results-header">
                  {textResults.total} resultado{textResults.total !== 1 ? "s" : ""}
                </div>
                <div className="search-results-list">
                  {textResults.items.map((result) => (
                    <div key={result.tarea.id} className="search-result-item">
                      <button
                        className="search-result-task"
                        onClick={() => handleTextResultClick(result.tarea.id)}
                      >
                        <span className="task-numero">{result.tarea.numero}</span>
                        <span className="task-cliente">{result.tarea.cliente.codigo}</span>
                        <span className="task-titulo">
                          {highlightMatch(result.tarea.titulo, textQuery)}
                        </span>
                      </button>
                      {result.comentarios.length > 0 && (
                        <div className="search-result-comments">
                          {result.comentarios.slice(0, 2).map((comentario) => (
                            <button
                              key={comentario.id}
                              className="search-result-comment"
                              onClick={() => handleTextResultClick(result.tarea.id, comentario.id)}
                            >
                              <span className="comment-author">
                                {comentario.creadoPorAgente?.nombre || "Cliente"}:
                              </span>
                              <span className="comment-text">
                                {highlightMatch(
                                  truncateAroundMatch(comentario.cuerpo || "", textQuery),
                                  textQuery
                                )}
                              </span>
                            </button>
                          ))}
                          {result.comentarios.length > 2 && (
                            <span className="comment-more">
                              +{result.comentarios.length - 2} comentarios mas
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Number Search Field */}
      <div className="search-field numero-search">
        <div className="search-input-wrapper">
          <LuSearch className="search-icon" size={14} />
          <input
            ref={numeroInputRef}
            type="text"
            placeholder="Numero de Tarea..."
            value={numeroQuery}
            onChange={(e) => {
              setNumeroQuery(e.target.value);
              setNumeroError(null);
            }}
            onKeyDown={handleNumeroKeyDown}
            className={`search-input ${numeroError ? "error" : ""}`}
          />
          {numeroLoading && <LuLoader className="search-loading" size={14} />}
          {numeroQuery && !numeroLoading && (
            <button onClick={handleNumeroClear} className="search-clear">
              <LuX size={14} />
            </button>
          )}
        </div>
        {numeroError && (
          <div className="search-error-tooltip">{numeroError}</div>
        )}
      </div>
    </div>
  );
}
