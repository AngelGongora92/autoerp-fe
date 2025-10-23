import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Row, Col, AutoComplete, Card, Typography, Spin, DatePicker, Select, Button, Space, message, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CreateCustomerModal from '../../components/create-customer-modal';
import CreateContactModal from '../../components/create-contact-modal';

const { Text } = Typography;

const StepOne = forwardRef((props, ref) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState([]);
  const [customerSearchValue, setCustomerSearchValue] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Estados para los contactos
  const [contactOptions, setContactOptions] = useState([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactValue, setContactValue] = useState(null);
  
  // Estados para los asesores
  const [advisorOptions, setAdvisorOptions] = useState([]);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  // Estados para los técnicos
  const [technicianOptions, setTechnicianOptions] = useState([]);
  const [technicianLoading, setTechnicianLoading] = useState(false);

  // Estado para el modal de creación de cliente
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Estado para el último folio
  const [lastFolio, setLastFolio] = useState(null);
  const [folioLoading, setFolioLoading] = useState(true);

  // useEffect para buscar asesores
  useEffect(() => {
    const fetchAdvisors = async () => {
      setAdvisorLoading(true);
      try {
        const response = await fetch(`${apiUrl}/employees/1`);
        if (!response.ok) throw new Error('Error al cargar asesores');
        const data = await response.json();
        const formattedOptions = data.map(advisor => ({
          value: advisor.employee_id,
          label: `${advisor.fname || ''} ${advisor.lname1 || ''}`.trim(),
        }));
        setAdvisorOptions(formattedOptions);
      } catch (error) {
        console.error("Error fetching advisors:", error);
        message.error('No se pudieron cargar los asesores.');
      } finally {
        setAdvisorLoading(false);
      }
    };
    fetchAdvisors();
  }, [apiUrl, form]);

  // useEffect para buscar técnicos
  useEffect(() => {
    const fetchTechnicians = async () => {
      setTechnicianLoading(true);
      try {
        const response = await fetch(`${apiUrl}/employees/2`);
        if (!response.ok) throw new Error('Error al cargar técnicos');
        const data = await response.json();
        const formattedOptions = data.map(tech => ({
          value: tech.employee_id,
          label: `${tech.fname || ''} ${tech.lname1 || ''}`.trim(),
        }));
        setTechnicianOptions(formattedOptions);
      } catch (error) {
        console.error("Error fetching technicians:", error);
        message.error('No se pudieron cargar los técnicos.');
      } finally {
        setTechnicianLoading(false);
      }
    };
    fetchTechnicians();
  }, [apiUrl, form]);

  // useEffect para obtener el último folio y autocompletar el siguiente
  useEffect(() => {
    const fetchLastFolio = async () => {
      setFolioLoading(true);
      try {
        // Usamos el nuevo endpoint para obtener la última orden
        const response = await fetch(`${apiUrl}/orders/last-order-id/`);
        if (!response.ok) {
          console.warn('No se pudo obtener el último folio.');
          setLastFolio(null);
          return;
        }
        // Leemos la respuesta como texto plano, ya que la API no devuelve un JSON.
        const lastFolioValue = await response.text();
        setLastFolio(lastFolioValue);

        // Calcular y establecer el siguiente folio
        if (lastFolioValue) {
          const match = lastFolioValue.match(/(\d+)$/);
          if (match) {
            const number = parseInt(match[1], 10);
            const prefix = lastFolioValue.substring(0, match.index);
            form.setFieldsValue({ folio: `${prefix}${number + 1}` });
          }
        }
      } catch (error) {
        console.error("Error al obtener el último folio:", error);
        setLastFolio(null);
      } finally {
        setFolioLoading(false);
      }
    };
    fetchLastFolio();
  }, [apiUrl, form]);

  const searchCustomers = async (searchText) => {
    if (!searchText || searchText.length < 3) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/customers/search?full_name=${searchText}`);
      if (!response.ok) throw new Error('Error en la respuesta de la red');
      const data = await response.json();
      const formattedOptions = data.map(customer => {
        const fullName = customer.is_company
          ? customer.cname
          : `${customer.fname || ''} ${customer.lname || ''}`.trim();
        return {
          ...customer,
          value: fullName,
          label: fullName,
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
    setCustomerSearchValue(value);
    setSelectedCustomer(option);
    setContactValue(null); // Limpiar contacto al cambiar de cliente
    // Limpiamos el campo de contacto cuando se selecciona un nuevo cliente
    form.setFieldsValue({ contact: null });
  };
  
  const onCustomerChange = (value) => {
    setCustomerSearchValue(value);
    if (!value) {
      setSelectedCustomer(null);
      // Limpiamos las opciones de contacto si se deselecciona el cliente
      setContactOptions([]);
      setContactValue(null);
      form.setFieldsValue({ contact: null });
    }
  };

  const handleContactChange = (value, option) => {
    // Cuando el usuario selecciona un contacto, actualizamos el formulario.
    // Antd Select pasa el `option` completo cuando se selecciona, o `undefined` cuando se limpia.
    // No necesitamos gestionar un estado `selectedContact` separado,
    // la información ya está en `option` o en `contactOptions`.
    // La tarjeta de información del contacto se renderizará buscando en `contactOptions`.
    setContactValue(value);
    form.setFieldsValue({ contact: value });
  };

  const validateFolio = async (_, value) => {
    // No es necesario validar si el campo está vacío, la regla `required` se encargará.
    if (!value) {
      return Promise.resolve();
    }
    try {
      // Asumimos un endpoint que verifica la existencia del folio.
      // Debería devolver 200/OK si existe, y 404 si no.
      const response = await fetch(`${apiUrl}/orders/customId/${value}`);
      if (response.ok) {
        // El backend encontró un folio coincidente.
        return Promise.reject(new Error('Este folio ya existe en la base de datos.'));
      }
      if (response.status === 404) {
        // El folio es único.
        return Promise.resolve();
      }
      // Para otros errores HTTP (como 500), informamos al usuario.
      return Promise.reject(new Error('No se pudo validar el folio en el servidor.'));
    } catch (error) {
      console.error("Error al validar folio:", error);
      return Promise.reject(new Error('Error de red al validar el folio.'));
    }
  };

  // useEffect para buscar contactos cuando se selecciona un cliente
  useEffect(() => {
    const fetchContacts = async (customerId) => {
      if (!customerId) return;
      setContactLoading(true);
      setContactOptions([]);
      try {
        const response = await fetch(`${apiUrl}/customers/${customerId}/contacts`);
        if (!response.ok) throw new Error('Error en la respuesta de la red para contactos');
        const data = await response.json();
        const formattedOptions = data.map(contact => {
          const fullName = `${contact.fname || ''} ${contact.lname || ''}`.trim();
          return {
            label: fullName,
            value: contact.contact_id,
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
      fetchContacts(selectedCustomer.customer_id);
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
      
      const fullName = newCustomer.is_company
        ? newCustomer.cname
        : `${newCustomer.fname || ''} ${newCustomer.lname || ''}`.trim();
      
      const formattedNewCustomer = {
        ...newCustomer,
        value: fullName,
        label: fullName,
      };

      // 1. Actualizamos las opciones para que el nuevo cliente esté disponible.
      setOptions([formattedNewCustomer, ...options]);
      // 2. Ahora sí, establecemos el valor en el formulario y actualizamos el estado.
      form.setFieldsValue({ customer: fullName });
      setCustomerSearchValue(fullName);
      setSelectedCustomer(formattedNewCustomer);

      setIsCustomerModalOpen(false);
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

    const payload = { ...values, customer_id: selectedCustomer.customer_id };

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
      const formattedNewContact = { ...newContact, value: newContact.contact_id, label: fullName };

      // 1. Actualizamos las opciones para que el nuevo contacto esté disponible.
      setContactOptions([formattedNewContact, ...contactOptions]);
      // 2. Ahora sí, establecemos el valor en el formulario.
      setContactValue(formattedNewContact.value);
      form.setFieldsValue({ contact: formattedNewContact.value });

      setIsContactModalOpen(false);
      message.success(`Contacto "${fullName}" creado y seleccionado.`);
    } catch (error) {
      console.error('Error al crear contacto:', error);
      message.error(error.message || 'Ocurrió un error al crear el contacto.');
    }
  };

  const openCreateCustomerModal = () => {
    form.setFieldsValue({ customer: undefined });
    setCustomerSearchValue('');
    onCustomerChange(undefined); // Reutilizamos la lógica de limpieza
    setIsCustomerModalOpen(true);
  };

  const openCreateContactModal = () => {
    setContactValue(null);
    form.setFieldsValue({ contact: null });
    setIsContactModalOpen(true);
  };

  const selectedContactValue = Form.useWatch('contact', form);
  const selectedContact = contactOptions.find(c => c.value === selectedContactValue);

  useImperativeHandle(ref, () => ({
    submitStep: async () => {
    try {
      const values = await form.validateFields();
      if (!selectedCustomer) {
        message.error('Por favor, seleccione un cliente.');
        form.scrollToField('customer');
        throw new Error('Cliente no seleccionado');
      }

      const payload = {
        c_order_id: values.folio,
        order_date: values.orderDateTime.toISOString(),
        advisor_id: values.advisor,
        mechanic_id: values.technician,
        customer_id: selectedCustomer.customer_id,
        contact_id: values.contact,
      };

      const response = await fetch(`${apiUrl}/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        throw new Error(errorMessage || 'No se pudo crear la orden.');
      }

      const newOrder = await response.json();
      return newOrder;
    } catch (errorInfo) {
      if (errorInfo.errorFields) {
        console.log('Falló la validación:', errorInfo);
        message.error('Por favor, complete todos los campos requeridos.');
      } else {
        console.error('Error al crear la orden:', errorInfo);
        // El mensaje de error específico de la API ya se muestra, no es necesario repetirlo.
      }
      throw errorInfo;
    }
  }}));
  return (
    <Form 
      form={form}
      layout="vertical"
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

          <Form.Item
            label="Asesor"
            name="advisor"
            rules={[{ required: true, message: 'Por favor, seleccione un asesor' }]}
          >
            <Select
              style={{ width: '50%' }}
              loading={advisorLoading}
              options={advisorOptions}
              placeholder="Seleccionar asesor"
              disabled={advisorLoading}
              allowClear
            />
          </Form.Item>

          <Form.Item 
            label="Cliente" 
            name="customer"
            rules={[{ required: true, message: 'Por favor, busque y seleccione un cliente' }]}
          >
            <Space.Compact style={{ width: '50%' }}>
              <AutoComplete
                value={customerSearchValue}
                style={{ width: '100%' }}
                options={options}
                onSelect={onCustomerSelect}
                onSearch={searchCustomers}
                onChange={onCustomerChange}
                placeholder="Escribe para buscar un cliente..."
                debounce={300}
                notFoundContent={loading ? <Spin size="small" /> : null}
              />
              <Button icon={<PlusOutlined />} onClick={openCreateCustomerModal} />
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
          <Form.Item
            label="Folio"
            name="folio"
            rules={[
              { required: true, message: 'Por favor, ingrese el folio' },
              { validator: validateFolio, validateTrigger: 'onBlur' }
            ]}  
            extra={
              folioLoading ? 
              <Spin size="small" /> : 
              lastFolio ? 
              `Último folio creado: ${lastFolio}` : 
              'No se encontró un folio anterior.'
            }
          >
            <Input placeholder="Ingrese el folio" style={{ width: '50%' }} allowClear />
          </Form.Item>

          <Form.Item
            label="Técnico"
            name="technician"
            rules={[{ required: true, message: 'Por favor, seleccione un técnico' }]}
          >
            <Select
              style={{ width: '50%' }}
              loading={technicianLoading}
              options={technicianOptions}
              placeholder="Seleccionar técnico"
              disabled={technicianLoading}
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Contacto"
            name="contact"
            rules={[{ required: true, message: 'Por favor, seleccione un contacto' }]}
          >
            <Space.Compact style={{ width: '50%' }}>
              <Select
                value={contactValue}
                // Forzar el re-montaje del componente cuando el cliente cambia.
                key={selectedCustomer?.customer_id}
                style={{ width: '100%' }}
                loading={contactLoading}
                options={contactOptions}
                disabled={!selectedCustomer}
                placeholder={
                  !selectedCustomer ? "Seleccione un cliente primero" : "Seleccionar contacto"
                }
                onChange={handleContactChange}
                allowClear
                notFoundContent={contactLoading ? <Spin size="small" /> : 'Sin contactos'}
              />
              <Button 
                icon={<PlusOutlined />} 
                disabled={!selectedCustomer} 
                onClick={openCreateContactModal} 
              />
            </Space.Compact>
          </Form.Item>
          {selectedContact && selectedContactValue && (
            <Card title="Información del Contacto" bordered={false} style={{ marginTop: 16, backgroundColor: '#FAFAFA', width: '50%' }}>
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
        customerId={selectedCustomer?.customer_id}
      />
      
    </Form>
  );
});

export default StepOne;