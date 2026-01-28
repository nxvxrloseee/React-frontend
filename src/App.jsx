import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Schedule from './pages/Schedule'; // Убедись, что импорт есть
import Payments from './pages/Payments';
import Reports from './pages/Reports';   // Убедись, что импорт есть
import { useAuth } from './context/AuthContext';

// Компонент для защиты роутов
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Загрузка...</div>;
    if (!user) return <Navigate to="/login" />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    return children;
};


function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
                    <MainLayout />
            }>
                <Route index element={<Dashboard />} />
                <Route path="clients" element={<Clients />} />
                <Route path="schedule" element={<Schedule />} /> {/* Добавлено */}
                <Route path="payments" element={<Payments />} />
                <Route path="reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Reports /></ProtectedRoute>} />   {/* Добавлено */}
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;