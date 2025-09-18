import React, { useState, useRef } from 'react';
import { Button, message, Steps, Card, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import StepOne from './step-one.jsx';
import StepTwo from './step-two.jsx';

const steps = [
  { title: 'Cliente' },
  { title: 'Vehiculo' },
  { title: 'Envío y Entrega' },
  { title: 'Revisión y Pago' },
];

const NewOrderPage = () => {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null); // Estado para guardar la orden
  const stepOneRef = useRef(null); // 👈 Creamos la referencia al componente hijo

  const next = async () => {
    // Si estamos en el primer paso, validamos el formulario del StepOne
    if (current === 0) {
      setLoading(true);
      try {
        // 👈 Usamos la referencia para llamar a la función 'submitStep' en el hijo
        const newOrder = await stepOneRef.current.submitStep();
        setOrderData(newOrder); // Guardamos la orden creada en el estado
        message.success('Paso 1 completado. Avanzando...');
        setCurrent(1); // Avanzamos al siguiente paso
      } catch (error) {
        console.error('La validación del formulario falló:', error);
        // Los mensajes de error ya son manejados por AntD en el componente hijo
      } finally {
        setLoading(false);
      }
    } else {
      setCurrent(current + 1); // Para otros pasos, solo avanzamos
    }
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

      <div style={contentStyle}>
        {current === 0 && <StepOne ref={stepOneRef} />}
        {current === 1 && <StepTwo orderData={orderData} />}
        {current === 2 && <h2>Paso 3: Dirección de Envío</h2>}
        {current === 3 && <h2>Paso 4: Resumen y Finalización</h2>}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'right' }}>
        {current > 0 && (
          <Button style={{ margin: '0 8px' }} onClick={() => prev()} disabled={loading}>
            Anterior
          </Button>
        )}
        {current < steps.length - 1 && (
          <Button 
            type="primary" 
            onClick={next} 
            loading={loading} // Muestra un estado de carga
            disabled={loading}
          >
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