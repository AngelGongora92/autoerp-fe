import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Spin, Row, Col } from 'antd';

const { Option } = Select;

const CreateVehicleModal = ({ open, onCreate, onCancel, customerId }) => {
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [colors, setColors] = useState([]);
  const [motors, setMotors] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchDropdownData = async () => {
        setLoading(true);
        try {
          // 1. Desestructurar todas las respuestas con los nombres correctos
          const [makesRes, typesRes, colorsRes, motorsRes, transmissionsRes] = await Promise.all([
            fetch(`${apiUrl}/vehicles/makes/`),
            fetch(`${apiUrl}/vehicles/types/`),
            fetch(`${apiUrl}/vehicles/colors/`),
            fetch(`${apiUrl}/vehicles/motors/`),
            fetch(`${apiUrl}/vehicles/transmissions/`),
          ]);

          // 2. Validar todas las respuestas
          if (!makesRes.ok || !typesRes.ok || !colorsRes.ok || !motorsRes.ok || !transmissionsRes.ok) {
            throw new Error('Failed to load vehicle options');
          }

          // 3. Convertir todas a JSON en un solo paso
          const [makesData, typesData, colorsData, motorsData, transmissionsData] = await Promise.all([
            makesRes.json(),
            typesRes.json(),
            colorsRes.json(),
            motorsRes.json(),
            transmissionsRes.json(),
          ]);
          
          setMakes(makesData);
          setVehicleTypes(typesData);
          setColors(colorsData);
          setMotors(motorsData);
          setTransmissions(transmissionsData);
        } catch (error) {
          message.error('No se pudieron cargar las opciones para vehículos.');
          console.error("Error fetching vehicle options:", error);
        } finally {
          setLoading(false);
        }
      };
      // Reset models when opening
      setModels([]);
      fetchDropdownData();
    }
  }, [open, apiUrl]);

  // El `onChange` de Select nos da el `value` y el `option` completo.
  // Usaremos el `make_id` del option para buscar los modelos.
  const handleMakeChange = async (value, option) => {
    // Reset model field when make changes
    form.setFieldsValue({ model: undefined });
    setModels([]);

    if (option?.make_id) {
      setModelsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/vehicles/models/${option.make_id}`);
        if (!response.ok) throw new Error('No se pudieron cargar los modelos');
        const data = await response.json();
        setModels(data);
      } catch (error) {
        message.error('No se pudieron cargar los modelos para la marca seleccionada.');
      } finally {
        setModelsLoading(false);
      }
    }
  };

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (!customerId) {
            message.error('Customer ID is missing!');
            return;
        }
        onCreate({ ...values, customer_id: customerId });
        form.resetFields();
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <Modal
      open={open}
      title="Crear Nuevo Vehículo"
      okText="Crear"
      cancelText="Cancelar"
      onCancel={onCancel}
      onOk={handleOk}
      width={800}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" tip="Cargando opciones..." />
        </div>
      ) : (
        <Form form={form} layout="vertical" name="form_in_modal">
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="make" label="Marca" rules={[{ required: true, message: 'Por favor seleccione la marca' }]}>
                        <Select placeholder="Seleccione una marca" onChange={handleMakeChange} showSearch optionFilterProp="children">
                            {makes.map(make => <Option key={make.make_id} value={make.make} make_id={make.make_id}>{make.make}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="model" label="Modelo" rules={[{ required: true, message: 'Por favor seleccione el modelo' }]}>
                        <Select placeholder="Seleccione un modelo" loading={modelsLoading} disabled={modelsLoading || models.length === 0} showSearch optionFilterProp="children">
                            {models.map(model => <Option key={model.model_id} value={model.model}>{model.model}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="year" label="Año" rules={[{ required: true, message: 'Por favor ingrese el año' }]}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item name="vin" label="VIN">
                        <Input />
                    </Form.Item>
                    <Form.Item name="plate" label="Placas">
                        <Input />
                    </Form.Item>
                    <Form.Item name="mileage" label="Kilometraje">
                        <Input type="number" addonAfter="km" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="v_type_id" label="Tipo de Vehículo" rules={[{ required: true, message: 'Por favor seleccione un tipo' }]}>
                        <Select placeholder="Seleccione un tipo">
                        {vehicleTypes.map(type => <Option key={type.v_type_id} value={type.v_type_id}>{type.type}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="color_id" label="Color" rules={[{ required: true, message: 'Por favor seleccione un color' }]}>
                        <Select placeholder="Seleccione un color">
                        {colors.map(color => <Option key={color.color_id} value={color.color_id}>{color.color}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="motor_id" label="Motor" rules={[{ required: true, message: 'Por favor seleccione un motor' }]}>
                        <Select placeholder="Seleccione un motor">
                        {motors.map(motor => <Option key={motor.motor_id} value={motor.motor_id}>{motor.type}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="transmission_id" label="Transmisión">
                        <Select placeholder="Seleccione una transmisión">
                        {transmissions.map(trans => <Option key={trans.transmission_id} value={trans.transmission_id}>{trans.type}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="cylinders" label="Cilindros">
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item name="liters" label="Litros">
                        <Input />
                    </Form.Item>
                    <Form.Item name="fleet_number" label="Número de Flotilla">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
        </Form>
      )}
    </Modal>
  );
};

export default CreateVehicleModal;