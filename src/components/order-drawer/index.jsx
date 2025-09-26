import React, { useState, useEffect } from 'react';
import { Drawer, Typography, List, Descriptions, Tag, Spin, message } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;

/**
 * OrderDrawer component to display order details.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.open - Controls the visibility of the drawer.
 * @param {Function} props.onClose - Function to call when the drawer is closed.
 * @param {object} props.order - The order object to display.
 * @param {Map} props.customerMap - Map of customer IDs to names.
 * @param {Map} props.employeeMap - Map of employee IDs to names.
 */
const OrderDrawer = ({ open, onClose, order, customerMap, employeeMap }) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [contactInfo, setContactInfo] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    // Solo buscar si el drawer está abierto y tenemos una orden
    if (open && order) {
      const fetchDetails = async () => {
        setLoadingDetails(true);
        try {
          // Usamos promesas individuales para más claridad
          const contactPromise = order.contact_id
            ? fetch(`${apiUrl}/contacts/${order.contact_id}`)
            : Promise.resolve(null);

          const vehiclePromise = order.vehicle_id
            ? fetch(`${apiUrl}/vehicles/${order.vehicle_id}`)
            : Promise.resolve(null);

          const [contactResponse, vehicleResponse] = await Promise.all([contactPromise, vehiclePromise]);

          if (order.contact_id) {
            const contactData = contactResponse && contactResponse.ok ? await contactResponse.json() : null;
            setContactInfo(contactData);
          }
          if (order.vehicle_id) {
            const vehicleDataArray = vehicleResponse && vehicleResponse.ok ? await vehicleResponse.json() : null;
            // La API devuelve un array, tomamos el primer elemento.
            setVehicleInfo(vehicleDataArray && vehicleDataArray.length > 0 ? vehicleDataArray[0] : null);
          }

        } catch (error) {
          console.error("Error fetching order details:", error);
          message.error("No se pudieron cargar los detalles adicionales de la orden.");
        } finally {
          setLoadingDetails(false);
        }
      };

      fetchDetails();
    }
    return () => {
        setContactInfo(null);
        setVehicleInfo(null);
    }
  }, [open, order, apiUrl]);

  // No renderizar nada si no hay una orden para mostrar
  if (!order) {
    return null;
  }

  const getStatusTag = (status) => {
    // Puedes expandir esto según los estados que manejes
    switch (status) {
      case 1:
        return <Tag color="blue">Recibido</Tag>;
      case 2:
        return <Tag color="gold">En Proceso</Tag>;
      case 3:
        return <Tag color="green">Completado</Tag>;
      default:
        return <Tag>No Asignado</Tag>;
    }
  };

  return (
    <Drawer
      title={`Detalles de la Orden #${order.c_order_id || order.order_id}`}
      width={640}
      onClose={onClose}
      open={open}
      destroyOnClose // Destruye los hijos del Drawer al cerrar para resetear el estado
    >
      {loadingDetails ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin tip="Cargando detalles..." />
        </div>
      ) : (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Folio">{order.c_order_id}</Descriptions.Item>
          <Descriptions.Item label="Fecha de Orden">{dayjs(order.order_date).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="Cliente">{customerMap?.get(order.customer_id) || `ID: ${order.customer_id}`}</Descriptions.Item>
          <Descriptions.Item label="Contacto">{contactInfo ? `${contactInfo.fname || ''} ${contactInfo.lname || ''}`.trim() : (order.contact_id || 'N/A')}</Descriptions.Item>
          <Descriptions.Item label="Vehículo">{vehicleInfo ? `${vehicleInfo.model?.make?.make || ''} ${vehicleInfo.model?.model || ''} (${vehicleInfo.year || ''})`.trim() : (order.vehicle_id || 'No asignado')}</Descriptions.Item>
          <Descriptions.Item label="Asesor">{employeeMap?.get(order.advisor_id) || `ID: ${order.advisor_id}`}</Descriptions.Item>
          <Descriptions.Item label="Técnico">{employeeMap?.get(order.mechanic_id) || `ID: ${order.mechanic_id}`}</Descriptions.Item>
          <Descriptions.Item label="Estatus Operativo">{getStatusTag(order.op_status_id)}</Descriptions.Item>
          <Descriptions.Item label="Estatus Administrativo">{order.adm_status_id || 'No asignado'}</Descriptions.Item>
        </Descriptions>
      )}

      {/* Sección para mostrar items/servicios (actualmente deshabilitada) */}
      {/* 
      <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>Servicios / Ítems</Title>
      <List
        // Cuando tengas los datos de los ítems, puedes pasarlos aquí.
        // Por ejemplo: dataSource={order.items}
        dataSource={[]}
        renderItem={(item) => (
          <List.Item key={item.id}>{item.name} - {item.quantity} x ${item.price.toFixed(2)}</List.Item>
        )}
        locale={{ emptyText: 'No hay servicios o ítems en esta orden.' }}
      /> 
      */}
    </Drawer>
  );
};

export default OrderDrawer;