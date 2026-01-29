import { useState, useEffect } from 'react';
import { paymentApi, clientApi, membershipTypeApi } from '../api/api';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const Payments = () => {
    const { can, isAdmin, isManager } = usePermissions();
    
    const [payments, setPayments] = useState([]);
    const [clients, setClients] = useState([]);
    const [membershipTypes, setMembershipTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
    });
    const [methodFilter, setMethodFilter] = useState('all');
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        client: '',
        amount: '',
        payment_method: 'Cash',
        membership_type: '',
        comment: '',
    });

    // Статистика
    const [stats, setStats] = useState({
        total: 0,
        cash: 0,
        card: 0,
        count: 0,
    });

    useEffect(() => { 
        loadData(); 
    }, []);

    useEffect(() => {
        calculateStats();
    }, [payments, dateFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [paymentsRes, clientsRes, typesRes] = await Promise.all([
                paymentApi.getAll(),
                clientApi.getAll(),
                membershipTypeApi.getAll().catch(() => ({ data: [] })),
            ]);
            setPayments(paymentsRes.data || []);
            setClients(clientsRes.data || []);
            setMembershipTypes(typesRes.data || []);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        const filtered = payments.filter(p => {
            const date = p.payment_date?.split('T')[0];
            return date >= dateFilter.from && date <= dateFilter.to;
        });

        const total = filtered.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const cash = filtered.filter(p => p.payment_method === 'Cash')
                            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const card = filtered.filter(p => p.payment_method === 'Card')
                            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        setStats({
            total,
            cash,
            card,
            count: filtered.length,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await paymentApi.create({
                ...formData,
                payment_date: new Date().toISOString(),
            });
            setModalOpen(false);
            setFormData({
                client: '',
                amount: '',
                payment_method: 'Cash',
                membership_type: '',
                comment: '',
            });
            loadData();
        } catch (error) {
            alert('Ошибка создания платежа: ' + (error.response?.data?.detail || 'Проверьте данные'));
        }
    };

    // Фильтрация платежей
    const filteredPayments = payments.filter(payment => {
        const client = clients.find(c => c.id === payment.client);
        const clientName = client ? `${client.surname} ${client.name}`.toLowerCase() : '';
        
        const matchesSearch = clientName.includes(searchTerm.toLowerCase()) ||
                             payment.amount?.toString().includes(searchTerm);
        
        const date = payment.payment_date?.split('T')[0];
        const matchesDate = date >= dateFilter.from && date <= dateFilter.to;
        
        const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter;
        
        return matchesSearch && matchesDate && matchesMethod;
    }).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    const columns = [
        { 
            key: 'id', 
            label: '№',
            width: '60px',
        },
        { 
            key: 'payment_date', 
            label: 'Дата',
            render: (val) => new Date(val).toLocaleDateString('ru-RU'),
        },
        { 
            key: 'client', 
            label: 'Клиент',
            render: (val) => {
                const client = clients.find(c => c.id === val);
                return client ? (
                    <div>
                        <div style={{fontWeight: 600}}>{client.surname} {client.name}</div>
                        <div style={{fontSize: '12px', color: '#7f8c8d'}}>{client.phone}</div>
                    </div>
                ) : '—';
            }
        },
        { 
            key: 'amount', 
            label: 'Сумма',
            render: (val) => (
                <span style={{fontWeight: 700, color: '#27ae60'}}>
                    {parseFloat(val).toLocaleString()} ₽
                </span>
            )
        },
        { 
            key: 'payment_method', 
            label: 'Тип',
            render: (val) => (
                <span 
                    className="badge"
                    style={{
                        backgroundColor: val === 'Cash' ? '#d4efdf' : '#d6eaf8',
                        color: val === 'Cash' ? '#1e8449' : '#2471a3',
                    }}
                >
                    {val === 'Cash' ? '💵 Наличные' : '💳 Карта'}
                </span>
            )
        },
        { 
            key: 'comment', 
            label: 'Комментарий',
            render: (val) => val || <span style={{color: '#95a5a6'}}>—</span>
        },
    ];

    return (
        <div style={styles.container}>
            {/* Заголовок */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Платежи</h1>
                    <p style={styles.subtitle}>
                        История платежей и регистрация новых оплат
                    </p>
                </div>
                {can('payments', 'create') && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => setModalOpen(true)}
                    >
                        + Зарегистрировать платёж
                    </button>
                )}
            </div>

            {/* Статистика */}
            <div style={styles.statsGrid}>
                <div style={{...styles.statCard, borderLeftColor: '#27ae60'}}>
                    <div style={styles.statIcon}>💰</div>
                    <div>
                        <div style={styles.statLabel}>Общая сумма</div>
                        <div style={styles.statValue}>{stats.total.toLocaleString()} ₽</div>
                    </div>
                </div>
                <div style={{...styles.statCard, borderLeftColor: '#2ecc71'}}>
                    <div style={styles.statIcon}>💵</div>
                    <div>
                        <div style={styles.statLabel}>Наличные</div>
                        <div style={styles.statValue}>{stats.cash.toLocaleString()} ₽</div>
                    </div>
                </div>
                <div style={{...styles.statCard, borderLeftColor: '#3498db'}}>
                    <div style={styles.statIcon}>💳</div>
                    <div>
                        <div style={styles.statLabel}>Безналичные</div>
                        <div style={styles.statValue}>{stats.card.toLocaleString()} ₽</div>
                    </div>
                </div>
                <div style={{...styles.statCard, borderLeftColor: '#9b59b6'}}>
                    <div style={styles.statIcon}>📊</div>
                    <div>
                        <div style={styles.statLabel}>Кол-во операций</div>
                        <div style={styles.statValue}>{stats.count}</div>
                    </div>
                </div>
            </div>

            {/* Фильтры */}
            <div style={styles.filtersCard}>
                <div style={styles.filtersRow}>
                    <input
                        type="text"
                        placeholder="Поиск по клиенту или сумме..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                        style={{flex: 1, maxWidth: '300px'}}
                    />
                    
                    <div style={styles.dateFilters}>
                        <span style={styles.dateLabel}>С:</span>
                        <input
                            type="date"
                            value={dateFilter.from}
                            onChange={e => setDateFilter({...dateFilter, from: e.target.value})}
                            className="form-input"
                            style={{marginBottom: 0, width: 'auto'}}
                        />
                        <span style={styles.dateLabel}>По:</span>
                        <input
                            type="date"
                            value={dateFilter.to}
                            onChange={e => setDateFilter({...dateFilter, to: e.target.value})}
                            className="form-input"
                            style={{marginBottom: 0, width: 'auto'}}
                        />
                    </div>

                    <div style={styles.methodFilters}>
                        <button 
                            className={`filter-btn ${methodFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setMethodFilter('all')}
                        >
                            Все
                        </button>
                        <button 
                            className={`filter-btn ${methodFilter === 'Cash' ? 'active' : ''}`}
                            onClick={() => setMethodFilter('Cash')}
                        >
                            💵 Наличные
                        </button>
                        <button 
                            className={`filter-btn ${methodFilter === 'Card' ? 'active' : ''}`}
                            onClick={() => setMethodFilter('Card')}
                        >
                            💳 Карта
                        </button>
                    </div>
                </div>
            </div>

            {/* Таблица платежей */}
            {loading ? (
                <div style={styles.loading}>
                    <div className="spinner"></div>
                    <p>Загрузка платежей...</p>
                </div>
            ) : (
                <div className="card">
                    <Table
                        columns={columns}
                        data={filteredPayments}
                    />
                    {filteredPayments.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">💰</div>
                            <p className="empty-state-text">
                                {searchTerm || methodFilter !== 'all' 
                                    ? 'Платежи не найдены' 
                                    : 'История платежей пуста'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Модальное окно создания платежа */}
            {isModalOpen && (
                <Modal 
                    title="Новый платёж" 
                    onClose={() => setModalOpen(false)}
                >
                    <form onSubmit={handleSubmit}>
                        <div className="form-label">Клиент *</div>
                        <select
                            className="form-select"
                            value={formData.client}
                            onChange={e => setFormData({ ...formData, client: e.target.value })}
                            required
                        >
                            <option value="">-- Выберите клиента --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.surname} {c.name} ({c.phone})
                                </option>
                            ))}
                        </select>

                        <div className="form-label">Сумма (₽) *</div>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="0"
                            min="1"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />

                        <div className="form-label">Тип оплаты</div>
                        <div style={styles.paymentMethods}>
                            <label 
                                style={{
                                    ...styles.methodOption,
                                    borderColor: formData.payment_method === 'Cash' ? '#27ae60' : '#e0e4e8',
                                    backgroundColor: formData.payment_method === 'Cash' ? '#d4efdf' : 'white',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="payment_method"
                                    value="Cash"
                                    checked={formData.payment_method === 'Cash'}
                                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                                    style={{display: 'none'}}
                                />
                                <span style={styles.methodIcon}>💵</span>
                                <span>Наличные</span>
                            </label>
                            <label 
                                style={{
                                    ...styles.methodOption,
                                    borderColor: formData.payment_method === 'Card' ? '#3498db' : '#e0e4e8',
                                    backgroundColor: formData.payment_method === 'Card' ? '#d6eaf8' : 'white',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="payment_method"
                                    value="Card"
                                    checked={formData.payment_method === 'Card'}
                                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                                    style={{display: 'none'}}
                                />
                                <span style={styles.methodIcon}>💳</span>
                                <span>Банковская карта</span>
                            </label>
                        </div>

                        {membershipTypes.length > 0 && (
                            <>
                                <div className="form-label">Тип абонемента</div>
                                <select
                                    className="form-select"
                                    value={formData.membership_type}
                                    onChange={e => {
                                        const type = membershipTypes.find(t => t.id === parseInt(e.target.value));
                                        setFormData({ 
                                            ...formData, 
                                            membership_type: e.target.value,
                                            amount: type?.price || formData.amount,
                                        });
                                    }}
                                >
                                    <option value="">-- Без абонемента --</option>
                                    {membershipTypes.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} — {parseFloat(t.price).toLocaleString()} ₽
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}

                        <div className="form-label">Комментарий</div>
                        <textarea
                            className="form-input"
                            placeholder="Например: Оплата годового абонемента"
                            rows="3"
                            value={formData.comment}
                            onChange={e => setFormData({ ...formData, comment: e.target.value })}
                        />

                        <div style={styles.modalButtons}>
                            <button type="submit" className="btn btn-success" style={{flex: 1}}>
                                💰 Подтвердить оплату
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
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
    },
    statCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        borderLeft: '4px solid',
    },
    statIcon: {
        fontSize: '28px',
    },
    statLabel: {
        fontSize: '13px',
        color: '#7f8c8d',
    },
    statValue: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#2c3e50',
    },
    filtersCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    filtersRow: {
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    dateFilters: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    dateLabel: {
        fontSize: '14px',
        color: '#7f8c8d',
    },
    methodFilters: {
        display: 'flex',
        gap: '8px',
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        gap: '16px',
        color: '#7f8c8d',
    },
    paymentMethods: {
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
    },
    methodOption: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '16px',
        border: '2px solid',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontWeight: '600',
    },
    methodIcon: {
        fontSize: '20px',
    },
    modalButtons: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px',
    },
};

export default Payments;