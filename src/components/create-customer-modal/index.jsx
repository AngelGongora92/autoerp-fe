import React from 'react';
import { Modal, Form, Input, Switch, Row, Col } from 'antd';

// El componente recibe props para controlarlo desde el padre
function CreateCustomerModal({ open, onCreate, onCancel }) {
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_API_URL;

  // Validador asíncrono para el nombre de la empresa usando el endpoint de búsqueda
  const validateCname = async (_, value) => {
    if (!value) return Promise.resolve();
    try {
      const response = await fetch(`${apiUrl}/customers/search?full_name=${encodeURIComponent(value)}`);
      if (!response.ok) throw new Error('Error del servidor al validar.');
      
      const data = await response.json();
      // Comprobamos si existe un cliente con el nombre exacto (insensible a mayúsculas)
      const exists = data.some(customer => customer.cname?.toLowerCase() === value.toLowerCase());

      if (exists) {
        return Promise.reject(new Error('Ya existe una empresa con este nombre.'));
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error('No se pudo verificar el nombre. Intente de nuevo.'));
    }
  };

  // Validador asíncrono para nombre y apellido de persona
  const validatePersonName = async () => {
    const fname = form.getFieldValue('fname');
    const lname = form.getFieldValue('lname');

    if (!fname || !lname) return Promise.resolve();
    const nameToCheck = `${fname} ${lname}`.trim();

    try {
      const response = await fetch(`${apiUrl}/customers/search?full_name=${encodeURIComponent(nameToCheck)}`);
      if (!response.ok) throw new Error('Error del servidor al validar.');

      const data = await response.json();
      const exists = data.some(customer => `${customer.fname || ''} ${customer.lname || ''}`.trim().toLowerCase() === nameToCheck.toLowerCase());

      if (exists) {
        return Promise.reject(new Error('Ya existe un cliente con esta combinación de nombre y apellido.'));
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error('No se pudo verificar el nombre. Intente de nuevo.'));
    }
  };

  return (
    <Modal
      open={open}
      title="Crear Nuevo Cliente"
      okText="Crear"
      cancelText="Cancelar"
      onCancel={onCancel}
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
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        // Valor inicial para el interruptor
        initialValues={{ is_company: false }}
      >
        <Form.Item name="is_company" label="¿Es una empresa?" valuePropName="checked">
          <Switch />
        </Form.Item>

        {/* Este Form.Item especial renderiza sus hijos de nuevo cuando una dependencia cambia */}
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.is_company !== currentValues.is_company}
        >
          {({ getFieldValue }) =>
            getFieldValue('is_company') ? (
              <Form.Item
                name="cname"
                label="Nombre de la Empresa"
                rules={[
                  { required: true, message: 'Por favor, ingrese el nombre de la empresa' },
                  { validator: validateCname, validateTrigger: 'onBlur' }
                ]}
              >
                <Input />
              </Form.Item>
            ) : (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="fname"
                      label="Nombres"
                      style={{ marginBottom: 0 }} // Quitamos el margen para que el error combinado quede más cerca
                      rules={[{ required: true, message: 'Por favor, ingrese los nombres' }]}
                    >
                      {/* Al desenfocar, validamos el campo fantasma que une ambos nombres */}
                      <Input onBlur={() => form.validateFields(['personNameValidation'])} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="lname"
                      label="Apellidos"
                      style={{ marginBottom: 0 }}
                      rules={[{ required: true, message: 'Por favor, ingrese los apellidos' }]}
                    >
                      <Input onBlur={() => form.validateFields(['personNameValidation'])} />
                    </Form.Item>
                  </Col>
                </Row>
                {/* Este Form.Item "fantasma" se usa para mostrar un único mensaje de error. */}
                <Form.Item name="personNameValidation" dependencies={['fname', 'lname']} rules={[{ validator: validatePersonName }]}>
                  {/* Este input es necesario para que el Form.Item funcione, pero no es visible */}
                  <Input style={{ display: 'none' }} />
                </Form.Item>
              </>
            )
          }
        </Form.Item>

        <Form.Item name="email" label="Correo Electrónico" rules={[{ type: 'email', message: 'El correo no es válido' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Teléfono"><Input /></Form.Item>
        <Form.Item name="address1" label="Dirección Principal"><Input /></Form.Item>
        <Form.Item name="address2" label="Dirección Secundaria (Colonia, etc.)"><Input /></Form.Item>
      </Form>
    </Modal>
  );
}

export default CreateCustomerModal;