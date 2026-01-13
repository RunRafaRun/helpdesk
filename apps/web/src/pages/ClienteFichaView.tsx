import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ClienteFichaView: React.FC = () => {
  const { clienteId } = useParams<{ clienteId: string }>();
  const [activeTab, setActiveTab] = useState('software');
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchCliente();
  }, [clienteId]);

  useEffect(() => {
    fetchItems();
  }, [clienteId, activeTab]);

  const fetchCliente = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8080/admin/clientes/${clienteId}`, {
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
    comentarios: 'comentarios'
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `http://localhost:8080/clientes/${clienteId}/${endpoints[activeTab]}`,
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

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const url = editingItem
        ? `http://localhost:8080/clientes/${clienteId}/${endpoints[activeTab]}/${editingItem.id}`
        : `http://localhost:8080/clientes/${clienteId}/${endpoints[activeTab]}`;
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingItem(null);
        setFormData({});
        fetchItems();
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

    try {
      const token = localStorage.getItem('accessToken');

      await fetch(`http://localhost:8080/clientes/${clienteId}/${endpoints[activeTab]}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      fetchItems();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar el registro');
    }
  };

  const openModal = (item: any = null) => {
    setEditingItem(item);
    setFormData(item || {});
    setShowModal(true);
  };

  const tabs = [
    { id: 'software', label: 'Software', icon: '💻' },
    { id: 'contactos', label: 'Contactos', icon: '👥' },
    { id: 'conexiones', label: 'Conexiones', icon: '🔌' },
    { id: 'centros', label: 'Centros de Trabajo', icon: '🏢' },
    { id: 'releases', label: 'Releases/Hotfixes', icon: '📦' },
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
        <button onClick={() => openModal(item)} style={actionBtnEdit}>Editar</button>
        <button onClick={() => handleDelete(item.id)} style={actionBtnDelete}>Eliminar</button>
      </td>
    );

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
                <td style={tdStyle}>{item.modulo || '-'}</td>
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
              <th style={thStyle}>Endpoint</th>
              <th style={thStyle}>Usuario</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{item.nombre}</td>
                <td style={tdStyle}>{item.endpoint || '-'}</td>
                <td style={tdStyle}>{item.usuario || '-'}</td>
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
              <th style={thStyle}>Ciudad</th>
              <th style={thStyle}>Provincia</th>
              <th style={thStyle}>País</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{item.nombre}</td>
                <td style={tdStyle}>{item.ciudad || '-'}</td>
                <td style={tdStyle}>{item.provincia || '-'}</td>
                <td style={tdStyle}>{item.pais || '-'}</td>
                {renderActions(item)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'releases') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Título</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Fecha Prevista</th>
              <th style={thStyle}>Agente</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={tdStyle}>
                  <span style={{ ...badgeStyle, backgroundColor: item.tipo === 'RELEASE' ? '#DBEAFE' : '#FEF3C7', color: item.tipo === 'RELEASE' ? '#1D4ED8' : '#B45309' }}>
                    {item.tipo}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{item.titulo}</td>
                <td style={tdStyle}>
                  <span style={{
                    ...badgeStyle,
                    backgroundColor: item.estado === 'INSTALADO' ? '#D1FAE5' : item.estado === 'EN_CURSO' ? '#DBEAFE' : item.estado === 'CANCELADO' ? '#FEE2E2' : '#F3F4F6',
                    color: item.estado === 'INSTALADO' ? '#059669' : item.estado === 'EN_CURSO' ? '#1D4ED8' : item.estado === 'CANCELADO' ? '#DC2626' : '#374151'
                  }}>
                    {item.estado}
                  </span>
                </td>
                <td style={tdStyle}>{item.fechaPrevista ? new Date(item.fechaPrevista).toLocaleDateString() : '-'}</td>
                <td style={tdStyle}>{item.agente?.nombre || '-'}</td>
                {renderActions(item)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'comentarios') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Comentario</th>
              <th style={thStyle}>Agente</th>
              <th style={thStyle}>Fecha</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.texto}</td>
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

    if (activeTab === 'software') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select style={inputStyle} value={formData.tipo || ''} onChange={(e) => setFormData({...formData, tipo: e.target.value})}>
              <option value="">Seleccione...</option>
              <option value="GP">GP</option>
              <option value="PM">PM</option>
              <option value="PLATAFORMA">PLATAFORMA</option>
              <option value="OTRO">OTRO</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input type="text" style={inputStyle} value={formData.nombre || ''} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Versión</label>
            <input type="text" style={inputStyle} value={formData.version || ''} onChange={(e) => setFormData({...formData, version: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Módulo</label>
            <input type="text" style={inputStyle} value={formData.modulo || ''} onChange={(e) => setFormData({...formData, modulo: e.target.value})} />
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
            <label style={labelStyle}>Endpoint</label>
            <input type="text" style={inputStyle} value={formData.endpoint || ''} onChange={(e) => setFormData({...formData, endpoint: e.target.value})} placeholder="https://..." />
          </div>
          <div>
            <label style={labelStyle}>Usuario</label>
            <input type="text" style={inputStyle} value={formData.usuario || ''} onChange={(e) => setFormData({...formData, usuario: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Referencia de Secreto</label>
            <input type="text" style={inputStyle} value={formData.secretRef || ''} onChange={(e) => setFormData({...formData, secretRef: e.target.value})} placeholder="Referencia al secreto en vault" />
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
            <label style={labelStyle}>Dirección</label>
            <input type="text" style={inputStyle} value={formData.direccion || ''} onChange={(e) => setFormData({...formData, direccion: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Ciudad</label>
              <input type="text" style={inputStyle} value={formData.ciudad || ''} onChange={(e) => setFormData({...formData, ciudad: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Provincia</label>
              <input type="text" style={inputStyle} value={formData.provincia || ''} onChange={(e) => setFormData({...formData, provincia: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Código Postal</label>
              <input type="text" style={inputStyle} value={formData.codigoPostal || ''} onChange={(e) => setFormData({...formData, codigoPostal: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>País</label>
              <input type="text" style={inputStyle} value={formData.pais || ''} onChange={(e) => setFormData({...formData, pais: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notas</label>
            <textarea style={{...inputStyle, minHeight: '80px'}} value={formData.notas || ''} onChange={(e) => setFormData({...formData, notas: e.target.value})} />
          </div>
        </div>
      );
    }

    if (activeTab === 'releases') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Tipo *</label>
              <select style={inputStyle} value={formData.tipo || ''} onChange={(e) => setFormData({...formData, tipo: e.target.value})}>
                <option value="">Seleccione...</option>
                <option value="RELEASE">RELEASE</option>
                <option value="HOTFIX">HOTFIX</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select style={inputStyle} value={formData.estado || 'PLANIFICADO'} onChange={(e) => setFormData({...formData, estado: e.target.value})}>
                <option value="PLANIFICADO">PLANIFICADO</option>
                <option value="EN_CURSO">EN_CURSO</option>
                <option value="INSTALADO">INSTALADO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Título *</label>
            <input type="text" style={inputStyle} value={formData.titulo || ''} onChange={(e) => setFormData({...formData, titulo: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Fecha Prevista</label>
              <input type="date" style={inputStyle} value={formData.fechaPrevista ? formData.fechaPrevista.split('T')[0] : ''} onChange={(e) => setFormData({...formData, fechaPrevista: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Fecha Instalada</label>
              <input type="date" style={inputStyle} value={formData.fechaInstalada ? formData.fechaInstalada.split('T')[0] : ''} onChange={(e) => setFormData({...formData, fechaInstalada: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Detalle</label>
            <textarea style={{...inputStyle, minHeight: '80px'}} value={formData.detalle || ''} onChange={(e) => setFormData({...formData, detalle: e.target.value})} />
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              {cliente?.descripcion || cliente?.codigo || 'Cliente'}
            </h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
              Código: {cliente?.codigo} | Licencia: {cliente?.licenciaTipo || 'No definida'}
            </p>
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
                  borderBottom: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                  color: activeTab === tab.id ? '#2563EB' : '#6B7280',
                  background: 'none',
                  border: 'none',
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
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
            <button onClick={() => openModal()} style={{ padding: '8px 16px', backgroundColor: '#2563EB', color: 'white', fontSize: '14px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
              + Agregar
            </button>
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
                {editingItem ? 'Editar' : 'Agregar'} {tabs.find(t => t.id === activeTab)?.label}
              </h3>
            </div>
            <div style={{ padding: '24px' }}>
              {renderForm()}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => { setShowModal(false); setEditingItem(null); setFormData({}); }} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: '#374151', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSave} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteFichaView;