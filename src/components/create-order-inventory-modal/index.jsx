import React from 'react';
import { Modal, Form, Input, Switch } from 'antd';

function CreateOrderInventoryModal({ open, onCreate, onCancel, confirmLoading }) {
  const [form] = Form.useForm();

  return (
    <Modal
      open={open}
      title="Crear Nuevo Tipo de Inventario"
      okText="Crear"
      cancelText="Cancelar"
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      // Al hacer clic en OK, se valida y envía el formulario
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();
            onCreate(values); // Pasamos los valores del formulario al componente padre
          })
          .catch((info) => {
            console.log('Falló la validación:', info);
          });
      }}
    >
      <Form form={form} layout="vertical" name="create_inventory_form" initialValues={{ is_active: true }}>
        <Form.Item
          name="name"
          label="Nombre del Inventario"
          rules={[{ required: true, message: 'Por favor, ingrese el nombre.' }]}
        >
          <Input placeholder="Ej: Interiores" />
        </Form.Item>
        <Form.Item name="is_active" label="Activo" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="picture_path" label="Ruta de Imagen (Opcional)">
          <Input placeholder="Ej: /path/to/image.png" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default CreateOrderInventoryModal;