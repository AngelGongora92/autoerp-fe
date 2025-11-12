import React, { useState, useEffect } from 'react';
import { Typography, Button, Spin, message, Space } from 'antd';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SaveOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import CreateOrderInventoryModal from '../create-order-inventory-modal';
import OrderInventoryItemsEditor from '../order-inventory-items-editor';

const { Title } = Typography;
const apiUrl = import.meta.env.VITE_API_URL;

// Componente para cada elemento de la lista que se puede arrastrar
const SortableItem = ({ item, onClick, isSelected }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.inv_type_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    backgroundColor: isDragging ? '#f0f0f0' : '#fff',
    border: isSelected ? '2px solid #1677ff' : '1px solid #d9d9d9',
    borderRadius: '8px', // Bordes redondeados
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', // Centrar el texto
    width: '150px', // Hacerlo cuadrado
    height: '150px', // Hacerlo cuadrado
    textAlign: 'center',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}> {/* listeners y attributes en el div principal */}
        <span>{item.name.toUpperCase()}</span>
    </div>
  );
};

function OrderInventoriesList() {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/orders/inventory-types/`);
      if (!response.ok) throw new Error('No se pudieron cargar los tipos de inventario.');
      const data = await response.json();
      // Ordenamos por la posición guardada en la base de datos
      const sortedData = data.sort((a, b) => a.position - b.position);
      setInventories(sortedData);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);


  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // El usuario debe arrastrar 5px para iniciar el drag
    },
  }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setInventories((items) => {
        const oldIndex = items.findIndex((item) => item.inv_type_id === active.id);
        const newIndex = items.findIndex((item) => item.inv_type_id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const payload = inventories.map((item, index) => ({
        inv_type_id: item.inv_type_id,
        position: index + 1, // Asignamos la nueva posición
      }));

      const response = await fetch(`${apiUrl}/orders/inventory-types/reorder`, {
        method: 'PUT', // Usamos PUT para actualizar el orden
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('No se pudo guardar el nuevo orden.');

      message.success('Orden de inventarios guardado con éxito.');
    } catch (error) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInventory = async (values) => {
    setCreating(true);
    try {
      const response = await fetch(`${apiUrl}/orders/inventory-types/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo crear el tipo de inventario.');
      }
      message.success(`Inventario "${values.name}" creado con éxito.`);
      setIsModalVisible(false);
      fetchInventories(); // Volvemos a cargar los inventarios para mostrar el nuevo
    } catch (error) {
      message.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleItemClick = (item) => {
    if (selectedInventory?.inv_type_id === item.inv_type_id) {
      setSelectedInventory(null); // Deseleccionar si se hace clic en el mismo
    } else {
      setSelectedInventory(item);
    }
  };

  const handleInventoryUpdate = (updatedInventory) => {
    // Actualizar la lista localmente para reflejar el cambio
    setInventories(prev => prev.map(inv => 
      inv.inv_type_id === updatedInventory.inv_type_id ? updatedInventory : inv
    ));
    // Actualizar el item seleccionado si sigue siendo el mismo
    setSelectedInventory(updatedInventory);
  };
  return (
    <Spin spinning={loading} tip="Cargando inventarios...">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={2} style={{ margin: 0 }}>Configuración de Inventarios</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Nuevo Inventario
        </Button>
      </div>
      <Typography.Paragraph>Arrastra los elementos para reordenarlos. Presiona "Guardar Orden" para aplicar los cambios.</Typography.Paragraph>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={inventories.map(i => i.inv_type_id)} strategy={horizontalListSortingStrategy}>
            <Space wrap align="center" size="large" style={{ justifyContent: 'center' }}>
              {inventories.map((item, index) => (
                <React.Fragment key={item.inv_type_id}>
                  <SortableItem 
                    item={item} 
                    onClick={() => handleItemClick(item)}
                    isSelected={selectedInventory?.inv_type_id === item.inv_type_id}
                  />
                  {index < inventories.length - 1 && (
                    <RightOutlined style={{ color: '#ccc', fontSize: '24px' }} />
                  )}
                </React.Fragment>
              ))}
            </Space>
          </SortableContext>
        </DndContext>

        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSaveOrder} style={{ marginTop: 24 }}>
          Guardar
        </Button>
      </div>

      {selectedInventory && (
        <OrderInventoryItemsEditor 
          inventory={selectedInventory}
          onInventoryUpdate={handleInventoryUpdate}
          onDeselect={() => setSelectedInventory(null)}
        />
      )}

      <CreateOrderInventoryModal
        open={isModalVisible}
        onCreate={handleCreateInventory}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={creating}
      />
    </Spin>
  );
}

export default OrderInventoriesList;