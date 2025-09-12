import React, { useState } from 'react';
import { Form, Row, Col, AutoComplete, Card, Typography, Spin } from 'antd';

const { Text } = Typography;

function StepOne() {
  const [options, setOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

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

  const onSelect = (value, option) => {
    setSelectedCustomer(option);
  };
  
  const onChange = (value) => {
    if (!value) setSelectedCustomer(null);
  };

  return (
    <Form layout="vertical">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Cliente">
            <AutoComplete
              options={options}
              style={{ width: '100%' }}
              onSelect={onSelect}
              // Directamente pasas la función de búsqueda
              onSearch={searchCustomers}
              onChange={onChange}
              placeholder="Escribe para buscar un cliente..."
              // Y aquí está la magia. Ant Design se encarga del debounce.
              debounce={300}
              notFoundContent={loading ? <Spin size="small" /> : null}
            />
          </Form.Item>
          {selectedCustomer && (
        <Card title="Información del Cliente Seleccionado" bordered={false} style={{ marginTop: 16, backgroundColor: '#FAFAFA' }}>
          <p><Text strong>Nombre:</Text> {selectedCustomer.label || 'N/A'}</p>
          <p><Text strong>Email:</Text> {selectedCustomer.email || 'N/A'}</p>
          <p><Text strong>Dirección:</Text> {`${selectedCustomer.address1 || ''} ${selectedCustomer.address2 || ''}`.trim() || 'N/A'}</p>
        </Card>
      )}
        </Col>

        <Col span={12}>
          <Form.Item label="Contacto">
            <AutoComplete
              options={options}
              style={{ width: '100%' }}
              onSelect={onSelect}
              // Directamente pasas la función de búsqueda
              onSearch={searchCustomers}
              onChange={onChange}
              placeholder="Escribe para buscar un cliente..."
              // Y aquí está la magia. Ant Design se encarga del debounce.
              debounce={300}
              notFoundContent={loading ? <Spin size="small" /> : null}
            />
          </Form.Item>
        </Col>
      </Row>

      
    </Form>
  );
}

export default StepOne;