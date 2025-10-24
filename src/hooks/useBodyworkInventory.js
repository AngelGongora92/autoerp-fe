import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';

const apiUrl = import.meta.env.VITE_API_URL;

export const useBodyworkInventory = (orderId) => {
  const [pointsByView, setPointsByView] = useState({});
  const [persistedPointsByView, setPersistedPointsByView] = useState({});
  const [damageTypes, setDamageTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar tipos de daño
  useEffect(() => {
    const fetchDamageTypes = async () => {
      try {
        const response = await fetch(`${apiUrl}/orders/bodywork-detail-types/`);
        if (!response.ok) throw new Error('No se pudieron cargar los tipos de daño.');
        const data = await response.json();
        setDamageTypes(data);
      } catch (error) {
        message.error(error.message);
      }
    };
    fetchDamageTypes();
  }, []);

  // Cargar puntos existentes
  const fetchExistingPoints = useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/orders/bodywork-details/${orderId}`);
      if (!response.ok) throw new Error('No se pudieron cargar los detalles de carrocería.');
      const data = await response.json();
      const groupedPoints = data.reduce((acc, p) => {
        acc[p.view] = acc[p.view] || [];
        acc[p.view].push({
          detail_id: p.detail_id, x: p.x, y: p.y,
          type: p.detail_type.detail_type_id,
          notes: p.detail_notes, picture_path: p.picture_path,
        });
        return acc;
      }, {});
      setPointsByView(groupedPoints);
      setPersistedPointsByView(JSON.parse(JSON.stringify(groupedPoints))); // Deep copy
    } catch (error) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchExistingPoints();
  }, [fetchExistingPoints]);

  // Guardar puntos de una vista específica
  const saveViewPoints = useCallback(async (viewKey) => {
    setIsSaving(true);
    const currentPoints = pointsByView[viewKey] || [];
    const originalPoints = persistedPointsByView[viewKey] || [];

    const pointsToSave = currentPoints.filter(p => p.type || p.notes || p.picture_path);

    const newPointsPayload = pointsToSave.filter(p => !p.detail_id);
    const updatedPoints = pointsToSave.filter(p => {
      if (!p.detail_id) return false;
      const original = originalPoints.find(op => op.detail_id === p.detail_id);
      return original && JSON.stringify(p) !== JSON.stringify(original);
    });
    const deletedPointIds = originalPoints
      .filter(p => !pointsToSave.some(cp => cp.detail_id === p.detail_id))
      .map(p => p.detail_id);

    try {
      const promises = [];
      // POST (Crear)
      if (newPointsPayload.length > 0) {
        const payload = newPointsPayload.map(({ type, ...restOfPoint }) => {
          const pointPayload = { ...restOfPoint, order_id: orderId, view: viewKey, is_free_selection: true };
          // Solo añadir detail_type_id si no es null.
          // El backend espera un entero, si es null, no lo enviamos y debería usar el default de la BD.
          if (type !== null) {
            pointPayload.detail_type_id = type;
          }
          return pointPayload; // `type` se excluye del payload si es null
        });
        promises.push(fetch(`${apiUrl}/orders/bodywork-details/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(res => res.ok ? res.json() : Promise.reject(res.json())));
      }
      // PATCH (Actualizar)
      updatedPoints.forEach(p => {
        // Desestructuramos para quitar 'type' y solo enviar 'detail_type_id' si es necesario
        const { type, ...restOfPoint } = p;
        const payload = { ...restOfPoint, order_id: orderId, view: viewKey, is_free_selection: true };
        if (p.type !== null) {
          payload.detail_type_id = type;
        }
        promises.push(fetch(`${apiUrl}/orders/bodywork-details/${p.detail_id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }));
      });
      // DELETE (Eliminar)
      deletedPointIds.forEach(id => {
        promises.push(fetch(`${apiUrl}/orders/bodywork-details/${id}`, { method: 'DELETE' }));
      });

      if (promises.length === 0) return true;

      await Promise.all(promises);
      
      await fetchExistingPoints();

      if (newPointsPayload.length || updatedPoints.length || deletedPointIds.length) {
        message.success(`Cambios en la vista guardados.`);
      }
      return true;
    } catch (error) {
      const errorData = await (error.json ? error.json() : Promise.resolve({ detail: 'Ocurrió un error al guardar.' }));
      message.error(errorData.detail || 'Ocurrió un error al guardar.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [pointsByView, persistedPointsByView, orderId, fetchExistingPoints]);

  return {
    pointsByView,
    setPointsByView,
    damageTypes,
    isLoading,
    isSaving,
    saveViewPoints,
  };
};