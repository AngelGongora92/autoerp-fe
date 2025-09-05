import React, { useState, useEffect } from 'react';
import { Table, Tag, Spin, Button, Space, Input, Modal, message } from 'antd';

const apiUrl = import.meta.env.VITE_API_URL;

function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // PASO 1: Llama al hook de Ant Design para obtener la instancia del modal y el contextHolder
  const [modal, contextHolder] = Modal.useModal();

  const handleEdit = (record) => {
    console.log('Editar usuario:', record);
    // Aquí puedes agregar la lógica para llamar a tu API de edición
  };

  const handleDelete = (record) => {
    // PASO 3: Usa la instancia 'modal' (en minúscula) en lugar del 'Modal' global
    modal.confirm({
      title: '¿Estás seguro de que quieres eliminar este usuario?',
      content: `Estás a punto de eliminar a "${record.username}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          const response = await fetch(`${apiUrl}/users/${record.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'No se pudo eliminar el usuario.' }));
            throw new Error(errorData.detail || 'Error del servidor al intentar eliminar.');
          }

          setUsers(prevUsers => prevUsers.filter(user => user.id !== record.id));
          message.success(`Usuario "${record.username}" eliminado con éxito.`);
        } catch (err) {
          console.error("Error al eliminar el usuario:", err);
          modal.error({ // También se actualiza aquí para consistencia
            title: 'Error al eliminar',
            content: err.message,
          });
        }
      },
    });
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      align: 'center',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Admin',
      dataIndex: 'is_admin',
      key: 'is_admin',
      align: 'center',
      render: (isAdmin) => (isAdmin ? <Tag color="blue">Sí</Tag> : <Tag color="default">No</Tag>),
    },
    {
      title: 'Permisos',
      key: 'permissions',
      dataIndex: 'permissions',
      align: 'center',
      render: (permissions) => (
        <Space size={[0, 8]} wrap>
          {permissions.length > 0 ? (
            permissions.map(permission => (
              <Tag color="geekblue" key={permission.name}>{permission.name.toUpperCase()}</Tag>
            ))
          ) : (
            <Tag color="default">Sin permisos</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      align: 'center',
      render: (text, record) => (
        <Space size="middle" wrap>
          <Button type="primary" ghost onClick={() => handleEdit(record)}>Editar</Button>
          <Button type="primary" danger ghost onClick={() => handleDelete(record)}>Eliminar</Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/`);
        if (!response.ok) {
          throw new Error('La respuesta de la red no fue OK');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (error) {
    return <div>Error al cargar los datos: {error}</div>;
  }
  
  if (loading) {
    return <Spin tip="Cargando usuarios..." size="large" fullscreen />;
  }

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '10px' }}>
      {/* PASO 2: Renderiza el contextHolder invisible. Es crucial para que el modal funcione. */}
      {contextHolder}
      
      <h2>Usuarios</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Input
          placeholder="Buscar por nombre de usuario..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 240 }}
        />
        <Button type="primary" onClick={showModal}>
          Nuevo Usuario
        </Button>
      </div>

      <Table 
        size="big"
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        pagination={{ pageSize: 5, position: ['bottomCenter'] }}
      />
      <Modal title="Crear Nuevo Usuario" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} footer={[
        <Button key="back" onClick={handleCancel}>Cancelar</Button>,
        <Button key="submit" type="primary" onClick={handleOk}>Guardar</Button>,
      ]}>
        <p>Aquí irá el formulario para crear un nuevo usuario.</p>
      </Modal>
    </div>
  );
}

export default UsersTable;