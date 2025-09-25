import React, { useState, useEffect } from 'react';
import { Drawer, Typography, List, Descriptions, Tag } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;

/**
 * OrderDrawer component to display order details.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.open - Controls the visibility of the drawer.
 * @param {Function} props.onClose - Function to call when the drawer is closed.
 * @param {object} props.order - The order object to display.
 */
const OrderDrawer = ({ open, onClose, order }) => {
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
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Folio">{order.c_order_id}</Descriptions.Item>
        <Descriptions.Item label="Fecha de Orden">{dayjs(order.order_date).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="Cliente ID">{order.customer_id}</Descriptions.Item>
        <Descriptions.Item label="Contacto ID">{order.contact_id}</Descriptions.Item>
        <Descriptions.Item label="Vehículo ID">{order.vehicle_id || 'No asignado'}</Descriptions.Item>
        <Descriptions.Item label="Asesor ID">{order.advisor_id}</Descriptions.Item>
        <Descriptions.Item label="Técnico ID">{order.mechanic_id}</Descriptions.Item>
        <Descriptions.Item label="Estatus Operativo">{getStatusTag(order.op_status_id)}</Descriptions.Item>
        <Descriptions.Item label="Estatus Administrativo">{order.adm_status_id || 'No asignado'}</Descriptions.Item>
      </Descriptions>

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