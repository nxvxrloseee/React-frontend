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

    return (
        <aside style={styles.sidebar}>
            <div style={styles.logo}>
                <h2 style={styles.logoText}>FitnessLife</h2>
                <div style={styles.roleBadge}>
                    {userRole === 'admin' && '👑 ADMIN'}
                    {userRole === 'manager' && '💼 MANAGER'}
                    {userRole === 'trainer' && '🏋️ TRAINER'}
                    {userRole === 'guest' && '👤 GUEST'}
                </div>
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
                                color: isActive ? '#27ae60' : '#ecf0f1',
                                borderLeft: isActive ? '4px solid #27ae60' : '4px solid transparent',
                            })}
                        >
                            <span style={{ marginRight: '12px', fontSize: '18px' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))
                ) : (
                    <div style={styles.noAccess}>
                        <p style={styles.noAccessText}>
                            ⚠️ Доступ запрещен
                        </p>
                        <p style={styles.noAccessSubtext}>
                            Обратитесь к администратору
                        </p>
                    </div>
                )}
            </nav>

            <div style={styles.footer}>
                {user && (
                    <div style={styles.userInfo}>
                        <div style={styles.userName}>{user.username}</div>
                        <div style={styles.userRole}>{userRole}</div>
                    </div>
                )}
                <button onClick={handleLogout} style={styles.logoutBtn}>
                    🚪 Выйти
                </button>
            </div>
        </aside>
    );
};

const styles = {
    sidebar: { 
        width: '240px', 
        height: '100vh', 
        backgroundColor: '#2c3e50', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'fixed', 
        left: 0, 
        top: 0,
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        zIndex: 100,
    },
    logo: { 
        padding: '25px 20px', 
        textAlign: 'center', 
        borderBottom: '1px solid #34495e',
        backgroundColor: '#243342',
    },
    logoText: {
        color: '#27ae60',
        margin: '0 0 10px 0',
        fontSize: '24px',
        fontWeight: 'bold',
    },
    roleBadge: { 
        fontSize: '11px', 
        background: '#34495e', 
        color: '#ecf0f1',
        padding: '5px 10px', 
        borderRadius: '12px', 
        display: 'inline-block',
        fontWeight: '600',
        letterSpacing: '0.5px',
    },
    nav: { 
        flex: 1, 
        padding: '10px 0',
        overflowY: 'auto',
    },
    link: { 
        display: 'flex', 
        alignItems: 'center', 
        padding: '14px 20px', 
        textDecoration: 'none', 
        transition: 'all 0.3s',
        fontSize: '15px',
        fontWeight: '500',
    },
    noAccess: {
        padding: '20px',
        textAlign: 'center',
    },
    noAccessText: {
        color: '#e74c3c',
        fontSize: '14px',
        margin: '0 0 5px 0',
        fontWeight: 'bold',
    },
    noAccessSubtext: {
        color: '#95a5a6',
        fontSize: '12px',
        margin: 0,
    },
    footer: {
        borderTop: '1px solid #34495e',
        padding: '15px',
    },
    userInfo: {
        marginBottom: '10px',
        padding: '10px',
        backgroundColor: '#34495e',
        borderRadius: '6px',
        textAlign: 'center',
    },
    userName: {
        color: '#ecf0f1',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '3px',
    },
    userRole: {
        color: '#95a5a6',
        fontSize: '11px',
        textTransform: 'uppercase',
    },
    logoutBtn: { 
        width: '100%',
        padding: '12px', 
        backgroundColor: '#c0392b', 
        color: 'white', 
        border: 'none', 
        cursor: 'pointer',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'background 0.3s',
    },
};

export default Sidebar;