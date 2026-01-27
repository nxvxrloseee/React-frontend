import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();

    // Для диагностики: посмотрите в консоль F12, что именно там написано
    console.log("Текущая роль пользователя:", user?.role);

    const menuItems = [
        { 
            path: '/', 
            label: 'Главная', 
            icon: '🏠', 
            roles: ['admin', 'manager', 'trainer', 'staff'] // добавил staff на всякий случай
        },
        { 
            path: '/clients', 
            label: 'Клиенты', 
            icon: '👥', 
            roles: ['admin', 'manager', 'trainer', 'staff'] 
        },
        { 
            path: '/schedule', 
            label: 'Расписание', 
            icon: '📅', 
            roles: ['admin', 'manager', 'trainer', 'staff'] 
        },
        { 
            path: '/payments', 
            label: 'Платежи', 
            icon: '💰', 
            roles: ['admin', 'manager', 'staff'] 
        },
        { 
            path: '/reports', 
            label: 'Отчеты', 
            icon: '📊', 
            roles: ['manager', 'admin'] 
        },
    ];

    // Если user.role пустой или не совпадает, покажем всё (для теста), 
    // либо отфильтруем аккуратно:
    const userRole = user?.role?.toLowerCase() || 'guest';
    
    const visibleItems = menuItems.filter(item => 
        item.roles.includes(userRole) || userRole === 'admin' // Админу видно всё всегда
    );

    return (
        <aside style={styles.sidebar}>
            <div style={styles.logo}>
                <h2 style={{ color: '#27ae60', margin: 0 }}>FitnessLife</h2>
                <div style={styles.roleBadge}>{userRole.toUpperCase()}</div>
            </div>

            <nav style={styles.nav}>
                {visibleItems.length > 0 ? (
                    visibleItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                ...styles.link,
                                backgroundColor: isActive ? '#34495e' : 'transparent',
                                color: isActive ? '#27ae60' : '#ecf0f1'
                            })}
                        >
                            <span style={{ marginRight: '10px' }}>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))
                ) : (
                    <p style={{padding: '20px', fontSize: '12px', color: '#e74c3c'}}>
                        Доступ запрещен. Обратитесь к админу.
                    </p>
                )}
            </nav>

            <button onClick={logout} style={styles.logoutBtn}>
                🚪 Выйти
            </button>
        </aside>
    );
};

const styles = {
    sidebar: { width: '240px', height: '100vh', backgroundColor: '#2c3e50', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0 },
    logo: { padding: '30px 20px', textAlign: 'center', borderBottom: '1px solid #34495e' },
    roleBadge: { fontSize: '10px', background: '#34495e', padding: '2px 8px', borderRadius: '10px', marginTop: '5px', display: 'inline-block' },
    nav: { flex: 1, padding: '20px 0' },
    link: { display: 'flex', alignItems: 'center', padding: '15px 20px', textDecoration: 'none', transition: '0.3s' },
    logoutBtn: { padding: '20px', backgroundColor: '#c0392b', color: 'white', border: 'none', cursor: 'pointer' }
};

export default Sidebar;