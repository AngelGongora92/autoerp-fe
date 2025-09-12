import React, { useEffect } from 'react';
import { Modal, Form, Input, Checkbox } from 'antd';

function EditUserModal({ open, onUpdate, onCancel, initialData }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && initialData) {
      // When the modal is opened and we have user data, set the form fields.
      // We need to transform the permissions back to a simple array of strings for the Checkbox.Group
      const permissions = initialData.permissions?.map(p => p.name) || [];
      form.setFieldsValue({
        ...initialData,
        permissions,
      });
    } else if (!open) {
      // If the modal is not open, reset the fields to clear previous data
      form.resetFields();
    }
  }, [initialData, form, open]);

  return (
    <Modal
      open={open}
      title="Editar Usuario"
      okText="Guardar Cambios"
      cancelText="Cancelar"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            // Prepare the final data to be sent
            const finalValues = { ...values };

            // If there are permissions (i.e., not an admin), transform them
            if (finalValues.permissions) {
              finalValues.permissions = finalValues.permissions.map(name => ({ name }));
            }

            // If the password is empty, don't send it so it's not updated
            if (!finalValues.password) {
              delete finalValues.password;
            }
            
            // Send the transformed data to the parent component
            onUpdate(finalValues);
          })
          .catch((info) => {
            console.log('Error de validación:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal_edit"
      >
        <Form.Item
          name="username"
          label="Nombre de Usuario"
          rules={[{ required: true, message: 'Por favor, ingrese un nombre de usuario' }]}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="password"
          label="Nueva Contraseña"
          help="Dejar en blanco para no cambiar la contraseña."
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
          {({ getFieldValue }) =>
            !getFieldValue('is_admin') && (
              <Form.Item name="permissions" label="Permisos">
                <Checkbox.Group>
                  <Checkbox value="servicio">Servicio</Checkbox>
                  <Checkbox value="page2">Page 2</Checkbox>
                  <Checkbox value="page3">Page 3</Checkbox>
                </Checkbox.Group>
              </Form.Item>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default EditUserModal;