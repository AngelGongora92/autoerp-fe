import { Routes, Route } from "react-router-dom";
import OrdersPage from "../../pages/orders/Index.jsx";
import UsersPage from "../../pages/users/Index.jsx";
import AppointmentsPage from "../../pages/appointments/Index.jsx";


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