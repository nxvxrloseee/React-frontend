import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MENU_ITEMS } from '../config/menu';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const userRole = (user && typeof user.role === 'string')
        ? user.role.toLowerCase()
        : 'guest';
    
    const visibleItems = MENU_ITEMS.filter(item => 
        item.roles.includes(userRole)
    );

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const getRoleBadge = () => {
        switch (userRole) {
            case 'admin': return { icon: '👑', text: 'Администратор', color: '#e74c3c' };
            case 'manager': return { icon: '💼', text: 'Руководитель', color: '#f39c12' };
            case 'trainer': return { icon: '🏋️', text: 'Тренер', color: '#3498db' };
            default: return { icon: '👤', text: 'Гость', color: '#95a5a6' };
        }
    };

    const roleBadge = getRoleBadge();

    return (
        <aside style={styles.sidebar}>
            {/* Логотип */}
            <div style={styles.logoSection}>
                <div style={styles.logoIcon}>🏃</div>
                <h1 style={styles.logoText}>Фитнес-Лайф</h1>
            </div>

            {/* Информация о пользователе */}
            <div style={styles.userSection}>
                <div style={styles.userAvatar}>
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div style={styles.userInfo}>
                    <div style={styles.userName}>{user?.username || 'Гость'}</div>
                    <div style={{
                        ...styles.userRole,
                        backgroundColor: roleBadge.color + '20',
                        color: roleBadge.color,
                    }}>
                        {roleBadge.icon} {roleBadge.text}
                    </div>
                </div>
            </div>

            {/* Навигация */}
            <nav style={styles.nav}>
                {visibleItems.length > 0 ? (
                    visibleItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                ...styles.navLink,
                                backgroundColor: isActive ? 'rgba(65, 105, 225, 0.15)' : 'transparent',
                                color: isActive ? '#4169E1' : '#b8c5d6',
                                borderLeft: isActive ? '3px solid #4169E1' : '3px solid transparent',
                            })}
                        >
                            <span style={styles.navIcon}>{item.icon}</span>
                            <span style={styles.navLabel}>{item.label}</span>
                        </NavLink>
                    ))
                ) : (
                    <div style={styles.noAccess}>
                        <p>⚠️ Нет доступных разделов</p>
                    </div>
                )}
            </nav>

            {/* Кнопка выхода */}
            <div style={styles.footer}>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                    <span>🚪</span>
                    <span>Выйти из системы</span>
                </button>
            </div>
        </aside>
    );
};

const styles = {
    sidebar: {
        width: '260px',
        height: '100vh',
        backgroundColor: '#1e2a38',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    },
    logoSection: {
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    logoIcon: {
        fontSize: '28px',
    },
    logoText: {
        color: '#ffffff',
        fontSize: '20px',
        fontWeight: '700',
        margin: 0,
    },
    userSection: {
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    userAvatar: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: '#4169E1',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '600',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: '600',
        marginBottom: '4px',
    },
    userRole: {
        fontSize: '11px',
        padding: '3px 8px',
        borderRadius: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: '500',
    },
    nav: {
        flex: 1,
        padding: '16px 0',
        overflowY: 'auto',
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        marginBottom: '2px',
    },
    navIcon: {
        fontSize: '18px',
        width: '24px',
        textAlign: 'center',
    },
    navLabel: {
        flex: 1,
    },
    noAccess: {
        padding: '20px',
        textAlign: 'center',
        color: '#7f8c8d',
        fontSize: '14px',
    },
    footer: {
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
    },
    logoutBtn: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px',
        backgroundColor: 'rgba(231, 76, 60, 0.15)',
        color: '#e74c3c',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
};

export default Sidebar;