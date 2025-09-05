import { Routes, Route } from "react-router-dom";
import OrdersPage from "../../pages/orders/index.jsx";
import UsersPage from "../../pages/users/index.jsx";
import AppointmentsPage from "../../pages/appointments/index.jsx";


function AppRoutes() {
    return (
        <Routes>
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
        </Routes>
    )
}

export default AppRoutes;