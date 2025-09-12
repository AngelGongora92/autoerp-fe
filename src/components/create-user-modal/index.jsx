import React from 'react';
import { Modal, Form, Input, Checkbox } from 'antd';

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
            // --- AQUÍ ESTÁ EL CAMBIO ---

            // 1. Prepara los datos finales que se enviarán
            const finalValues = { ...values };

            // 2. Si hay permisos (es decir, no es admin), transfórmalos
            if (finalValues.permissions) {
              finalValues.permissions = finalValues.permissions.map(name => ({ name: name }));
            }
            
            form.resetFields();
            // 3. Envía los datos ya transformados al componente padre
            onCreate(finalValues);
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

        <Form.Item
          noStyle
          dependencies={['is_admin']}
        >
          {() =>
            !form.getFieldValue('is_admin') && (
              <Form.Item
                name="permissions"
                label="Permisos"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!getFieldValue('is_admin') && (!value || value.length === 0)) {
                        return Promise.reject(new Error('Por favor, seleccione al menos un permiso'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
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