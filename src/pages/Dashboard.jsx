const Dashboard = () => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px' }}>
                <h3>Сегодня ожидается</h3>
                <p style={{ fontSize: '24px', color: '#27ae60' }}>12 тренировок</p>
            </div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px' }}>
                <h3>Новых клиентов за неделю</h3>
                <p style={{ fontSize: '24px', color: '#3498db' }}>+28 человек</p>
            </div>
        </div>
    );
};