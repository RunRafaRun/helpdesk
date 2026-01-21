import React from "react";
import { useNavigate, useParams } from "react-router-dom"; import "../../styles/collapsible.css"; import { getCliente, listUnidades, listUsuariosCliente, listContactos, createContacto, updateContacto, deactivateContacto, createUnidad, updateUnidad, createUsuarioCliente, updateUsuarioCliente } from "../../lib/api";

export default function ClienteEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = React.useState<any | null>(null);
  const [loadingCliente, setLoadingCliente] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Secciones (lazy)
  const [usuarios, setUsuarios] = React.useState<any[] | null>(null);
  const [usuariosError, setUsuariosError] = React.useState<string | null>(null);
  const [usuarioSaveError, setUsuarioSaveError] = React.useState<string | null>(null);
  const [showInactiveUsuarios, setShowInactiveUsuarios] = React.useState(false);

  const [showUsuarioModal, setShowUsuarioModal] = React.useState(false);
  const [editingUsuarioId, setEditingUsuarioId] = React.useState<string | null>(null);
  const [savingUsuario, setSavingUsuario] = React.useState(false);
  const [usuarioForm, setUsuarioForm] = React.useState<{ nombre: string; usuario: string; password: string; email: string; telefono: string; tipo: string; recibeNotificaciones: boolean; recibeTodasLasTareas: boolean; activo: boolean }>({
    nombre: "",
    usuario: "",
    password: "",
    email: "",
    telefono: "",
    tipo: "USUARIO",
    recibeNotificaciones: true,
    recibeTodasLasTareas: true,
    activo: true,
  });
  const [usuarioInitial, setUsuarioInitial] = React.useState<any | null>(null);


  const [contactos, setContactos] = React.useState<any[] | null>(null);
  const [contactosError, setContactosError] = React.useState<string | null>(null);
  const [showInactiveContactos, setShowInactiveContactos] = React.useState(false);

  const [showContactoModal, setShowContactoModal] = React.useState(false);
  const [editingContactoId, setEditingContactoId] = React.useState<string | null>(null);
  const [contactoForm, setContactoForm] = React.useState({
    nombre: "",
    cargo: "",
    email: "",
    movil: "",
    principal: false,
    activo: true,
    notas: "",
  });
  const [savingContacto, setSavingContacto] = React.useState(false);
  const [contactoInitial, setContactoInitial] = React.useState<any | null>(null);


  // UCs (Unidades comerciales)
  const [unidades, setUnidades] = React.useState<any[] | null>(null);
  const [unidadesError, setUnidadesError] = React.useState<string | null>(null);
  const [showInactiveUnidades, setShowInactiveUnidades] = React.useState(false);

  const [showUnidadModal, setShowUnidadModal] = React.useState(false);
  const [editingUnidadId, setEditingUnidadId] = React.useState<string | null>(null);
  const [savingUnidad, setSavingUnidad] = React.useState(false);
  const [unidadForm, setUnidadForm] = React.useState<{ codigo: string; scope: "HOTEL" | "CENTRAL" | "TODOS"; descripcion: string; activo: boolean }>({
    codigo: "",
    scope: "HOTEL",
    descripcion: "",
    activo: true,
  });
  const [unidadInitial, setUnidadInitial] = React.useState<any | null>(null);




  function isContactoDirty() {
    if (!contactoInitial) return false;
    const a = {
      nombre: (contactoForm.nombre ?? "").trim(),
      cargo: (contactoForm.cargo ?? "").trim(),
      email: (contactoForm.email ?? "").trim(),
      movil: (contactoForm.movil ?? "").trim(),
      principal: !!contactoForm.principal,
      activo: contactoForm.activo !== false,
      notas: (contactoForm.notas ?? "").trim(),
    };
    const b = {
      nombre: (contactoInitial.nombre ?? "").trim(),
      cargo: (contactoInitial.cargo ?? "").trim(),
      email: (contactoInitial.email ?? "").trim(),
      movil: (contactoInitial.movil ?? "").trim(),
      principal: !!contactoInitial.principal,
      activo: contactoInitial.activo !== false,
      notas: (contactoInitial.notas ?? "").trim(),
    };
    return JSON.stringify(a) !== JSON.stringify(b);
  }

  async function loadContactos() {
    if (!id) return;
    setContactosError(null);
    try {
      setContactos(await listContactos(id, { includeInactive: showInactiveContactos }));
    } catch (e: any) {
      setContactosError(e?.message ?? "Error cargando contactos");
    }
  }

  React.useEffect(() => {
    // Si ya se cargaron contactos, refrescar al cambiar el filtro "Mostrar inactivos"
    if (contactos !== null) {
      loadContactos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactiveContactos]);

  
  async function loadUnidades() {
    if (!id) return;
    setUnidadesError(null);
    try {
      setUnidades(await listUnidades(id, { includeInactive: showInactiveUnidades }));
    } catch (e: any) {
      setUnidadesError(e?.message ?? "Error cargando UCs");
    }
  }

  React.useEffect(() => {
    if (unidades !== null) {
      loadUnidades();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactiveUnidades]);

  function isUnidadDirty() {
    if (!unidadInitial) return false;
    const a = {
      codigo: (unidadForm.codigo ?? "").trim(),
      scope: unidadForm.scope,
      descripcion: (unidadForm.descripcion ?? "").trim(),
      activo: !!unidadForm.activo,
    };
    const b = {
      codigo: (unidadInitial.codigo ?? "").trim(),
      scope: unidadInitial.scope ?? "HOTEL",
      descripcion: (unidadInitial.descripcion ?? "").trim(),
      activo: unidadInitial.activo !== false,
    };
    return JSON.stringify(a) !== JSON.stringify(b);
  }

  function openNewUnidad() {
    setEditingUnidadId(null);
    setUnidadForm({ codigo: "", scope: "HOTEL", descripcion: "", activo: true });
    setUnidadInitial({ codigo: "", scope: "HOTEL", descripcion: "", activo: true });
    setShowUnidadModal(true);
  }

  function openEditUnidad(u: any) {
    setEditingUnidadId(u.id);
    const init = {
      codigo: u.codigo ?? "",
      // Prisma enum: HOTEL | RESTAURANTE | CORPORATIVO | IT | COMERCIAL
      scope: (u.scope ?? "HOTEL") as any,
      descripcion: u.descripcion ?? "",
      activo: u.activo !== false,
    };
    setUnidadForm(init);
    setUnidadInitial(init);
    setShowUnidadModal(true);
  }

  function closeUnidadModal() {
    if (savingUnidad) return;
    if (isUnidadDirty()) {
      const ok = confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?");
      if (!ok) return;
    }
    setShowUnidadModal(false);
    setEditingUnidadId(null);
    setUnidadInitial(null);
  }

  function navUnidad(dir: "first" | "prev" | "next" | "last") {
    if (!unidades || unidades.length === 0) return;
    if (savingUnidad) return;

    if (isUnidadDirty()) {
      const ok = confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?");
      if (!ok) return;
    }

    const currentIdx = editingUnidadId ? unidades.findIndex((x: any) => x.id === editingUnidadId) : -1;
    let idx = currentIdx;

    if (dir === "first") idx = 0;
    if (dir === "last") idx = unidades.length - 1;
    if (dir === "prev") idx = Math.max(0, (currentIdx === -1 ? 0 : currentIdx - 1));
    if (dir === "next") idx = Math.min(unidades.length - 1, (currentIdx === -1 ? 0 : currentIdx + 1));

    openEditUnidad(unidades[idx]);
  }

  async function saveUnidad() {
    if (!id) return;
    setSavingUnidad(true);
    try {
      const payload = {
        codigo: unidadForm.codigo.trim(),
        scope: unidadForm.scope,
        descripcion: unidadForm.descripcion.trim() || undefined,
        activo: !!unidadForm.activo,
      };
      if (editingUnidadId) {
        await updateUnidad(id, editingUnidadId, payload);
      } else {
        await createUnidad(id, payload);
      }
      await loadUnidades();
      setShowUnidadModal(false);
      setEditingUnidadId(null);
      setUnidadInitial(null);
    } catch (e: any) {
      alert(e?.message ?? "Error guardando UC");
    } finally {
      setSavingUnidad(false);
    }
  }

function openNewContacto() {
    setEditingContactoId(null);
    setContactoForm({ nombre: "", cargo: "", email: "", movil: "", principal: false, activo: true, notas: "" });
    setContactoInitial({ nombre: "", cargo: "", email: "", movil: "", principal: false, activo: true, notas: "" });
    setEditingContactoId(null);
    setShowContactoModal(true);
  }

  function openEditContacto(c: any) {
    setEditingContactoId(c.id);
    setContactoInitial(c);
    setContactoForm({
      nombre: c.nombre ?? "",
      cargo: c.cargo ?? "",
      email: c.email ?? "",
      movil: c.movil ?? "",
      principal: !!c.principal,
      notas: c.notas ?? "",
      activo: c.activo !== false,
    });
    setShowContactoModal(true);
  }

  async function onToggleActivoContacto(c: any) {
    try {
      await updateContacto(id!, c.id, {
        nombre: c.nombre,
        cargo: c.cargo,
        email: c.email,
        movil: c.movil,
        principal: c.principal,
        notas: c.notas,
        activo: !c.activo,
      });
      await loadContactos();
    } catch (e: any) {
      setContactosError(e?.message ?? "Error actualizando contacto");
    }
  }

async function onSaveContacto() {
    if (!id) return;
    setSavingContacto(true);
    setContactosError(null);
    try {
      const payload = {
        nombre: contactoForm.nombre.trim(),
        cargo: contactoForm.cargo?.trim() || null,
        email: contactoForm.email?.trim() || null,
        movil: contactoForm.movil?.trim() || null,
        principal: !!contactoForm.principal,
        notas: contactoForm.notas?.trim() || null,
        activo: contactoForm.activo !== false,
      };
      if (editingContactoId) {
        await updateContacto(id, editingContactoId, payload);
      } else {
        await createContacto(id, payload);
      }
      setShowContactoModal(false);
      setEditingContactoId(null);
      setContactoForm({ nombre: "", cargo: "", email: "", movil: "", principal: false, activo: true, notas: "" });
    setContactoInitial({ nombre: "", cargo: "", email: "", movil: "", principal: false, activo: true, notas: "" });
      await loadContactos();
    } catch (e: any) {
      setContactosError(e?.message ?? "Error guardando contacto");
    } finally {
      setSavingContacto(false);
    }
  }

  async function loadCliente() {
    if (!id) return;
    setLoadingCliente(true);
    setError(null);
    try {
      const data = await getCliente(id);
      setCliente(data);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoadingCliente(false);
    }
  }

  React.useEffect(() => { loadCliente(); }, [id]);

  async function loadUsuarios() {
    if (!id) return;
    setUsuariosError(null);
    try {
      const data = await listUsuariosCliente(id, { includeInactive: showInactiveUsuarios });
      setUsuarios(data);
    } catch (e: any) {
      setUsuariosError(e?.message ?? "Error");
      setUsuarios([]);
    }
  }

  React.useEffect(() => {
    // UsuariosCliente: recargar al cambiar cliente o filtro de inactivos
    loadUsuarios();
  }, [id, showInactiveUsuarios]);

  

  function isUsuarioDirty() {
    if (!usuarioInitial) return false;
    return JSON.stringify(usuarioForm) !== JSON.stringify(usuarioInitial);
  }

  function openNewUsuario() {
    setEditingUsuarioId(null);
    setUsuarioSaveError(null);
    const fresh = {
      nombre: "",
      usuario: "",
      password: "",
      email: "",
      telefono: "",
      tipo: "USUARIO",
      recibeNotificaciones: true,
      recibeTodasLasTareas: true,
      activo: true
    };
    setUsuarioForm(fresh);
    setUsuarioInitial(fresh);

    setShowUsuarioModal(true);
  }

  function openEditUsuario(u: any) {
    setUsuarioSaveError(null);
    const form = {
      nombre: u?.nombre ?? "",
      usuario: u?.usuario ?? "",
      password: "",
      email: u?.email ?? "",
      telefono: u?.telefono ?? "",
      tipo: u?.tipo ?? "USUARIO",
      recibeNotificaciones: u?.recibeNotificaciones ?? true,
      recibeTodasLasTareas: u?.recibeTodasLasTareas ?? true,
      activo: (u?.activo ?? true) === true,
    };
    setEditingUsuarioId(u?.id ?? null);
    setUsuarioForm(form);
    setUsuarioInitial(form);

    setShowUsuarioModal(true);
  }

  async function saveUsuario() {
    if (!id) return;
    setUsuarioSaveError(null);

    if (!(usuarioForm.usuario ?? "").trim() || !(usuarioForm.nombre ?? "").trim()) {
      setUsuarioSaveError("Usuario y Nombre son obligatorios");
      return;
    }

    // Password is mandatory when creating a new usuario
    if (!editingUsuarioId && !(usuarioForm.password ?? "").trim()) {
      setUsuarioSaveError("password es obligatorio al crear un usuario");
      return;
    }

    setSavingUsuario(true);
    try {
      const dto: any = {
        usuario: (usuarioForm.usuario ?? "").trim(),
        nombre: (usuarioForm.nombre ?? "").trim(),
        email: (usuarioForm.email ?? "").trim() || null,
        telefono: (usuarioForm.telefono ?? "").trim() || null,
        tipo: usuarioForm.tipo ?? "USUARIO",
        recibeNotificaciones: usuarioForm.recibeNotificaciones === true,
        recibeTodasLasTareas: usuarioForm.recibeTodasLasTareas === true,
        activo: usuarioForm.activo === true,
      };

      // Only send password when provided (mandatory on create)
      if ((usuarioForm.password ?? "").trim()) {
        dto.password = (usuarioForm.password ?? "").trim();
      }

      if (!editingUsuarioId) {
        await createUsuarioCliente(id, dto);
      } else {
        await updateUsuarioCliente(id, editingUsuarioId, dto);
      }

      await loadUsuarios();
      setShowUsuarioModal(false);
    } catch (e: any) {
      setUsuarioSaveError(e?.message ?? "No se pudo guardar");
    } finally {
      setSavingUsuario(false);
    }
  }

  function closeUsuarioModal() {
    if (savingUsuario) return;
    if (isUsuarioDirty()) {
      const ok = confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?");
      if (!ok) return;
    }
    setUsuarioSaveError(null);
    setShowUsuarioModal(false);
  }

  async function navUsuario(dir: "first" | "prev" | "next" | "last") {
    if (!usuarios || usuarios.length === 0) return;
    if (savingUsuario) return;

    if (isUsuarioDirty()) {
      const save = confirm("Tienes cambios sin guardar. ¿Guardar antes de navegar?");
      if (save) {
        await saveUsuario();
        // si el save cerró el modal, lo reabrimos en el destino
        if (!showUsuarioModal) {
          setShowUsuarioModal(true);
        }
      }
    }

    const currentIdx = editingUsuarioId ? usuarios.findIndex((x: any) => x.id === editingUsuarioId) : -1;
    let idx = currentIdx;
    if (dir == "first") idx = 0;
    if (dir == "last") idx = usuarios.length - 1;
    if (dir == "prev") idx = Math.max(0, (currentIdx == -1 ? 0 : currentIdx - 1));
    if (dir == "next") idx = Math.min(usuarios.length - 1, (currentIdx == -1 ? 0 : currentIdx + 1));

    const u = usuarios[idx];
    openEditUsuario(u);
  }
const title = loadingCliente ? "Cliente" : (cliente?.codigo ?? "Cliente");


  function PureSkeleton() {
    return <div className="small" style={{ marginTop: 12 }}>Cargando...</div>;
  }

  
  
  function navContacto(dir: "first" | "prev" | "next" | "last") {
    if (!contactos || contactos.length === 0) return;
    if (savingContacto) return;

    if (isContactoDirty()) {
      const ok = confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?");
      if (!ok) return;
    }

    const currentIdx = editingContactoId ? contactos.findIndex((x: any) => x.id === editingContactoId) : -1;
    let idx = currentIdx;

    if (dir === "first") idx = 0;
    if (dir === "last") idx = contactos.length - 1;
    if (dir === "prev") idx = Math.max(0, (currentIdx === -1 ? 0 : currentIdx - 1));
    if (dir === "next") idx = Math.min(contactos.length - 1, (currentIdx === -1 ? 0 : currentIdx + 1));

    const c = contactos[idx];
    openEditContacto(c);
  }

function closeContactoModal() {
    if (savingContacto) return;
    if (isContactoDirty()) {
      const ok = confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?");
      if (!ok) return;
    }
    setShowContactoModal(false);
    setEditingContactoId(null);
    setContactoInitial(null);
  }

return (
    <div className="grid">
      <div className="topbar">
        <div>
          <div className="h1">{title}</div>
          <div className="h2">Edición de cliente</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => navigate(-1)}>Volver</button>
          <button className="btn" onClick={loadCliente} disabled={loadingCliente}>Refrescar</button>
          <button className="btn primary" onClick={() => navigate(`/clientes/${id}/ficha`)}>Ver Ficha</button>
        </div>
      </div>

      {error && <div className="small" style={{ color: "var(--danger)" }}>{error}</div>}

      {/* DATOS */}
      <details className="card cardDetails collapsible" open>
        <summary className="cardSummary">
          <div className="h1">Datos</div>
        </summary>
        <div className="cardContent">
          {loadingCliente && <div className="small">Cargando…</div>}
          {!loadingCliente && cliente && (
            <div className="form">
              <div className="field">
                <div className="label">Código</div>
                <input className="input" value={cliente.codigo ?? ""} disabled />
              </div>
              <div className="field full">
                <div className="label">Descripción</div>
                <input className="input" value={cliente.descripcion ?? ""} disabled />
              </div>
              <div className="field">
                <div className="label">Licencia</div>
                <input className="input" value={cliente.licenciaTipo ?? "-"} disabled />
              </div>
            </div>
          )}
        </div>
      </details>

      {/* UCs */}
      <details className="card cardDetails collapsible" onToggle={(e) => {
        const d = e.currentTarget as HTMLDetailsElement;
        if (d.open && unidades === null) loadUnidades();
      }}>
        <summary className="cardSummary">
          <div className="h1">UCs</div>
        </summary>
        <div className="cardContent">
          <div className="cardHeaderRow">
            <div className="small">UCs del cliente</div>
            <div className="row" style={{ gap: 14, alignItems: "center" }}>
              <label className="row small" style={{ gap: 8, userSelect: "none" }}>
                <input type="checkbox" checked={showInactiveUnidades} onChange={(e) => setShowInactiveUnidades(e.target.checked)} />
                Mostrar inactivos
              </label>
              <button className="btn" type="button" onClick={openNewUnidad}>Añadir UC</button>
            </div>
          </div>

          {unidadesError && <div className="small" style={{ marginTop: 12, color: "var(--danger)" }}>{unidadesError}</div>}

          {unidades === null ? (
            <div className="small">(Abrir para cargar)</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Scope</th>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Activo</th>
                  <th style={{ width: 130, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {unidades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="small">Sin UCs</td>
                  </tr>
                )}
                {unidades.map((u) => (
                  <tr key={u.id}>
                    <td>{u.scope}</td>
                    <td>{u.codigo}</td>
                    <td>{u.descripcion ?? "-"}</td>
                    <td>{u.activo ? "Sí" : "No"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn" type="button" onClick={() => openEditUnidad(u)}>Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>

      {/* USUARIOS */}
      <details className="card cardDetails collapsible" onToggle={(e) => { const d = e.currentTarget as HTMLDetailsElement; if (d.open && usuarios === null) loadUsuarios(); }}>
        <summary className="cardSummary">
          <div className="h1">Usuarios</div>
        </summary>
        <div className="cardContent">
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div className="small">Usuarios del cliente</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label className="small" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={showInactiveUsuarios} onChange={(e) => setShowInactiveUsuarios(e.target.checked)} />
                Mostrar inactivos
              </label>
              <button className="btn" onClick={() => { if (usuarios === null) loadUsuarios(); openNewUsuario(); }}>Añadir usuario</button>
            </div>
          </div>

          {usuariosError && <div className="small" style={{ marginTop: 12, color: "var(--danger)" }}>{usuariosError}</div>}

          {usuarios === null ?
            <div className="small" style={{ marginTop: 12 }}>(Abrir para cargar)</div>
            :
            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Activo</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={6} className="small">Sin usuarios</td></tr>
                ) : usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.usuario}</td>
                    <td>{u.nombre}</td>
                    <td><span className="small">{u.email ?? ""}</span></td>
                    <td><span className="small">{u.telefono ?? ""}</span></td>
                    <td>{u.activo ? "Sí" : "No"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btnSmall" onClick={() => openEditUsuario(u)}>Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      </details>

      {/* Contactos */}
      <details
        className="card cardDetails collapsible"
        onToggle={(e) => {
          const el = e.currentTarget;
          if (el.open && contactos === null) loadContactos();
        }}
      >
        <summary className="cardSummary">
          <div className="h1">Contactos</div>
        </summary>
        <div className="cardContent">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div className="small">Contactos del cliente</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label className="small" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={showInactiveContactos} onChange={(e) => { setShowInactiveContactos(e.target.checked); }} />
              Mostrar inactivos
            </label>
            <button className="btn" onClick={openNewContacto}>{editingContactoId ? "Editar contacto" : "Añadir contacto"}</button>
          </div>
          </div>

          {contactosError && <div className="small" style={{ marginTop: 12, color: "var(--danger)" }}>{contactosError}</div>}

          {contactos === null ? (
            PureSkeleton()
          ) : contactos.length === 0 ? (
            <div className="small" style={{ marginTop: 12 }}>No hay contactos.</div>
          ) : (
            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cargo</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Principal</th><th>Activo</th><th style={{textAlign:"right"}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contactos.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td>{c.cargo ?? ""}</td>
                    <td>{c.email ?? ""}</td>
                    <td>{c.movil ?? ""}</td>
                    <td>{c.principal ? "Sí" : ""}</td>
                    <td>{c.activo !== false ? "Sí" : "No"}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btnSmall" onClick={() => openEditContacto(c)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </details>

      {/* Modal nuevo contacto */}
      {showContactoModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div className="h1">{editingContactoId ? "Editar contacto" : "Añadir contacto"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                  <button className="iconBtn" onClick={() => navContacto("first")} disabled={savingContacto}>⏮</button>
                  <button className="iconBtn" onClick={() => navContacto("prev")} disabled={savingContacto}>◀</button>
                  <button className="iconBtn" onClick={() => navContacto("next")} disabled={savingContacto}>▶</button>
                  <button className="iconBtn" onClick={() => navContacto("last")} disabled={savingContacto}>⏭</button>
                </div>
            </div>

            {contactosError && <div className="small" style={{ marginTop: 12, color: "var(--danger)" }}>{contactosError}</div>}

            <div className="formGrid">
              <div className="field">
                <label className="label">Nombre *</label>
                <input
                  className="input"                  value={contactoForm.nombre}
                  onChange={(e) => setContactoForm((s) => ({ ...s, nombre: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="label">Cargo</label>
                <input
                  className="input"                  value={contactoForm.cargo}
                  onChange={(e) => setContactoForm((s) => ({ ...s, cargo: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="label">Email</label>
                <input
                  className="input"                  value={contactoForm.email}
                  onChange={(e) => setContactoForm((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="label">Teléfono</label>
                <input
                  className="input"                  value={contactoForm.movil}
                  onChange={(e) => setContactoForm((s) => ({ ...s, movil: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={!!contactoForm.principal}
                onChange={(e) => setContactoForm((s) => ({ ...s, principal: e.target.checked }))}
              />
              <span>Principal</span>
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={contactoForm.activo !== false}
                onChange={(e) => setContactoForm((s) => ({ ...s, activo: e.target.checked }))}
              />
              <span>Activo</span>
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label className="label">Notas</label>
              <textarea
                className="input"
                style={{ color: "#0f172a", background: "white", minHeight: 110 }}
                value={contactoForm.notas}
                onChange={(e) => setContactoForm((s) => ({ ...s, notas: e.target.value }))}
              />
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn" onClick={closeContactoModal} disabled={savingContacto}>Cancelar</button>
              <button className="btn primary" onClick={onSaveContacto} disabled={savingContacto || !contactoForm.nombre.trim()}>
                {savingContacto ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      
      
      {/* Modal usuario */}
      {showUsuarioModal && (
        <div role="dialog" aria-modal="true" className="modalOverlay">
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div className="h1">{editingUsuarioId ? "Editar usuario" : "Añadir usuario"}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="iconBtn" onClick={() => navUsuario("first")} disabled={savingUsuario || !usuarios || usuarios.length === 0} title="Primero">⏮</button>
                <button className="iconBtn" onClick={() => navUsuario("prev")} disabled={savingUsuario || !usuarios || usuarios.length === 0} title="Anterior">◀</button>
                <button className="iconBtn" onClick={() => navUsuario("next")} disabled={savingUsuario || !usuarios || usuarios.length === 0} title="Siguiente">▶</button>
                <button className="iconBtn" onClick={() => navUsuario("last")} disabled={savingUsuario || !usuarios || usuarios.length === 0} title="Último">⏭</button>
              </div>
            </div>

            {usuarioSaveError && (
              <div className="small" style={{ marginTop: 10, color: "var(--danger)" }}>
                {usuarioSaveError}
              </div>
            )}

            <div className="formGrid" style={{ marginTop: 12 }}>
              <div className="field">
                <label className="label">Nombre</label>
                <input className="input" value={usuarioForm.nombre ?? ""} onChange={(e) => setUsuarioForm((s) => ({ ...s, nombre: e.target.value }))} />
              </div>

              <div className="field">
                <label className="label">Usuario</label>
                <input className="input" value={usuarioForm.usuario ?? ""} onChange={(e) => setUsuarioForm((s) => ({ ...s, usuario: e.target.value }))} />
              </div>

              <div className="field">
                <label className="label">{editingUsuarioId ? "Password (solo si quieres cambiarlo)" : "Password"}</label>
                <input className="input" type="password" value={usuarioForm.password ?? ""} onChange={(e) => setUsuarioForm((s) => ({ ...s, password: e.target.value }))} />
              </div>

              <div className="field">
                <label className="label">Email</label>
                <input className="input" value={usuarioForm.email ?? ""} onChange={(e) => setUsuarioForm((s) => ({ ...s, email: e.target.value }))} />
              </div>

              <div className="field">
                <label className="label">Teléfono</label>
                <input className="input" value={usuarioForm.telefono ?? ""} onChange={(e) => setUsuarioForm((s) => ({ ...s, telefono: e.target.value }))} />
              </div>

              <div className="field">
                <label className="label">Tipo</label>
                <input className="input" value={usuarioForm.tipo} onChange={(e) => setUsuarioForm((s) => ({ ...s, tipo: e.target.value }))} />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="checkRow">
                  <input type="checkbox" checked={!!usuarioForm.recibeNotificaciones} onChange={(e) => setUsuarioForm((s) => ({ ...s, recibeNotificaciones: e.target.checked }))} />
                  Recibe notificaciones
                </label>
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="checkRow">
                  <input type="checkbox" checked={!!usuarioForm.recibeTodasLasTareas} onChange={(e) => setUsuarioForm((s) => ({ ...s, recibeTodasLasTareas: e.target.checked }))} />
                  Recibe todas las tareas
                </label>
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="checkRow">
                  <input type="checkbox" checked={!!usuarioForm.activo} onChange={(e) => setUsuarioForm((s) => ({ ...s, activo: e.target.checked }))} />
                  Activo
                </label>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn" onClick={closeUsuarioModal} disabled={savingUsuario}>Cancelar</button>
              <button className="btn primary" onClick={saveUsuario} disabled={savingUsuario || !(usuarioForm.nombre ?? "").trim() || !(usuarioForm.usuario ?? "").trim() || (!editingUsuarioId && !(usuarioForm.password ?? "").trim())}>
                {savingUsuario ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

{/* Modal UC */}
      {showUnidadModal && (
        <div role="dialog" aria-modal="true" className="modalOverlay">
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div className="h1">{editingUnidadId ? "Editar UC" : "Añadir UC"}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="iconBtn" onClick={() => navUnidad("first")} disabled={savingUnidad || !unidades || unidades.length === 0} title="Primero">⏮</button>
                <button className="iconBtn" onClick={() => navUnidad("prev")} disabled={savingUnidad || !unidades || unidades.length === 0} title="Anterior">◀</button>
                <button className="iconBtn" onClick={() => navUnidad("next")} disabled={savingUnidad || !unidades || unidades.length === 0} title="Siguiente">▶</button>
                <button className="iconBtn" onClick={() => navUnidad("last")} disabled={savingUnidad || !unidades || unidades.length === 0} title="Último">⏭</button>
              </div>
            </div>

            <div className="formGrid" style={{ marginTop: 12 }}>
              <div className="field">
                <label className="label">Código</label>
                <input className="input" value={unidadForm.codigo} onChange={(e) => setUnidadForm((s) => ({ ...s, codigo: e.target.value }))} />
              </div>

              <div className="field">
                <label className="label">Scope</label>
                <select className="input" value={unidadForm.scope} onChange={(e) => setUnidadForm((s) => ({ ...s, scope: e.target.value as any }))}>
                  <option value="HOTEL">HOTEL</option>
                  <option value="RESTAURANTE">RESTAURANTE</option>
                  <option value="CORPORATIVO">CORPORATIVO</option>
                  <option value="IT">IT</option>
                  <option value="COMERCIAL">COMERCIAL</option>
                </select>
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="label">Descripción</label>
                <textarea className="input" rows={3} value={unidadForm.descripcion} onChange={(e) => setUnidadForm((s) => ({ ...s, descripcion: e.target.value }))} />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="checkRow">
                  <input type="checkbox" checked={!!unidadForm.activo} onChange={(e) => setUnidadForm((s) => ({ ...s, activo: e.target.checked }))} />
                  Activo
                </label>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn" onClick={closeUnidadModal} disabled={savingUnidad}>Cancelar</button>
              <button className="btn primary" onClick={saveUnidad} disabled={savingUnidad || !unidadForm.codigo.trim()}>
                {savingUnidad ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

{/* Placeholders: resto de secciones */}
      {[
        "Software",
        "Conexiones",
        "Comentarios",
        "Centros de trabajo",
        "Releases / Hotfix",
      ].map((name) => (
        <details key={name} className="card cardDetails collapsible">
          <summary className="cardSummary">
            <div className="h1">{name}</div>
          </summary>
          <div className="cardContent">
            <div className="small">Pendiente de implementar (API + UI).</div>
          </div>
        </details>
      ))}
    </div>
  );
}
