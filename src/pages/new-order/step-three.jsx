import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Form, message, Typography, Progress, Button, Space, Spin } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useBodyworkInventory } from '../../hooks/useBodyworkInventory';
import FreeSelectionBodywork from '../../components/free-selection-bodywork' // Importamos el nuevo componente

const { Title, Paragraph } = Typography;

// Definimos las vistas de la carrocería
const bodyViews = [
  { key: 'front', title: 'Vista Frontal', image: '/sedan-front.png' },
  { key: 'right', title: 'Lateral Derecho', image: '/sedan-right.png' },
  { key: 'back', title: 'Vista Trasera', image: '/sedan-back.png' },
  { key: 'left', title: 'Lateral Izquierdo', image: '/sedan-left.png' },
  { key: 'up', title: 'Vista Superior', image: '/sedan-up.png' },
];

const StepThree = forwardRef(({ orderData, onViewChange }, ref) => {
  const [form] = Form.useForm();
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isLastView, setIsLastView] = useState(false);

  const currentView = bodyViews[currentViewIndex];
  const progressPercent = ((currentViewIndex + 1) / bodyViews.length) * 100;

  // Usamos nuestro nuevo hook para manejar la lógica del inventario
  const { pointsByView, setPointsByView, damageTypes, isLoading, isSaving, saveViewPoints } = useBodyworkInventory(orderData?.order_id);

  useEffect(() => {
    // Actualizamos si es la última vista cada vez que el índice cambia.
    setIsLastView(currentViewIndex === bodyViews.length - 1);
    if (onViewChange) {
      onViewChange(currentViewIndex === bodyViews.length - 1);
    }
  }, [currentViewIndex]);

  useImperativeHandle(ref, () => ({
    // Exponemos el estado para que el padre sepa si es la última vista
    get isLastView() {
      return currentViewIndex === bodyViews.length - 1;
    },
    // Exponemos la función de guardado para que el padre la pueda llamar
    saveCurrentViewPoints: () => saveViewPoints(currentView.key),
    // Nueva función para que el padre controle la navegación de vistas
    handleNextView: async () => {
      // Guardamos la vista actual antes de intentar avanzar
      const saved = await saveViewPoints(currentView.key);
      if (!saved) return false; // Si no se pudo guardar, no avanzamos

      if (currentViewIndex < bodyViews.length - 1) {
        setCurrentViewIndex(prev => prev + 1);
        return false; // Indicamos que aún no se puede avanzar al siguiente paso
      }
      return true; // Indicamos que es la última vista y se puede avanzar
    },
    // Esta función ahora solo se usa si el usuario avanza sin haber pasado por todas las vistas (lo cual no debería pasar con el flujo actual)
    // O para un guardado final explícito si se necesitara.
    submitStep: async () => {
      try {
        // La lógica principal de guardado ya se hizo en `saveCurrentViewPoints`.
        // Aquí solo confirmamos que el paso está completo.
        const updatedOrder = { ...orderData, inventory_complete: true };
        return updatedOrder;
      } catch (errorInfo) {
        message.error('Ocurrió un error al finalizar el inventario de carrocería.');
        throw errorInfo;
      }
    }
  }));

  const handleSetPointsForCurrentView = (updater) => {
    setPointsByView(prev => {
      const currentPoints = prev[currentView.key] || [];
      // Si el 'updater' es una función, la ejecutamos con los puntos actuales.
      // Si no, es el nuevo array de puntos directamente.
      const newPoints = typeof updater === 'function' ? updater(currentPoints) : updater;
      return {
        ...prev,
        [currentView.key]: newPoints,
      };
    });
  };

  const handleRemovePoint = async (indexToRemove) => {
    const viewKey = currentView.key;
    const newPoints = (pointsByView[viewKey] || []).filter((_, i) => i !== indexToRemove);
    setPointsByView(prev => ({ ...prev, [viewKey]: newPoints }));
  };

  const goToPrevView = async () => {
    const saved = await saveViewPoints(currentView.key);
    if (!saved) return;

    if (currentViewIndex > 0) {
      setCurrentViewIndex(prev => prev - 1);
    }
  };
  const goToNextView = async () => {
    const saved = await saveViewPoints(currentView.key);
    if (!saved) return;

    if (currentViewIndex < bodyViews.length - 1) {
      setCurrentViewIndex(prev => prev + 1);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ pointsByView: {} }}>
      <Spin spinning={isLoading || isSaving} tip={isSaving ? "Guardando..." : "Cargando inventario..."}>
        {!isLoading && (
          <>
            <Title level={4}>Inventario de Carrocería - {currentView.title}</Title>
            <Paragraph>Progreso del inventario de carrocería. Haz clic en la imagen para marcar los daños.</Paragraph>
            <Progress percent={progressPercent} style={{ marginBottom: 24 }} />
            
            <FreeSelectionBodywork
              imageSrc={currentView.image}
              points={pointsByView[currentView.key] || []}
              damageTypes={damageTypes}
              orderId={orderData?.order_id}
              viewKey={currentView.key}
              setPoints={handleSetPointsForCurrentView}
              onRemovePoint={handleRemovePoint}
            />
            <Space style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
              <Button icon={<ArrowLeftOutlined />} onClick={goToPrevView} disabled={currentViewIndex === 0 || isSaving}>Vista Anterior</Button>
              <Button icon={<ArrowRightOutlined />} onClick={goToNextView} disabled={currentViewIndex === bodyViews.length - 1 || isSaving}>Siguiente Vista</Button>
            </Space>
          </>
        )}
      </Spin>
    </Form>
  );
});

export default StepThree;