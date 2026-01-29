import { useState, useEffect } from 'react';
import { hallApi } from '../api/api';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const Halls = () => {
    const { isAdmin } = usePermissions();
    
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        capacity: '',
        equipment: '',
        floor: '',
        area: '',
        is_active: true,
    });

    useEffect(() => { 
        loadHalls(); 
    }, []);

    const loadHalls = async () => {
        setLoading(true);
        try {
            const res = await hallApi.getAll();
            setHalls(res.data || []);
        } catch (error) {
            console.error('Ошибка загрузки залов:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await hallApi.update(editing.id, formData);
            } else {
                await hallApi.create(formData);
            }
            setModalOpen(false);
            setEditing(null);
            resetForm();
            loadHalls();
        } catch (error) {
            alert('Ошибка сохранения: ' + (error.response?.data?.name?.[0] || 'Проверьте данные'));
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            capacity: '',
            equipment: '',
            floor: '',
            area: '',
            is_active: true,
        });
    };

    const handleEdit = (hall) => {
        setEditing(hall);
        setFormData({
            name: hall.name || '',
            capacity: hall.capacity || '',
            equipment: hall.equipment || '',
            floor: hall.floor || '',
            area: hall.area || '',
            is_active: hall.is_active !== false,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Удалить зал? Это действие может повлиять на расписание.')) return;
        
        try {
            await hallApi.delete(id);
            loadHalls();
        } catch (error) {
            alert('Ошибка удаления. Возможно, зал используется в расписании.');
        }
    };

    const columns = [
        { 
            key: 'name', 
            label: 'Название',
            render: (val, row) => (
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={styles.hallIcon}>🏢</div>
                    <div>
                        <div style={{fontWeight: 600}}>{val}</div>
                        {row.floor && <div style={{fontSize: '12px', color: '#7f8c8d'}}>{row.floor} этаж</div>}
                    </div>
                </div>
            )
        },
        { 
            key: 'capacity', 
            label: 'Вместимость',
            render: (val) => val ? `${val} чел.` : '—'
        },
        { 
            key: 'area', 
            label: 'Площадь',
            render: (val) => val ? `${val} м²` : '—'
        },
        { 
            key: 'equipment', 
            label: 'Оборудование',
            render: (val) => val || <span style={{color: '#95a5a6'}}>Не указано</span>
        },
        { 
            key: 'is_active', 
            label: 'Статус',
            render: (val) => (
                <span className={`badge ${val !== false ? 'badge-success' : 'badge-secondary'}`}>
                    {val !== false ? 'Активен' : 'Закрыт'}
                </span>
            )
        },
    ];

    // Статистика
    const stats = {
        total: halls.length,
        active: halls.filter(h => h.is_active !== false).length,
        totalCapacity: halls.filter(h => h.is_active !== false)
                           .reduce((sum, h) => sum + (parseInt(h.capacity) || 0), 0),
    };

    return (
        <div style={styles.container}>
            {/* Заголовок */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Залы</h1>
                    <p style={styles.subtitle}>
                        Управление залами фитнес-центра
                    </p>
                </div>
                {isAdmin && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            setEditing(null);
                            resetForm();
                            setModalOpen(true);
                        }}
                    >
                        + Добавить зал
                    </button>
                )}
            </div>

            {/* Статистика */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>🏢</div>
                    <div>
                        <div style={styles.statValue}>{stats.total}</div>
                        <div style={styles.statLabel}>Всего залов</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>✅</div>
                    <div>
                        <div style={{...styles.statValue, color: '#27ae60'}}>{stats.active}</div>
                        <div style={styles.statLabel}>Активных</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>👥</div>
                    <div>
                        <div style={{...styles.statValue, color: '#3498db'}}>{stats.totalCapacity}</div>
                        <div style={styles.statLabel}>Общая вместимость</div>
                    </div>
                </div>
            </div>

            {/* Список залов */}
            {loading ? (
                <div style={styles.loading}>
                    <div className="spinner"></div>
                    <p>Загрузка залов...</p>
                </div>
            ) : (
                <div className="card">
                    <Table
                        columns={columns}
                        data={halls}
                        actions={isAdmin ? (row) => (
                            <div style={styles.actions}>
                                <button 
                                    className="btn btn-sm btn-outline"
                                    onClick={() => handleEdit(row)}
                                >
                                    ✏️ Изменить
                                </button>
                                <button 
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(row.id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ) : null}
                    />
                    {halls.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">🏢</div>
                            <p className="empty-state-text">Залы не добавлены</p>
                            {isAdmin && (
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setModalOpen(true)}
                                >
                                    Добавить первый зал
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Модальное окно */}
            {isModalOpen && (
                <Modal 
                    title={editing ? 'Редактировать зал' : 'Новый зал'} 
                    onClose={() => setModalOpen(false)}
                >
                    <form onSubmit={handleSubmit}>
                        <div className="form-label">Название зала *</div>
                        <input
                            className="form-input"
                            placeholder="Например: Тренажёрный зал №1"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />

                        <div style={styles.formRow}>
                            <div style={{flex: 1}}>
                                <div className="form-label">Вместимость (чел.) *</div>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="20"
                                    min="1"
                                    value={formData.capacity}
                                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{flex: 1}}>
                                <div className="form-label">Площадь (м²)</div>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="100"
                                    min="1"
                                    value={formData.area}
                                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-label">Этаж</div>
                        <select
                            className="form-select"
                            value={formData.floor}
                            onChange={e => setFormData({ ...formData, floor: e.target.value })}
                        >
                            <option value="">Не указан</option>
                            <option value="1">1 этаж</option>
                            <option value="2">2 этаж</option>
                            <option value="3">3 этаж</option>
                            <option value="-1">Цокольный этаж</option>
                        </select>

                        <div className="form-label">Оборудование</div>
                        <textarea
                            className="form-input"
                            rows="3"
                            placeholder="Беговые дорожки, велотренажёры, гантели..."
                            value={formData.equipment}
                            onChange={e => setFormData({ ...formData, equipment: e.target.value })}
                        />

                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            Зал активен (доступен для записи)
                        </label>

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
    },
    statIcon: {
        fontSize: '32px',
    },
    statValue: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#2c3e50',
    },
    statLabel: {
        fontSize: '13px',
        color: '#7f8c8d',
    },
    hallIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        backgroundColor: '#e8f4fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
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
    formRow: {
        display: 'flex',
        gap: '16px',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        cursor: 'pointer',
    },
    modalButtons: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px',
    },
};

export default Halls;