import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Calendar, Select, Row, Col, Typography, message, Button } from 'antd';
import dayjs from 'dayjs';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Función para generar opciones de tiempo en intervalos de 30 minutos
const generateTimeOptions = (startHour, endHour, interval) => {
  const options = [];
  let currentTime = dayjs().hour(startHour).minute(0).second(0);
  const endTime = dayjs().hour(endHour).minute(0).second(0);

  while (currentTime.isBefore(endTime)) {
    options.push({
      value: currentTime.format('HH:mm'),
      label: currentTime.format('hh:mm A'),
    });
    currentTime = currentTime.add(interval, 'minute');
  }
  return options;
};

const StepThree = forwardRef(({ appointmentData }, ref) => {
  const [form] = Form.useForm();
  const [selectedCustomerInfo, setSelectedCustomerInfo] = useState(null);

  // Generar opciones de 8:00 AM a 6:00 PM en intervalos de 30 min
  const timeOptions = generateTimeOptions(8, 18, 30); 

  useEffect(() => {
    if (appointmentData?._customer) {
      setSelectedCustomerInfo(appointmentData._customer);
    }
    // Pre-llenar el formulario si los datos ya existen (al volver atrás)
    if (appointmentData?.appointment_date) {
        const date = dayjs(appointmentData.appointment_date);
        form.setFieldsValue({
            date: date,
            time: date.format('HH:mm'),
        });
    }
  }, [appointmentData, form]);

  useImperativeHandle(ref, () => ({
    submitStep: async () => {
      try {
        const values = await form.validateFields();
        const { date, time } = values;

        // Combinar fecha y hora
        const [hour, minute] = time.split(':');
        const appointmentDateTime = date.hour(hour).minute(minute).second(0);

        // Formatear a ISO string para el backend
        const payload = {
          appointment_date: appointmentDateTime.toISOString(),
        };

        return payload;
      } catch (errorInfo) {
        if (errorInfo.errorFields && errorInfo.errorFields.length > 0) {
          message.error('Por favor, seleccione una fecha y hora.');
        } else {
          console.error('Error en el paso 3:', errorInfo);
        }
        throw errorInfo;
      }
    }
  }));

  const handleDateSelect = (date) => {
    // Actualiza el valor en el formulario cuando se selecciona una fecha en el calendario
    form.setFieldsValue({ date: date });
  };

  const disabledDate = (current) => {
    // No se pueden seleccionar días anteriores al día de hoy.
    return current && current < dayjs().startOf('day');
  };

  const customHeaderRender = ({ value, onChange }) => {
    const month = value.format('MMMM');
    const year = value.format('YYYY');

    const handlePrevMonth = () => {
      onChange(value.clone().subtract(1, 'month'));
    };

    const handleNextMonth = () => {
      onChange(value.clone().add(1, 'month'));
    };

    return (
      <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button shape="circle" icon={<LeftOutlined />} onClick={handlePrevMonth} size="small" />
        <Typography.Text strong style={{ textTransform: 'capitalize' }}>
          {`${month} ${year}`}
        </Typography.Text>
        <Button shape="circle" icon={<RightOutlined />} onClick={handleNextMonth} size="small" />
      </div>
    );
  };

  return (
    <div>
      <Row justify="center" align="top" style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <p style={{ margin: 0, textAlign: 'center' }}>
            
            <Text strong>Cliente: </Text> 
            {selectedCustomerInfo ? 
            (selectedCustomerInfo.is_company ? 
            selectedCustomerInfo.cname : `${selectedCustomerInfo.fname || ''} ${selectedCustomerInfo.lname || ''}`.trim()) : 'Cargando...'}
          </p>
        </Col>
      </Row>

      <Form form={form} layout="vertical">
        <Row justify="center" gutter={16}>
          <Col xs={24} sm={14} md={10}>
            <Typography.Title level={5} style={{textAlign: 'center'}}>Fecha de la Cita</Typography.Title>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              width: '100%'
            }}>
              <div style={{ 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px',
              }}>
                <Calendar 
                  fullscreen={false} 
                  onSelect={handleDateSelect} 
                  disabledDate={disabledDate}
                  headerRender={customHeaderRender} />
              </div>
            </div>
            <Form.Item name="date" rules={[{ required: true, message: 'Por favor, seleccione una fecha en el calendario' }]} style={{ display: 'none' }}>
              <div />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="time" label="Hora de la Cita" rules={[{ required: true, message: 'Seleccione una hora' }]}>
              <Select
                options={timeOptions}
                placeholder="Seleccionar hora"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
});

export default StepThree;