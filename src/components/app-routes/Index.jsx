import { Routes, Route } from "react-router-dom";
import OrdersPage from "../../pages/orders";
import UsersPage from "../../pages/users";
import AppointmentsPage from "../../pages/appointments";


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