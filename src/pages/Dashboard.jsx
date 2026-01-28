import { useState, useEffect } from 'react';
import { clientApi, trainingApi, paymentApi } from '../api/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import '../assets/css/App.css';

const Dashboard = () => {
    const { user } = useAuth();
    
    // Состояния для статистики
    const [stats, setStats] = useState({
        totalClients: 0,
        activeClients: 0,
        todayTrainings: 0,
        weekTrainings: 0,
        monthRevenue: 0,
        todayRevenue: 0,
        activeTrainers: 0,
    });
    
    const [loading, setLoading] = useState(true);
    
    // Модальное окно для быстрой регистрации
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ 
        name: '', 
        surname: '', 
        phone: '', 
        email: '',
        birth_date: '' 
    });
    const [status, setStatus] = useState({ type: '', msg: '' });

    // Загрузка статистики
    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        setLoading(true);
        try {
            const [clientsRes, trainingsRes, paymentsRes] = await Promise.all([
                clientApi.getAll(),
                trainingApi.getAll(),
                paymentApi.getAll()
            ]);

            const clients = clientsRes.data || [];
            const trainings = trainingsRes.data || [];
            const payments = paymentsRes.data || [];

            // Подсчет статистики
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            // Тренировки сегодня
            const todayTrainings = trainings.filter(t => 
                t.date_time && t.date_time.startsWith(today)
            ).length;

            // Тренировки за неделю
            const weekTrainings = trainings.filter(t => {
                const trainingDate = new Date(t.date_time);
                return trainingDate >= weekAgo && trainingDate <= now;
            }).length;

            // Выручка за месяц
            const monthRevenue = payments
                .filter(p => new Date(p.payment_date) >= monthStart)
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

            // Выручка за сегодня
            const todayRevenue = payments
                .filter(p => p.payment_date && p.payment_date.startsWith(today))
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

            setStats({
                totalClients: clients.length,
                activeClients: clients.filter(c => c.is_active !== false).length,
                todayTrainings,
                weekTrainings,
                monthRevenue: Math.round(monthRevenue),
                todayRevenue: Math.round(todayRevenue),
            });
        } catch (error) {
            console.error("Ошибка загрузки статистики:", error);
        } finally {
            setLoading(false);
        }
    };

    // Регистрация нового клиента
    const handleRegister = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });

        try {
            await clientApi.create(formData);
            
            setStatus({ type: 'success', msg: 'Клиент успешно зарегистрирован!' });
            loadDashboardStats(); // Обновляем статистику
            setFormData({ name: '', surname: '', phone: '', email: '', birth_date: '' });
            
            setTimeout(() => {
                setModalOpen(false);
                setStatus({ type: '', msg: '' });
            }, 1500);

        } catch (error) {
            const errorText = error.response?.data?.phone 
                ? 'Этот номер телефона уже занят' 
                : error.response?.data?.detail || 'Ошибка при сохранении данных';
            setStatus({ type: 'error', msg: errorText });
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>Загрузка данных...</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1>Обзор системы</h1>
                    <p style={{ color: '#7f8c8d', margin: '5px 0' }}>
                        Добро пожаловать, {user?.username} ({user?.role})
                    </p>
                </div>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button className="btn-primary" onClick={() => setModalOpen(true)}>
                        + Новый клиент
                    </button>
                )}
            </div>

            {/* Основная статистика */}
            <div className="grid-container">
                <div className="info-card">
                    <h3>👥 Всего клиентов</h3>
                    <p style={{ fontSize: '36px', color: 'var(--primary-bg)', margin: '10px 0', fontWeight: 'bold' }}>
                        {stats.totalClients}
                    </p>
                    <p style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        Активных: {stats.activeClients}
                    </p>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <Link to="/clients" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
                            Перейти к списку →
                        </Link>
                    )}
                </div>

                <div className="info-card">
                    <h3>📅 Тренировки сегодня</h3>
                    <p style={{ fontSize: '36px', color: '#3498db', margin: '10px 0', fontWeight: 'bold' }}>
                        {stats.todayTrainings}
                    </p>
                    <p style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        За неделю: {stats.weekTrainings}
                    </p>
                    <Link to="/schedule" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
                        Смотреть расписание →
                    </Link>
                </div>

                <div className="info-card">
                    <h3>💰 Выручка (месяц)</h3>
                    <p style={{ fontSize: '36px', color: 'var(--accent-color)', margin: '10px 0', fontWeight: 'bold' }}>
                        {stats.monthRevenue.toLocaleString()} ₽
                    </p>
                    <p style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        Сегодня: {stats.todayRevenue.toLocaleString()} ₽
                    </p>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <Link to="/payments" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
                            История платежей →
                        </Link>
                    )}
                </div>
            </div>

            {/* Дополнительные виджеты для админа/менеджера */}
            {(user?.role === 'admin' || user?.role === 'manager') && (
                <div style={{ marginTop: '30px' }}>
                    <h2 style={{ marginBottom: '15px' }}>Быстрые действия</h2>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <Link to="/schedule" style={{ textDecoration: 'none' }}>
                            <button className="btn-primary" style={{ padding: '15px 25px' }}>
                                📋 Создать занятие
                            </button>
                        </Link>
                        <Link to="/payments" style={{ textDecoration: 'none' }}>
                            <button className="btn-primary" style={{ padding: '15px 25px', backgroundColor: '#3498db' }}>
                                💳 Зарегистрировать платеж
                            </button>
                        </Link>
                        <Link to="/reports" style={{ textDecoration: 'none' }}>
                            <button className="btn-primary" style={{ padding: '15px 25px', backgroundColor: '#9b59b6' }}>
                                📊 Сформировать отчет
                            </button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Модальное окно регистрации клиента */}
            {isModalOpen && (
                <Modal title="Регистрация клиента" onClose={() => setModalOpen(false)}>
                    <p style={{ color: '#7f8c8d', marginBottom: '20px', fontSize: '14px' }}>
                        Введите данные для создания учетной записи
                    </p>
                    
                    {status.msg && (
                        <div style={{ 
                            padding: '10px', 
                            marginBottom: '15px', 
                            borderRadius: '4px',
                            backgroundColor: status.type === 'error' ? '#fadbd8' : '#d4efdf',
                            color: status.type === 'error' ? '#c0392b' : '#1e8449'
                        }}>
                            {status.msg}
                        </div>
                    )}

                    <form onSubmit={handleRegister}>
                        <input 
                            className="form-input" 
                            placeholder="Фамилия *" 
                            value={formData.surname}
                            onChange={e => setFormData({...formData, surname: e.target.value})}
                            required 
                        />
                        <input 
                            className="form-input" 
                            placeholder="Имя *" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            required 
                        />
                        <input 
                            className="form-input" 
                            type="date"
                            placeholder="Дата рождения *" 
                            value={formData.birth_date}
                            onChange={e => setFormData({...formData, birth_date: e.target.value})}
                            required 
                        />
                        <input 
                            className="form-input" 
                            placeholder="Телефон (79xxxxxxxxx) *" 
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            required 
                        />
                        <input 
                            className="form-input" 
                            type="email"
                            placeholder="Email (необязательно)" 
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                                Сохранить
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setModalOpen(false)} 
                                style={{ flex: 1, padding: '12px', background: '#ecf0f1', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Dashboard;