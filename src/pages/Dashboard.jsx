import { useState, useEffect } from 'react';
import { clientApi, trainingApi } from '../api/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    // Состояния для статистики
    const [stats, setStats] = useState({ clients: 0, trainings: 0, revenue: 0 });
    
    // Состояния для Модального окна (Регистрация)
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ surname: '', name: '', phone: '', email: '' });
    const [status, setStatus] = useState({ type: '', msg: '' });

    // Загрузка статистики при входе
    useEffect(() => {
        const fetchData = async () => {
            try {
                // В реальном проекте лучше сделать отдельный эндпоинт /api/stats/
                // Здесь мы просто считаем количество записей
                const clientsRes = await clientApi.getAll();
                const trainingsRes = await trainingApi.getSchedule(); // Предполагаем, что такой метод есть
                
                setStats({
                    clients: clientsRes.data.length,
                    trainings: trainingsRes.data.length,
                    revenue: 150000 // Заглушка или запрос к reports/revenue
                });
            } catch (error) {
                console.error("Ошибка загрузки данных дашборда", error);
            }
        };
        fetchData();
    }, []);

    // --- ЛОГИКА РЕГИСТРАЦИИ (ТОТ САМЫЙ ЭНДПОИНТ) ---
    const handleRegister = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });

        try {
            // Отправляем POST запрос на Django
            await clientApi.create(formData);
            
            setStatus({ type: 'success', msg: 'Клиент успешно зарегистрирован!' });
            setStats(prev => ({ ...prev, clients: prev.clients + 1 })); // Обновляем счетчик
            setFormData({ surname: '', name: '', phone: '', email: '' }); // Очистка
            
            // Закрываем окно через 1.5 секунды
            setTimeout(() => {
                setModalOpen(false);
                setStatus({ type: '', msg: '' });
            }, 1500);

        } catch (error) {
            // Обработка ошибок валидации (например, дубль телефона)
            const errorText = error.response?.data?.phone 
                ? 'Этот номер телефона уже занят' 
                : 'Ошибка при сохранении данных';
            setStatus({ type: 'error', msg: errorText });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Обзор системы</h1>
                {/* Кнопка быстрого действия */}
                <button className="btn-primary" onClick={() => setModalOpen(true)}>
                    + Новый клиент
                </button>
            </div>

            {/* Карточки статистики */}
            <div className="grid-container">
                <div className="info-card">
                    <h3>Всего клиентов</h3>
                    <p style={{ fontSize: '32px', color: 'var(--primary-bg)', margin: '10px 0' }}>{stats.clients}</p>
                    <Link to="/clients" style={{ color: 'var(--accent-color)' }}>Перейти к списку →</Link>
                </div>
                <div className="info-card">
                    <h3>Тренировок сегодня</h3>
                    <p style={{ fontSize: '32px', color: 'var(--primary-bg)', margin: '10px 0' }}>{stats.trainings}</p>
                    <Link to="/schedule" style={{ color: 'var(--accent-color)' }}>Смотреть расписание →</Link>
                </div>
                <div className="info-card">
                    <h3>Выручка (мес)</h3>
                    <p style={{ fontSize: '32px', color: 'var(--accent-color)', margin: '10px 0' }}>{stats.revenue.toLocaleString()} ₽</p>
                    <span style={{ fontSize: '0.9em', color: '#7f8c8d' }}>Обновлено только что</span>
                </div>
            </div>

            {/* --- МОДАЛЬНОЕ ОКНО РЕГИСТРАЦИИ --- */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Регистрация клиента</h2>
                        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Введите данные для создания учетной записи</p>
                        
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
                                placeholder="Фамилия" 
                                value={formData.surname}
                                onChange={e => setFormData({...formData, surname: e.target.value})}
                                required 
                            />
                            <input 
                                className="form-input" 
                                placeholder="Имя" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required 
                            />
                            <input 
                                className="form-input" 
                                placeholder="Телефон (79xxxxxxxxx)" 
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
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Сохранить</button>
                                <button 
                                    type="button" 
                                    onClick={() => setModalOpen(false)} 
                                    style={{ flex: 1, padding: '12px', background: '#ecf0f1', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;