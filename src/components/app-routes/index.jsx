import React from 'react';
import { Route, Routes } from 'react-router-dom';
import OrdersInventoriesPage from '../../pages/orders-inventories';
import NewOrderPage from '../../pages/new-order';
import UsersPage from '../../pages/users';
import AppointmentsPage from '../../pages/appointments';
import OrdersPage from '../../pages/orders';
import NewAppointmentPage from '../../pages/new-appoinment';

const AppRoutes = () => (
  <Routes>
    {/* Rutas existentes */}
    <Route path="/orders-inventories" element={<OrdersInventoriesPage />} />
    <Route path="/new-order" element={<NewOrderPage />} />
    {/* Rutas corregidas */}
    <Route path="/users" element={<UsersPage />} />
    <Route path="/appointments" element={<AppointmentsPage />} />
    <Route path="/orders" element={<OrdersPage />} />
    <Route path="/new-appointment" element={<NewAppointmentPage />} />
  </Routes>
);

export default AppRoutes;