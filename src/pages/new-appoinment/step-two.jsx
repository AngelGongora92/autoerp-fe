import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Select, Spin, message, Row, Col, Card, Typography } from 'antd';

const { Text, Paragraph } = Typography;

const StepTwo = forwardRef(({ appointmentData }, ref) => {
  const [form] = Form.useForm();
  const [selectedCustomerInfo, setSelectedCustomerInfo] = useState(null);
  
  // Estados para los asesores
  const [advisorOptions, setAdvisorOptions] = useState([]);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  const [technicianOptions, setTechnicianOptions] = useState([]);
  const [technicianLoading, setTechnicianLoading] = useState(false);

  // Estados para los motivos de cita
  const [appointmentReasons, setAppointmentReasons] = useState([]);
  const [reasonsLoading, setReasonsLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    console.log('StepTwo recibió appointmentData:', appointmentData);
    if (appointmentData?._customer) {
      setSelectedCustomerInfo(appointmentData._customer);
    }
  }, [appointmentData]);

  // useEffect para buscar asesores y técnicos
  useEffect(() => {
    const fetchEmployees = async (roleId, setLoading, setOptions, roleName) => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/employees/${roleId}`);
        if (!response.ok) throw new Error(`Error al cargar ${roleName}`);
        const data = await response.json();
        const formattedOptions = data.map(employee => ({
          value: employee.employee_id,
          label: `${employee.fname || ''} ${employee.lname1 || ''}`.trim(),
        }));
        setOptions(formattedOptions);
      } catch (error) {
        console.error(`Error fetching ${roleName}:`, error);
        message.error(`No se pudieron cargar los ${roleName}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees(1, setAdvisorLoading, setAdvisorOptions, 'asesores');
    fetchEmployees(2, setTechnicianLoading, setTechnicianOptions, 'técnicos');
  }, [apiUrl]);

  // useEffect para buscar motivos de cita
  useEffect(() => {
    const fetchAppointmentReasons = async () => {
      setReasonsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/appointments/reasons/`);
        if (!response.ok) throw new Error('Error al cargar los motivos de cita');
        const data = await response.json();
        const formattedOptions = data.map(reason => ({
          value: reason.reason_id,
          label: reason.reason,
        }));
        setAppointmentReasons(formattedOptions);
      } catch (error) {
        console.error('Error fetching appointment reasons:', error);
        message.error('No se pudieron cargar los motivos de cita.');
      } finally {
        setReasonsLoading(false);
      }
    };

    fetchAppointmentReasons();
  }, [apiUrl]);

  // Efecto para pre-llenar los campos si el usuario vuelve atrás
  useEffect(() => {
    if (appointmentData) {
      form.setFieldsValue({
        advisor: appointmentData.advisor_id,
        technician: appointmentData.mechanic_id,
        reason_id: appointmentData.reason_id,
      });
    }
  }, [appointmentData, form]);

  useImperativeHandle(ref, () => ({
    submitStep: async () => {
      try {
        const values = await form.validateFields();

        // 1. Preparamos el payload para actualizar la cita principal (vehículo y kilometraje)
        const payload = { 
          reason_id: values.reason_id,
          advisor_id: values.advisor,
          mechanic_id: values.technician,
        };

        // Devolvemos el payload para que el componente padre lo gestione.
        return payload;
      } catch (errorInfo) {
        if (errorInfo.errorFields && errorInfo.errorFields.length > 0) {
          message.error('Por favor, complete todos los campos requeridos.');
        } else {
          console.error('Error en el paso 2:', errorInfo);
        }
        throw errorInfo;
      }
    }
  }));

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

      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={{ advisor: undefined, technician: undefined, reason_id: undefined }}
      >
        <Row gutter={24}>
          <Col xs={24} md={{ span: 12, offset: 6 }} order={{ xs: 2, md: 2 }}>
            <Row>
              <Col span={24}>
                <Form.Item label="Motivo de Cita" name="reason_id" rules={[{ required: true, message: 'Por favor, seleccione un motivo' }]} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                    <Select
                        style={{ width: '100%' }}
                        loading={reasonsLoading}
                        options={appointmentReasons}
                        placeholder="Seleccionar motivo"
                        disabled={reasonsLoading}
                        allowClear
                    />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Asesor" name="advisor" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                    <Select
                        style={{ width: '100%' }}
                        loading={advisorLoading}
                        options={advisorOptions}
                        placeholder="Sin Asignar"
                        disabled={advisorLoading}
                        allowClear
                    />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Técnico" name="technician" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                    <Select
                        style={{ width: '100%' }}
                        loading={technicianLoading}
                        options={technicianOptions}
                        placeholder="Sin Asignar"
                        disabled={technicianLoading}
                        allowClear
                    />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
    </div>
  );
});

export default StepTwo;
