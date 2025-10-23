import React, { useState, useRef, useEffect } from 'react';
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
  const [isStepThreeLastView, setIsStepThreeLastView] = useState(false);
  const [orderData, setOrderData] = useState(null); // Estado para guardar la orden
  const stepOneRef = useRef(null);
  const stepTwoRef = useRef(null); // Referencia para el Paso 2
  const stepThreeRef = useRef(null); // Referencia para el Paso 3

  useEffect(() => {
    if (current === 2) {
      // Cuando entramos al paso 3, verificamos si ya estamos en la última vista.
      // Usamos un timeout para asegurarnos que el ref del hijo esté disponible.
      setTimeout(() => {
        setIsStepThreeLastView(stepThreeRef.current?.isLastView ?? false);
      }, 0);
    }
  }, [current]);

  const handleStepThreeViewChange = (isLast) => {
    setIsStepThreeLastView(isLast);
  };

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
    } else if (current === 2) {
      setLoading(true);
      // El paso 3 ahora tiene su propia navegación interna.
      // Llamamos a `handleNextView` que nos dirá si ya podemos avanzar al siguiente paso.
      const canAdvance = await stepThreeRef.current.handleNextView();
      setIsStepThreeLastView(stepThreeRef.current?.isLastView ?? false);
      setLoading(false); // `handleNextView` tiene su propio spinner, así que quitamos el del botón principal.
      
      if (canAdvance) {
        try {
          // Si ya no hay más vistas, obtenemos los datos finales.
          const updatedOrder = await stepThreeRef.current.submitStep();
          setOrderData(updatedOrder);
          message.success('Inventario de carrocería completado. Avanzando...');
          setCurrent(3);
        } catch (error) {
          console.error('Fallo al finalizar el paso 3:', error);
        }
      }
    } else {
      setCurrent(current + 1); // Para otros pasos, solo avanzamos
    }
  };

  const prev = async () => {
    if (current === 2) {
      setLoading(true);
      try {
        // Guardamos los puntos de la vista actual antes de retroceder
        await stepThreeRef.current.saveCurrentViewPoints();
        setCurrent(current - 1);
      } catch (error) {
        console.error("Error al guardar antes de retroceder:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrent(current - 1);
    }
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
        {current === 2 && <StepThree ref={stepThreeRef} orderData={orderData} onViewChange={handleStepThreeViewChange} />}
        {current === 3 && <h2>Paso 4: Resumen y Finalización</h2>}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'right' }}>
        {current > 0 && (
          <Button style={{ margin: '0 8px' }} onClick={prev} loading={loading} disabled={loading}>
            Anterior
          </Button>
        )}
        {current < steps.length - 1 && (
          <Button 
            type="primary" 
            onClick={next} 
            loading={loading} // Muestra un estado de carga
            disabled={loading || (current === 2 && !isStepThreeLastView)}
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