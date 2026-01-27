import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ 
                flex: 1, 
                marginLeft: '240px', // Ширина сайдбара
                padding: '20px', 
                backgroundColor: '#f4f7f6' 
            }}>
                {/* БЕЗ ЭТОГО ТЕГА СТРАНИЦЫ НЕ ПОЯВЯТСЯ */}
                <Outlet /> 
            </main>
        </div>
    );
};

export default MainLayout;