import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Row, Col, AutoComplete, Card, Typography, Spin, Select, Button, Space, message, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CreateCustomerModal from '../../components/create-customer-modal';
import CreateVehicleModal from '../../components/create-vehicle-modal';
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

  // Estados para los vehículos
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [selectedVehicleInfo, setSelectedVehicleInfo] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // Estado para el modal de creación de cliente
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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
    form.setFieldsValue({ vehicle: null });
    setSelectedVehicleInfo(null);
    setVehicleOptions([]);
    form.setFieldsValue({ contact: null });
  };
  
  const onCustomerChange = (value) => {
    setCustomerSearchValue(value);
    if (!value) {
      setSelectedCustomer(null);
      // Limpiamos las opciones de contacto si se deselecciona el cliente
      setContactOptions([]);
      setContactValue(null);
      setVehicleOptions([]);
      setSelectedVehicleInfo(null);
      form.setFieldsValue({ vehicle: null });
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

  // useEffect para buscar contactos cuando se selecciona un cliente
  useEffect(() => {
    const fetchContacts = async (customerId) => {
      if (!customerId) return;
      setContactLoading(true);
      setContactOptions([]);
      try {
        const response = await fetch(`${apiUrl}/customers/${customerId}/contacts/`);
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
      fetchVehicles(selectedCustomer.customer_id);
    }
  }, [selectedCustomer, apiUrl]); // fetchVehicles no necesita estar en el array de dependencias

  const fetchVehicles = async (customerId) => {
    if (!customerId) return;
    setVehicleLoading(true);
    try {
      const response = await fetch(`${apiUrl}/vehicles/${customerId}`);
      if (!response.ok) throw new Error('Error al cargar vehículos');
      const data = await response.json();
      const formattedOptions = data.map(vehicle => ({
        ...vehicle,
        value: vehicle.vehicle_id,
        label: `${vehicle.year || ''} ${vehicle.model?.make?.make || ''} ${vehicle.model?.model || ''} - ${vehicle.vin ? `VIN:${vehicle.vin.slice(-6)}` : 'S/N'}`.trim(),
      }));
      setVehicleOptions(formattedOptions);
      return formattedOptions;
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      message.error('No se pudieron cargar los vehículos del cliente.');
    } finally {
      setVehicleLoading(false);
    }
  };

  // useEffect para pre-llenar los campos si el usuario vuelve atrás
  // (Este efecto se puede expandir para manejar el regreso desde el paso 2)
  
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

  const handleCreateVehicle = async (values) => {
    if (!selectedCustomer) {
      message.error("Debe seleccionar un cliente para poder crear un vehículo.");
      return;
    }
    const payload = { ...values, customer_id: selectedCustomer.customer_id };

    try {
      const response = await fetch(`${apiUrl}/vehicles/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('No se pudo crear el vehículo');
      const newVehicle = await response.json();
      message.success('Vehículo creado con éxito!');
      setIsVehicleModalOpen(false);
      
      const newOptions = await fetchVehicles(selectedCustomer.customer_id);
      if (newOptions) {
        const newOption = newOptions.find(opt => opt.value === newVehicle.vehicle_id);
        if (newOption) {
            form.setFieldsValue({ vehicle: newVehicle.vehicle_id });
            setSelectedVehicleInfo(newOption);
        }
      }
    } catch (error) {
      message.error(error.message || 'Error al crear el vehículo.');
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

  const openCreateVehicleModal = () => {
    form.setFieldsValue({ vehicle: null });
    setSelectedVehicleInfo(null);
    setIsVehicleModalOpen(true);
  };

  const selectedContactValue = Form.useWatch('contact', form);
  const selectedContact = contactOptions.find(c => c.value === selectedContactValue);

  const getVehiclePlaceholder = () => {
    if (!selectedCustomer) return "Seleccione un cliente primero";
    if (vehicleLoading) return "Cargando vehículos...";
    return vehicleOptions.length === 0 ? "Agregar vehiculos" : "Seleccionar vehiculo";
  };

  const onVehicleSelect = (value, option) => {
    setSelectedVehicleInfo(option);
    form.setFieldsValue({ vehicle: value }); // Aseguramos que el formulario se actualice
  };

  const onVehicleChange = (value) => { if (!value) setSelectedVehicleInfo(null); };

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
        customer_id: selectedCustomer.customer_id,
        contact_id: values.contact,
        vehicle_id: values.vehicle,
        // Aquí irían los campos específicos de la cita, como la fecha de la cita
      };

      // Devolvemos el payload para que el componente padre lo gestione.
      // También incluimos la información completa del cliente y contacto para usarla en otros pasos.
      return {
        ...payload,
        _customer: selectedCustomer,
        _contact: selectedContact,
        _vehicle: selectedVehicleInfo,
      };
    } catch (errorInfo) {
      if (errorInfo.errorFields) {
        console.log('Falló la validación:', errorInfo);
        message.error('Por favor, complete todos los campos requeridos.');
      } else {
        // Si no son errores de validación, es probable que sea el error 'Cliente no seleccionado'.
        console.error('Error en el paso 1:', errorInfo);
      }
      throw errorInfo;
    }
  }}));
  return (
    <Form 
      form={form}
      layout="vertical"
    >
      <Row gutter={16}>
        <Col xs={24} md={8}>
            <Form.Item label="Cliente" name="customer" rules={[{ required: true, message: 'Por favor, busque y seleccione un cliente' }]}>
                <Space.Compact style={{ width: '100%' }}>
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
                <Card title={<Text><Text strong>Cliente: </Text>{selectedCustomer.label}</Text>} bordered={false} style={{ marginTop: 16, backgroundColor: '#FAFAFA' }}>
                    <p><Text strong>Email:</Text> {selectedCustomer.email || 'N/A'}</p>
                    <p><Text strong>Dirección:</Text> {`${selectedCustomer.address1 || ''} ${selectedCustomer.address2 || ''}`.trim() || 'N/A'}</p>
                    <p><Text strong>Teléfono:</Text> {selectedCustomer.phone || 'N/A'}</p>
                </Card>
            )}
        </Col>

        <Col xs={24} md={8}>
            <Form.Item label="Contacto" name="contact" rules={[{ required: true, message: 'Por favor, seleccione un contacto' }]}>
                <Space.Compact style={{ width: '100%' }}>
                    <Select
                        value={contactValue}
                        key={selectedCustomer?.customer_id}
                        style={{ width: '100%' }}
                        loading={contactLoading}
                        options={contactOptions}
                        disabled={!selectedCustomer}
                        placeholder={!selectedCustomer ? "Seleccione un cliente primero" : "Seleccionar contacto"}
                        onChange={handleContactChange}
                        allowClear
                        notFoundContent={contactLoading ? <Spin size="small" /> : 'Sin contactos'}
                    />
                    <Button icon={<PlusOutlined />} disabled={!selectedCustomer} onClick={openCreateContactModal} />
                </Space.Compact>
            </Form.Item>
            {selectedContact && selectedContactValue && (
                <Card title={<Text><Text strong>Contacto: </Text>{selectedContact.label}</Text>} bordered={false} style={{ marginTop: 16, backgroundColor: '#FAFAFA' }}>
                    
                    <p><Text strong>Email:</Text> {selectedContact.email || 'N/A'}</p>
                    <p><Text strong>Teléfono:</Text> {selectedContact.phone || 'N/A'}</p>
                </Card>
            )}
        </Col>

        <Col xs={24} md={8}>
            <Form.Item
              label="Vehículo"
              name="vehicle"
              rules={[{ required: true, message: 'Por favor, seleccione un vehículo' }]}
            >
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  style={{ width: '100%' }}
                  loading={vehicleLoading}
                  options={vehicleOptions}
                  disabled={!selectedCustomer || vehicleLoading}
                  placeholder={getVehiclePlaceholder()}
                  notFoundContent={vehicleLoading ? <Spin size="small" /> : 'Sin vehículos'}
                  onSelect={onVehicleSelect}
                  onChange={onVehicleChange}
                  allowClear
                />
                <Button icon={<PlusOutlined />} disabled={!selectedCustomer} onClick={openCreateVehicleModal} />
              </Space.Compact>
            </Form.Item>
            
            {selectedVehicleInfo && (
              <Card title={<Text><Text strong>Vehículo: </Text>{`${selectedVehicleInfo.model?.make?.make || ''} ${selectedVehicleInfo.model?.model || ''}`.trim()}</Text>} bordered={false} style={{ marginTop: 16, backgroundColor: '#FAFAFA' }}>
                  
                  
                  <p><Text strong>Año:</Text> {selectedVehicleInfo.year || 'N/A'}</p>
                  <p><Text strong>VIN:</Text> {selectedVehicleInfo.vin || 'N/A'}</p>
                  <p><Text strong>Placas:</Text> {selectedVehicleInfo.plate || 'N/A'}</p>
                  <p><Text strong>KM:</Text> {selectedVehicleInfo.mileage || 'N/A'}</p>
                  <p><Text strong>Color:</Text> {selectedVehicleInfo.color?.color || 'N/A'}</p>
              </Card>
            )}
        </Col>
      </Row>
      
      <CreateCustomerModal
        open={isCustomerModalOpen}
        onCreate={handleCreateCustomer}
        onCancel={() => setIsCustomerModalOpen(false)}
      />

      <CreateVehicleModal
        open={isVehicleModalOpen}
        onCreate={handleCreateVehicle}
        onCancel={() => setIsVehicleModalOpen(false)}
        customerId={selectedCustomer?.customer_id}
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