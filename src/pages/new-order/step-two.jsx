import React from 'react';
import { Form, Select, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

function StepTwo({ orderData }) {
  return (
    <div>
      
      {/* Aquí van los campos del formulario para la información del vehículo */}
      {orderData && <p>Continuando con la orden: {orderData.order_id}</p>}

      <Form layout="vertical" style={{ lineHeight: 'normal', textAlign: 'left', marginTop: 24 }}>
        <Form.Item
          label="Vehículo"
          name="vehicle"
        >
          <Space.Compact style={{ width: '50%' }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Seleccionar vehículo"
            />
            <Button icon={<PlusOutlined />} />
          </Space.Compact>
        </Form.Item>
      </Form>
    </div>
  );
}

export default StepTwo;
