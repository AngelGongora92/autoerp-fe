import React, { useState, useMemo } from 'react';
import { Table, Tag, Spin, Button, Space, Input } from 'antd';
import CreateUserModal from '../create-user-modal';
import EditUserModal from '../edit-user-modal';
import { useUsers } from '../../hooks/use-users'; // This line is correct

// ✅ Las columnas se pueden definir fuera del componente si no dependen de su estado o props
const columnsConfig = (handleEdit, handleDelete) => [
    { title: 'Username', dataIndex: 'username', key: 'username', align: 'center', sorter: (a, b) => a.username.localeCompare(b.username) },
    { title: 'Admin', dataIndex: 'is_admin', key: 'is_admin', align: 'center', render: (isAdmin) => <Tag color={isAdmin ? "blue" : "default"}>{isAdmin ? 'Sí' : 'No'}</Tag> },
    { title: 'Permisos', key: 'permissions', dataIndex: 'permissions', align: 'center', render: (permissions) => (
        <Space size={[0, 8]} wrap>
          {permissions?.length > 0 ? (
            permissions.map(p => <Tag color="geekblue" key={p.name}>{p.name.toUpperCase()}</Tag>)
          ) : (<Tag>Sin permisos</Tag>)}
        </Space>
    )},
    { title: 'Acciones', key: 'actions', align: 'center', render: (_, record) => (
        <Space size="middle" wrap>
          <Button type="primary" ghost onClick={() => handleEdit(record)}>Editar</Button>
          <Button type="primary" danger ghost onClick={() => handleDelete(record)}>Eliminar</Button>
        </Space>
    )},
];


function UsersTable() {
  // Obtenemos todo lo que necesitamos del hook, incluyendo las nuevas funciones para editar
  const {
    users,
    loading,
    error,
    createUser,
    deleteUser,
    contextHolder,
    editingUser,
    isEditModalOpen,
    handleEdit,
    handleCancelEdit,
    updateUser,
  } = useUsers();
  
  const [searchText, setSearchText] = useState('');
  // Renombramos el estado para mayor claridad
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Creamos las columnas, pasando las funciones de manejo del hook
  const columns = useMemo(() => columnsConfig(handleEdit, deleteUser), [handleEdit, deleteUser]);

  const filteredUsers = useMemo(() => 
    users.filter(user =>
      user.username.toLowerCase().includes(searchText.toLowerCase())
  ), [users, searchText]);

  if (error) return <div>Error al cargar los datos: {error}</div>;
  if (loading) return <Spin tip="Cargando usuarios..." size="large" fullscreen />;

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
        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
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
        open={isCreateModalOpen}
        onCreate={async (values) => {
          await createUser(values);
          setIsCreateModalOpen(false);
        }}
        onCancel={() => setIsCreateModalOpen(false)}
      />

      {/* Agregamos el modal de edición */}
      <EditUserModal
        open={isEditModalOpen}
        initialData={editingUser}
        onUpdate={async (values) => {
          if (editingUser) {
            await updateUser(editingUser.id, values);
          }
          handleCancelEdit(); // Cierra el modal
        }}
        onCancel={handleCancelEdit}
      />
    </div>
  );
}

export default UsersTable;