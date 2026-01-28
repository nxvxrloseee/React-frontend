import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Trainers from './pages/Trainers';
import Halls from './pages/Halls';
import MembershipTypes from './pages/MembershipTypes';
import Schedule from './pages/Schedule';
import Payments from './pages/Payments';
import Reports from './pages/Reports';

// Компонент для защиты роутов
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh' 
            }}>
                <p>Загрузка...</p>
            </div>
        );
    }
    
    if (!user) return <Navigate to="/login" />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    return children;
};

// Layout wrapper для всех защищенных страниц
const ProtectedLayout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh' 
            }}>
                <p>Загрузка...</p>
            </div>
        );
    }
    
    if (!user) return <Navigate to="/login" />;

    return (
        <MainLayout>
            <Outlet />
        </MainLayout>
    );
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedLayout />}>
                <Route index element={<Dashboard />} />
                
                <Route 
                    path="clients" 
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'manager', 'trainer']}>
                            <Clients />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="trainers" 
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'manager', 'trainer']}>
                            <Trainers />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="halls" 
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'manager', 'trainer']}>
                            <Halls />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="membership-types" 
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'manager', 'trainer']}>
                            <MembershipTypes />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="schedule" 
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'manager', 'trainer']}>
                            <Schedule />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="payments" 
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'manager']}>
                            <Payments />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="reports" 
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'manager']}>
                            <Reports />
                        </ProtectedRoute>
                    } 
                />
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;