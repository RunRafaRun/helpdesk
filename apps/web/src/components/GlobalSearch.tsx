import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LuSearch, LuX, LuLoader } from "react-icons/lu";
import { buscarTextoEnTareas, buscarTareaPorNumero, buscarTareaPorPatron, TextSearchResult, PatronSearchResult } from "../lib/api";

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
  const [numeroResults, setNumeroResults] = useState<PatronSearchResult | null>(null);
  const [numeroDropdownOpen, setNumeroDropdownOpen] = useState(false);
  const numeroInputRef = useRef<HTMLInputElement>(null);
  const numeroDropdownRef = useRef<HTMLDivElement>(null);

  // Debounce timeout ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numeroDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Text search dropdown
      if (
        textDropdownRef.current &&
        !textDropdownRef.current.contains(event.target as Node) &&
        textInputRef.current &&
        !textInputRef.current.contains(event.target as Node)
      ) {
        setTextDropdownOpen(false);
      }
      // Number search dropdown
      if (
        numeroDropdownRef.current &&
        !numeroDropdownRef.current.contains(event.target as Node) &&
        numeroInputRef.current &&
        !numeroInputRef.current.contains(event.target as Node)
      ) {
        setNumeroDropdownOpen(false);
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

  // Check if query contains wildcard
  const hasWildcard = (query: string) => query.includes("*");

  // Number/pattern search with debounce for wildcards
  const handleNumeroSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length < 2) {
      setNumeroResults(null);
      setNumeroDropdownOpen(false);
      return;
    }

    // If it has wildcard, search with pattern
    if (hasWildcard(trimmedQuery)) {
      setNumeroLoading(true);
      setNumeroError(null);
      try {
        const results = await buscarTareaPorPatron(trimmedQuery, 10);
        setNumeroResults(results);
        if (results.items.length === 0) {
          setNumeroError("No se encontraron tareas");
          setNumeroDropdownOpen(false);
        } else if (results.items.length === 1) {
          // Single result - navigate directly
          setNumeroQuery("");
          setNumeroResults(null);
          setNumeroDropdownOpen(false);
          navigate(`/tareas/${results.items[0].id}`);
        } else {
          // Multiple results - show dropdown
          setNumeroDropdownOpen(true);
        }
      } catch (error) {
        console.error("Error searching by pattern:", error);
        setNumeroError("Error en la busqueda");
      } finally {
        setNumeroLoading(false);
      }
    }
  }, [navigate]);

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumeroQuery(value);
    setNumeroError(null);

    // If has wildcard, debounce search
    if (hasWildcard(value)) {
      if (numeroDebounceRef.current) {
        clearTimeout(numeroDebounceRef.current);
      }
      numeroDebounceRef.current = setTimeout(() => {
        handleNumeroSearch(value);
      }, 400);
    } else {
      // No wildcard - close dropdown
      setNumeroResults(null);
      setNumeroDropdownOpen(false);
    }
  };

  // Number search on Enter (for exact match without wildcard)
  const handleNumeroKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && numeroQuery.trim()) {
      e.preventDefault();
      const trimmedQuery = numeroQuery.trim();
      
      // If has wildcard, trigger search (in case debounce hasn't fired yet)
      if (hasWildcard(trimmedQuery)) {
        if (numeroDebounceRef.current) {
          clearTimeout(numeroDebounceRef.current);
        }
        await handleNumeroSearch(trimmedQuery);
        return;
      }
      
      // Exact match search
      setNumeroLoading(true);
      setNumeroError(null);
      
      try {
        const tarea = await buscarTareaPorNumero(trimmedQuery);
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
    
    // Close dropdown on Escape
    if (e.key === "Escape") {
      setNumeroDropdownOpen(false);
    }
  };

  const handleNumeroClear = () => {
    setNumeroQuery("");
    setNumeroError(null);
    setNumeroResults(null);
    setNumeroDropdownOpen(false);
    numeroInputRef.current?.focus();
  };

  const handleNumeroResultClick = (tareaId: string) => {
    setNumeroDropdownOpen(false);
    setNumeroQuery("");
    setNumeroResults(null);
    navigate(`/tareas/${tareaId}`);
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

  // Highlight pattern match (for wildcard searches)
  const highlightPatternMatch = (numero: string, pattern: string) => {
    if (!pattern || !numero) return numero;
    
    // Extract the non-wildcard part
    const cleanPattern = pattern.replace(/\*/g, "");
    if (!cleanPattern) return numero;
    
    const index = numero.toLowerCase().indexOf(cleanPattern.toLowerCase());
    if (index === -1) return numero;
    
    const before = numero.substring(0, index);
    const match = numero.substring(index, index + cleanPattern.length);
    const after = numero.substring(index + cleanPattern.length);
    
    return (
      <>
        {before}
        <mark className="search-highlight">{match}</mark>
        {after}
      </>
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
            placeholder="Numero de Tarea... (*2492)"
            value={numeroQuery}
            onChange={handleNumeroChange}
            onKeyDown={handleNumeroKeyDown}
            onFocus={() => numeroResults && numeroResults.items.length > 1 && setNumeroDropdownOpen(true)}
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
        
        {/* Number Search Results Dropdown (for wildcard matches) */}
        {numeroDropdownOpen && numeroResults && numeroResults.items.length > 1 && (
          <div ref={numeroDropdownRef} className="search-dropdown numero-dropdown">
            <div className="search-results-header">
              {numeroResults.total} tarea{numeroResults.total !== 1 ? "s" : ""} encontrada{numeroResults.total !== 1 ? "s" : ""}
              {numeroResults.total > numeroResults.items.length && (
                <span className="search-results-more"> (mostrando {numeroResults.items.length})</span>
              )}
            </div>
            <div className="search-results-list">
              {numeroResults.items.map((tarea) => (
                <button
                  key={tarea.id}
                  className="search-result-task numero-result"
                  onClick={() => handleNumeroResultClick(tarea.id)}
                >
                  <span className="task-numero">
                    {highlightPatternMatch(tarea.numero, numeroQuery)}
                  </span>
                  <span className="task-cliente">{tarea.cliente.codigo}</span>
                  <span className="task-titulo">{tarea.titulo}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
