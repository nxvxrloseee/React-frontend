import { useState, useEffect } from 'react';
import { membershipApi, membershipTypeApi, clientApi } from '../api/api';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const Memberships = () => {
    const { can, isAdmin, isManager, isTrainer } = usePermissions();
    
    const [memberships, setMemberships] = useState([]);
    const [membershipTypes, setMembershipTypes] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('memberships'); // 'memberships' или 'types'
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Модальные окна
    const [isTypeModalOpen, setTypeModalOpen] = useState(false);
    const [isMembershipModalOpen, setMembershipModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    
    const [typeFormData, setTypeFormData] = useState({
        name: '',
        duration_days: '',
        price: '',
        visits_limit: '',
        description: '',
    });
    
    const [membershipFormData, setMembershipFormData] = useState({
        client: '',
        type: '',
        start_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => { 
        loadData(); 
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [membershipsRes, typesRes, clientsRes] = await Promise.all([
                membershipApi.getAll(),
                membershipTypeApi.getAll(),
                clientApi.getAll(),
            ]);
            setMemberships(membershipsRes.data || []);
            setMembershipTypes(typesRes.data || []);
            setClients(clientsRes.data || []);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            setLoading(false);
        }
    };

    // ===== Управление типами абонементов =====
    const handleTypeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await membershipTypeApi.update(editingType.id, typeFormData);
            } else {
                await membershipTypeApi.create(typeFormData);
            }
            setTypeModalOpen(false);
            setEditingType(null);
            resetTypeForm();
            loadData();
        } catch (error) {
            alert('Ошибка сохранения: ' + (error.response?.data?.name?.[0] || 'Проверьте данные'));
        }
    };

    const handleEditType = (type) => {
        setEditingType(type);
        setTypeFormData({
            name: type.name || '',
            duration_days: type.duration_days || '',
            price: type.price || '',
            visits_limit: type.visits_limit || '',
            description: type.description || '',
        });
        setTypeModalOpen(true);
    };

    const handleDeleteType = async (id) => {
        if (!confirm('Удалить тип абонемента?')) return;
        try {
            await membershipTypeApi.delete(id);
            loadData();
        } catch (error) {
            alert('Ошибка удаления. Возможно, есть активные абонементы этого типа.');
        }
    };

    const resetTypeForm = () => {
        setTypeFormData({
            name: '',
            duration_days: '',
            price: '',
            visits_limit: '',
            description: '',
        });
    };

    // ===== Управление абонементами клиентов =====
    const handleMembershipSubmit = async (e) => {
        e.preventDefault();
        try {
            const selectedType = membershipTypes.find(t => t.id === parseInt(membershipFormData.type));
            const startDate = new Date(membershipFormData.start_date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + (selectedType?.duration_days || 30));
            
            await membershipApi.create({
                ...membershipFormData,
                end_date: endDate.toISOString().split('T')[0],
                status: 'Активен',
            });
            setMembershipModalOpen(false);
            setMembershipFormData({
                client: '',
                type: '',
                start_date: new Date().toISOString().split('T')[0],
            });
            loadData();
        } catch (error) {
            alert('Ошибка оформления абонемента');
        }
    };

    // Статистика
    const stats = {
        total: memberships.length,
        active: memberships.filter(m => m.status === 'Активен').length,
        expiring: memberships.filter(m => {
            const endDate = new Date(m.end_date);
            const today = new Date();
            const diff = (endDate - today) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 7 && m.status === 'Активен';
        }).length,
        expired: memberships.filter(m => m.status === 'Истёк').length,
    };

    // Фильтрация абонементов
    const filteredMemberships = memberships.filter(m => {
        const client = clients.find(c => c.id === m.client);
        const clientName = client ? `${client.surname} ${client.name}`.toLowerCase() : '';
        const matchesSearch = clientName.includes(searchTerm.toLowerCase());
        
        if (statusFilter === 'all') return matchesSearch;
        if (statusFilter === 'active') return matchesSearch && m.status === 'Активен';
        if (statusFilter === 'expiring') {
            const endDate = new Date(m.end_date);
            const today = new Date();
            const diff = (endDate - today) / (1000 * 60 * 60 * 24);
            return matchesSearch && diff >= 0 && diff <= 7 && m.status === 'Активен';
        }
        if (statusFilter === 'expired') return matchesSearch && m.status === 'Истёк';
        
        return matchesSearch;
    });

    const membershipColumns = [
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
            key: 'type', 
            label: 'Тип',
            render: (val) => {
                const type = membershipTypes.find(t => t.id === val);
                return type?.name || val || '—';
            }
        },
        { 
            key: 'start_date', 
            label: 'Начало',
            render: (val) => val ? new Date(val).toLocaleDateString('ru-RU') : '—'
        },
        { 
            key: 'end_date', 
            label: 'Окончание',
            render: (val) => val ? new Date(val).toLocaleDateString('ru-RU') : '—'
        },
        { 
            key: 'status', 
            label: 'Статус',
            render: (val, row) => {
                const endDate = new Date(row.end_date);
                const today = new Date();
                const diff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                
                let badgeClass = 'badge-success';
                let statusText = val;
                
                if (val === 'Истёк' || diff < 0) {
                    badgeClass = 'badge-danger';
                    statusText = 'Истёк';
                } else if (diff <= 7) {
                    badgeClass = 'badge-warning';
                    statusText = `${diff} дн.`;
                }
                
                return <span className={`badge ${badgeClass}`}>{statusText}</span>;
            }
        },
    ];

    const typeColumns = [
        { key: 'name', label: 'Название' },
        { 
            key: 'duration_days', 
            label: 'Срок',
            render: (val) => val ? `${val} дней` : '—'
        },
        { 
            key: 'price', 
            label: 'Цена',
            render: (val) => val ? `${parseFloat(val).toLocaleString()} ₽` : '—'
        },
        { 
            key: 'visits_limit', 
            label: 'Посещений',
            render: (val) => val || 'Безлимит'
        },
        { key: 'description', label: 'Описание' },
    ];

    const canEditTypes = can('memberships', 'editTypes');

    return (
        <div style={styles.container}>
            {/* Заголовок */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Абонементы</h1>
                    <p style={styles.subtitle}>
                        Управление абонементами клиентов
                    </p>
                </div>
                <div style={styles.headerButtons}>
                    {can('memberships', 'create') && (
                        <button 
                            className="btn btn-primary"
                            onClick={() => setMembershipModalOpen(true)}
                        >
                            + Оформить абонемент
                        </button>
                    )}
                </div>
            </div>

            {/* Табы */}
            <div style={styles.tabs}>
                <button 
                    style={{
                        ...styles.tab,
                        borderBottomColor: activeTab === 'memberships' ? '#4169E1' : 'transparent',
                        color: activeTab === 'memberships' ? '#4169E1' : '#7f8c8d',
                    }}
                    onClick={() => setActiveTab('memberships')}
                >
                    📋 Абонементы клиентов
                </button>
                <button 
                    style={{
                        ...styles.tab,
                        borderBottomColor: activeTab === 'types' ? '#4169E1' : 'transparent',
                        color: activeTab === 'types' ? '#4169E1' : '#7f8c8d',
                    }}
                    onClick={() => setActiveTab('types')}
                >
                    🎫 Типы абонементов
                </button>
            </div>

            {activeTab === 'memberships' ? (
                <>
                    {/* Статистика */}
                    <div style={styles.statsGrid}>
                        <div 
                            style={{
                                ...styles.statCard,
                                borderColor: statusFilter === 'all' ? '#4169E1' : '#e0e4e8',
                                cursor: 'pointer',
                            }}
                            onClick={() => setStatusFilter('all')}
                        >
                            <div style={styles.statValue}>{stats.total}</div>
                            <div style={styles.statLabel}>Всего</div>
                        </div>
                        <div 
                            style={{
                                ...styles.statCard,
                                borderColor: statusFilter === 'active' ? '#27ae60' : '#e0e4e8',
                                cursor: 'pointer',
                            }}
                            onClick={() => setStatusFilter('active')}
                        >
                            <div style={{...styles.statValue, color: '#27ae60'}}>{stats.active}</div>
                            <div style={styles.statLabel}>Активных</div>
                        </div>
                        <div 
                            style={{
                                ...styles.statCard,
                                borderColor: statusFilter === 'expiring' ? '#f39c12' : '#e0e4e8',
                                cursor: 'pointer',
                            }}
                            onClick={() => setStatusFilter('expiring')}
                        >
                            <div style={{...styles.statValue, color: '#f39c12'}}>{stats.expiring}</div>
                            <div style={styles.statLabel}>Истекают (7 дн.)</div>
                        </div>
                        <div 
                            style={{
                                ...styles.statCard,
                                borderColor: statusFilter === 'expired' ? '#e74c3c' : '#e0e4e8',
                                cursor: 'pointer',
                            }}
                            onClick={() => setStatusFilter('expired')}
                        >
                            <div style={{...styles.statValue, color: '#e74c3c'}}>{stats.expired}</div>
                            <div style={styles.statLabel}>Истекли</div>
                        </div>
                    </div>

                    {/* Поиск */}
                    <div style={styles.searchBar}>
                        <input
                            type="text"
                            placeholder="Поиск по клиенту..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* Таблица абонементов */}
                    {loading ? (
                        <div style={styles.loading}>
                            <div className="spinner"></div>
                            <p>Загрузка...</p>
                        </div>
                    ) : (
                        <div className="card">
                            <Table
                                columns={membershipColumns}
                                data={filteredMemberships}
                                actions={can('memberships', 'extend') ? (row) => (
                                    <button 
                                        className="btn btn-sm btn-success"
                                        onClick={() => {
                                            setMembershipFormData({
                                                client: row.client,
                                                type: row.type,
                                                start_date: new Date().toISOString().split('T')[0],
                                            });
                                            setMembershipModalOpen(true);
                                        }}
                                    >
                                        🔄 Продлить
                                    </button>
                                ) : null}
                            />
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Типы абонементов */}
                    <div style={styles.typesHeader}>
                        <h2 style={styles.sectionTitle}>Типы абонементов</h2>
                        {canEditTypes && (
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    setEditingType(null);
                                    resetTypeForm();
                                    setTypeModalOpen(true);
                                }}
                            >
                                + Добавить тип
                            </button>
                        )}
                    </div>

                    <div className="card">
                        <Table
                            columns={typeColumns}
                            data={membershipTypes}
                            actions={canEditTypes ? (row) => (
                                <div style={styles.actions}>
                                    <button 
                                        className="btn btn-sm btn-outline"
                                        onClick={() => handleEditType(row)}
                                    >
                                        ✏️
                                    </button>
                                    {isAdmin && (
                                        <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDeleteType(row.id)}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            ) : null}
                        />
                    </div>
                </>
            )}

            {/* Модальное окно типа абонемента */}
            {isTypeModalOpen && (
                <Modal 
                    title={editingType ? 'Редактировать тип' : 'Новый тип абонемента'} 
                    onClose={() => setTypeModalOpen(false)}
                >
                    <form onSubmit={handleTypeSubmit}>
                        <div className="form-label">Название *</div>
                        <input
                            className="form-input"
                            placeholder="Например: Годовой безлимит"
                            value={typeFormData.name}
                            onChange={e => setTypeFormData({ ...typeFormData, name: e.target.value })}
                            required
                        />

                        <div style={styles.formRow}>
                            <div style={{flex: 1}}>
                                <div className="form-label">Срок (дней) *</div>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="30"
                                    min="1"
                                    value={typeFormData.duration_days}
                                    onChange={e => setTypeFormData({ ...typeFormData, duration_days: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{flex: 1}}>
                                <div className="form-label">Цена (₽) *</div>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="5000"
                                    min="0"
                                    value={typeFormData.price}
                                    onChange={e => setTypeFormData({ ...typeFormData, price: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-label">Лимит посещений (пусто = безлимит)</div>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="Без ограничений"
                            min="0"
                            value={typeFormData.visits_limit}
                            onChange={e => setTypeFormData({ ...typeFormData, visits_limit: e.target.value })}
                        />

                        <div className="form-label">Описание</div>
                        <textarea
                            className="form-input"
                            rows="3"
                            placeholder="Дополнительная информация..."
                            value={typeFormData.description}
                            onChange={e => setTypeFormData({ ...typeFormData, description: e.target.value })}
                        />

                        <div style={styles.modalButtons}>
                            <button type="submit" className="btn btn-primary" style={{flex: 1}}>
                                {editingType ? 'Сохранить' : 'Создать'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setTypeModalOpen(false)}
                                style={{flex: 1}}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Модальное окно оформления абонемента */}
            {isMembershipModalOpen && (
                <Modal 
                    title="Оформить абонемент" 
                    onClose={() => setMembershipModalOpen(false)}
                >
                    <form onSubmit={handleMembershipSubmit}>
                        <div className="form-label">Клиент *</div>
                        <select
                            className="form-select"
                            value={membershipFormData.client}
                            onChange={e => setMembershipFormData({ ...membershipFormData, client: e.target.value })}
                            required
                        >
                            <option value="">-- Выберите клиента --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.surname} {c.name} ({c.phone})
                                </option>
                            ))}
                        </select>

                        <div className="form-label">Тип абонемента *</div>
                        <select
                            className="form-select"
                            value={membershipFormData.type}
                            onChange={e => setMembershipFormData({ ...membershipFormData, type: e.target.value })}
                            required
                        >
                            <option value="">-- Выберите тип --</option>
                            {membershipTypes.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} — {parseFloat(t.price).toLocaleString()} ₽ ({t.duration_days} дн.)
                                </option>
                            ))}
                        </select>

                        <div className="form-label">Дата начала *</div>
                        <input
                            type="date"
                            className="form-input"
                            value={membershipFormData.start_date}
                            onChange={e => setMembershipFormData({ ...membershipFormData, start_date: e.target.value })}
                            required
                        />

                        {membershipFormData.type && (
                            <div style={styles.previewCard}>
                                <div style={styles.previewTitle}>Предпросмотр</div>
                                {(() => {
                                    const type = membershipTypes.find(t => t.id === parseInt(membershipFormData.type));
                                    const startDate = new Date(membershipFormData.start_date);
                                    const endDate = new Date(startDate);
                                    endDate.setDate(endDate.getDate() + (type?.duration_days || 30));
                                    return (
                                        <>
                                            <p>Тип: <strong>{type?.name}</strong></p>
                                            <p>Окончание: <strong>{endDate.toLocaleDateString('ru-RU')}</strong></p>
                                            <p>К оплате: <strong>{parseFloat(type?.price || 0).toLocaleString()} ₽</strong></p>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        <div style={styles.modalButtons}>
                            <button type="submit" className="btn btn-success" style={{flex: 1}}>
                                ✅ Оформить
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setMembershipModalOpen(false)}
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
    headerButtons: {
        display: 'flex',
        gap: '12px',
    },
    tabs: {
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #e0e4e8',
    },
    tab: {
        padding: '12px 20px',
        background: 'none',
        border: 'none',
        borderBottom: '3px solid transparent',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
    },
    statCard: {
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'center',
        border: '2px solid #e0e4e8',
        transition: 'all 0.2s',
    },
    statValue: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#2c3e50',
    },
    statLabel: {
        fontSize: '13px',
        color: '#7f8c8d',
        marginTop: '4px',
    },
    searchBar: {
        marginBottom: '20px',
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
    typesHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#2c3e50',
        margin: 0,
    },
    actions: {
        display: 'flex',
        gap: '8px',
    },
    formRow: {
        display: 'flex',
        gap: '16px',
    },
    previewCard: {
        background: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        marginTop: '16px',
    },
    previewTitle: {
        fontWeight: '600',
        marginBottom: '8px',
        color: '#7f8c8d',
    },
    modalButtons: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px',
    },
};

export default Memberships;