import React, { useState } from 'react';
import { Button, message, Steps, Card } from 'antd';
import { Link } from 'react-router-dom'; // PASO 1: Importa Link
import { ArrowLeftOutlined } from '@ant-design/icons'; // (Opcional) para un ícono
import StepOne from './step-one.jsx';
import StepTwo from './step-two.jsx'; // Importa el componente del Paso 2

const steps = [
  {
    title: 'Cliente',
    content: <StepOne />,
  },
  {
    title: 'Vehiculo',
    content: <StepTwo />,
  },
  {
    title: 'Envío y Entrega',
    content: <h2>Paso 3: Dirección de Envío</h2>,
  },
  {
    title: 'Revisión y Pago',
    content: <h2>Paso 4: Resumen y Finalización</h2>,
  },
];

const NewOrderPage = () => {
  const [current, setCurrent] = useState(0);

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const items = steps.map((item) => ({
    key: item.title,
    title: item.title,
  }));

  const contentStyle = {
    lineHeight: '260px',
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px dashed #d9d9d9',
    marginTop: '5px',
    padding: '20px'
  };

  return (
    // PASO 2: Añade la prop "extra" al Card
    <Card 
      title="Crear Nueva Orden" 
      
      extra={
        <Link to="/orders">
          <Button icon={<ArrowLeftOutlined />}>
            Volver a Órdenes
          </Button>
        </Link>
      }
    >
      <Steps current={current} items={items} />

      <div style={contentStyle}>{steps[current].content}</div>

      <div style={{ marginTop: '24px', textAlign: 'right' }}>
        {current > 0 && (
          <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
            Anterior
          </Button>
        )}
        {current < steps.length - 1 && (
          <Button type="primary" onClick={() => next()}>
            Siguiente
          </Button>
        )}
        {current === steps.length - 1 && (
          <Button type="primary" onClick={() => message.success('¡Orden creada con éxito!')}>
            Finalizar
          </Button>
        )}
      </div>
    </Card>
  );
};

export default NewOrderPage;