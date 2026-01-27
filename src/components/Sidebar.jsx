import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    

    const menuItems = [
        { path: '/', label: 'Главная', icon: '🏠', roles: ['admin', 'trainer', 'director'] },
        { path: '/clients', label: 'Клиенты', icon: '👥', roles: ['admin', 'trainer', 'director'] },
        { path: '/payments', label: 'Платежи', icon: '💰', roles: ['admin', 'director'] },
        { path: '/reports', label: 'Отчеты', icon: '📊', roles: ['director'] }, // Только директор!
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || 'admin'));

    return (
        <div style={styles.sidebar}>
            <div style={styles.logo}>Фитнес-Лайф</div>
            <nav style={styles.nav}>
                {filteredMenu.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{
                            ...styles.link,
                            backgroundColor: location.pathname === item.path ? '#34495e' : 'transparent'
                        }}
                    >
                        <span style={{ marginRight: '10px' }}>{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>
            <button onClick={logout} style={styles.logoutBtn}>Выйти</button>
        </div>
    );
};

const styles = {
    sidebar: { width: '250px', height: '100vh', backgroundColor: '#2c3e50', color: '#ecf0f1', display: 'flex', flexDirection: 'column', position: 'fixed' },
    logo: { padding: '20px', fontSize: '20px', fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #34495e' },
    nav: { flex: 1, paddingTop: '20px' },
    link: { display: 'block', padding: '15px 20px', color: '#ecf0f1', textDecoration: 'none', transition: '0.3s' },
    logoutBtn: { padding: '15px', background: '#e74c3c', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }
};

export default Sidebar;