import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Typography, Progress, Button, Space, Spin } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useBodyworkInventory } from '../../hooks/useBodyworkInventory';
import FreeSelectionBodywork from '../free-selection-bodywork';

const { Title, Paragraph } = Typography;

const bodyViews = [
  { key: 'front', title: 'Vista Frontal', image: '/sedan-front.png' },
  { key: 'right', title: 'Lateral Derecho', image: '/sedan-right.png' },
  { key: 'back', title: 'Vista Trasera', image: '/sedan-back.png' },
  { key: 'left', title: 'Lateral Izquierdo', image: '/sedan-left.png' },
  { key: 'up', title: 'Vista Superior', image: '/sedan-up.png' },
];

// Este componente es básicamente tu antiguo StepThree, pero enfocado solo en la carrocería.
const BodyworkInventory = forwardRef(({ orderData, inventoryType, onCompletionChange }, ref) => {
  const [form] = Form.useForm();
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  const currentView = bodyViews[currentViewIndex];
  const progressPercent = ((currentViewIndex + 1) / bodyViews.length) * 100;

  const { pointsByView, setPointsByView, damageTypes, isLoading, isSaving, saveViewPoints } = useBodyworkInventory(orderData?.order_id, inventoryType?.inv_type_id);

  const isLastView = currentViewIndex === bodyViews.length - 1;

  // Informa al padre (el nuevo StepThree) si este inventario está completo (es decir, si estamos en la última vista)
  useEffect(() => {
    if (onCompletionChange) {
      onCompletionChange(isLastView);
    }
  }, [isLastView, onCompletionChange]);

  // El padre (StepThree) llamará a esta función para guardar los datos antes de cambiar de inventario.
  useImperativeHandle(ref, () => ({
    saveStep: async () => {
      // Ahora la función de guardado se encarga de todo el objeto, no solo de una vista.
      // La llamamos aquí para asegurar que el estado final se guarde.
      await saveViewPoints();
      return true;
    }
  }));

  const handleSetPointsForCurrentView = (updater) => {
    setPointsByView(prev => {
      const currentPoints = prev[currentView.key] || [];
      const newPoints = typeof updater === 'function' ? updater(currentPoints) : updater;
      return { ...prev, [currentView.key]: newPoints };
    });
  };

  const handleRemovePoint = (indexToRemove) => {
    const viewKey = currentView.key;
    const newPoints = (pointsByView[viewKey] || []).filter((_, i) => i !== indexToRemove);
    setPointsByView(prev => ({ ...prev, [viewKey]: newPoints }));
  };

  const goToPrevView = async () => {
    await saveViewPoints();
    if (currentViewIndex > 0) {
      setCurrentViewIndex(prev => prev - 1);
    }
  };

  const goToNextView = async () => {
    await saveViewPoints();
    if (currentViewIndex < bodyViews.length - 1) {
      setCurrentViewIndex(prev => prev + 1);
    }
  };

  // Efecto para limpiar el punto anterior si estaba vacío al cambiar de vista.
  useEffect(() => {
    handleSetPointsForCurrentView(points => points.filter(p => p.type !== null || p.notes !== ''));
  }, [currentView.key]);

  return (
    <Form form={form} layout="vertical">
      <Spin spinning={isLoading || isSaving} tip={isSaving ? "Guardando..." : "Cargando inventario..."} style={{ minHeight: '200px', width: '100%' }}>
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
              inventoryTypeName={inventoryType?.name?.toLowerCase().replace(/\s/g, '_')}
              onRemovePoint={handleRemovePoint}
            />
            <Space style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
              <Button icon={<ArrowLeftOutlined />} onClick={goToPrevView} disabled={currentViewIndex === 0 || isSaving}>Vista Anterior</Button>
              <Button icon={<ArrowRightOutlined />} onClick={goToNextView} disabled={isLastView || isSaving}>Siguiente Vista</Button>
            </Space>
          </>
        )}
      </Spin>
    </Form>
  );
});

export default BodyworkInventory;