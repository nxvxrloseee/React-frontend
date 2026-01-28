import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => (
    <div style={styles.container}>
        <Sidebar />
        <main style={styles.content}>
            {children || <Outlet />}
        </main>
    </div>
);

const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#ecf0f1',
    },
    content: {
        marginLeft: '240px', // Ширина sidebar из Sidebar.jsx
        flex: 1,
        padding: '30px',
        width: 'calc(100% - 240px)',
        boxSizing: 'border-box',
    }
};

export default MainLayout;