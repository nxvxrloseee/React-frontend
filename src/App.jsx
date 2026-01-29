import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Trainers from './pages/Trainers';
import Schedule from './pages/Schedule';
import Payments from './pages/Payments';
import Memberships from './pages/Memberships';
import Halls from './pages/Halls';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Компонент для защиты роутов
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={styles.loading}>
                <div style={styles.spinner}></div>
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
            <div style={styles.loading}>
                <div style={styles.spinner}></div>
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
                    path="memberships" 
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'manager', 'trainer']}>
                            <Memberships />
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

                <Route 
                    path="halls" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Halls />
                        </ProtectedRoute>
                    } 
                />

                <Route 
                    path="settings" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Settings />
                        </ProtectedRoute>
                    } 
                />
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

const styles = {
    loading: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: '16px',
        color: '#7f8c8d',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #e0e4e8',
        borderTopColor: '#4169E1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
};

export default App;