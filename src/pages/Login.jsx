import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
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
            } else {
                setError(result.error || 'Неверный логин или пароль');
            }
        } catch (err) {
            console.error(err);
            setError('Ошибка соединения с сервером');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formWrapper}>
                {/* Логотип */}
                <div style={styles.logoSection}>
                    <div style={styles.logoIcon}>🏃</div>
                    <h1 style={styles.logoText}>Фитнес-Лайф</h1>
                </div>

                {/* Форма */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h2 style={styles.title}>Вход в систему</h2>
                    <p style={styles.subtitle}>
                        Введите учётные данные для доступа к панели управления
                    </p>

                    {error && (
                        <div style={styles.errorBox}>
                            <span style={styles.errorIcon}>⚠️</span>
                            {error}
                        </div>
                    )}

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Логин</label>
                        <input
                            type="text"
                            value={credentials.username}
                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                            style={styles.input}
                            placeholder="Введите логин"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Пароль</label>
                        <div style={styles.passwordWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                style={styles.input}
                                placeholder="Введите пароль"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={() => setShowPassword(!showPassword)}
                                style={styles.checkbox}
                            />
                            Показать пароль
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            ...styles.submitBtn,
                            opacity: isLoading ? 0.7 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isLoading ? (
                            <>
                                <span style={styles.spinner}></span>
                                Вход...
                            </>
                        ) : (
                            'Войти'
                        )}
                    </button>
                </form>

                {/* Подсказка для тестирования */}
                <div style={styles.hint}>
                    <p style={styles.hintTitle}>Тестовые учётные записи:</p>
                    <div style={styles.hintGrid}>
                        <div style={styles.hintItem}>
                            <span style={styles.hintRole}>👑 Админ:</span>
                            <code>admin / admin123</code>
                        </div>
                        <div style={styles.hintItem}>
                            <span style={styles.hintRole}>💼 Руководитель:</span>
                            <code>manager / manager123</code>
                        </div>
                        <div style={styles.hintItem}>
                            <span style={styles.hintRole}>🏋️ Тренер:</span>
                            <code>trainer / trainer123</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
    },
    formWrapper: {
        width: '100%',
        maxWidth: '420px',
    },
    logoSection: {
        textAlign: 'center',
        marginBottom: '24px',
    },
    logoIcon: {
        fontSize: '48px',
        marginBottom: '8px',
    },
    logoText: {
        color: 'white',
        fontSize: '28px',
        fontWeight: '700',
        margin: 0,
        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    form: {
        background: 'white',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    title: {
        margin: '0 0 8px',
        fontSize: '24px',
        fontWeight: '700',
        color: '#2c3e50',
        textAlign: 'center',
    },
    subtitle: {
        margin: '0 0 24px',
        fontSize: '14px',
        color: '#7f8c8d',
        textAlign: 'center',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        border: '1px solid rgba(231, 76, 60, 0.3)',
        borderRadius: '8px',
        color: '#c0392b',
        fontSize: '14px',
        marginBottom: '20px',
    },
    errorIcon: {
        fontSize: '16px',
    },
    inputGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#2c3e50',
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        fontSize: '15px',
        border: '2px solid #e0e4e8',
        borderRadius: '10px',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
    },
    passwordWrapper: {
        position: 'relative',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '10px',
        fontSize: '13px',
        color: '#7f8c8d',
        cursor: 'pointer',
    },
    checkbox: {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
    },
    submitBtn: {
        width: '100%',
        padding: '14px',
        fontSize: '16px',
        fontWeight: '600',
        color: 'white',
        background: 'linear-gradient(135deg, #4169E1 0%, #3457b2 100%)',
        border: 'none',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    spinner: {
        width: '18px',
        height: '18px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    hint: {
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
    },
    hintTitle: {
        margin: '0 0 12px',
        fontSize: '13px',
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    hintGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    hintItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.8)',
    },
    hintRole: {
        fontWeight: '500',
    },
};

// Добавляем keyframes через style tag
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    input:focus {
        border-color: #4169E1 !important;
        box-shadow: 0 0 0 4px rgba(65, 105, 225, 0.15) !important;
    }
`;
document.head.appendChild(styleSheet);

export default Login;