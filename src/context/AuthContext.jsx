import { createContext, useState, useContext } from 'react';
import { authApi } from '../api/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('access_token');
        console.log('🔍 AuthProvider initialized, token exists:', !!token);
        return token ? {loggedIn: true} : null;
    });

    const navigate = useNavigate();

    const login = async (credentials) => {
        console.log('🔐 Login function called');
        console.log('📝 Credentials:', {
            username: credentials.username,
            hasPassword: !!credentials.password,
            passwordLength: credentials.password?.length,
        });

        try {
            console.log('📤 Calling authApi.login...');
            // fetch API возвращает { data, status, headers }
            const response = await authApi.login(credentials);
            
            console.log('✅ Login response received:', {
                status: response.status,
                hasData: !!response.data,
                hasAccess: !!response.data?.access,
                hasRefresh: !!response.data?.refresh,
            });

            if (response.data?.access) {
                console.log('💾 Saving tokens to localStorage...');
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
                
                console.log('✅ Tokens saved successfully');
                console.log('🔑 Access token (first 20 chars):', response.data.access.substring(0, 20) + '...');
                
                setUser({ loggedIn: true });
                console.log('👤 User state updated, navigating to /...');
                navigate('/');
                
                return { success: true };
            } else {
                console.error('❌ No access token in response!', response.data);
                return { success: false, message: 'Сервер не вернул токен доступа' };
            }
            
        } catch (error) {
            console.error('❌ Login failed with error:', {
                message: error.message,
                response: error.response,
                name: error.name,
            });

            // Более детальная обработка ошибок
            let errorMessage = 'Неверный логин или пароль';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Ошибка сети. Проверьте подключение к серверу.';
                console.error('🌐 Network error - backend might be down or CORS issue');
            } else if (error.response) {
                // Сервер ответил с ошибкой
                if (error.response.status === 401) {
                    errorMessage = 'Неверный логин или пароль';
                } else if (error.response.status === 500) {
                    errorMessage = 'Ошибка сервера. Попробуйте позже.';
                } else {
                    errorMessage = error.response.data?.detail || 'Ошибка входа';
                }
            }

            return { success: false, message: errorMessage, error };
        }
    };

    const logout = () => {
        console.log('🚪 Logout called');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        console.log('✅ User logged out, navigating to /login');
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);