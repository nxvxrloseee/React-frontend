import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(credentials);
            
            if (result.success) {
                navigate('/');
            } 
            else {
                setError(result.message)
            }
            
        } catch (err) {
            console.log(err);
            setError('Произошла ошибка соединения');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.title}>Фитнес-Лайф</h2>
                <p style={styles.subtitle}>Вход в систему управления</p>
                
                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}
                
                <input
                    type="text"
                    placeholder="Логин"
                    style={styles.input}
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    required
                    disabled={isLoading}
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    style={styles.input}
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
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
        </div>
    );
};

// Стили
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
    }
};

export default Login;