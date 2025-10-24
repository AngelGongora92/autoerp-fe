import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Form, Select, Button, Space, Spin, message, Row, Col, Card, Typography, Input, Collapse, Tooltip, Slider, InputNumber } from 'antd';
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
  const [activeCollapseKey, setActiveCollapseKey] = useState([]);
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
        // Si la orden ya tiene un 'c_mileage' guardado, úsalo. Si no, usa el del vehículo.
        form.setFieldsValue({ 
          current_mileage: orderData.c_mileage ?? previouslySelectedVehicle.mileage 
        });
      }
      if (orderData.fuel_level !== null && orderData.fuel_level !== undefined) {
        form.setFieldsValue({ fuel_level: orderData.fuel_level });
      }
    }
  }, [orderData, vehicleOptions, form]);

  // Efecto para cargar la información extra si ya existe en la orden
  useEffect(() => {
    if (orderData?.has_extra_info) {
      setActiveCollapseKey(['1']); // Expande el panel de información extra
      const fetchAndSetExtraInfo = async () => {
        try {
          const response = await fetch(`${apiUrl}/orders/extra-info/${orderData.order_id}`);
          if (!response.ok) {
            console.warn('No se pudo obtener la información extra guardada.');
            return;
          }
          const extraInfoData = await response.json();

          // Transformamos los datos para el formato del formulario: { extra_items: { '1': 'info1', '2': 'info2' } }
          const formValues = extraInfoData.reduce((acc, item) => {
            if (item.item_id && item.info) {
              acc[item.item_id] = item.info;
            }
            return acc;
          }, {});

          form.setFieldsValue({ extra_items: formValues });
        } catch (error) {
          message.error('No se pudo cargar la información extra guardada.');
        }
      };
      fetchAndSetExtraInfo();
    }
  }, [orderData, apiUrl, form]);

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
        
        // Buscamos la info completa del vehículo seleccionado para asegurar que tenemos el 'mileage' original.
        const currentVehicleData = vehicleOptions.find(opt => opt.value === values.vehicle);

        // Verificamos si se llenó algún campo de información extra.
        const hasExtraInfo = !!(values.extra_items && Object.values(values.extra_items).some(info => info));

        // 1. Preparamos el payload para actualizar la orden principal (vehículo y kilometraje)
        const payload = { 
          vehicle_id: values.vehicle,
          // La API espera 'c_mileage' como un entero
          fuel_level: values.fuel_level !== undefined ? Math.round(values.fuel_level) : null,
          c_mileage: values.current_mileage ? parseInt(values.current_mileage, 10) : null,
          p_mileage: currentVehicleData?.mileage ? parseInt(currentVehicleData.mileage, 10) : null,
          has_extra_info: hasExtraInfo,
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

        // 3. Preparamos y enviamos la información extra en un solo batch
        if (values.extra_items) {
          const extraInfoPayloads = Object.entries(values.extra_items)
            .filter(([, info]) => info) // Filtramos los que tienen valor
            .map(([itemId, info]) => ({
              order_id: orderData.order_id,
              item_id: parseInt(itemId, 10),
              info: info,
            }));

          // Solo enviamos la petición si hay algo que guardar
          if (extraInfoPayloads.length > 0) {
            const extraInfoResponse = await fetch(`${apiUrl}/orders/extra-info/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(extraInfoPayloads), // Enviamos el array completo
            });
            if (!extraInfoResponse.ok) {
              throw new Error('No se pudo guardar la información extra.');
            }
          }
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
    // Al seleccionar, también establecemos el kilometraje del vehículo en el campo correspondiente.
    form.setFieldsValue({ vehicle: value, current_mileage: option.mileage });
  };

  const onVehicleChange = (value) => {
    if (!value) {
      setSelectedVehicleInfo(null);
      form.setFieldsValue({ current_mileage: undefined }); // Limpiamos el kilometraje si se deselecciona el vehículo
    }
  };

  // --- Slider de Combustible ---
  const fuelMarks = {
    0: 'E',
    12.5: '1/8',
    25: '1/4',
    37.5: '3/8',
    50: '1/2',
    62.5: '5/8',
    75: '3/4',
    87.5: '7/8',
    100: 'F',
  };
  // --- Fin Slider ---

  return (
    <div>
      <Row justify="center" align="top" style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <p style={{ margin: 0, textAlign: 'center' }}>
            <Text strong>Orden:</Text> {orderData?.c_order_id || 'N/A'}
            <span style={{ margin: '0 16px' }}>|</span>
            <Text strong>Cliente: </Text> 
            {selectedCustomerInfo ? 
            (selectedCustomerInfo.is_company ? 
            selectedCustomerInfo.cname : `${selectedCustomerInfo.fname || ''} ${selectedCustomerInfo.lname || ''}`.trim()) : 'Cargando...'}
          </p>
        </Col>
      </Row>

      <Form form={form} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <Row gutter={24}>
          {/* Bloque del Vehículo */}
          <Col xs={24} md={12} order={{ xs: 1, md: 1 }}>
            <Form.Item
              label="Vehículo"
              name="vehicle"
              rules={[{ required: true, message: 'Por favor, seleccione un vehículo' }]}
              labelCol={{ span: 24 }} // Full width label on mobile
              wrapperCol={{ span: 24 }} // Full width input on mobile
            >
              <Space.Compact style={{ width: '100%' }}>
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
                  <Col xs={24} sm={12}>
                  <p><Text strong>Marca:</Text> {selectedVehicleInfo.model?.make?.make || 'N/A'}</p>
                  <p><Text strong>Modelo:</Text> {selectedVehicleInfo.model?.model || 'N/A'}</p>
                  <p><Text strong>Año:</Text> {selectedVehicleInfo.year || 'N/A'}</p>
                  <p><Text strong>VIN:</Text> {selectedVehicleInfo.vin || 'N/A'}</p>
                  <p><Text strong>Placas:</Text> {selectedVehicleInfo.plate || 'N/A'}</p>
                  <p><Text strong>KM:</Text> {selectedVehicleInfo.mileage || 'N/A'}</p>
                  <p><Text strong>Tipo:</Text> {selectedVehicleInfo.vehicle_type?.type || 'N/A'}</p>
                  </Col>
                  <Col xs={24} sm={12}>
                  <p><Text strong>Color:</Text> {selectedVehicleInfo.color?.color || 'N/A'}</p>
                  <p><Text strong>Motor:</Text> {selectedVehicleInfo.motor?.type || 'N/A'}</p>
                  <p><Text strong>Transmisión:</Text> {selectedVehicleInfo.transmission?.type || 'N/A'}</p>
                  <p><Text strong>Cilindros:</Text> {selectedVehicleInfo.cylinders || 'N/A'}</p>
                  <p><Text strong>Litros:</Text> {selectedVehicleInfo.liters || 'N/A'}</p>
                  </Col>
                </Row>
              </Card>
            )}
          </Col>

          {/* Columna contenedora para los campos de la derecha */}
          <Col xs={24} md={12} order={{ xs: 2, md: 2 }}>
            <Row>
              {/* Bloque de Combustible/Carga */}
              <Col span={24} order={{ xs: 2, md: 1 }}>
                {selectedVehicleInfo && (
                  <Form.Item
                    label={selectedVehicleInfo.motor?.type === 'electrico' ? 'Nivel de Carga' : 'Nivel de Combustible'}
                    name="fuel_level"
                    initialValue={50}
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                    style={{ marginBottom: 24 }}
                  >
                    <Form.Item noStyle dependencies={['fuel_level']}>
                      {({ getFieldValue }) => {
                        const inputValue = getFieldValue('fuel_level');
                        const isElectric = selectedVehicleInfo.motor?.type === 'electrico';
                        if (isElectric) {
                          return (
                            <Row align="middle" gutter={16}>
                              <Col xs={24} md={18} order={{ xs: 1, md: 1 }}>
                                <Slider tooltip={{ open: false }} min={0} max={100} value={inputValue} onChange={(val) => form.setFieldsValue({ fuel_level: val })} />
                              </Col>
                              <Col xs={24} md={6} order={{ xs: 2, md: 2 }}>
                                <InputNumber min={0} max={100} addonAfter="%" value={inputValue} onChange={(val) => form.setFieldsValue({ fuel_level: val })} />
                              </Col>
                            </Row>
                          );
                        }
                        return (
                          <Row>
                            <Col span={24} style={{paddingRight: '15px'}}>
                              <Slider marks={fuelMarks} tooltip={{ open: false }} step={12.5} value={inputValue} onChange={(val) => form.setFieldsValue({ fuel_level: val })} />
                            </Col>
                          </Row>
                        );
                      }}
                    </Form.Item>
                  </Form.Item>
                )}
              </Col>

              {/* Bloque de Kilometraje */}
              <Col span={24} order={{ xs: 3, md: 2 }}>
                <Form.Item label="Kilometraje Actual" name="current_mileage" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                  <Input type="number" addonAfter="km" style={{ width: '100%', maxWidth: '250px' }} />
                </Form.Item>
              </Col>

              {/* Bloque de Información Extra */}
              <Col span={24} order={{ xs: 4, md: 3 }}>
                <Collapse
                  ghost
                  activeKey={activeCollapseKey}
                  onChange={(keys) => setActiveCollapseKey(keys)}
                  items={[{
                    key: '1',
                    label: 'Informacion extra',
                    children: extraItemsLoading ? (
                      <Spin tip="Cargando ítems..." />
                    ) : (
                      extraItems.map(item => (
                        <Form.Item
                          key={item.item_id}
                          name={['extra_items', item.item_id]}
                          label={<span>{item.title}<Tooltip title={item.description} placement="right"><QuestionCircleOutlined style={{ marginLeft: 8, color: 'rgba(0, 0, 0, 0.45)' }} /></Tooltip></span>}
                          style={{ marginBottom: 8 }}
                          labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}
                        >
                          <Input placeholder={`Ingrese ${item.title.toLowerCase()}`} />
                        </Form.Item>
                      ))
                    ),
                  }]}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
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
