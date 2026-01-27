import { createContext, useState, useContext } from 'react';
import { authApi } from '../api/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('access_token');
        return token ? {loggedIn: true} : null;
    });

    const navigate = useNavigate();

    const login = async (credentials) => {
        try {
            const { data } = await authApi.login(credentials);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            setUser({ loggedIn: true });
            navigate('/'); // Переход на главную после входа
            console.log(data);
            return { success: true };
            
        } catch (error) {
            
            return { success: false, message: 'Неверный логин или пароль', error };
            
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);