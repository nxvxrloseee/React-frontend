import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Функция для безопасного извлечения данных из JWT
    const decodeToken = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error("Failed to decode token", error);
            return null;
        }
    };

    useEffect(() => {
        const initAuth = () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                const payload = decodeToken(token);
                if (payload) {
                    // Проверяем срок действия токена
                    const now = Date.now() / 1000;
                    if (payload.exp && payload.exp < now) {
                        // Токен истёк
                        logout();
                        setLoading(false);
                        return;
                    }

                    const detectedRole = payload.role || payload.groups?.[0] || payload.user_role || 'guest';
                    
                    setUser({
                        id: payload.user_id,
                        username: payload.username,
                        role: detectedRole.toLowerCase(),
                        trainer: payload.trainer_id || null, // ID связанного тренера
                    });
                } else {
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        try {
            const response = await authApi.login(credentials);
            const payload = decodeToken(response.data.access);
            
            const userData = {
                id: payload.user_id,
                username: payload.username,
                role: (payload.role || 'guest').toLowerCase(),
                trainer: payload.trainer_id || null,
            };

            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return { 
                success: false, 
                error: error.response?.data?.detail || "Неверный логин или пароль" 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};