import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';

const apiUrl = import.meta.env.VITE_API_URL;

export const useBodyworkInventory = (orderId, inventoryTypeId) => {
  const [pointsByView, setPointsByView] = useState({});
  const [damageTypes, setDamageTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Nuevo estado para mapear 'front' -> item_id 1, 'right' -> item_id 2, etc.
  const [viewToItemIdMap, setViewToItemIdMap] = useState({});

  // Cargar tipos de daño
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!inventoryTypeId) return;
      try {
        // Hacemos las dos peticiones en paralelo para más eficiencia
        const [damageTypesRes, itemsRes] = await Promise.all([
          fetch(`${apiUrl}/orders/bodywork-detail-types/`),
          fetch(`${apiUrl}/orders/inventory-items/${inventoryTypeId}`)
        ]);

        if (!damageTypesRes.ok) throw new Error('No se pudieron cargar los tipos de daño.');
        if (!itemsRes.ok) throw new Error('No se pudieron cargar los ítems de las vistas de carrocería.');

        const damageTypesData = await damageTypesRes.json();
        const itemsData = await itemsRes.json();

        setDamageTypes(damageTypesData);

        // Creamos el mapeo de 'front' -> 1, 'right' -> 2, etc. desde la API
        const map = itemsData.items.reduce((acc, item) => {
          acc[item.label.toLowerCase()] = item.item_id; // ej: acc['front'] = 1
          return acc;
        }, {});
        setViewToItemIdMap(map);
      } catch (error) {
        message.error(error.message);
      }
    };
    fetchInitialData();
  }, [inventoryTypeId]);

  // Cargar puntos existentes
  const fetchExistingPoints = useCallback(async () => {
    // Esperamos a que el mapeo de vistas esté listo antes de buscar los puntos
    if (!orderId || !inventoryTypeId || Object.keys(viewToItemIdMap).length === 0) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Apuntamos al nuevo endpoint de datos de inventario
      const response = await fetch(`${apiUrl}/orders/inventory-data/${orderId}/${inventoryTypeId}`);
      if (response.ok) {
        const savedData = await response.json();
        // La API ahora devuelve una lista de registros, donde cada registro contiene
        // un array de puntos de daño en su campo 'data' para una vista específica.
        const pointsGroupedByView = savedData.reduce((acc, record) => {
          try {
            const pointsForView = record.data; // 'data' es ahora directamente un array JSON de puntos
            // Buscamos la clave de la vista ('front', 'right') a partir del item_id del registro.
            const viewKey = Object.keys(viewToItemIdMap).find(key => viewToItemIdMap[key] === record.item_id);
            if (!viewKey) return acc; // Si no encontramos la vista, ignoramos el punto.

            if (!acc[viewKey]) {
              acc[viewKey] = [];
            }
            // El JSON ya no necesita la propiedad 'view', así que solo guardamos los datos del punto.
            // El backend espera un objeto con una clave 'points' que contenga el array.
            if (Array.isArray(pointsForView?.points)) {
              acc[viewKey] = pointsForView.points;
            }
          } catch (e) { console.error("Error al parsear datos del punto de carrocería", e); }
          return acc;
        }, {});
        setPointsByView(pointsGroupedByView);
      } else if (response.status !== 404) {
        throw new Error('No se pudieron cargar los detalles de carrocería.');
      }
      // Si es 404, significa que no hay datos guardados, lo cual está bien.
    } catch (error) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, inventoryTypeId, viewToItemIdMap]);

  useEffect(() => {
    fetchExistingPoints();
  }, [fetchExistingPoints]);

  // Guardar el estado completo del inventario de carrocería
  const saveBodyworkInventory = useCallback(async () => {
    if (!orderId || Object.keys(viewToItemIdMap).length === 0) return false;

    setIsSaving(true);
    try {
      // Transformamos el objeto pointsByView en un array de registros, donde cada registro
      // representa una vista y su campo 'data' contiene un array de todos los puntos de esa vista.
      const payload = Object.entries(pointsByView).map(([viewKey, points]) => ({
        order_id: orderId,
        // Usamos el item_id correspondiente a la vista (front, right, etc.)
        item_id: viewToItemIdMap[viewKey],
        // El campo 'data' ahora es un objeto que contiene una clave 'points' con el array de puntos.
        data: {
          points: points.filter(p => p.type !== null || p.notes !== '' || p.picture_path !== null) // Filtramos puntos vacíos antes de guardar
        }
      }));

      if (payload.length === 0) return true; // No hay puntos que guardar.

      const response = await fetch(`${apiUrl}/orders/inventory-data/`, {
        method: 'POST', // El backend ahora espera un array de puntos.
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('No se pudo guardar el inventario de carrocería.');
      }

      // No es necesario volver a llamar a fetchExistingPoints si el guardado es exitoso
      // y no hay cambios de estado que dependan de ello.
      message.success(`Inventario de carrocería guardado.`);
      return true;
    } catch (error) {
      message.error(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [pointsByView, orderId, viewToItemIdMap]);

  return {
    pointsByView,
    setPointsByView,
    damageTypes,
    isLoading,
    isSaving,
    saveViewPoints: saveBodyworkInventory, // Renombramos la función exportada para mayor claridad
  };
};