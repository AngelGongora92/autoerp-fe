import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Form, Select, Button, Space, Spin, message, Row, Col, Card, Typography, Input, Collapse, Checkbox, Tooltip } from 'antd';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import CreateVehicleModal from '../../components/create-vehicle-modal';

const { Text, Paragraph } = Typography;

const StepTwo = forwardRef(({ orderData }, ref) => {
  const [form] = Form.useForm();
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [selectedCustomerInfo, setSelectedCustomerInfo] = useState(null);
  const [selectedVehicleInfo, setSelectedVehicleInfo] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [extraItems, setExtraItems] = useState([]);
  const [extraItemsLoading, setExtraItemsLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchVehicles = useCallback(async (customerId) => {
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
  }, [apiUrl]);

  useEffect(() => {
    if (orderData?.customer_id) {
      const fetchCustomerInfo = async (customerId) => {
        try {
          const response = await fetch(`${apiUrl}/customers/${customerId}`);
          if (!response.ok) throw new Error('Error al cargar información del cliente');
          const data = await response.json();
          setSelectedCustomerInfo(data);
        } catch (error) {
          console.error("Error fetching customer info:", error);
          message.error('No se pudo cargar la información del cliente.');
        }
      };
      fetchCustomerInfo(orderData.customer_id);
      fetchVehicles(orderData.customer_id);

      const fetchExtraItems = async () => {
        setExtraItemsLoading(true);
        try {
          const response = await fetch(`${apiUrl}/orders/extra-items/`);
          if (!response.ok) throw new Error('Error al cargar los ítems extra.');
          const data = await response.json();
          setExtraItems(data);
        } catch (error) {
          console.error("Error fetching extra items:", error);
          message.error(error.message);
        } finally {
          setExtraItemsLoading(false);
        }
      };

      fetchExtraItems();

    }
  }, [orderData, fetchVehicles]);

  useEffect(() => {
    if (orderData?.vehicle_id && vehicleOptions.length > 0) {
      form.setFieldsValue({ vehicle: orderData.vehicle_id });
      const previouslySelectedVehicle = vehicleOptions.find(
        (option) => option.value === orderData.vehicle_id
      );
      if (previouslySelectedVehicle) {
        setSelectedVehicleInfo(previouslySelectedVehicle);
      }
    }
  }, [orderData, vehicleOptions, form]);

  const handleCreateVehicle = async (values) => {
    try {
      const response = await fetch(`${apiUrl}/vehicles/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('No se pudo crear el vehículo');
      const newVehicle = await response.json();
      message.success('Vehículo creado con éxito!');
      setIsVehicleModalOpen(false);
      
      // Refresh vehicle list and select the new one
      const newOptions = await fetchVehicles(orderData.customer_id);
      if (newOptions) {
        const newOption = newOptions.find(opt => opt.value === newVehicle.vehicle_id);
        if (newOption) {
            form.setFieldsValue({ vehicle: newVehicle.vehicle_id });
            setSelectedVehicleInfo(newOption);
        }
      }

    } catch (error) {
      message.error(error.message || 'Error al crear el vehículo.');
      console.error('Failed to create vehicle:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    submitStep: async () => {
      try {
        const values = await form.validateFields();

        // 1. Preparamos el payload para actualizar la orden principal (vehículo y kilometraje)
        const payload = { 
          vehicle_id: values.vehicle,
          // La API espera 'c_mileage' como un entero
          c_mileage: values.current_mileage ? parseInt(values.current_mileage, 10) : null,
        };

        // 2. Actualizamos la orden
        const orderUpdateResponse = await fetch(`${apiUrl}/orders/${orderData.order_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!orderUpdateResponse.ok) {
          const errorData = await orderUpdateResponse.json();
          throw new Error(errorData.detail || 'No se pudo actualizar la orden con el vehículo.');
        }

        const updatedOrder = await orderUpdateResponse.json();

        // 3. Preparamos y enviamos la información extra
        if (values.extra_items) {
          const extraInfoPromises = Object.entries(values.extra_items)
            .filter(([, info]) => info) // Filtramos los que tienen valor
            .map(([itemId, info]) => {
              const extraInfoPayload = {
                order_id: orderData.order_id,
                item_id: parseInt(itemId, 10),
                info: info,
              };
              return fetch(`${apiUrl}/orders/extra-info/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(extraInfoPayload),
              });
            });

          await Promise.all(extraInfoPromises);
        }

        return updatedOrder;
      } catch (errorInfo) {
        if (errorInfo.errorFields) {
          message.error('Por favor, seleccione un vehículo.');
        } else {
          message.error(errorInfo.message || 'Ocurrió un error al guardar el vehículo.');
        }
        throw errorInfo;
      }
    }
  }));

  const getPlaceholder = () => {
    if (vehicleLoading) return "Cargando vehículos...";
    return vehicleOptions.length === 0 ? "Agregar vehiculos" : "Seleccionar vehiculo";
  };

  const onVehicleSelect = (value, option) => {
    setSelectedVehicleInfo(option);
    form.setFieldsValue({ vehicle: value });
  };

  const onVehicleChange = (value) => {
    if (!value) {
      setSelectedVehicleInfo(null);
    }
  };

  return (
    <div>
      <Row justify="center" align="top" style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <p style={{ margin: 0, textAlign: 'center' }}>
            <Text strong>Orden:</Text> {orderData?.c_order_id || 'N/A'}
            <span style={{ margin: '0 16px' }}>|</span>
            <Text strong>Cliente:</Text> 
            {selectedCustomerInfo ? 
            (selectedCustomerInfo.is_company ? 
            selectedCustomerInfo.cname : `${selectedCustomerInfo.fname || ''} ${selectedCustomerInfo.lname || ''}`.trim()) : 'Cargando...'}
          </p>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form form={form} >
            <Form.Item
              label="Vehículo"
              name="vehicle"
              rules={[{ required: true, message: 'Por favor, seleccione un vehículo' }]}
            >
              <Space.Compact style={{ width: '70%' }}>
                <Select
                  style={{ width: '100%' }}
                  loading={vehicleLoading}
                  options={vehicleOptions}
                  disabled={!orderData || vehicleLoading}
                  placeholder={getPlaceholder()}
                  notFoundContent={vehicleLoading ? <Spin size="small" /> : null}
                  onSelect={onVehicleSelect}
                  onChange={onVehicleChange}
                  allowClear
                />
                <Button icon={<PlusOutlined />} disabled={!orderData} onClick={() => setIsVehicleModalOpen(true)} />
              </Space.Compact>
            </Form.Item>
            
            {selectedVehicleInfo && (
              <Card title="Información del Vehículo" bordered={false} style={{ marginTop: 16, backgroundColor: '#FAFAFA' }}>
                <Row gutter={16}>
                  <Col span={12}>
                  <p><Text strong>Marca:</Text> {selectedVehicleInfo.model?.make?.make || 'N/A'}</p>
                  <p><Text strong>Modelo:</Text> {selectedVehicleInfo.model?.model || 'N/A'}</p>
                  <p><Text strong>Año:</Text> {selectedVehicleInfo.year || 'N/A'}</p>
                  <p><Text strong>VIN:</Text> {selectedVehicleInfo.vin || 'N/A'}</p>
                  <p><Text strong>Placas:</Text> {selectedVehicleInfo.plate || 'N/A'}</p>
                  <p><Text strong>KM:</Text> {selectedVehicleInfo.mileage || 'N/A'}</p>
                  <p><Text strong>Tipo:</Text> {selectedVehicleInfo.vehicle_type?.type || 'N/A'}</p>
                  </Col>
                  <Col span={12}>
                  <p><Text strong>Color:</Text> {selectedVehicleInfo.color?.color || 'N/A'}</p>
                  <p><Text strong>Motor:</Text> {selectedVehicleInfo.motor?.type || 'N/A'}</p>
                  <p><Text strong>Transmisión:</Text> {selectedVehicleInfo.transmission?.type || 'N/A'}</p>
                  <p><Text strong>Cilindros:</Text> {selectedVehicleInfo.cylinders || 'N/A'}</p>
                  <p><Text strong>Litros:</Text> {selectedVehicleInfo.liters || 'N/A'}</p>
                  </Col>
                </Row>
              </Card>
            )}
          </Form>
        </Col>
        <Col span={12}>
          <Form form={form} layout="vertical">
            <Form.Item
              label="Kilometraje Actual"
              name="current_mileage"
            >
              <Input type="number" addonAfter="km" style={{ width: '50%' }} />
            </Form.Item>

            <Collapse ghost>
              <Collapse.Panel header="Informacion extra" key="1">
                {extraItemsLoading ? (
                  <Spin tip="Cargando ítems..." />
                ) : (
                  extraItems.map(item => (
                    <Form.Item 
                      key={item.item_id}
                      name={['extra_items', item.item_id]}
                      label={
                        <span>
                          {item.title}
                          <Tooltip title={item.description} placement="right">
                            <QuestionCircleOutlined style={{ marginLeft: 8, color: 'rgba(0, 0, 0, 0.45)' }} />
                          </Tooltip>
                        </span>
                      }
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder={`Ingrese ${item.title.toLowerCase()}`} />
                    </Form.Item>
                  )))}
              </Collapse.Panel>
            </Collapse>
          </Form>
        </Col>
      </Row>
      <CreateVehicleModal
        open={isVehicleModalOpen}
        onCreate={handleCreateVehicle}
        onCancel={() => setIsVehicleModalOpen(false)}
        customerId={orderData?.customer_id}
      />
    </div>
  );
});

export default StepTwo;
