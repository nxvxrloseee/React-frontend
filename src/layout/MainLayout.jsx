import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '24px', background: '#ecf0f1' }}>
            {children}
        </main>
    </div>
);

export default MainLayout;
