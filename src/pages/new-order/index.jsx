import React, { useState, useRef } from 'react';
import { Button, message, Steps, Card, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import StepOne from './step-one.jsx';
import StepTwo from './step-two.jsx';
import StepThree from './step-three.jsx';



const steps = [
  { title: 'Cliente' },
  { title: 'Vehiculo' },
  { title: 'Inventarios' },
  { title: 'Revisión y Pago' },
];

const NewOrderPage = () => {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null); // Estado para guardar la orden
  const stepOneRef = useRef(null);
  const stepTwoRef = useRef(null); // Referencia para el Paso 2

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
    } else if (current === 1) {
      setLoading(true);
      try {
        const updatedOrder = await stepTwoRef.current.submitStep();
        setOrderData(updatedOrder); // Actualizamos la orden con el vehículo
        message.success('Paso 2 completado. Avanzando...');
        setCurrent(2);
      } catch (error) {
        console.error('Fallo en el paso 2:', error);
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
        {current === 1 && <StepTwo ref={stepTwoRef} orderData={orderData} />}
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