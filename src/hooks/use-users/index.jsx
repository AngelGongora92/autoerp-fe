// src/hooks/useUsers.js
import { useState, useEffect, useCallback } from 'react';
import { message, Modal } from 'antd';

const apiUrl = import.meta.env.VITE_API_URL;

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, contextHolder] = Modal.useModal(); // Antd hook for modals

  // State for the edit modal
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Usamos useCallback para que la función no se recree en cada render
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/users/`);
      if (!response.ok) throw new Error('La respuesta de la red no fue OK');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = useCallback(async (values) => {
    try {
      const response = await fetch(`${apiUrl}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo crear el usuario.');
      }
      const newUser = await response.json();
      setUsers((prev) => [...prev, newUser]); // Actualizamos el estado local
      message.success(`Usuario "${newUser.username}" creado con éxito.`);
      return Promise.resolve();
    } catch (err) {
      message.error(err.message);
      return Promise.reject(err);
    }
  }, []);

  const updateUser = useCallback(async (userId, values) => {
    try {
      const response = await fetch(`${apiUrl}/users/${userId}`, {
        method: 'PUT', // Or PATCH, depending on your API
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo actualizar el usuario.');
      }

      const updatedUser = await response.json();
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? updatedUser : user))
      );
      message.success(`Usuario "${updatedUser.username}" actualizado con éxito.`);
      return Promise.resolve();
    } catch (err) {
      message.error(err.message);
      return Promise.reject(err);
    }
  }, []);

  const deleteUser = useCallback((userToDelete) => {
     modal.confirm({
      title: `¿Eliminar a ${userToDelete.username}?`,
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          const response = await fetch(`${apiUrl}/users/${userToDelete.id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'No se pudo eliminar.');
          }
          setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
          message.success(`Usuario "${userToDelete.username}" eliminado.`);
        } catch (err) {
          modal.error({ title: 'Error al eliminar', content: err.message });
        }
      },
    });
  }, [modal]);
  
  // Handlers for the edit modal
  const handleEdit = useCallback((user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingUser(null); // It's good practice to clear the user data on cancel
  }, []);
  
  // El hook devuelve el estado y las funciones que el componente necesita
  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    contextHolder,
    editingUser,
    isEditModalOpen,
    handleEdit,
    handleCancelEdit,
  };
}