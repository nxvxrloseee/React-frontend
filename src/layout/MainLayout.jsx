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
        backgroundColor: '#f5f7fa',
    },
    content: {
        marginLeft: '260px',
        flex: 1,
        padding: '30px',
        width: 'calc(100% - 260px)',
        boxSizing: 'border-box',
    }
};

export default MainLayout;