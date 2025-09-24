import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Spin, Row, Col } from 'antd';

const { Option } = Select;

const CreateVehicleModal = ({ open, onCreate, onCancel, customerId }) => {
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [colors, setColors] = useState([]);
  const [motors, setMotors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchDropdownData = async () => {
        setLoading(true);
        try {
          const [typesRes, colorsRes, motorsRes] = await Promise.all([
            fetch(`${apiUrl}/vehicle-types/`),
            fetch(`${apiUrl}/vehicle/colors/`),
            fetch(`${apiUrl}/vehicle/motors/`),
          ]);

          if (!typesRes.ok || !colorsRes.ok || !motorsRes.ok) {
            throw new Error('Failed to load vehicle options');
          }

          const typesData = await typesRes.json();
          const colorsData = await colorsRes.json();
          const motorsData = await motorsRes.json();

          setVehicleTypes(typesData);
          setColors(colorsData);
          setMotors(motorsData);

        } catch (error) {
          message.error('No se pudieron cargar las opciones para vehículos.');
          console.error("Error fetching vehicle options:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDropdownData();
    }
  }, [open, apiUrl]);

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
                    <Form.Item name="make" label="Marca" rules={[{ required: true, message: 'Por favor ingrese la marca' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="model" label="Modelo" rules={[{ required: true, message: 'Por favor ingrese el modelo' }]}>
                        <Input />
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
                    <Form.Item name="vehicle_type_id" label="Tipo de Vehículo" rules={[{ required: true, message: 'Por favor seleccione un tipo' }]}>
                        <Select placeholder="Seleccione un tipo">
                        {vehicleTypes.map(type => <Option key={type.vehicle_type_id} value={type.vehicle_type_id}>{type.type}</Option>)}
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
                    <Form.Item name="transmission" label="Transmisión">
                        <Input />
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