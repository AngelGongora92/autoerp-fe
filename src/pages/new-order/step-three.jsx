import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Form, message, Typography, Progress, Button, Space, Spin } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
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
  // El estado ahora es un objeto para guardar puntos por vista
  const [bodyPointsByView, setBodyPointsByView] = useState({});
  // Nuevo estado para rastrear los puntos que ya están guardados en la BD
  const [persistedBodyPoints, setPersistedBodyPoints] = useState({});
  const [damageTypes, setDamageTypes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingBodyPoints, setLoadingBodyPoints] = useState(true); // Nuevo estado de carga para los puntos de carrocería
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isLastView, setIsLastView] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const currentView = bodyViews[currentViewIndex];
  const progressPercent = ((currentViewIndex + 1) / bodyViews.length) * 100;

  useEffect(() => {
    // Actualizamos si es la última vista cada vez que el índice cambia.
    setIsLastView(currentViewIndex === bodyViews.length - 1);
    if (onViewChange) {
      onViewChange(currentViewIndex === bodyViews.length - 1);
    }
  }, [currentViewIndex]);


  useEffect(() => {
    const fetchDamageTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await fetch(`${apiUrl}/orders/bodywork-detail-types/`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los tipos de daño.');
        }
        const data = await response.json();
        setDamageTypes(data);
      } catch (error) {
        message.error(error.message);
        console.error("Error fetching damage types:", error);
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchDamageTypes();
  }, [apiUrl]);

  // Nuevo useEffect para cargar los puntos de daño existentes para la orden actual
  useEffect(() => {
    const fetchExistingBodyPoints = async () => {
      if (!orderData?.order_id) {
        setLoadingBodyPoints(false);
        return;
      }

      setLoadingBodyPoints(true);
      try {
        const response = await fetch(`${apiUrl}/orders/bodywork-details/${orderData.order_id}`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los detalles de carrocería existentes.');
        }
        const data = await response.json();

        const pointsByView = {};
        data.forEach(p => {
          if (!pointsByView[p.view]) {
            pointsByView[p.view] = [];
          }
          pointsByView[p.view].push({
            detail_id: p.detail_id, x: p.x, y: p.y, type: p.detail_type.detail_type_id, notes: p.detail_notes, picture_path: p.picture_path,
          });
        });
        setBodyPointsByView(pointsByView);
        setPersistedBodyPoints(pointsByView); // Inicializamos los puntos persistidos también
      } catch (error) {
        message.error(error.message);
        console.error("Error fetching existing body points:", error);
      } finally {
        setLoadingBodyPoints(false);
      }
    };
    fetchExistingBodyPoints();
  }, [orderData?.order_id, apiUrl]); // Se ejecuta cuando order_id cambia

  // Guarda un único punto, decidiendo si es una creación (POST) o una actualización (PATCH)
  const savePoint = async (point, index) => {
    // ESTA FUNCIÓN AHORA SOLO SE USA PARA ACTUALIZACIONES (PATCH)
    const viewKey = currentView.key;
    // No guardar si el punto está vacío
    if (!point.type && !point.notes && !point.picture_path) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        order_id: orderData.order_id,
        view: viewKey,
        is_free_selection: true,
        detail_type_id: point.type || null,
        x: point.x,
        y: point.y,
        detail_notes: point.notes,
        picture_path: point.picture_path || null,
      };

      // Esta función ahora solo hace PATCH. La creación se hace en lote.
      const response = await fetch(`${apiUrl}/orders/bodywork-details/${point.detail_id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo guardar el detalle.');
      }

      message.success(`Punto #${index + 1} guardado.`);
      return true;
    } catch (error) {
      console.error("Error guardando el punto:", error);
      message.error(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };


  const saveCurrentViewPoints = async () => {
    setIsSaving(true);
    const viewKey = currentView.key;
    const currentPoints = bodyPointsByView[viewKey] || [];
    const originalPoints = persistedBodyPoints[viewKey] || [];

    // 1. Descartar puntos vacíos antes de guardar
    const pointsToSave = currentPoints.filter(
      p => p.type !== null || p.notes !== '' || p.picture_path
    );

    // Identificar puntos nuevos, modificados y eliminados
    const newPointsPayload = [];
    const modifiedPoints = [];
    const deletedPointIds = [];

    const currentPointIds = new Set(pointsToSave.map(p => p.detail_id).filter(Boolean));

    // Puntos eliminados
    originalPoints.forEach(p => {
      if (p.detail_id && !currentPointIds.has(p.detail_id)) {
        deletedPointIds.push(p.detail_id);
      }
    });

    pointsToSave.forEach((point, index) => {
      if (!point.detail_id) {
        // Punto nuevo
        newPointsPayload.push({
          order_id: orderData.order_id,
          view: viewKey,
          is_free_selection: true,
          detail_type_id: point.type || null,
          x: point.x,
          y: point.y,
          detail_notes: point.notes,
          picture_path: point.picture_path || null,
        });
      } else {
        // Punto potencialmente modificado
        const originalPoint = originalPoints.find(p => p.detail_id === point.detail_id);
        if (originalPoint && JSON.stringify(point) !== JSON.stringify(originalPoint)) {
          modifiedPoints.push(savePoint(point, index)); // savePoint ahora es solo para PATCH
        }
      }
    });

    try {
      // Ejecutar todas las operaciones en paralelo
      const promises = [];

      // 2. Crear nuevos puntos en lote
      if (newPointsPayload.length > 0) {
        promises.push(
          fetch(`${apiUrl}/orders/bodywork-details/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPointsPayload),
          }).then(async res => {
            if (!res.ok) throw await res.json();
            // Actualizar el estado local con los nuevos IDs
            const createdPoints = await res.json();
            setBodyPointsByView(prev => {
              const updatedViewPoints = [...(prev[viewKey] || [])];
              createdPoints.forEach(cp => {
                const pointIndex = updatedViewPoints.findIndex(p => !p.detail_id && p.x === cp.x && p.y === cp.y);
                if (pointIndex !== -1) {
                  updatedViewPoints[pointIndex].detail_id = cp.detail_id;
                }
              });
              return { ...prev, [viewKey]: updatedViewPoints };
            });
          })
        );
      }

      // 3. Actualizar puntos modificados
      modifiedPoints.forEach(p => promises.push(p));

      // 4. Eliminar puntos
      deletedPointIds.forEach(id => {
        promises.push(
          fetch(`${apiUrl}/orders/bodywork-details/${id}`, { method: 'DELETE' })
            .then(res => { if (!res.ok) throw new Error('Error al eliminar'); })
        );
      });

      await Promise.all(promises);

      // 5. Sincronizar el estado persistido con el estado actual
      setPersistedBodyPoints(prev => ({ ...prev, [viewKey]: [...pointsToSave] }));
      
      if (newPointsPayload.length > 0 || modifiedPoints.length > 0 || deletedPointIds.length > 0) {
        message.success(`Cambios en la vista '${currentView.title}' guardados.`);
      }

      return true;
    } catch (error) {
      console.error("Error guardando los puntos de la vista:", error);
      message.error(error.detail || error.message || 'Ocurrió un error al guardar.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    // Exponemos el estado para que el padre sepa si es la última vista
    get isLastView() {
      return currentViewIndex === bodyViews.length - 1;
    },
    // Exponemos la función de guardado para que el padre la pueda llamar
    saveCurrentViewPoints,
    // Nueva función para que el padre controle la navegación de vistas
    handleNextView: async () => {
      // Guardamos la vista actual antes de intentar avanzar
      const saved = await saveCurrentViewPoints();
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
    setBodyPointsByView(prev => {
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
    const points = bodyPointsByView[viewKey] || [];
    const pointToRemove = points[indexToRemove];

    // Si el punto tiene un detail_id, significa que existe en la BD y debemos llamar a la API.
    if (pointToRemove && pointToRemove.detail_id) {
      setIsSaving(true);
      try {
        const response = await fetch(`${apiUrl}/orders/bodywork-details/${pointToRemove.detail_id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'No se pudo eliminar el detalle.');
        }

        message.success('Detalle eliminado correctamente.');
      } catch (error) {
        message.error(error.message);
        console.error("Error al eliminar el detalle:", error);
        setIsSaving(false);
        return; // Detenemos la ejecución si la API falla
      } finally {
        setIsSaving(false);
      }
    }

    // Si la eliminación en la API fue exitosa o si el punto no estaba en la BD, lo eliminamos del estado.
    const newPoints = points.filter((_, i) => i !== indexToRemove);
    setBodyPointsByView(prev => ({ ...prev, [viewKey]: newPoints }));
    setPersistedBodyPoints(prev => ({ ...prev, [viewKey]: newPoints })); // También actualizamos el estado persistido
  };

  const goToPrevView = async () => {
    const saved = await saveCurrentViewPoints();
    if (!saved) return;

    if (currentViewIndex > 0) {
      setCurrentViewIndex(prev => prev - 1);
    }
  };

  const goToNextView = async () => {
    const saved = await saveCurrentViewPoints();
    if (!saved) return;

    if (currentViewIndex < bodyViews.length - 1) {
      setCurrentViewIndex(prev => prev + 1);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ pointsByView: {} }}>
      <Spin spinning={isSaving || loadingBodyPoints || loadingTypes} tip={isSaving ? "Guardando..." : "Cargando inventario..."}>
        {!loadingBodyPoints && !loadingTypes && (
          <>
            <Title level={4}>Inventario de Carrocería - {currentView.title}</Title>
            <Paragraph>Progreso del inventario de carrocería. Haz clic en la imagen para marcar los daños.</Paragraph>
            <Progress percent={progressPercent} style={{ marginBottom: 24 }} />
            
            <FreeSelectionBodywork
              imageSrc={currentView.image}
              points={bodyPointsByView[currentView.key] || []}
              damageTypes={damageTypes}
              loadingTypes={loadingTypes}
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