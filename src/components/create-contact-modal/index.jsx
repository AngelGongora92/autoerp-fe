import React from 'react';
import { Modal, Form, Input, Row, Col } from 'antd';

// El componente recibe props para controlarlo desde el padre
function CreateContactModal({ open, onCreate, onCancel, customerId }) {
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_API_URL;

  // Validador para comprobar si el contacto ya existe para este cliente específico.
  const validateContactName = async () => {
    const fname = form.getFieldValue('fname');
    const lname = form.getFieldValue('lname');

    // No validar si falta algún campo o el ID del cliente.
    if (!fname || !lname || !customerId) {
      return Promise.resolve();
    }

    const nameToCheck = `${fname} ${lname}`.trim();

    try {
      // Obtenemos todos los contactos del cliente para verificar en el frontend.
      const response = await fetch(`${apiUrl}/customers/${customerId}/contacts`);
      if (!response.ok) throw new Error('Error del servidor al validar.');

      const existingContacts = await response.json();
      
      // Comprobamos si alguno de los contactos existentes coincide con el nombre a crear.
      const exists = existingContacts.some(contact => 
        `${contact.fname || ''} ${contact.lname || ''}`.trim().toLowerCase() === nameToCheck.toLowerCase()
      );

      if (exists) {
        return Promise.reject(new Error('Ya existe un contacto con este nombre para este cliente.'));
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error('No se pudo verificar el nombre. Intente de nuevo.'));
    }
  };
  
  return (
    <Modal
      open={open}
      title="Crear Nuevo Contacto"
      okText="Crear"
      cancelText="Cancelar"
      // Limpiamos el formulario cuando el modal se cierra por completo.
      afterClose={() => form.resetFields()}
      onCancel={onCancel}
      // Al hacer clic en OK, se valida y envía el formulario
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            onCreate(values); // Pasamos los valores del formulario al componente padre
          })
          .catch((info) => {
            console.log('Falló la validación:', info);
          });
      }}
    >
      <Form form={form} layout="vertical" name="contact_form_in_modal">
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fname"
                label="Nombres"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: 'Por favor, ingrese los nombres' }]}
              >
                <Input onBlur={() => form.validateFields(['contactNameValidation'])} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lname"
                label="Apellidos"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: 'Por favor, ingrese los apellidos' }]}
              >
                <Input onBlur={() => form.validateFields(['contactNameValidation'])} />
              </Form.Item>
            </Col>
          </Row>
          {/* Campo "fantasma" para mostrar un único mensaje de error combinado. */}
          <Form.Item 
            name="contactNameValidation" 
            dependencies={['fname', 'lname']} 
            rules={[{ validator: validateContactName }]}
          >
            <Input style={{ display: 'none' }} />
          </Form.Item>
        </>

        <Form.Item name="email" label="Correo Electrónico" rules={[{ type: 'email', message: 'El correo no es válido' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Teléfono"><Input /></Form.Item>
      </Form>
    </Modal>
  );
}

export default CreateContactModal;