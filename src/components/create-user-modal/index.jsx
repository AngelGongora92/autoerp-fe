import React from 'react';
import { Modal, Form, Input, Checkbox } from 'antd'; // Checkbox.Group no es necesario aquí

function CreateUserModal({ open, onCreate, onCancel }) {
  const [form] = Form.useForm();

  return (
    <Modal
      open={open}
      title="Crear Nuevo Usuario"
      okText="Crear"
      cancelText="Cancelar"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();
            onCreate(values);
          })
          .catch((info) => {
            console.log('Error de validación:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{
          is_admin: false,
        }}
      >
        <Form.Item
          name="username"
          label="Nombre de Usuario"
          rules={[{ required: true, message: 'Por favor, ingrese un nombre de usuario' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label="Contraseña"
          rules={[{ required: true, message: 'Por favor, ingrese una contraseña' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item name="is_admin" valuePropName="checked">
          <Checkbox>Administrador</Checkbox>
        </Form.Item>

        {/* --- CÓDIGO CORREGIDO PARA LA LÓGICA CONDICIONAL --- */}
        
        {/* 1. Este Form.Item "observa" los cambios en 'is_admin' */}
        <Form.Item
          noStyle
          dependencies={['is_admin']}
        >
          {/* 2. Esta función se ejecuta cada vez que 'is_admin' cambia */}
          {() =>
            // 3. Si 'is_admin' NO está marcado, se muestra el campo de permisos
            !form.getFieldValue('is_admin') && (
              <Form.Item
                name="permissions"
                label="Permisos"
                // La validación solo se aplica si el campo es visible
                rules={[{ required: true, message: 'Por favor, seleccione al menos un permiso' }]}
              >
                {/* Antd recomienda usar Checkbox.Group para manejar múltiples checkboxes */}
                <Checkbox.Group>
                  <Checkbox value="servicio">Servicio</Checkbox>
                  <Checkbox value="page2">Page 2</Checkbox>
                  <Checkbox value="page3">Page 3</Checkbox>
                  <Checkbox value="page4">Page 4</Checkbox>
                  <Checkbox value="page5">Page 5</Checkbox>
                </Checkbox.Group>
              </Form.Item>
            )
          }
        </Form.Item>

      </Form>
    </Modal>
  );
}

export default CreateUserModal;
        