import React, { useState, useEffect } from 'react';
import { Form, Row, Col, AutoComplete, Card, Typography, Spin, DatePicker, Select, Button, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CreateCustomerModal from '../../components/create-customer-modal';
import CreateContactModal from '../../components/create-contact-modal';

const { Text } = Typography;

function StepOne() {
  const [form] = Form.useForm();
  const [options, setOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Estados para los contactos
  const [contactOptions, setContactOptions] = useState([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Estado para el modal de creación de cliente
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const searchCustomers = async (searchText) => {
    if (!searchText) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/customers/search?full_name=${searchText}`);
      if (!response.ok) throw new Error('Error en la respuesta de la red');
      const data = await response.json();
      // La respuesta de la API es una lista de clientes.
      // Debemos transformarla al formato que AutoComplete espera: un array de objetos
      // con las propiedades `value` y `label`. Construimos el nombre completo.
      const formattedOptions = data.map(customer => {
        const fullName = customer.is_company
          ? customer.cname
          : `${customer.fname || ''} ${customer.lname || ''}`.trim();
        return {
          ...customer, // Mantenemos todos los datos del cliente para usarlos después
          value: fullName, // `value` es lo que se pondrá en el input al seleccionar
          label: fullName, // `label` es lo que se mostrará en el dropdown
        };
      });
      setOptions(formattedOptions);
    } catch (error) {
      console.error("Error buscando clientes:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const onCustomerSelect = (value, option) => {
    setSelectedCustomer(option);
    // Limpiamos el campo de contacto al seleccionar un nuevo cliente
    form.setFieldsValue({ contact: undefined });
    setSelectedContact(null);
  };
  
  const onCustomerChange = (value) => {
    if (!value) {
      setSelectedCustomer(null);
      setContactOptions([]); // Limpiamos las opciones de contacto
      setSelectedContact(null);
    }
  };

  const onContactSelect = (value) => {
    // Buscamos el objeto completo del contacto en nuestras opciones usando el ID (value)
    // para asegurarnos de que tenemos todos los datos correctos.
    const contact = contactOptions.find(opt => opt.value === value);
    setSelectedContact(contact);
  };

  const onContactChange = (value) => {
    if (!value) {
      setSelectedContact(null);
    }
  };

  // useEffect para buscar contactos cuando se selecciona un cliente
  useEffect(() => {
    const fetchContacts = async (customerId) => {
      if (!customerId) return;
      setContactLoading(true);
      setContactOptions([]);
      try {
        const response = await fetch(`${apiUrl}/contacts/${customerId}`);
        if (!response.ok) throw new Error('Error en la respuesta de la red para contactos');
        const data = await response.json();
        // Asumo que la API de contactos devuelve fname y lname, como la de clientes.
        const formattedOptions = data.map(contact => {
          const fullName = `${contact.fname || ''} ${contact.lname || ''}`.trim();
          return {
            label: fullName,
            value: contact.id, // Usamos el ID como valor único para el Select
            ...contact,
          };
        });
        setContactOptions(formattedOptions);
      } catch (error) {
        console.error("Error buscando contactos:", error);
        setContactOptions([]);
      } finally {
        setContactLoading(false);
      }
    };

    if (selectedCustomer) {
      fetchContacts(selectedCustomer.id);
    }
  }, [selectedCustomer, apiUrl]);

  const handleCreateCustomer = async (values) => {
    try {
      const response = await fetch(`${apiUrl}/customers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo crear el cliente.');
      }

      const newCustomer = await response.json();
      
      // Formateamos el nuevo cliente para que sea compatible con el AutoComplete y la Card
      const fullName = newCustomer.is_company
        ? newCustomer.cname
        : `${newCustomer.fname || ''} ${newCustomer.lname || ''}`.trim();
      
      const formattedNewCustomer = {
        ...newCustomer,
        value: fullName,
        label: fullName,
      };

      // Actualizamos el formulario para seleccionar automáticamente al nuevo cliente
      form.setFieldsValue({ customer: fullName });
      setSelectedCustomer(formattedNewCustomer);
      setOptions([formattedNewCustomer, ...options]); // Lo añadimos a la lista de opciones

      setIsCustomerModalOpen(false); // Cerramos el modal
      message.success(`Cliente "${fullName}" creado y seleccionado.`);

    } catch (error) {
      console.error('Error al crear cliente:', error);
      message.error(error.message || 'Ocurrió un error al crear el cliente.');
    }
  };

  const handleCreateContact = async (values) => {
    if (!selectedCustomer) {
      message.error("Debe seleccionar un cliente para poder crear un contacto.");
      return;
    }

    // El payload debe incluir el ID del cliente.
    // Usualmente, Django REST Framework espera el nombre del campo (ej: 'customer') en lugar de 'customer_id'.
    const payload = { ...values, customer_id: selectedCustomer.id };

    try {
      const response = await fetch(`${apiUrl}/contacts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo crear el contacto.');
      }

      const newContact = await response.json();
      const fullName = `${newContact.fname || ''} ${newContact.lname || ''}`.trim();
      const formattedNewContact = { ...newContact, value: newContact.id, label: fullName };

      // Actualizamos el formulario para seleccionar automáticamente al nuevo contacto
      form.setFieldsValue({ contact: formattedNewContact.value });
      setSelectedContact(formattedNewContact);
      setContactOptions([formattedNewContact, ...contactOptions]);

      setIsContactModalOpen(false);
      message.success(`Contacto "${fullName}" creado y seleccionado.`);
    } catch (error) {
      console.error('Error al crear contacto:', error);
      message.error(error.message || 'Ocurrió un error al crear el contacto.');
    }
  };

  return (
    <Form 
      form={form}
      layout="vertical"
      // Establecemos el valor inicial del campo de fecha y hora al momento actual.
      initialValues={{ orderDateTime: dayjs() }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Fecha y Hora de la Orden"
            name="orderDateTime"
            rules={[{ required: true, message: 'Por favor, seleccione la fecha y hora' }]}
          >
            <DatePicker 
              showTime 
              placeholder="Seleccione fecha y hora" 
              style={{ width: '50%' }} 
              format="YYYY-MM-DD HH:mm" 
            />
          </Form.Item>

          <Form.Item label="Cliente" name="customer">
            <Space.Compact style={{ width: '50%' }}>
              <AutoComplete
                style={{ width: '100%' }}
                options={options}
                onSelect={onCustomerSelect}
                onSearch={searchCustomers}
                onChange={onCustomerChange}
                placeholder="Escribe para buscar un cliente..."
                debounce={300}
                notFoundContent={loading ? <Spin size="small" /> : null}
              />
              <Button icon={<PlusOutlined />} onClick={() => setIsCustomerModalOpen(true)} />
            </Space.Compact>
          </Form.Item>
          {selectedCustomer && (
        <Card title="Información del Cliente Seleccionado" bordered={false} style={{ marginTop: 16, backgroundColor: '#FAFAFA' }}>
          <p><Text strong>Nombre:</Text> {selectedCustomer.label || 'N/A'}</p>
          <p><Text strong>Email:</Text> {selectedCustomer.email || 'N/A'}</p>
          <p><Text strong>Dirección:</Text> {`${selectedCustomer.address1 || ''} ${selectedCustomer.address2 || ''}`.trim() || 'N/A'}</p>
          <p><Text strong>Teléfono:</Text> {selectedCustomer.phone || 'N/A'}</p>
        </Card>
      )}
        </Col>

        <Col span={12}>
          <Form.Item label="Contacto" name="contact">
            <Space.Compact style={{ width: '50%' }}>
              <Select
                style={{ width: '100%' }}
                loading={contactLoading}
                options={contactOptions}
                onSelect={onContactSelect}
                onChange={onContactChange}
                disabled={!selectedCustomer}
                placeholder={
                  !selectedCustomer ? "Seleccione un cliente primero" : "Seleccionar contacto"
                }
                allowClear
                notFoundContent={contactLoading ? <Spin size="small" /> : 'Sin contactos'}
              />
              <Button icon={<PlusOutlined />} disabled={!selectedCustomer} onClick={() => setIsContactModalOpen(true)} />
            </Space.Compact>
          </Form.Item>
          {selectedContact && (
            <Card title="Información del Contacto Seleccionado" bordered={false} style={{ marginTop: 16, backgroundColor: '#FAFAFA' }}>
              <p><Text strong>Nombre:</Text> {selectedContact.label || 'N/A'}</p>
              <p><Text strong>Email:</Text> {selectedContact.email || 'N/A'}</p>
              <p><Text strong>Teléfono:</Text> {selectedContact.phone || 'N/A'}</p>
            </Card>
          )}
        </Col>
      </Row>
      
      <CreateCustomerModal
        open={isCustomerModalOpen}
        onCreate={handleCreateCustomer}
        onCancel={() => setIsCustomerModalOpen(false)}
      />

      <CreateContactModal
        open={isContactModalOpen}
        onCreate={handleCreateContact}
        onCancel={() => setIsContactModalOpen(false)}
        customerId={selectedCustomer?.id}
      />
      
    </Form>
  );
}

export default StepOne;