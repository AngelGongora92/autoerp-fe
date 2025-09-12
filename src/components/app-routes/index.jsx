import { Routes, Route } from "react-router-dom";
import OrdersPage from "../../pages/orders/index.jsx";
import UsersPage from "../../pages/users/index.jsx";
import AppointmentsPage from "../../pages/appointments/index.jsx";
import NewOrderPage from "../../pages/new-order/index.jsx";


function AppRoutes() {
    return (
        <Routes>
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/new-order" element={<NewOrderPage />} />
        </Routes>
    )
}

export default AppRoutes;