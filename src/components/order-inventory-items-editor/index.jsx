import React, { useState, useEffect } from 'react';
import { Typography, Button, Spin, message, Space, Card, Form, Input, Checkbox, Row, Col, Radio, Slider } from 'antd';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SaveOutlined, HolderOutlined, LeftOutlined, RightOutlined, PlusOutlined } from '@ant-design/icons';

const apiUrl = import.meta.env.VITE_API_URL;

// Componente para cada ítem del inventario en la lista vertical
const SortableListItem = ({ item, onItemChange }) => {
  const [sliderValue, setSliderValue] = useState(3); // Estado local para el valor del slider
  const [radioValue, setRadioValue] = useState(null); // Estado para los Radio.Button
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.item_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? '#f0f0f0' : '#fff',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    marginBottom: '8px',
  };

  // Lógica para el carrusel de tipo de input
  const inputTypes = ['three_options', 'checkbox', 'slider'];
  const currentTypeIndex = inputTypes.indexOf(item.input_type);

  const handlePrevInputType = () => {
    const newIndex = (currentTypeIndex - 1 + inputTypes.length) % inputTypes.length;
    onItemChange(item.item_id, 'input_type', inputTypes[newIndex]);
  };

  const handleNextInputType = () => {
    const newIndex = (currentTypeIndex + 1) % inputTypes.length;
    onItemChange(item.item_id, 'input_type', inputTypes[newIndex]);
  };

  let inputTypeDisplay;
  if (item.input_type === 'three_options') {
    const radioStyles = {
      good: { selected: { backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a' }, unselected: { backgroundColor: '#f6ffed', color: 'rgba(0,0,0,0.88)', borderColor: '#b7eb8f' } },
      regular: { selected: { backgroundColor: '#faad14', color: 'white', borderColor: '#faad14' }, unselected: { backgroundColor: '#fffbe6', color: 'rgba(0,0,0,0.88)', borderColor: '#ffe58f' } },
      bad: { selected: { backgroundColor: '#f5222d', color: 'white', borderColor: '#f5222d' }, unselected: { backgroundColor: '#fff1f0', color: 'rgba(0,0,0,0.88)', borderColor: '#ffccc7' } },
    };

    inputTypeDisplay = (
      <Radio.Group size="small" onChange={(e) => setRadioValue(e.target.value)}>
        <Radio.Button value={1} style={radioValue === 1 ? radioStyles.good.selected : radioStyles.good.unselected}>B</Radio.Button>
        <Radio.Button value={2} style={radioValue === 2 ? radioStyles.regular.selected : radioStyles.regular.unselected}>R</Radio.Button>
        <Radio.Button value={3} style={radioValue === 3 ? radioStyles.bad.selected : radioStyles.bad.unselected}>M</Radio.Button>
      </Radio.Group>
    );
  } else if (item.input_type === 'checkbox') {
    inputTypeDisplay = <Checkbox />;
  } else if (item.input_type === 'slider') {
    inputTypeDisplay = (
      <Space>
        <Slider min={0} max={5} value={sliderValue} onChange={setSliderValue} style={{ width: 80, margin: 0 }} />
        <span style={{ minWidth: '1.5em', textAlign: 'center' }}>{sliderValue}</span>
      </Space>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Row gutter={[16, 8]} align="middle" style={{ padding: '8px 12px' }}>
        <Col style={{ cursor: 'grab' }} {...attributes} {...listeners}>
          <HolderOutlined />
        </Col>
        <Col flex="0.7">
          <Input value={item.label} onChange={(e) => onItemChange(item.item_id, 'label', e.target.value)} />
        </Col>
        <Col flex="1">
          <Input value={item.description} onChange={(e) => onItemChange(item.item_id, 'description', e.target.value)} />
        </Col>
        <Col flex="1">
          <Space>
            <Button size="small" icon={<LeftOutlined />} onClick={handlePrevInputType} />
            <div style={{ minWidth: 140, textAlign: 'center', border: '1px solid #d9d9d9', padding: '4px', borderRadius: '6px', backgroundColor: '#fafafa' }}>
              {inputTypeDisplay}
            </div>
            <Button size="small" icon={<RightOutlined />} onClick={handleNextInputType} />
          </Space>
        </Col>
        <Col>
          <Checkbox checked={item.picture_upload} onChange={(e) => onItemChange(item.item_id, 'picture_upload', e.target.checked)}>Foto</Checkbox>
        </Col>
        <Col>
          <Checkbox checked={item.is_mandatory} onChange={(e) => onItemChange(item.item_id, 'is_mandatory', e.target.checked)}>Obligatorio</Checkbox>
        </Col>
      </Row>
    </div>
  );
};

const OrderInventoryItemsEditor = ({ inventory, onInventoryUpdate, onDeselect }) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsSaving, setItemsSaving] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    if (inventory) {
      const formValues = { ...inventory, is_hidden: !inventory.is_active }; // is_hidden es el inverso de is_active
      form.setFieldsValue(formValues);
      setIsEditing(false);
    } else {
      form.resetFields();
    }
  }, [inventory, form]);

  useEffect(() => {
    const fetchItems = async () => {
      if (inventory) {
        setItemsLoading(true);
        setInventoryItems([]);
        try {
          const response = await fetch(`${apiUrl}/orders/inventory-items/${inventory.inv_type_id}`);
          if (!response.ok) throw new Error('No se pudieron cargar los ítems del inventario.');
          const data = await response.json();
          const sortedItems = (data.items || []).sort((a, b) => a.position - b.position);
          setInventoryItems(sortedItems);
        } catch (error) {
          message.error(error.message);
        } finally {
          setItemsLoading(false);
        }
      } else {
        setInventoryItems([]);
      }
    };
    fetchItems();
  }, [inventory]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleUpdateInventory = async (values) => {
    setSaving(true);
    try {
      const payload = { name: values.name, is_active: !values.is_hidden }; // Invertimos el valor de is_hidden para obtener is_active
      const response = await fetch(`${apiUrl}/orders/inventory-types/${inventory.inv_type_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'No se pudo actualizar el inventario.');
      const updatedInventory = await response.json();
      message.success(`Inventario "${updatedInventory.name}" actualizado.`);
      onInventoryUpdate(updatedInventory);
      setIsEditing(false);
    } catch (error) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleItemDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setInventoryItems((items) => {
        const oldIndex = items.findIndex((item) => item.item_id === active.id);
        const newIndex = items.findIndex((item) => item.item_id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleItemChange = (itemId, field, value) => {
    setInventoryItems(prevItems => prevItems.map(item => item.item_id === itemId ? { ...item, [field]: value } : item));
  };

  const handleAddItem = async () => {
    setIsAddingItem(true);
    try {
      const newItemPayload = {
      inv_type_id: inventory.inv_type_id,
      label: 'Nuevo Ítem', // Un nombre por defecto
      description: '',
      input_type: 'checkbox',
      picture_upload: false,
      is_mandatory: false,
      position: inventoryItems.length, // La posición final en la lista actual
      };

      const response = await fetch(`${apiUrl}/orders/inventory-items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItemPayload),
      });

      if (!response.ok) {
        throw new Error('No se pudo crear el nuevo ítem.');
      }

      const createdItem = await response.json();
      setInventoryItems(prevItems => [...prevItems, createdItem]);
      message.success(`Ítem "${createdItem.label}" añadido. Ahora puedes editarlo.`);
    } catch (error) {
      message.error(error.message);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleSaveItems = async () => {
    setItemsSaving(true);
    try {
      const allItems = inventoryItems
        .filter(item => item.label && item.label.trim() !== '')
        .map((item, index) => {
          // Aseguramos que se envíe 'is_mandatory' y no 'is_required'
          const { is_required, ...rest } = item;
          return { ...rest, position: index, is_mandatory: !!item.is_mandatory };
        });

      if (allItems.length === 0 && inventoryItems.length > 0) {
        message.warning('No hay ítems con nombre para guardar.');
        setItemsSaving(false);
        return;
      }
      
      if (allItems.length === 0) {
        message.info('No hay cambios que guardar.');
        setItemsSaving(false);
        return;
      }

      // Ahora solo necesitamos una petición PATCH con todos los ítems.
      const response = await fetch(`${apiUrl}/orders/inventory-items/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allItems),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudieron guardar los ítems.');
      }

      message.success('Ítems guardados correctamente.');
      // Opcional: Volver a cargar los ítems para obtener los IDs reales de los nuevos ítems
      // y reflejar cualquier cambio del backend.
      // Para ello, se podría crear una función `fetchItems` fuera del useEffect y llamarla aquí.
    } catch (error) {
      message.error(error.message);
    } finally {
      setItemsSaving(false);
    }
  };

  return (
    <Card title="Editor de Inventario" styles={{ header: { textAlign: 'center' } }} style={{ marginTop: 24 }} id={`inventory-editor-${inventory.inv_type_id}`}>
      <Form form={form} layout="vertical" onFinish={handleUpdateInventory} onValuesChange={() => setIsEditing(true)}>
        <Form.Item name="name" label="Nombre del Inventario" rules={[{ required: true, message: 'El nombre es requerido' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="is_hidden" valuePropName="checked">
          <Checkbox>Ocultar inventario</Checkbox>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving} disabled={!isEditing}>
              Guardar Cambios
            </Button>
            <Button onClick={onDeselect}>Cerrar</Button>
          </Space>
        </Form.Item>
      </Form>

      {inventory.inv_type_id !== 1 && (
        <Spin spinning={itemsLoading} tip="Cargando ítems...">
          <Typography.Title level={5} style={{ marginTop: 24 }}>Ítems del Inventario</Typography.Title>
          <Typography.Paragraph>Arrastra los ítems para reordenarlos. Los cambios se guardan al presionar "Guardar".</Typography.Paragraph>
          
          <Row gutter={[16, 8]} style={{ marginBottom: 8, padding: '0 12px' }}>
            <Col style={{ width: 24 }}></Col>
            <Col flex="0.7"><Typography.Text strong>Label</Typography.Text></Col>
            <Col flex="1"><Typography.Text strong>Descripción</Typography.Text></Col>
            <Col flex="1"><Typography.Text strong>Tipo de Input</Typography.Text></Col>
            <Col><Typography.Text strong>Opciones</Typography.Text></Col>
            <Col style={{ width: 110 }}></Col>
          </Row>

          <DndContext sensors={sensors} onDragEnd={handleItemDragEnd}>
            <SortableContext items={inventoryItems.map(i => i.item_id)} strategy={verticalListSortingStrategy}>
              {inventoryItems.map(item => (
                <SortableListItem key={item.item_id} item={item} onItemChange={handleItemChange} />
              ))}
            </SortableContext>
          </DndContext>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, gap: '8px' }}>
            <Button icon={<PlusOutlined />} onClick={handleAddItem} loading={isAddingItem}>
              Añadir Ítem
            </Button>
            {inventoryItems.length > 0 && (
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveItems} loading={itemsSaving}>
                Guardar
              </Button>
            )}
          </div>
        </Spin>
      )}
    </Card>
  );
};

export default OrderInventoryItemsEditor;
