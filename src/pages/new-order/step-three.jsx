import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Form, message, Typography, Progress, Button, Space, Spin, Result } from 'antd';
import BodyworkInventory from '../../components/bodywork-inventory';
import GenericInventory from '../../components/generic-inventory';

const StepThree = forwardRef(({ orderData, onCompletionChange }, ref) => {
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [activeInventories, setActiveInventories] = useState([]);
  const [currentInventoryIndex, setCurrentInventoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isCurrentInventoryComplete, setIsCurrentInventoryComplete] = useState(false);

  // Usamos un ref mutable para almacenar la instancia del componente hijo.
  // Esto evita problemas de "stale closure" con la referencia.
  const inventoryRef = useRef(null); 
  const setInventoryRef = (node) => { inventoryRef.current = node; };

  useEffect(() => {
    const fetchInventoryTypes = async () => {
      setIsLoading(true);
      try {
        // Actualizamos el endpoint para que coincida con tu API
        const response = await fetch(`${apiUrl}/orders/inventory-types/`);
        if (!response.ok) throw new Error('No se pudieron cargar los tipos de inventario.');
        const data = await response.json();

        // Filtramos para mostrar solo los inventarios activos
        const activeOnlyInventories = data.filter(inv => inv.is_active);
        setActiveInventories(activeOnlyInventories);
      } catch (error) {
        message.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventoryTypes();
  }, [apiUrl]);

  const isLastInventory = currentInventoryIndex === activeInventories.length - 1;
  const progressPercent = activeInventories.length > 0 ? ((currentInventoryIndex + 1) / activeInventories.length) * 100 : 0;

  useEffect(() => {
    // Solo llamamos a onCompletionChange si hay inventarios activos.
    if (onCompletionChange && activeInventories.length > 0) {
      // El paso se considera completo tan pronto como se llega al último inventario.
      const isStepComplete = isLastInventory;
      onCompletionChange(isStepComplete);
    }
  }, [isLastInventory, onCompletionChange, activeInventories.length]);

  // Efecto para reiniciar el estado de completado cuando el inventario cambia.
  // Esto asegura que el nuevo inventario pueda reportar su propio estado de completado.
  useEffect(() => {
    setIsCurrentInventoryComplete(false);
  }, [currentInventoryIndex]);

  const saveCurrentInventory = async () => {
    if (inventoryRef.current?.saveStep) {
      return await inventoryRef.current.saveStep();
    }
    return false; // Si no hay ref o función, el guardado falla.
  };

  useImperativeHandle(ref, () => ({
    submitStep: async () => {
      setIsSaving(true);
      try {
        await saveCurrentInventory();
        const updatedOrder = { ...orderData, inventory_complete: true };
        setIsSaving(false);
        return updatedOrder;
      } catch (errorInfo) {
        message.error('Ocurrió un error al finalizar los inventarios.');
        setIsSaving(false);
        throw errorInfo;
      }
    }
  }));

  const goToPrevInventory = async () => {
    if (currentInventoryIndex > 0) { // Solo actuar si no es el primero
      setIsSaving(true);
      const saved = await saveCurrentInventory();
      setIsSaving(false);
      if (saved) { // Solo retroceder si el guardado fue exitoso
        setCurrentInventoryIndex(prev => prev - 1);
      }
    }
  };
  const goToNextInventory = async () => {
    if (!isLastInventory) { // Solo actuar si no es el último
      setIsSaving(true);
      const saved = await saveCurrentInventory();
      setIsSaving(false);
      if (saved) { // Solo avanzar si el guardado fue exitoso
        setCurrentInventoryIndex(prev => prev + 1);
      }
    }
  };
  
  const currentInventory = activeInventories[currentInventoryIndex];
  
  let ComponentToRender;
  if (currentInventory?.component_key === 'bodywork') {
    ComponentToRender = BodyworkInventory;
  } else if (currentInventory) {
    ComponentToRender = GenericInventory;
  }

  if (isLoading) return <Spin tip="Cargando configuración de inventarios..." />;
  if (!activeInventories.length) return <Result status="info" title="No hay inventarios activos" subTitle="Puedes continuar al siguiente paso." />;
  
  return <>
    <Progress percent={progressPercent} style={{ marginBottom: 24 }} />
    
    {ComponentToRender ? (
      <ComponentToRender 
        ref={setInventoryRef} 
        orderData={orderData} 
        inventoryType={currentInventory}
        onCompletionChange={setIsCurrentInventoryComplete} 
      />
    ) : <Result status="warning" title="Componente de inventario no encontrado" />}
    
    <Space style={{ marginTop: 24, width: '100%', justifyContent: 'space-between' }}>
      <Button onClick={goToPrevInventory} disabled={currentInventoryIndex === 0 || isSaving}>Inventario Anterior</Button>
      <Button 
        type="primary" 
        onClick={goToNextInventory} 
        // El botón se deshabilita si es el último inventario, si está guardando,
        // O si es el inventario de carrocería (id 1) y aún no se han completado todas sus vistas.
        disabled={isLastInventory || isSaving || (currentInventory?.inv_type_id === 1 && !isCurrentInventoryComplete)}
      >
        Siguiente Inventario
      </Button>
    </Space>
  </>;
});

export default StepThree;