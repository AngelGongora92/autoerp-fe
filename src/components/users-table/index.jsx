import React, { useState, useEffect } from 'react';
import { Table, Tag, Spin, Button, Space, Input, Modal, message } from 'antd';
import CreateUserModal from '../create-user-modal'; // Asumiendo que CreateUserModal está en un archivo separado

const apiUrl = import.meta.env.VITE_API_URL;

function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modal, contextHolder] = Modal.useModal();

  const handleEdit = (record) => {
    console.log('Editar usuario:', record);
    // Aquí puedes agregar la lógica para llamar a tu API de edición
  };

  const handleDelete = (record) => {
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
          modal.error({
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

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  
  // FUNCIÓN AÑADIDA
  const handleCreate = async (values) => {
    console.log('Creando nuevo usuario con:', values);
    
    try {
      const response = await fetch(`${apiUrl}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values), 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error al crear el usuario.' }));
        throw new Error(errorData.detail || 'No se pudo crear el usuario.');
      }

      const newUser = await response.json();

      setUsers(prevUsers => [...prevUsers, newUser]);
      message.success(`Usuario "${newUser.username}" creado con éxito.`);
      
      setIsModalOpen(false); 
    } catch (err) {
      console.error("Error al crear usuario:", err);
      message.error(err.message);
    }
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
        size="middle"
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        pagination={{ pageSize: 5, position: ['bottomCenter'] }}
      />
      <CreateUserModal
        open={isModalOpen}
        onCreate={handleCreate}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default UsersTable;