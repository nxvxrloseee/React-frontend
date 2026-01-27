import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{ marginLeft: '250px', flex: 1, padding: '30px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;