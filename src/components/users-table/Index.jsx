import React, { useState, useEffect } from 'react';
import { Table, Tag, Spin, Button, Space, Input, Modal } from 'antd';

function UsersTable() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (record) => {
    console.log('Editar usuario:', record);
    // Aquí puedes agregar la lógica para llamar a tu API de edición
  };

  const handleDelete = (record) => {
    console.log('Eliminar usuario:', record);
    // Aquí puedes agregar la lógica para llamar a tu API de eliminación
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    // Aquí irá la lógica para enviar el nuevo usuario a la API
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // 2. Define la estructura de las columnas de la tabla
  const columns = [
    
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username), // Habilita el ordenamiento
    },
    {
      title: 'Admin',
      dataIndex: 'is_admin',
      key: 'is_admin',
      // 'render' te permite personalizar cómo se muestra la celda
      render: (isAdmin) => (
        isAdmin ? <Tag color="blue">Sí</Tag> : <Tag color="default">No</Tag>
      ),
    },
    {
      title: 'Permisos',
      key: 'permissions',
      dataIndex: 'permissions',
      
      onCell: () => {
      return {
        style: {
            border: 'dashed 1px #ccc',
            borderRadius: '8px',
            
        },
      };
    },
      
      // Usamos 'render' de nuevo para el array de permisos
      render: (permissions) => (
        <>
          {permissions.length > 0 ? (
            permissions.map(permission => (
              <Tag color="geekblue" key={permission.name}>
                {permission.name.toUpperCase()}
              </Tag>
            ))
          ) : (
            <Tag color="default">Sin permisos</Tag>
          )}
        </>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      // 'render' te permite personalizar cómo se muestra la celda
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
        const response = await fetch('http://127.0.0.1:8000/users/');
        if (!response.ok) {
          throw new Error('La respuesta de la red no fue OK');
        }
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Efecto para filtrar los usuarios cuando cambia el texto de búsqueda
  useEffect(() => {
    const results = users.filter(user =>
      user.username.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchText, users]);

  if (error) {
    return <div>Error al cargar los datos: {error}</div>;
  }
  
  // Usamos el Spin de Antd para un mejor indicador de carga
  if (loading) {
    return <Spin tip="Cargando usuarios..." size="large" fullscreen />;
  }


  return (
    <div style={{ padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Usuarios</h2>
        <Space>
          <Input
            placeholder="Buscar por nombre de usuario..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 240 }}
          />
          <Button type="primary" onClick={showModal}>
            Nuevo Usuario
          </Button>
        </Space>
      </div>
      
      {/* 3. Usa el componente Table */}
      <Table 
        size="middle"
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id" // Le dice a la tabla que use el 'id' como key única para cada fila
        pagination={{ pageSize: 5, position: ['bottomCenter'] }} // Centra la paginación en la parte inferior
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