import { useEffect, useState } from 'react';
import { clientApi, membershipApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const Clients = () => {
    const { user } = useAuth();
    const { can, isAdmin, isTrainer } = usePermissions();
    
    const [clients, setClients] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        secondname: '',
        phone: '',
        email: '',
        birth_date: ''
    });

    useEffect(() => { 
        loadData(); 
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [clientsRes, membershipsRes] = await Promise.all([
                clientApi.getAll(),
                membershipApi.getAll().catch(() => ({ data: [] })),
            ]);
            setClients(clientsRes.data || []);
            setMemberships(membershipsRes.data || []);
        } catch (error) {
            console.error('Ошибка загрузки клиентов:', error);
        } finally {
            setLoading(false);
        }
    };

    // Получить статус абонемента клиента
    const getClientMembershipStatus = (clientId) => {
        const clientMemberships = memberships.filter(m => m.client === clientId);
        const activeMembership = clientMemberships.find(m => m.status === 'Активен');
        if (activeMembership) return { status: 'Активен', type: activeMembership.type_name };
        
        const expiredMembership = clientMemberships.find(m => m.status === 'Истёк');
        if (expiredMembership) return { status: 'Истёк', type: expiredMembership.type_name };
        
        return { status: 'Нет', type: null };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await clientApi.update(editing.id, formData);
            } else {
                await clientApi.create(formData);
            }
            setModalOpen(false);
            setEditing(null);
            setFormData({ name: '', surname: '', secondname: '', phone: '', email: '', birth_date: '' });
            loadData();
        } catch (error) {
            alert('Ошибка сохранения: ' + (error.response?.data?.phone?.[0] || 'Проверьте данные'));
        }
    };

    const handleEdit = (client) => {
        // Тренер может редактировать только своих клиентов (если эта логика нужна)
        setEditing(client);
        setFormData({
            name: client.name,
            surname: client.surname,
            secondname: client.secondname || '',
            phone: client.phone,
            email: client.email || '',
            birth_date: client.birth_date,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Вы уверены, что хотите удалить клиента?')) return;
        
        try {
            await clientApi.delete(id);
            loadData();
        } catch (error) {
            alert('Ошибка удаления');
        }
    };

    // Фильтрация клиентов
    const filteredClients = clients.filter(client => {
        const fullName = `${client.surname} ${client.name} ${client.secondname || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                             client.phone?.includes(searchTerm) ||
                             client.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (statusFilter === 'all') return matchesSearch;
        
        const membership = getClientMembershipStatus(client.id);
        if (statusFilter === 'active') return matchesSearch && membership.status === 'Активен';
        if (statusFilter === 'expired') return matchesSearch && membership.status === 'Истёк';
        if (statusFilter === 'none') return matchesSearch && membership.status === 'Нет';
        
        return matchesSearch;
    });

    const columns = [
        { 
            key: 'fullName', 
            label: 'ФИО',
            render: (_, row) => `${row.surname} ${row.name} ${row.secondname || ''}`.trim()
        },
        { key: 'phone', label: 'Телефон' },
        { key: 'email', label: 'Email' },
        { 
            key: 'membership', 
            label: 'Абонемент',
            render: (_, row) => {
                const membership = getClientMembershipStatus(row.id);
                const badgeClass = membership.status === 'Активен' ? 'badge-success' 
                                 : membership.status === 'Истёк' ? 'badge-danger'
                                 : 'badge-secondary';
                return (
                    <span className={`badge ${badgeClass}`}>
                        {membership.status}
                        {membership.type && ` (${membership.type})`}
                    </span>
                );
            }
        },
        { 
            key: 'registration_date', 
            label: 'Дата регистрации',
            render: (val) => val ? new Date(val).toLocaleDateString('ru-RU') : '-'
        },
    ];

    return (
        <div style={styles.container}>
            {/* Заголовок */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Клиенты</h1>
                    <p style={styles.subtitle}>
                        Всего: {clients.length} • Найдено: {filteredClients.length}
                    </p>
                </div>
                {can('clients', 'create') && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            setEditing(null);
                            setFormData({ name: '', surname: '', secondname: '', phone: '', email: '', birth_date: '' });
                            setModalOpen(true);
                        }}
                    >
                        + Добавить клиента
                    </button>
                )}
            </div>

            {/* Фильтры */}
            <div style={styles.filters}>
                <input
                    type="text"
                    placeholder="Поиск по ФИО, телефону, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    style={{flex: 1, maxWidth: '400px'}}
                />
                <div style={styles.filterButtons}>
                    <button 
                        className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        Все
                    </button>
                    <button 
                        className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('active')}
                    >
                        С абонементом
                    </button>
                    <button 
                        className={`filter-btn ${statusFilter === 'expired' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('expired')}
                    >
                        Истёк
                    </button>
                    <button 
                        className={`filter-btn ${statusFilter === 'none' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('none')}
                    >
                        Без абонемента
                    </button>
                </div>
            </div>

            {/* Таблица */}
            {loading ? (
                <div style={styles.loading}>
                    <div className="spinner"></div>
                    <p>Загрузка клиентов...</p>
                </div>
            ) : (
                <div className="card">
                    <Table
                        columns={columns}
                        data={filteredClients}
                        actions={(row) => (
                            <div style={styles.actions}>
                                {can('clients', 'edit') && (
                                    <button 
                                        className="btn btn-sm btn-outline"
                                        onClick={() => handleEdit(row)}
                                    >
                                        ✏️ Изменить
                                    </button>
                                )}
                                {can('clients', 'delete') && (
                                    <button 
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(row.id)}
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        )}
                    />
                    {filteredClients.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <p className="empty-state-text">
                                {searchTerm || statusFilter !== 'all' 
                                    ? 'Клиенты не найдены' 
                                    : 'Список клиентов пуст'}
                            </p>
                            {can('clients', 'create') && !searchTerm && statusFilter === 'all' && (
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setModalOpen(true)}
                                >
                                    Добавить первого клиента
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Кнопка экспорта */}
            {can('reports', 'exportPdf') && clients.length > 0 && (
                <div style={styles.exportSection}>
                    <button className="btn btn-secondary">
                        📄 Экспорт в PDF
                    </button>
                </div>
            )}

            {/* Модальное окно */}
            {isModalOpen && (
                <Modal 
                    title={editing ? 'Редактировать клиента' : 'Новый клиент'} 
                    onClose={() => setModalOpen(false)}
                >
                    <form onSubmit={handleSubmit}>
                        <div className="form-label">Фамилия *</div>
                        <input
                            className="form-input"
                            placeholder="Введите фамилию"
                            value={formData.surname}
                            onChange={e => setFormData({ ...formData, surname: e.target.value })}
                            required
                        />
                        
                        <div className="form-label">Имя *</div>
                        <input
                            className="form-input"
                            placeholder="Введите имя"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        
                        <div className="form-label">Отчество</div>
                        <input
                            className="form-input"
                            placeholder="Введите отчество"
                            value={formData.secondname}
                            onChange={e => setFormData({ ...formData, secondname: e.target.value })}
                        />
                        
                        <div className="form-label">Дата рождения *</div>
                        <input
                            className="form-input"
                            type="date"
                            value={formData.birth_date}
                            onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                            required
                        />
                        
                        <div className="form-label">Телефон *</div>
                        <input
                            className="form-input"
                            placeholder="+7 (999) 123-45-67"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                        
                        <div className="form-label">Email</div>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="example@mail.ru"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />

                        <div style={styles.modalButtons}>
                            <button type="submit" className="btn btn-primary" style={{flex: 1}}>
                                {editing ? 'Сохранить' : 'Создать'}
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
    filters: {
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    filterButtons: {
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
    actions: {
        display: 'flex',
        gap: '8px',
    },
    exportSection: {
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'flex-end',
    },
    modalButtons: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px',
    },
};

export default Clients;