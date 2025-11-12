import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Radio, Input, Card, Spin, message, Typography, Col, Row, Checkbox, Tooltip, Space, Button, Modal, Upload, Image } from 'antd';
import { QuestionCircleOutlined, CameraOutlined, UploadOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons';
import { useSupabaseUpload } from '../../hooks/useSupabaseUpload';

const { Text } = Typography;

const capitalize = (s) => {
  if (typeof s !== 'string' || s.length === 0) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const GenericInventory = forwardRef(({ orderData, inventoryType, onCompletionChange }, ref) => {
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isUploading, isCompressing, uploadInventoryFile, deleteInventoryFile } = useSupabaseUpload();
  const apiUrl = import.meta.env.VITE_API_URL;

  // Estado para el modal de subida de imágenes
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [currentItemForUpload, setCurrentItemForUpload] = useState(null);

  const inventoryTypeName = inventoryType?.name?.toLowerCase().replace(/\s/g, '_');

  // 1. Al montar, le decimos al padre que este inventario está "completo" para poder avanzar.
  useEffect(() => {
    if (onCompletionChange) {
      onCompletionChange(true);
    }
  }, [onCompletionChange, inventoryType]);

  // 2. Cargar los ítems y los datos guardados para este inventario específico.
  useEffect(() => {
    const fetchData = async () => {
      if (!inventoryType?.inv_type_id || !orderData?.order_id) return;
      
      setIsLoading(true);
      try {
        // Petición para obtener los ítems del checklist (ej. "Asientos", "Tapetes")
        const itemsResponse = await fetch(`${apiUrl}/orders/inventory-items/${inventoryType.inv_type_id}`);
        if (!itemsResponse.ok) throw new Error('No se pudieron cargar los ítems del inventario.');
        const itemsData = await itemsResponse.json();
        const fetchedItems = Array.isArray(itemsData.items) ? itemsData.items : [];
        const sortedItems = fetchedItems.sort((a, b) => a.position - b.position);
        setItems(sortedItems);

        // Petición para obtener los datos ya guardados para esta orden y tipo de inventario
        const dataResponse = await fetch(`${apiUrl}/orders/inventory-data/${orderData.order_id}/${inventoryType.inv_type_id}`);
        if (dataResponse.ok) {
          const savedData = await dataResponse.json();
          // La API devuelve una lista de items. Necesitamos transformarla a un objeto
          // que antd Form pueda usar con `setFieldsValue`.
          // Ej: [{ item_id: 4, data: '{"status":"bueno"}' }] -> { 4: { status: 'bueno' } }
          const formValues = savedData.reduce((acc, current) => {
            try {
              acc[current.item_id] = current.data; // 'data' is now directly a JSON object
            } catch (e) { console.error("Error al parsear datos del item", current.item_id, e); }
            return acc;
          }, {});
          form.setFieldsValue(formValues);
        } else if (dataResponse.status !== 404) {
          // Si no es 404 (no encontrado), es un error real.
          throw new Error('No se pudieron cargar los datos guardados del inventario.');
        }

      } catch (error) {
        message.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [inventoryType, orderData, apiUrl, form]);

  // 3. Exponer la función de guardado para que el padre la llame.
  useImperativeHandle(ref, () => ({
    saveStep: async () => {
      setIsSaving(true);
      try {
        const values = form.getFieldsValue();
        
        // Solo guardamos si hay algún dato que enviar
        if (Object.keys(values).length === 0) {
            return true; // No hay nada que guardar, éxito.
        }

        // Creamos un array con el payload de cada ítem que tenga datos.
        const payload = Object.keys(values)
          .map(itemId => {
            const itemData = values[itemId];
            // Solo incluimos ítems que tengan algún dato (status o notes)
            if (!itemData || (itemData.status === undefined && !itemData.notes)) {
              return null;
            }
            return {
              order_id: orderData.order_id,
              item_id: parseInt(itemId, 10),
              data: itemData, // 'data' is now directly a JSON object
            };
          })
          .filter(Boolean); // Eliminamos los ítems nulos (sin datos)

        // Si después de filtrar no hay nada que guardar, consideramos la operación exitosa.
        if (payload.length === 0) return true;

        const response = await fetch(`${apiUrl}/orders/inventory-data/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), // Enviamos el array completo
        });

        if (!response.ok) {
          throw new Error(`No se pudo guardar el inventario de ${inventoryType.name}.`);
        }
        
        message.success(`Inventario de ${inventoryType.name} guardado.`);
        return true;
      } catch (error) {
        message.error(error.message);
        return false;
      } finally {
        setIsSaving(false);
      }
    }
  }));

  const handleOpenUploadModal = (item) => {
    setCurrentItemForUpload(item);
    setIsUploadModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsUploadModalVisible(false);
    setCurrentItemForUpload(null);
  };

  const beforeUploadValidation = (file) => {
    const MAX_ORIGINAL_SIZE_MB = 10;
    const isTooLarge = file.size / 1024 / 1024 > MAX_ORIGINAL_SIZE_MB;
    if (isTooLarge) {
      message.error(`El archivo es demasiado grande. El límite es de ${MAX_ORIGINAL_SIZE_MB} MB.`);
      return Upload.LIST_IGNORE; // Previene que customRequest se ejecute
    }
    return true;
  };

  const handleImageUpload = async (options) => {
    const { file } = options;
    if (!currentItemForUpload) return;

    // Antes de subir la nueva imagen, borramos la anterior si existe
    const oldPicturePath = form.getFieldValue([currentItemForUpload?.item_id, 'picture_path']);
    if (oldPicturePath) {
      await deleteInventoryFile(oldPicturePath);
    }

    const publicUrl = await uploadInventoryFile(file, {
      orderId: orderData.order_id,
      inventoryTypeName: inventoryTypeName,
      itemIdOrViewKey: currentItemForUpload.item_id,
    });

    if (publicUrl) {
      // Actualizamos el valor en el formulario de Ant Design
      const currentValues = form.getFieldValue(currentItemForUpload.item_id) || {};
      form.setFieldsValue({
        [currentItemForUpload.item_id]: {
          ...currentValues,
          picture_path: publicUrl,
        },
      });
      message.success(`${file.name} subido correctamente.`);
      
      // Forzamos un re-render para que el botón cambie de "Añadir" a "Ver"
      // y cerramos el modal si era una imagen nueva.
      // El modal ya no se cierra automáticamente.
    } 
  };

  const handleRemoveImage = async (item) => {
    const picturePath = form.getFieldValue([item.item_id, 'picture_path']);
    if (!picturePath) return;
    if (await deleteInventoryFile(picturePath)) { // Esperamos a que se elimine antes de actualizar el estado
      form.setFieldsValue({ [item.item_id]: { ...form.getFieldValue(item.item_id) || {}, picture_path: null } });
      message.success('Imagen eliminada correctamente.');
    }
  };

  return (
    <Spin spinning={isLoading || isSaving} tip={isSaving ? "Guardando..." : "Cargando..."}>
      <Typography.Title level={4} style={{ textAlign: 'center' }}>{capitalize(inventoryType.name)}</Typography.Title>
      <Form form={form} layout="vertical">
        {items.map(item => {
          if (!item) return null;

          let inputControl;
          if (item.input_type === 'three_options') {
            inputControl = (
              <Form.Item name={[item.item_id, 'status']} noStyle>
                <Radio.Group>
                  <Radio.Button value="bueno">Bueno</Radio.Button>
                  <Radio.Button value="regular">Regular</Radio.Button>
                  <Radio.Button value="malo">Malo</Radio.Button>
                </Radio.Group>
              </Form.Item>
            );
          } else if (item.input_type === 'checkbox') {
            inputControl = (
              <Form.Item name={[item.item_id, 'status']} noStyle valuePropName="checked">
                <Checkbox />
              </Form.Item>
            );
          }

          return (
            <Card key={item.item_id} size="small" style={{ marginBottom: 16 }}>
              <Row align="middle" gutter={[16, 16]}>
                <Col xs={24} sm={8} md={6}>
                  <Space>
                    <Text strong>{capitalize(item.label)}</Text>
                    {item.description && (
                      <Tooltip title={item.description}><QuestionCircleOutlined /></Tooltip>
                    )}
                  </Space>
                </Col>
                <Col xs={24} sm={16} md={8}>{inputControl}</Col>
                <Col xs={24} sm={16} md={6}>
                  <Form.Item name={[item.item_id, 'notes']} noStyle>
                    <Input placeholder="Notas adicionales..." />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8} md={4}>
                  {item.picture_upload && (
                    <Form.Item name={[item.item_id, 'picture_path']} noStyle>
                      {/* Usamos Form.Item para que el botón se actualice cuando cambia el valor */}
                      <Form.Item noStyle shouldUpdate={(prev, curr) => prev[item.item_id]?.picture_path !== curr[item.item_id]?.picture_path}>
                        {({ getFieldValue }) => {
                          const picturePath = getFieldValue([item.item_id, 'picture_path']);
                          return picturePath ? (
                            <Button 
                              icon={<EyeOutlined />} 
                              style={{ width: '100%' }} 
                              onClick={() => handleOpenUploadModal(item)}
                            >
                              Ver/Cambiar
                            </Button>
                          ) : (
                            <Button 
                              icon={<CameraOutlined />} 
                              style={{ width: '100%' }} 
                              onClick={() => handleOpenUploadModal(item)}
                            >
                              Añadir Foto
                            </Button>
                          );
                        }}
                      </Form.Item>
                    </Form.Item>
                  )}
                </Col>
              </Row>
            </Card>
          );
        })}
      </Form>

      {/* Modal para subir la imagen */}
      <Modal
        title={`Foto para ${currentItemForUpload ? capitalize(currentItemForUpload.label) : ''}`}
        open={isUploadModalVisible}
        onCancel={handleModalCancel}
        footer={
          <Space>
            {form.getFieldValue([currentItemForUpload?.item_id, 'picture_path']) && (
              <Upload customRequest={handleImageUpload} showUploadList={false} beforeUpload={beforeUploadValidation}>
                <Button loading={isUploading || isCompressing}>
                  {isCompressing ? 'Comprimiendo...' : (isUploading ? 'Subiendo...' : 'Cambiar Imagen')}
                </Button>
              </Upload>
            )}
            <Button key="done" type="primary" onClick={handleModalCancel}>
              Listo
            </Button>
          </Space>
        }
      destroyOnHidden
      >
        {form.getFieldValue([currentItemForUpload?.item_id, 'picture_path']) ? (
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Typography.Title level={5}>Imagen Actual</Typography.Title>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Image width={200} src={form.getFieldValue([currentItemForUpload.item_id, 'picture_path'])} />
              <Button
                type="text"
                danger
                icon={<CloseOutlined style={{ fontSize: '18px' }} />}
                onClick={() => handleRemoveImage(currentItemForUpload)}
                loading={isUploading}
                style={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}
              />
            </div>
          </div>
        ) : (
          <Upload.Dragger
            customRequest={handleImageUpload}
            beforeUpload={beforeUploadValidation}
            showUploadList={false}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
            <p className="ant-upload-text">Haz clic o arrastra una imagen para subirla</p>
          </Upload.Dragger>
        )}
      </Modal>
    </Spin>
  );
});

export default GenericInventory;