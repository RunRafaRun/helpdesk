import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const ClienteFichaView: React.FC = () => {
  const { clienteCodigo } = useParams<{ clienteCodigo: string }>();
  const navigate = useNavigate();
  const { me } = useAuth();

  // Check if user has full edit permission (CONFIG_CLIENTES) or just read-only (CONFIG_CLIENTES_READ)
  const canEdit = me?.permisos?.includes('CONFIG_CLIENTES') ?? false;
  const [activeTab, setActiveTab] = useState('unidades');
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [allClientes, setAllClientes] = useState<any[]>([]);
  const [allReleases, setAllReleases] = useState<any[]>([]);
  const [allModulos, setAllModulos] = useState<any[]>([]);
  const [allAgentes, setAllAgentes] = useState<any[]>([]);
  const [currentRelease, setCurrentRelease] = useState<any>(null);
  const [comentarioDestacado, setComentarioDestacado] = useState<string | null>(null);
  const [clienteForm, setClienteForm] = useState<any>({});
  const [savingCliente, setSavingCliente] = useState(false);

  useEffect(() => {
    fetchCliente();
    fetchAllClientes();
    fetchAllReleases();
    fetchAllModulos();
    fetchAllAgentes();
  }, [clienteCodigo]);

  useEffect(() => {
    if (cliente?.id) {
      fetchItems();
      fetchCurrentRelease();
      fetchComentarioDestacado();
    }
  }, [cliente?.id, activeTab]);

  useEffect(() => {
    if (cliente) {
      setClienteForm({
        codigo: cliente.codigo || '',
        descripcion: cliente.descripcion || '',
        jefeProyecto1: cliente.jefeProyecto1 || '',
        jefeProyecto2: cliente.jefeProyecto2 || '',
        licenciaTipo: cliente.licenciaTipo || ''
      });
    }
  }, [cliente]);

  const fetchCurrentRelease = async () => {
    if (!cliente?.id) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:8080/clientes/${cliente.id}/releases-plan`,
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      if (response.ok) {
        const data = await response.json();
        // Find latest INSTALADO (sort by fechaPrevista desc, then release.codigo desc, then hotfix.codigo desc)
        const instalados = data.filter((r: any) => r.estado === 'INSTALADO');
        if (instalados.length > 0) {
          instalados.sort((a: any, b: any) => {
            // Sort by fechaPrevista desc
            const dateA = a.fechaPrevista ? new Date(a.fechaPrevista).getTime() : 0;
            const dateB = b.fechaPrevista ? new Date(b.fechaPrevista).getTime() : 0;
            if (dateB !== dateA) return dateB - dateA;
            // Then by release.codigo desc
            const releaseCompare = (b.release?.codigo || '').localeCompare(a.release?.codigo || '');
            if (releaseCompare !== 0) return releaseCompare;
            // Then by hotfix.codigo desc
            return (b.hotfix?.codigo || '').localeCompare(a.hotfix?.codigo || '');
          });
          setCurrentRelease(instalados[0]);
        } else {
          setCurrentRelease(null);
        }
      }
    } catch (error) {
      console.error('Error al cargar release actual:', error);
    }
  };

  const fetchComentarioDestacado = async () => {
    if (!cliente?.id) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:8080/clientes/${cliente.id}/comentarios`,
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      if (response.ok) {
        const data = await response.json();
        const destacado = data.find((c: any) => c.destacado);
        setComentarioDestacado(destacado?.texto || null);
      }
    } catch (error) {
      console.error('Error al cargar comentario destacado:', error);
    }
  };

  const handleToggleDestacado = async (comentarioId: string) => {
    if (!cliente?.id) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:8080/clientes/${cliente.id}/comentarios/${comentarioId}/destacar`,
        { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }}
      );
      if (response.ok) {
        fetchItems();
        fetchComentarioDestacado();
      }
    } catch (error) {
      console.error('Error al destacar comentario:', error);
    }
  };

  const fetchAllClientes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8080/admin/clientes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllClientes(data);
      }
    } catch (error) {
      console.error('Error al cargar lista de clientes:', error);
    }
  };

  const fetchAllReleases = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8080/admin/releases', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllReleases(data);
      }
    } catch (error) {
      console.error('Error al cargar releases:', error);
    }
  };

  const fetchAllModulos = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8080/admin/modulos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllModulos(data);
      }
    } catch (error) {
      console.error('Error al cargar módulos:', error);
    }
  };

  const fetchAllAgentes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8080/admin/agentes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllAgentes(data);
      }
    } catch (error) {
      console.error('Error al cargar agentes:', error);
    }
  };

  const currentIndex = allClientes.findIndex(c => c.codigo === clienteCodigo);
  const canGoFirst = currentIndex > 0;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < allClientes.length - 1;
  const canGoLast = currentIndex < allClientes.length - 1;

  const goToCliente = (codigo: string) => navigate(`/clientes/${codigo}/ficha`);
  const goFirst = () => canGoFirst && goToCliente(allClientes[0].codigo);
  const goPrev = () => canGoPrev && goToCliente(allClientes[currentIndex - 1].codigo);
  const goNext = () => canGoNext && goToCliente(allClientes[currentIndex + 1].codigo);
  const goLast = () => canGoLast && goToCliente(allClientes[allClientes.length - 1].codigo);

  const fetchCliente = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8080/admin/clientes/by-codigo/${clienteCodigo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCliente(data);
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const endpoints: Record<string, string> = {
    software: 'software',
    contactos: 'contactos',
    conexiones: 'conexiones',
    centros: 'centros-trabajo',
    releases: 'releases-plan',
    comentarios: 'comentarios',
    unidades: 'unidades',
    usuarios: 'usuarios'
  };

  const fetchItems = async () => {
    if (!cliente?.id) return;
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `http://localhost:8080/clientes/${cliente.id}/${endpoints[activeTab]}`,
        { headers: { 'Authorization': `Bearer ${token}` }}
      );

      if (response.ok) {
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error al cargar items:', error);
      setItems([]);
    }
  };

  // Helper to extract numeric part from release/hotfix codes (R35 -> 35, HF01 -> 1)
  const extractNumber = (code: string): number => {
    const match = code.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Compare two release/hotfix combinations. Returns: -1 if a < b, 0 if equal, 1 if a > b
  const compareReleaseHotfix = (
    releaseA: string, hotfixA: string | null,
    releaseB: string, hotfixB: string | null
  ): number => {
    const releaseNumA = extractNumber(releaseA);
    const releaseNumB = extractNumber(releaseB);

    if (releaseNumA !== releaseNumB) {
      return releaseNumA < releaseNumB ? -1 : 1;
    }

    // Same release, compare hotfixes
    if (!hotfixA && hotfixB) return -1;
    if (hotfixA && !hotfixB) return 1;
    if (!hotfixA && !hotfixB) return 0;

    const hotfixNumA = extractNumber(hotfixA!);
    const hotfixNumB = extractNumber(hotfixB!);

    if (hotfixNumA === hotfixNumB) return 0;
    return hotfixNumA < hotfixNumB ? -1 : 1;
  };

  // Get the latest installed release for validation
  const getLatestInstalado = () => {
    const instalados = items.filter((item: any) => item.estado === 'INSTALADO');
    if (instalados.length === 0) return null;

    return instalados.reduce((latest: any, current: any) => {
      const comparison = compareReleaseHotfix(
        current.release?.codigo || '', current.hotfix?.codigo || null,
        latest.release?.codigo || '', latest.hotfix?.codigo || null
      );
      return comparison > 0 ? current : latest;
    });
  };

  // Validate release form data
  const validateReleasesForm = (): string | null => {
    const estado = formData.estado || 'PLANIFICADO';

    // Validate fechaPrevista for PLANIFICADO
    if (estado === 'PLANIFICADO') {
      if (!formData.fechaPrevista) {
        return 'La fecha prevista es obligatoria para releases planificados.';
      }

      const fecha = new Date(formData.fechaPrevista);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (fecha < today) {
        return 'La fecha prevista no puede ser anterior a hoy.';
      }
    }

    // Validate release/hotfix is not lower than latest installed
    if (!formData.releaseId) {
      return 'Debe seleccionar un release.';
    }

    const latestInstalado = getLatestInstalado();
    if (latestInstalado) {
      const selectedRelease = allReleases.find((r: any) => r.id === formData.releaseId);
      const selectedHotfix = selectedRelease?.hotfixes?.find((h: any) => h.id === formData.hotfixId);

      const comparison = compareReleaseHotfix(
        selectedRelease?.codigo || '', selectedHotfix?.codigo || null,
        latestInstalado.release?.codigo || '', latestInstalado.hotfix?.codigo || null
      );

      if (comparison < 0) {
        const latestLabel = `${latestInstalado.release?.codigo}${latestInstalado.hotfix ? `-${latestInstalado.hotfix.codigo}` : ''}`;
        return `El release/hotfix seleccionado es anterior al último instalado (${latestLabel}). Debe seleccionar uno igual o superior.`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    if (!cliente?.id) return;

    // Frontend validation for releases
    if (activeTab === 'releases') {
      const validationError = validateReleasesForm();
      if (validationError) {
        alert(validationError);
        return;
      }
    }

    try {
      const token = localStorage.getItem('accessToken');

      const url = editingItem
        ? `http://localhost:8080/clientes/${cliente.id}/${endpoints[activeTab]}/${editingItem.id}`
        : `http://localhost:8080/clientes/${cliente.id}/${endpoints[activeTab]}`;

      const method = editingItem ? 'PUT' : 'POST';

      // Filter formData to only include DTO-allowed fields (remove system/relation fields)
      const systemFields = ['id', 'clienteId', 'createdAt', 'updatedAt', 'agente', 'agenteId', 'release', 'hotfix', 'modulo', 'modulos'];
      let filteredData = Object.fromEntries(
        Object.entries(formData).filter(([key]) => !systemFields.includes(key))
      );

      // For software tab: enforce PMS rules
      if (activeTab === 'software' && filteredData.tipo === 'PMS') {
        filteredData.nombre = 'Avalon';
      }
      // For software tab: clear moduloId if not PMS
      if (activeTab === 'software' && filteredData.tipo !== 'PMS') {
        filteredData.moduloId = null;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filteredData)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingItem(null);
        setFormData({});
        fetchItems();
        // Refresh current release badge if we modified releases
        if (activeTab === 'releases') {
          fetchCurrentRelease();
        }
        // Refresh highlighted comment if we modified comentarios
        if (activeTab === 'comentarios') {
          fetchComentarioDestacado();
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'No se pudo guardar'}`);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el registro');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    if (!cliente?.id) return;

    try {
      const token = localStorage.getItem('accessToken');

      await fetch(`http://localhost:8080/clientes/${cliente.id}/${endpoints[activeTab]}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      fetchItems();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar el registro');
    }
  };

  const handleSaveCliente = async () => {
    if (!cliente?.id) return;
    setSavingCliente(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8080/admin/clientes/${cliente.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          codigo: clienteForm.codigo,
          descripcion: clienteForm.descripcion || null,
          jefeProyecto1: clienteForm.jefeProyecto1 || null,
          jefeProyecto2: clienteForm.jefeProyecto2 || null,
          licenciaTipo: clienteForm.licenciaTipo || null
        })
      });

      if (response.ok) {
        const updatedCliente = await response.json();
        setShowClienteModal(false);
        // If codigo changed, navigate to new URL
        if (updatedCliente.codigo !== clienteCodigo) {
          navigate(`/clientes/${updatedCliente.codigo}/ficha`, { replace: true });
        } else {
          setCliente(updatedCliente);
          fetchAllClientes(); // Refresh the list for navigation
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'No se pudo guardar'}`);
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente');
    } finally {
      setSavingCliente(false);
    }
  };

  const openModal = (item: any = null) => {
    setEditingItem(item);
    setFormData(item || {});
    setShowModal(true);
  };

  const tabs = [
    { id: 'unidades', label: 'UCs', icon: '🏨' },
    { id: 'usuarios', label: 'Usuarios', icon: '👤' },
    { id: 'software', label: 'Software', icon: '💻' },
    { id: 'contactos', label: 'Contactos', icon: '👥' },
    { id: 'conexiones', label: 'Conexiones', icon: '🔌' },
    { id: 'centros', label: 'Centros Trabajo', icon: '🏢' },
    { id: 'releases', label: 'Releases', icon: '📦' },
    { id: 'comentarios', label: 'Comentarios', icon: '📝' },
  ];

  const renderTable = () => {
    if (!Array.isArray(items) || items.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
          No hay registros. Haga clic en "Agregar" para crear uno nuevo.
        </div>
      );
    }

    const thStyle: React.CSSProperties = { padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase' };
    const tdStyle: React.CSSProperties = { padding: '16px 24px', fontSize: '14px' };
    const actionBtnEdit: React.CSSProperties = { color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px' };
    const actionBtnDelete: React.CSSProperties = { color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' };
    const badgeStyle: React.CSSProperties = { padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500 };

    const renderActions = (item: any) => (
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {canEdit ? (
          <>
            <button onClick={() => openModal(item)} style={actionBtnEdit}>Editar</button>
            <button onClick={() => handleDelete(item.id)} style={actionBtnDelete}>Eliminar</button>
          </>
        ) : (
          <button onClick={() => openModal(item)} style={actionBtnEdit}>Ver</button>
        )}
      </td>
    );

    if (activeTab === 'unidades') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Código</th>
              <th style={thStyle}>Descripción</th>
              <th style={thStyle}>Scope</th>
              <th style={thStyle}>Estado</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{item.codigo}</td>
                <td style={tdStyle}>{item.descripcion || '-'}</td>
                <td style={tdStyle}>
                  <span style={{
                    ...badgeStyle,
                    backgroundColor: item.scope === 'CENTRAL' ? '#DBEAFE' : item.scope === 'TODOS' ? '#D1FAE5' : '#FEF3C7',
                    color: item.scope === 'CENTRAL' ? '#1D4ED8' : item.scope === 'TODOS' ? '#059669' : '#B45309'
                  }}>
                    {item.scope}
                  </span>
                </td>
                <td style={tdStyle}>
                  {item.activo ? (
                    <span style={{ ...badgeStyle, backgroundColor: '#D1FAE5', color: '#059669' }}>Activo</span>
                  ) : (
                    <span style={{ ...badgeStyle, backgroundColor: '#FEE2E2', color: '#DC2626' }}>Inactivo</span>
                  )}
                </td>
                {renderActions(item)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'usuarios') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Usuario</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Módulos</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>
                  {item.usuario}
                  {item.principal && (
                    <span style={{ ...badgeStyle, backgroundColor: '#DBEAFE', color: '#1D4ED8', marginLeft: '8px' }}>Principal</span>
                  )}
                </td>
                <td style={tdStyle}>{item.nombre}</td>
                <td style={tdStyle}>{item.email || '-'}</td>
                <td style={tdStyle}>{item.tipo || '-'}</td>
                <td style={tdStyle}>
                  {item.activo ? (
                    <span style={{ ...badgeStyle, backgroundColor: '#D1FAE5', color: '#059669' }}>Activo</span>
                  ) : (
                    <span style={{ ...badgeStyle, backgroundColor: '#FEE2E2', color: '#DC2626' }}>Inactivo</span>
                  )}
                  {item.recibeNotificaciones && (
                    <span style={{ ...badgeStyle, backgroundColor: '#FEF3C7', color: '#B45309', marginLeft: '4px' }}>Notif.</span>
                  )}
                </td>
                <td style={tdStyle}>
                  {item.principal ? (
                    <span style={{ color: '#6B7280', fontStyle: 'italic' }}>Todos</span>
                  ) : item.modulos?.length > 0 ? (
                    <span>{item.modulos.map((m: any) => m.modulo?.codigo).join(', ')}</span>
                  ) : (
                    <span style={{ color: '#9CA3AF' }}>-</span>
                  )}
                </td>
                {renderActions(item)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'software') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Versión</th>
              <th style={thStyle}>Módulo</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={tdStyle}>{item.tipo}</td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{item.nombre}</td>
                <td style={tdStyle}>{item.version || '-'}</td>
                <td style={tdStyle}>{item.modulo?.codigo || '-'}</td>
                {renderActions(item)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'contactos') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Cargo</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Móvil</th>
              <th style={thStyle}>Principal</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{item.nombre}</td>
                <td style={tdStyle}>{item.cargo || '-'}</td>
                <td style={tdStyle}>{item.email || '-'}</td>
                <td style={tdStyle}>{item.movil || '-'}</td>
                <td style={tdStyle}>
                  {item.principal && <span style={{ ...badgeStyle, backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>Principal</span>}
                  {!item.activo && <span style={{ ...badgeStyle, backgroundColor: '#FEE2E2', color: '#DC2626', marginLeft: '4px' }}>Inactivo</span>}
                </td>
                {renderActions(item)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'conexiones') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Entorno</th>
              <th style={thStyle}>Usuario</th>
              <th style={thStyle}>Password</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{item.nombre}</td>
                <td style={tdStyle}>{item.endpoint || '-'}</td>
                <td style={tdStyle}>{item.usuario || '-'}</td>
                <td style={tdStyle}>{item.secretRef || '••••••••'}</td>
                {renderActions(item)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'centros') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Base de Datos</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{item.nombre}</td>
                <td style={tdStyle}>{item.baseDatos || '-'}</td>
                {renderActions(item)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'releases') {
      // Find the latest installed release to determine which can be deleted
      const latestInstalado = getLatestInstalado();

      const canDeleteRelease = (item: any) => {
        // PLANIFICADO can always be deleted
        if (item.estado !== 'INSTALADO') return true;
        // If no latest installed, can delete
        if (!latestInstalado) return true;
        // Can only delete if this IS the latest installed
        return item.id === latestInstalado.id;
      };

      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Release / Hotfix</th>
              <th style={thStyle}>Fecha Prevista</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Detalle</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => {
              const canDelete = canDeleteRelease(item);
              return (
                <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>
                    {item.release?.codigo}{item.hotfix ? `-${item.hotfix.codigo}` : ''}
                  </td>
                  <td style={tdStyle}>{item.fechaPrevista ? new Date(item.fechaPrevista).toLocaleDateString() : '-'}</td>
                  <td style={tdStyle}>
                    <span style={{
                      ...badgeStyle,
                      backgroundColor: item.estado === 'INSTALADO' ? '#D1FAE5' : '#FEF3C7',
                      color: item.estado === 'INSTALADO' ? '#059669' : '#B45309'
                    }}>
                      {item.estado}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.detalle || '-'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button onClick={() => openModal(item)} style={actionBtnEdit}>
                      {!canEdit || item.estado === 'INSTALADO' ? 'Ver' : 'Editar'}
                    </button>
                    {canEdit && (canDelete ? (
                      <button onClick={() => handleDelete(item.id)} style={actionBtnDelete}>Eliminar</button>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '14px', cursor: 'not-allowed' }} title="No se puede eliminar porque hay releases más recientes instalados">
                        Eliminar
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'comentarios') {
      const starBtnStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px',
        padding: '4px',
        marginRight: '8px',
        verticalAlign: 'middle'
      };

      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={{ ...thStyle, width: '40px' }}></th>
              <th style={thStyle}>Comentario</th>
              <th style={thStyle}>Agente</th>
              <th style={thStyle}>Fecha</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB', backgroundColor: item.destacado ? '#FFFBEB' : 'white' }}>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {canEdit ? (
                    <button
                      onClick={() => handleToggleDestacado(item.id)}
                      style={starBtnStyle}
                      title={item.destacado ? 'Quitar destacado' : 'Destacar comentario'}
                    >
                      {item.destacado ? '★' : '☆'}
                    </button>
                  ) : (
                    item.destacado && <span style={{ fontSize: '18px', color: '#F59E0B' }}>★</span>
                  )}
                </td>
                <td style={{ ...tdStyle, maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.texto}>
                  {item.destacado && <span style={{ ...badgeStyle, backgroundColor: '#FEF3C7', color: '#B45309', marginRight: '8px' }}>Destacado</span>}
                  {item.texto}
                </td>
                <td style={tdStyle}>{item.agente?.nombre || '-'}</td>
                <td style={tdStyle}>{new Date(item.createdAt).toLocaleString()}</td>
                {renderActions(item)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  const renderForm = () => {
    const inputStyle: React.CSSProperties = { marginTop: '4px', display: 'block', width: '100%', borderRadius: '6px', border: '1px solid #D1D5DB', padding: '8px 12px', boxSizing: 'border-box' };
    const labelStyle: React.CSSProperties = { display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' };

    if (activeTab === 'unidades') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Código *</label>
            <input type="text" style={inputStyle} value={formData.codigo || ''} onChange={(e) => setFormData({...formData, codigo: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Descripción</label>
            <input type="text" style={inputStyle} value={formData.descripcion || ''} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Scope</label>
            <select style={inputStyle} value={formData.scope || 'HOTEL'} onChange={(e) => setFormData({...formData, scope: e.target.value})}>
              <option value="HOTEL">HOTEL</option>
              <option value="CENTRAL">CENTRAL</option>
              <option value="TODOS">TODOS</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.activo !== false} onChange={(e) => setFormData({...formData, activo: e.target.checked})} />
              <span style={{ fontSize: '14px', color: '#374151' }}>Activo</span>
            </label>
          </div>
        </div>
      );
    }

    if (activeTab === 'usuarios') {
      const selectedModuloIds = formData.moduloIds || (formData.modulos?.map((m: any) => m.modulo?.id) || []);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Usuario *</label>
              <input type="text" style={inputStyle} value={formData.usuario || ''} onChange={(e) => setFormData({...formData, usuario: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input type="text" style={inputStyle} value={formData.nombre || ''} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" style={inputStyle} value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input type="text" style={inputStyle} value={formData.telefono || ''} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Tipo</label>
              <input type="text" style={inputStyle} value={formData.tipo || ''} onChange={(e) => setFormData({...formData, tipo: e.target.value})} placeholder="Ej: Administrador, Técnico..." />
            </div>
            <div>
              <label style={labelStyle}>{editingItem ? 'Nueva Contraseña' : 'Contraseña *'}</label>
              <input type="password" style={inputStyle} value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder={editingItem ? 'Dejar vacío para no cambiar' : ''} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.activo !== false} onChange={(e) => setFormData({...formData, activo: e.target.checked})} />
              <span style={{ fontSize: '14px', color: '#374151' }}>Activo</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.principal || false} onChange={(e) => setFormData({...formData, principal: e.target.checked})} />
              <span style={{ fontSize: '14px', color: '#374151' }}>Usuario principal (recibe todas las notificaciones)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.recibeNotificaciones !== false} onChange={(e) => setFormData({...formData, recibeNotificaciones: e.target.checked})} />
              <span style={{ fontSize: '14px', color: '#374151' }}>Recibe notificaciones</span>
            </label>
          </div>
          {!formData.principal && (
            <div>
              <label style={labelStyle}>Módulos para notificaciones</label>
              <div style={{ border: '1px solid #D1D5DB', borderRadius: '6px', padding: '12px', maxHeight: '150px', overflowY: 'auto' }}>
                {allModulos.length === 0 ? (
                  <span style={{ color: '#6B7280' }}>No hay módulos disponibles</span>
                ) : (
                  allModulos.map((m) => (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedModuloIds.includes(m.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...selectedModuloIds, m.id]
                            : selectedModuloIds.filter((id: string) => id !== m.id);
                          setFormData({...formData, moduloIds: newIds});
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{m.codigo}{m.descripcion ? ` - ${m.descripcion}` : ''}</span>
                    </label>
                  ))
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                Seleccione los módulos de los que este usuario recibirá notificaciones de tareas
              </div>
            </div>
          )}
          {formData.principal && (
            <div style={{ padding: '12px', backgroundColor: '#DBEAFE', borderRadius: '6px', color: '#1D4ED8', fontSize: '14px' }}>
              El usuario principal recibe notificaciones de <strong>todos</strong> los módulos
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'software') {
      const isPMS = formData.tipo === 'PMS';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Tipo *</label>
            <select
              style={inputStyle}
              value={formData.tipo || ''}
              onChange={(e) => {
                const newTipo = e.target.value;
                if (newTipo === 'PMS') {
                  setFormData({...formData, tipo: newTipo, nombre: 'Avalon', version: '', moduloId: formData.moduloId || null});
                } else {
                  setFormData({...formData, tipo: newTipo, moduloId: null});
                }
              }}
            >
              <option value="">Seleccione...</option>
              <option value="PMS">PMS</option>
              <option value="ERP">ERP</option>
              <option value="PERIFERIA">PERIFERIA</option>
              <option value="OTROS">OTROS</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Nombre *</label>
            {isPMS ? (
              <input
                type="text"
                style={{...inputStyle, backgroundColor: '#F3F4F6', cursor: 'not-allowed'}}
                value="Avalon"
                disabled
              />
            ) : (
              <input
                type="text"
                style={inputStyle}
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>Versión</label>
            {isPMS ? (
              <select
                style={inputStyle}
                value={formData.version || ''}
                onChange={(e) => setFormData({...formData, version: e.target.value})}
              >
                <option value="">Seleccione...</option>
                <option value="5.0">5.0</option>
                <option value="Avalon Cloud">Avalon Cloud</option>
              </select>
            ) : (
              <input
                type="text"
                style={inputStyle}
                value={formData.version || ''}
                onChange={(e) => setFormData({...formData, version: e.target.value})}
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>Módulo</label>
            <select
              style={{...inputStyle, ...(isPMS ? {} : { backgroundColor: '#F3F4F6', cursor: 'not-allowed' })}}
              value={formData.moduloId || ''}
              onChange={(e) => setFormData({...formData, moduloId: e.target.value || null})}
              disabled={!isPMS}
            >
              <option value="">Sin módulo</option>
              {allModulos.map((m) => (
                <option key={m.id} value={m.id}>{m.codigo}{m.descripcion ? ` - ${m.descripcion}` : ''}</option>
              ))}
            </select>
            {!isPMS && (
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                Solo disponible para tipo PMS
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Notas</label>
            <textarea style={{...inputStyle, minHeight: '80px'}} value={formData.notas || ''} onChange={(e) => setFormData({...formData, notas: e.target.value})} />
          </div>
        </div>
      );
    }

    if (activeTab === 'contactos') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input type="text" style={inputStyle} value={formData.nombre || ''} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Cargo</label>
            <input type="text" style={inputStyle} value={formData.cargo || ''} onChange={(e) => setFormData({...formData, cargo: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" style={inputStyle} value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Móvil</label>
            <input type="text" style={inputStyle} value={formData.movil || ''} onChange={(e) => setFormData({...formData, movil: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.principal || false} onChange={(e) => setFormData({...formData, principal: e.target.checked})} />
              <span style={{ fontSize: '14px', color: '#374151' }}>Contacto principal</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.activo !== false} onChange={(e) => setFormData({...formData, activo: e.target.checked})} />
              <span style={{ fontSize: '14px', color: '#374151' }}>Activo</span>
            </label>
          </div>
          <div>
            <label style={labelStyle}>Notas</label>
            <textarea style={{...inputStyle, minHeight: '80px'}} value={formData.notas || ''} onChange={(e) => setFormData({...formData, notas: e.target.value})} />
          </div>
        </div>
      );
    }

    if (activeTab === 'conexiones') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input type="text" style={inputStyle} value={formData.nombre || ''} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Entorno</label>
            <input type="text" style={inputStyle} value={formData.endpoint || ''} onChange={(e) => setFormData({...formData, endpoint: e.target.value})} placeholder="Producción, Desarrollo, etc." />
          </div>
          <div>
            <label style={labelStyle}>Usuario</label>
            <input type="text" style={inputStyle} value={formData.usuario || ''} onChange={(e) => setFormData({...formData, usuario: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" style={inputStyle} value={formData.secretRef || ''} onChange={(e) => setFormData({...formData, secretRef: e.target.value})} placeholder="Contraseña" />
          </div>
          <div>
            <label style={labelStyle}>Notas</label>
            <textarea style={{...inputStyle, minHeight: '80px'}} value={formData.notas || ''} onChange={(e) => setFormData({...formData, notas: e.target.value})} />
          </div>
        </div>
      );
    }

    if (activeTab === 'centros') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input type="text" style={inputStyle} value={formData.nombre || ''} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Base de Datos</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.baseDatos || 'AntforHotel-'}
              onChange={(e) => setFormData({...formData, baseDatos: e.target.value})}
              placeholder="AntforHotel-NombreHotel"
            />
          </div>
        </div>
      );
    }

    if (activeTab === 'releases') {
      const selectedRelease = allReleases.find(r => r.id === formData.releaseId);
      const availableHotfixes = selectedRelease?.hotfixes || [];
      // Only read-only if the ORIGINAL record was INSTALADO (not when user selects INSTALADO)
      const isInstalado = editingItem?.estado === 'INSTALADO';
      const hasPlanificado = items.some(item => item.estado === 'PLANIFICADO' && item.id !== editingItem?.id);
      const latestInstalado = getLatestInstalado();
      const latestLabel = latestInstalado
        ? `${latestInstalado.release?.codigo}${latestInstalado.hotfix ? `-${latestInstalado.hotfix.codigo}` : ''}`
        : null;

      // Check if selected release/hotfix is lower than latest installed
      const selectedHotfix = selectedRelease?.hotfixes?.find((h: any) => h.id === formData.hotfixId);
      const isReleaseLower = latestInstalado && formData.releaseId && compareReleaseHotfix(
        selectedRelease?.codigo || '', selectedHotfix?.codigo || null,
        latestInstalado.release?.codigo || '', latestInstalado.hotfix?.codigo || null
      ) < 0;

      // Check if fechaPrevista is valid for PLANIFICADO
      const estado = formData.estado || 'PLANIFICADO';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const fechaValue = formData.fechaPrevista ? formData.fechaPrevista.split('T')[0] : '';
      const fechaDate = fechaValue ? new Date(fechaValue) : null;
      const isFechaInvalid = estado === 'PLANIFICADO' && fechaDate && fechaDate < today;
      const isFechaMissing = estado === 'PLANIFICADO' && !fechaValue;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isInstalado && (
            <div style={{ padding: '12px', backgroundColor: '#D1FAE5', borderRadius: '6px', color: '#059669', fontSize: '14px' }}>
              Este registro está instalado y no puede ser modificado.
            </div>
          )}
          {latestLabel && !isInstalado && (
            <div style={{ padding: '12px', backgroundColor: '#DBEAFE', borderRadius: '6px', color: '#1D4ED8', fontSize: '14px' }}>
              Release mínimo requerido: <strong>{latestLabel}</strong> (último instalado)
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Release *</label>
              <select
                style={{...inputStyle, ...(isReleaseLower ? { borderColor: '#DC2626' } : {})}}
                value={formData.releaseId || ''}
                onChange={(e) => setFormData({...formData, releaseId: e.target.value, hotfixId: null})}
                disabled={isInstalado}
              >
                <option value="">Seleccione release...</option>
                {allReleases.map((r) => (
                  <option key={r.id} value={r.id}>{r.codigo}{r.descripcion ? ` - ${r.descripcion}` : ''}</option>
                ))}
              </select>
              {isReleaseLower && (
                <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                  Selección inferior al release mínimo ({latestLabel})
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Hotfix (opcional)</label>
              <select
                style={{...inputStyle, ...(isReleaseLower ? { borderColor: '#DC2626' } : {})}}
                value={formData.hotfixId || ''}
                onChange={(e) => setFormData({...formData, hotfixId: e.target.value || null})}
                disabled={!formData.releaseId || isInstalado}
              >
                <option value="">Solo release (sin hotfix)</option>
                {availableHotfixes.map((hf: any) => (
                  <option key={hf.id} value={hf.id}>{hf.codigo}{hf.descripcion ? ` - ${hf.descripcion}` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Fecha Prevista {estado === 'PLANIFICADO' ? '*' : ''}</label>
              <input
                type="date"
                style={{...inputStyle, ...((isFechaInvalid || isFechaMissing) ? { borderColor: '#DC2626' } : {})}}
                value={fechaValue}
                onChange={(e) => setFormData({...formData, fechaPrevista: e.target.value})}
                disabled={isInstalado}
                min={new Date().toISOString().split('T')[0]}
              />
              {isFechaInvalid && (
                <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                  La fecha no puede ser anterior a hoy
                </div>
              )}
              {isFechaMissing && (
                <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                  Obligatoria para releases planificados
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select
                style={inputStyle}
                value={formData.estado || 'PLANIFICADO'}
                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                disabled={isInstalado}
              >
                <option value="PLANIFICADO" disabled={hasPlanificado && formData.estado !== 'PLANIFICADO'}>PLANIFICADO</option>
                <option value="INSTALADO">INSTALADO</option>
              </select>
              {hasPlanificado && formData.estado !== 'PLANIFICADO' && !editingItem && (
                <div style={{ fontSize: '12px', color: '#B45309', marginTop: '4px' }}>
                  Ya existe un release planificado. Debe instalarlo antes de crear otro.
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Detalle</label>
            <textarea
              style={{...inputStyle, minHeight: '80px'}}
              value={formData.detalle || ''}
              onChange={(e) => setFormData({...formData, detalle: e.target.value})}
              disabled={isInstalado}
            />
          </div>
        </div>
      );
    }

    if (activeTab === 'comentarios') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Comentario *</label>
            <textarea style={{...inputStyle, minHeight: '120px'}} value={formData.texto || ''} onChange={(e) => setFormData({...formData, texto: e.target.value})} placeholder="Escriba su comentario aquí..." />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.destacado || false}
                onChange={(e) => setFormData({...formData, destacado: e.target.checked})}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Destacar este comentario (se mostrará en la ficha del cliente)
              </span>
            </label>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: '20px', color: '#6B7280' }}>Cargando...</div>
      </div>
    );
  }

  const navBtnStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: '14px',
    fontWeight: 500,
    backgroundColor: 'white',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#374151',
  };
  const navBtnDisabled: React.CSSProperties = { ...navBtnStyle, opacity: 0.4, cursor: 'not-allowed' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <button
                onClick={() => navigate('/config/clientes')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: '14px', padding: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                ← Volver a Clientes
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                    {cliente?.descripcion || cliente?.codigo || 'Cliente'}
                  </h1>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                    Código: {cliente?.codigo} | Tipo Licencia: {cliente?.licenciaTipo || 'No definida'} | Jefe Proyecto 1: {cliente?.jefeProyecto1 || '-'} | Jefe Proyecto 2: {cliente?.jefeProyecto2 || '-'}
                    {currentRelease && (
                      <span style={{ marginLeft: '12px', padding: '2px 8px', backgroundColor: '#D1FAE5', color: '#059669', borderRadius: '4px', fontWeight: 500 }}>
                        {currentRelease.release?.codigo}{currentRelease.hotfix ? `-${currentRelease.hotfix.codigo}` : ''}
                      </span>
                    )}
                  </p>
                  {comentarioDestacado && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #FDE68A',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#92400E',
                      lineHeight: '1.6'
                    }} title={comentarioDestacado}>
                      <div style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        <span style={{ fontWeight: 600, marginRight: '8px' }}>Nota:</span>
                        {comentarioDestacado}
                      </div>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => setShowClienteModal(true)}
                    style={{ padding: '8px 16px', backgroundColor: '#2563EB', color: 'white', fontSize: '14px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer', marginLeft: '16px', whiteSpace: 'nowrap' }}
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '24px' }}>
              <button onClick={goFirst} disabled={!canGoFirst} style={canGoFirst ? navBtnStyle : navBtnDisabled} title="Primero">⏮</button>
              <button onClick={goPrev} disabled={!canGoPrev} style={canGoPrev ? navBtnStyle : navBtnDisabled} title="Anterior">◀</button>
              <span style={{ padding: '6px 12px', fontSize: '13px', color: '#6B7280' }}>
                {currentIndex >= 0 ? `${currentIndex + 1} / ${allClientes.length}` : '-'}
              </span>
              <button onClick={goNext} disabled={!canGoNext} style={canGoNext ? navBtnStyle : navBtnDisabled} title="Siguiente">▶</button>
              <button onClick={goLast} disabled={!canGoLast} style={canGoLast ? navBtnStyle : navBtnDisabled} title="Último">⏭</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                  color: activeTab === tab.id ? '#2563EB' : '#6B7280',
                  background: 'none',
                  cursor: 'pointer'
                }}
              >
                <span style={{ marginRight: '8px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #E5E7EB' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            {canEdit && (
              <button onClick={() => openModal()} style={{ padding: '8px 16px', backgroundColor: '#2563EB', color: 'white', fontSize: '14px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                + Agregar
              </button>
            )}
          </div>

          <div style={{ padding: '24px' }}>
            {renderTable()}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '672px', width: '100%', margin: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                {!canEdit ? 'Ver' : (editingItem ? 'Editar' : 'Agregar')} {tabs.find(t => t.id === activeTab)?.label}
              </h3>
            </div>
            <div style={{ padding: '24px' }}>
              {renderForm()}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => { setShowModal(false); setEditingItem(null); setFormData({}); }} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: '#374151', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }}>
                {!canEdit || (activeTab === 'releases' && editingItem?.estado === 'INSTALADO') ? 'Cerrar' : 'Cancelar'}
              </button>
              {canEdit && !(activeTab === 'releases' && editingItem?.estado === 'INSTALADO') && (
                <button onClick={handleSave} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Guardar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showClienteModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '600px', width: '100%', margin: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Editar Cliente
              </h3>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Código *</label>
                  <input
                    type="text"
                    style={{ marginTop: '4px', display: 'block', width: '100%', borderRadius: '6px', border: '1px solid #D1D5DB', padding: '8px 12px', boxSizing: 'border-box' }}
                    value={clienteForm.codigo || ''}
                    onChange={(e) => setClienteForm({...clienteForm, codigo: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Descripción</label>
                  <input
                    type="text"
                    style={{ marginTop: '4px', display: 'block', width: '100%', borderRadius: '6px', border: '1px solid #D1D5DB', padding: '8px 12px', boxSizing: 'border-box' }}
                    value={clienteForm.descripcion || ''}
                    onChange={(e) => setClienteForm({...clienteForm, descripcion: e.target.value})}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Jefe Proyecto 1</label>
                    <select
                      style={{ marginTop: '4px', display: 'block', width: '100%', borderRadius: '6px', border: '1px solid #D1D5DB', padding: '8px 12px', boxSizing: 'border-box' }}
                      value={clienteForm.jefeProyecto1 || ''}
                      onChange={(e) => setClienteForm({...clienteForm, jefeProyecto1: e.target.value})}
                    >
                      <option value="">-- Seleccionar --</option>
                      {allAgentes.map((a) => (
                        <option key={a.id} value={a.usuario}>{a.nombre} ({a.usuario})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Jefe Proyecto 2</label>
                    <select
                      style={{ marginTop: '4px', display: 'block', width: '100%', borderRadius: '6px', border: '1px solid #D1D5DB', padding: '8px 12px', boxSizing: 'border-box' }}
                      value={clienteForm.jefeProyecto2 || ''}
                      onChange={(e) => setClienteForm({...clienteForm, jefeProyecto2: e.target.value})}
                    >
                      <option value="">-- Seleccionar --</option>
                      {allAgentes.map((a) => (
                        <option key={a.id} value={a.usuario}>{a.nombre} ({a.usuario})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Tipo Licencia</label>
                  <select
                    style={{ marginTop: '4px', display: 'block', width: '100%', borderRadius: '6px', border: '1px solid #D1D5DB', padding: '8px 12px', boxSizing: 'border-box', maxWidth: '200px' }}
                    value={clienteForm.licenciaTipo || ''}
                    onChange={(e) => setClienteForm({...clienteForm, licenciaTipo: e.target.value})}
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="AAM">AAM</option>
                    <option value="PPU">PPU</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowClienteModal(false)}
                style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: '#374151', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCliente}
                disabled={savingCliente}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'white',
                  backgroundColor: '#2563EB',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: savingCliente ? 'not-allowed' : 'pointer',
                  opacity: savingCliente ? 0.7 : 1
                }}
              >
                {savingCliente ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteFichaView;