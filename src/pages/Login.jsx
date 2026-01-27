import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('🎯 Form submitted!');
        console.log('📋 Form data:', {
            username: credentials.username,
            hasPassword: !!credentials.password,
            passwordLength: credentials.password?.length,
        });

        setError('');
        setIsLoading(true);
        
        console.log('⏳ Setting loading state to true...');

        try {
            console.log('🚀 Calling login function...');
            const result = await login(credentials);
            
            console.log('📬 Login result received:', result);

            if (!result.success) {
                console.log('❌ Login failed, setting error message:', result.message);
                setError(result.message);
            } else {
                console.log('✅ Login successful!');
            }
        } catch (err) {
            console.error('💥 Unexpected error in handleSubmit:', err);
            setError('Произошла неожиданная ошибка');
        } finally {
            setIsLoading(false);
            console.log('⏹️ Setting loading state to false');
        }
    };

    return (
        <div className="auth-container" style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.title}>Фитнес-Лайф</h2>
                <p style={styles.subtitle}>Вход в систему управления</p>
                
                {error && (
                    <div style={styles.error}>
                        {error}
                        <br />
                        <small style={{ fontSize: '12px', opacity: 0.8 }}>
                            (Откройте консоль браузера для деталей)
                        </small>
                    </div>
                )}
                
                <input
                    type="text"
                    placeholder="Логин"
                    style={styles.input}
                    value={credentials.username}
                    onChange={(e) => {
                        console.log('📝 Username changed:', e.target.value);
                        setCredentials({...credentials, username: e.target.value});
                    }}
                    required
                    disabled={isLoading}
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    style={styles.input}
                    value={credentials.password}
                    onChange={(e) => {
                        console.log('🔒 Password changed, length:', e.target.value.length);
                        setCredentials({...credentials, password: e.target.value});
                    }}
                    required
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    style={{
                        ...styles.button,
                        ...(isLoading ? styles.buttonDisabled : {})
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
            </form>

            {/* Информационная панель для отладки */}
            <div style={styles.debugPanel}>
                <h4>🔍 Информация для отладки</h4>
                <p>Откройте консоль браузера (F12) чтобы увидеть:</p>
                <ul style={{ textAlign: 'left', fontSize: '12px' }}>
                    <li>📤 Исходящие запросы</li>
                    <li>📥 Ответы от сервера</li>
                    <li>🔑 Информацию о токенах</li>
                    <li>❌ Детали ошибок</li>
                </ul>
            </div>
        </div>
    );
};

// Базовые стили
const styles = {
    container: { 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#f4f7f6',
        padding: '20px',
    },
    form: { 
        padding: '40px', 
        background: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
        width: '350px', 
        textAlign: 'center',
        marginBottom: '20px',
    },
    title: { 
        margin: '0 0 10px', 
        color: '#2c3e50', 
        fontWeight: 'bold' 
    },
    subtitle: { 
        color: '#7f8c8d', 
        marginBottom: '20px' 
    },
    input: { 
        width: '100%', 
        padding: '12px', 
        margin: '10px 0', 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        boxSizing: 'border-box' 
    },
    button: { 
        width: '100%', 
        padding: '12px', 
        background: '#27ae60', 
        color: '#fff', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer', 
        marginTop: '10px',
        transition: 'opacity 0.3s',
    },
    buttonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
    error: { 
        color: '#e74c3c', 
        marginBottom: '10px', 
        fontSize: '14px',
        padding: '10px',
        backgroundColor: '#fee',
        borderRadius: '4px',
    },
    debugPanel: {
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '350px',
        width: '100%',
        textAlign: 'center',
        fontSize: '14px',
        color: '#555',
    }
};

export default Login;