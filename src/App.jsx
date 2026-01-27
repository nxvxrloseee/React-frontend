import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layout/MainLayout';

// Импорт страниц
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Schedule from './pages/Schedule';
import Payments from './pages/Payments';
import Reports from './pages/Reports';

// Импорт глобальных стилей
import './assets/css/index.css';
import './assets/css/App.css';

/**
 * Компонент для защиты роутов. 
 * Если пользователь не авторизован, отправляет на страницу логина.
 */
const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    
    // Пока статус загрузки не определен, можно вернуть пустой экран или спиннер
    if (user === undefined) return null; 
    
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Публичный маршрут */}
                    <Route path="/login" element={<Login />} />

                    {/* Защищенные маршруты внутри MainLayout */}
                    <Route path="/" element={
                        <PrivateRoute>
                            <MainLayout><Dashboard /></MainLayout>
                        </PrivateRoute>
                    } />

                    <Route path="/clients" element={
                        <PrivateRoute>
                            <MainLayout><Clients /></MainLayout>
                        </PrivateRoute>
                    } />

                    <Route path="/schedule" element={
                        <PrivateRoute>
                            <MainLayout><Schedule /></MainLayout>
                        </PrivateRoute>
                    } />

                    <Route path="/payments" element={
                        <PrivateRoute>
                            <MainLayout><Payments /></MainLayout>
                        </PrivateRoute>
                    } />

                    <Route path="/reports" element={
                        <PrivateRoute>
                            <MainLayout><Reports /></MainLayout>
                        </PrivateRoute>
                    } />

                    {/* Редирект со всех несуществующих страниц на главную */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;