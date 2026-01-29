import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { clientApi, trainingApi, paymentApi, membershipApi } from '../api/api';
import Modal from '../components/ui/Modal';

const Dashboard = () => {
    const { user } = useAuth();
    const { can, isAdmin, isManager, isTrainer } = usePermissions();
    
    const [stats, setStats] = useState({
        totalClients: 0,
        activeClients: 0,
        todayTrainings: 0,
        weekTrainings: 0,
        monthRevenue: 0,
        todayRevenue: 0,
        expiringMemberships: 0,
        newClientsToday: 0,
    });
    const [recentTrainings, setRecentTrainings] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        phone: '',
        email: '',
        birth_date: '',
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Загружаем данные параллельно
            const [clientsRes, trainingsRes, paymentsRes, membershipsRes] = await Promise.all([
                clientApi.getAll().catch(() => ({ data: [] })),
                trainingApi.getAll().catch(() => ({ data: [] })),
                can('payments', 'view') ? paymentApi.getAll().catch(() => ({ data: [] })) : { data: [] },
                membershipApi.getAll().catch(() => ({ data: [] })),
            ]);

            const clients = clientsRes.data || [];
            const trainings = trainingsRes.data || [];
            const payments = paymentsRes.data || [];
            const memberships = membershipsRes.data || [];

            // Фильтруем тренировки для тренера (только свои)
            let filteredTrainings = trainings;
            if (isTrainer && user?.trainer) {
                filteredTrainings = trainings.filter(t => t.trainer === user.trainer);
            }

            const today = new Date().toISOString().split('T')[0];
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Считаем статистику
            const todayTrainings = filteredTrainings.filter(t => 
                t.date_time?.startsWith(today)
            ).length;

            const weekTrainings = filteredTrainings.filter(t => 
                t.date_time >= weekAgo
            ).length;

            // Финансовая статистика (только для админа и менеджера)
            let monthRevenue = 0;
            let todayRevenue = 0;
            if (can('payments', 'view')) {
                const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                monthRevenue = payments
                    .filter(p => p.payment_date >= monthAgo)
                    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                todayRevenue = payments
                    .filter(p => p.payment_date?.startsWith(today))
                    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            }

            // Истекающие абонементы (в ближайшие 7 дней)
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const expiringMemberships = memberships.filter(m => 
                m.end_date >= today && m.end_date <= nextWeek && m.status === 'Активен'
            ).length;

            setStats({
                totalClients: clients.length,
                activeClients: clients.filter(c => c.is_active !== false).length,
                todayTrainings,
                weekTrainings,
                monthRevenue,
                todayRevenue,
                expiringMemberships,
                newClientsToday: clients.filter(c => c.registration_date === today).length,
            });

            // Ближайшие тренировки
            const upcomingTrainings = filteredTrainings
                .filter(t => t.date_time >= today && t.status === 'Запланирована')
                .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
                .slice(0, 5);
            setRecentTrainings(upcomingTrainings);

            // Уведомления
            const newAlerts = [];
            if (expiringMemberships > 0) {
                newAlerts.push({
                    type: 'warning',
                    icon: '⏳',
                    text: `${expiringMemberships} абонемент(ов) истекает в ближайшие 7 дней`,
                    link: '/memberships',
                });
            }
            if (todayTrainings > 0) {
                newAlerts.push({
                    type: 'info',
                    icon: '📅',
                    text: `Сегодня запланировано ${todayTrainings} занятий`,
                    link: '/schedule',
                });
            }
            setAlerts(newAlerts);

        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        try {
            await clientApi.create(formData);
            setModalOpen(false);
            setFormData({ name: '', surname: '', phone: '', email: '', birth_date: '' });
            loadDashboardData();
        } catch (error) {
            alert('Ошибка создания клиента: ' + (error.response?.data?.phone?.[0] || 'Проверьте данные'));
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Загрузка данных...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Заголовок */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Здравствуйте, {user?.username}!</h1>
                    <p style={styles.subtitle}>
                        {isAdmin && 'Панель администратора'}
                        {isManager && 'Панель руководителя'}
                        {isTrainer && 'Ваша панель тренера'}
                    </p>
                </div>
                {can('clients', 'create') && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => setModalOpen(true)}
                    >
                        + Создать клиента
                    </button>
                )}
            </div>

            {/* Уведомления */}
            {alerts.length > 0 && (
                <div style={styles.alertsSection}>
                    {alerts.map((alert, idx) => (
                        <Link 
                            key={idx} 
                            to={alert.link}
                            style={{
                                ...styles.alertItem,
                                backgroundColor: alert.type === 'warning' 
                                    ? 'rgba(243, 156, 18, 0.1)' 
                                    : 'rgba(65, 105, 225, 0.1)',
                                borderColor: alert.type === 'warning' 
                                    ? 'rgba(243, 156, 18, 0.3)' 
                                    : 'rgba(65, 105, 225, 0.3)',
                            }}
                        >
                            <span style={styles.alertIcon}>{alert.icon}</span>
                            <span>{alert.text}</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Сводка за день */}
            <div style={styles.sectionTitle}>Сводка за день</div>
            <div style={styles.statsGrid}>
                {/* Карточка клиентов */}
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>👥</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>Всего клиентов</div>
                        <div style={styles.statValue}>{stats.totalClients}</div>
                        <div style={styles.statExtra}>Активных: {stats.activeClients}</div>
                    </div>
                </div>

                {/* Карточка тренировок */}
                <div style={{...styles.statCard, borderLeftColor: '#3498db'}}>
                    <div style={styles.statIcon}>📅</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>
                            {isTrainer ? 'Ваши занятия сегодня' : 'Занятия сегодня'}
                        </div>
                        <div style={styles.statValue}>{stats.todayTrainings}</div>
                        <div style={styles.statExtra}>За неделю: {stats.weekTrainings}</div>
                    </div>
                </div>

                {/* Карточка истекающих абонементов */}
                <div style={{...styles.statCard, borderLeftColor: '#f39c12'}}>
                    <div style={styles.statIcon}>⏳</div>
                    <div style={styles.statContent}>
                        <div style={styles.statLabel}>Истекающие абонементы</div>
                        <div style={styles.statValue}>{stats.expiringMemberships}</div>
                        <div style={styles.statExtra}>В ближайшие 7 дней</div>
                    </div>
                </div>

                {/* Карточка выручки (только для админа и менеджера) */}
                {can('payments', 'view') && (
                    <div style={{...styles.statCard, borderLeftColor: '#27ae60'}}>
                        <div style={styles.statIcon}>💰</div>
                        <div style={styles.statContent}>
                            <div style={styles.statLabel}>Выручка (месяц)</div>
                            <div style={styles.statValue}>{stats.monthRevenue.toLocaleString()} ₽</div>
                            <div style={styles.statExtra}>Сегодня: {stats.todayRevenue.toLocaleString()} ₽</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Быстрые действия */}
            <div style={styles.sectionTitle}>Быстрые действия</div>
            <div style={styles.actionsGrid}>
                {can('clients', 'create') && (
                    <button 
                        style={styles.actionBtn}
                        onClick={() => setModalOpen(true)}
                    >
                        <span style={styles.actionIcon}>👤</span>
                        <span>Создать клиента</span>
                    </button>
                )}
                
                <Link to="/schedule" style={{...styles.actionBtn, textDecoration: 'none'}}>
                    <span style={styles.actionIcon}>📋</span>
                    <span>{isTrainer ? 'Моё расписание' : 'Создать занятие'}</span>
                </Link>

                {can('payments', 'create') && (
                    <Link to="/payments" style={{...styles.actionBtn, textDecoration: 'none', backgroundColor: '#3498db'}}>
                        <span style={styles.actionIcon}>💳</span>
                        <span>Зарегистрировать платёж</span>
                    </Link>
                )}

                {can('reports', 'financial') && (
                    <Link to="/reports" style={{...styles.actionBtn, textDecoration: 'none', backgroundColor: '#9b59b6'}}>
                        <span style={styles.actionIcon}>📊</span>
                        <span>Сформировать отчёт</span>
                    </Link>
                )}
            </div>

            {/* Ближайшие занятия */}
            {recentTrainings.length > 0 && (
                <>
                    <div style={styles.sectionTitle}>
                        {isTrainer ? 'Ваши ближайшие занятия' : 'Ближайшие занятия'}
                    </div>
                    <div style={styles.trainingsList}>
                        {recentTrainings.map(training => (
                            <div key={training.id} style={styles.trainingItem}>
                                <div style={styles.trainingTime}>
                                    {new Date(training.date_time).toLocaleString('ru-RU', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                                <div style={styles.trainingInfo}>
                                    <div style={styles.trainingType}>{training.type_name || 'Тренировка'}</div>
                                    <div style={styles.trainingMeta}>
                                        {training.hall_name} • {training.trainer_name}
                                    </div>
                                </div>
                                <div style={styles.trainingStatus}>
                                    <span className="badge badge-info">{training.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Модальное окно создания клиента */}
            {isModalOpen && (
                <Modal title="Создать клиента" onClose={() => setModalOpen(false)}>
                    <form onSubmit={handleCreateClient}>
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
                            placeholder="Телефон *"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            required
                        />
                        <input
                            className="form-input"
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                        
                        <div style={styles.modalButtons}>
                            <button type="submit" className="btn btn-primary" style={{flex: 1}}>
                                Создать
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-outline"
                                onClick={() => setModalOpen(false)}
                                style={{flex: 1}}
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

const styles = {
    container: {
        padding: '10px',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        gap: '16px',
        color: '#7f8c8d',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #e0e4e8',
        borderTopColor: '#4169E1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#2c3e50',
        margin: 0,
    },
    subtitle: {
        fontSize: '14px',
        color: '#7f8c8d',
        margin: '4px 0 0',
    },
    alertsSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '24px',
    },
    alertItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.2s',
    },
    alertIcon: {
        fontSize: '20px',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: '16px',
        marginTop: '32px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
    },
    statCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        borderLeft: '4px solid #4169E1',
    },
    statIcon: {
        fontSize: '32px',
    },
    statContent: {
        flex: 1,
    },
    statLabel: {
        fontSize: '13px',
        color: '#7f8c8d',
        marginBottom: '4px',
    },
    statValue: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#2c3e50',
    },
    statExtra: {
        fontSize: '12px',
        color: '#95a5a6',
        marginTop: '4px',
    },
    actionsGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
    },
    actionBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 24px',
        backgroundColor: '#4169E1',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    actionIcon: {
        fontSize: '18px',
    },
    trainingsList: {
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    trainingItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        borderBottom: '1px solid #f0f0f0',
    },
    trainingTime: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#4169E1',
        minWidth: '100px',
    },
    trainingInfo: {
        flex: 1,
    },
    trainingType: {
        fontWeight: '600',
        color: '#2c3e50',
    },
    trainingMeta: {
        fontSize: '13px',
        color: '#7f8c8d',
        marginTop: '2px',
    },
    trainingStatus: {},
    modalButtons: {
        display: 'flex',
        gap: '12px',
        marginTop: '20px',
    },
};

export default Dashboard;