import React from 'react';
import OrderInventoriesList from '../../components/order-inventories-list';
import { Typography } from 'antd';

const { Title } = Typography; // Mantener Title si se usa para el título principal de la página

function OrdersInventoriesPage() {
  return (
    <OrderInventoriesList />
  );
}

export default OrdersInventoriesPage;