import { useState, useEffect } from 'react';
import { trainingApi, trainerApi, hallApi, clientApi } from '../api/api';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/ui/Modal';

const Schedule = () => {
    const { can, canOwn, isAdmin, isTrainer, isManager, user } = usePermissions();
    
    const [trainings, setTrainings] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [halls, setHalls] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        trainer: '',
        hall: '',
        type: '',
    });
    
    const [modalMode, setModalMode] = useState(null); // 'create', 'edit', 'register'
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    
    const [formData, setFormData] = useState({
        date_time: '',
        trainer: '',
        training_type: '',
        hall: '',
        max_clients: 10,
        status: 'Запланирована',
    });
    const [registerClientId, setRegisterClientId] = useState('');

    // Типы тренировок
    const trainingTypes = [
        { id: 'yoga', name: 'Йога' },
        { id: 'power', name: 'Силовая' },
        { id: 'cardio', name: 'Кардио' },
        { id: 'personal', name: 'Персональная' },
        { id: 'group', name: 'Групповая' },
        { id: 'swimming', name: 'Плавание' },
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [trainingsRes, trainersRes, hallsRes, clientsRes] = await Promise.all([
                trainingApi.getAll(),
                trainerApi.getAll(),
                hallApi.getAll(),
                clientApi.getAll(),
            ]);
            
            let data = trainingsRes.data || [];
            
            // Тренер видит только свои занятия
            if (isTrainer && user?.trainer) {
                data = data.filter(t => t.trainer === user.trainer);
            }
            
            setTrainings(data);
            setTrainers(trainersRes.data || []);
            setHalls(hallsRes.data || []);
            setClients(clientsRes.data || []);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        
        let dataToSend = { ...formData };
        
        // Тренер автоматически привязывается к своим занятиям
        if (isTrainer) {
            if (!user?.trainer) {
                setStatusMsg({ type: 'error', text: 'У вашего аккаунта не привязан профиль тренера' });
                return;
            }
            dataToSend.trainer = user.trainer;
        }
        
        try {
            await trainingApi.create(dataToSend);
            setStatusMsg({ type: 'success', text: 'Занятие успешно создано' });
            setModalMode(null);
            resetForm();
            loadData();
        } catch (error) {
            setStatusMsg({ type: 'error', text: 'Ошибка при создании занятия' });
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await trainingApi.update(selectedTraining.id, formData);
            setStatusMsg({ type: 'success', text: 'Занятие обновлено' });
            setModalMode(null);
            loadData();
        } catch (error) {
            setStatusMsg({ type: 'error', text: 'Ошибка обновления' });
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await trainingApi.register(selectedTraining.id, registerClientId);
            setStatusMsg({ type: 'success', text: 'Клиент успешно записан' });
            setModalMode(null);
            setRegisterClientId('');
            loadData();
        } catch (error) {
            const msg = error.response?.data?.error || 'Ошибка записи (возможно, нет мест)';
            setStatusMsg({ type: 'error', text: msg });
        }
    };

    const handleEdit = (training) => {
        // Проверка прав
        if (isTrainer && training.trainer !== user?.trainer) {
            alert('Вы можете редактировать только свои занятия');
            return;
        }
        
        setSelectedTraining(training);
        setFormData({
            date_time: training.date_time,
            trainer: training.trainer,
            training_type: training.training_type,
            hall: training.hall,
            max_clients: training.max_clients,
            status: training.status,
        });
        setModalMode('edit');
    };

    const handleDelete = async (training) => {
        if (isTrainer && training.trainer !== user?.trainer) {
            alert('Вы можете удалять только свои занятия');
            return;
        }
        
        if (!confirm('Удалить занятие?')) return;
        
        try {
            await trainingApi.delete(training.id);
            loadData();
        } catch (error) {
            alert('Ошибка удаления');
        }
    };

    const handleRegisterClick = (training) => {
        if (isTrainer && training.trainer !== user?.trainer) {
            alert('Вы можете записывать клиентов только на свои занятия');
            return;
        }
        
        setSelectedTraining(training);
        setRegisterClientId('');
        setModalMode('register');
    };

    const resetForm = () => {
        setFormData({
            date_time: '',
            trainer: '',
            training_type: '',
            hall: '',
            max_clients: 10,
            status: 'Запланирована',
        });
    };

    // Фильтрация занятий
    const filteredTrainings = trainings.filter(t => {
        const matchesDate = t.date_time?.startsWith(filters.date);
        const matchesTrainer = filters.trainer ? t.trainer === parseInt(filters.trainer) : true;
        const matchesHall = filters.hall ? t.hall === parseInt(filters.hall) : true;
        const matchesType = filters.type ? t.training_type === filters.type : true;
        return matchesDate && matchesTrainer && matchesHall && matchesType;
    }).sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

    // Группировка по времени
    const groupedByTime = filteredTrainings.reduce((acc, training) => {
        const time = training.date_time?.split('T')[1]?.slice(0, 5) || '00:00';
        if (!acc[time]) acc[time] = [];
        acc[time].push(training);
        return acc;
    }, {});

    const getStatusColor = (status) => {
        switch (status) {
            case 'Запланирована': return '#3498db';
            case 'Проведена': return '#27ae60';
            case 'Отменена': return '#e74c3c';
            default: return '#7f8c8d';
        }
    };

    const canCreate = can('schedule', 'create') || (isTrainer && can('schedule', 'createOwn'));

    return (
        <div style={styles.container}>
            {/* Заголовок */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Расписание занятий</h1>
                    <p style={styles.subtitle}>
                        {isTrainer ? 'Ваши занятия' : 'Все занятия'} • {filteredTrainings.length} на выбранную дату
                    </p>
                </div>
                {canCreate && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            setModalMode('create');
                            resetForm();
                            setStatusMsg({ type: '', text: '' });
                        }}
                    >
                        + Добавить занятие
                    </button>
                )}
            </div>

            {/* Уведомление */}
            {statusMsg.text && (
                <div className={`alert alert-${statusMsg.type === 'error' ? 'error' : 'success'}`}>
                    {statusMsg.text}
                </div>
            )}

            {/* Фильтры */}
            <div style={styles.filtersCard}>
                <div style={styles.filtersGrid}>
                    <div>
                        <label style={styles.filterLabel}>Выбрать дату</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.date}
                            onChange={e => setFilters({ ...filters, date: e.target.value })}
                            style={{marginBottom: 0}}
                        />
                    </div>
                    
                    {!isTrainer && (
                        <div>
                            <label style={styles.filterLabel}>Тренер</label>
                            <select
                                className="form-select"
                                value={filters.trainer}
                                onChange={e => setFilters({ ...filters, trainer: e.target.value })}
                                style={{marginBottom: 0}}
                            >
                                <option value="">Все тренеры</option>
                                {trainers.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.surname} {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <div>
                        <label style={styles.filterLabel}>Выбрать тип</label>
                        <select
                            className="form-select"
                            value={filters.type}
                            onChange={e => setFilters({ ...filters, type: e.target.value })}
                            style={{marginBottom: 0}}
                        >
                            <option value="">Все типы</option>
                            {trainingTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label style={styles.filterLabel}>Фильтр по залу</label>
                        <select
                            className="form-select"
                            value={filters.hall}
                            onChange={e => setFilters({ ...filters, hall: e.target.value })}
                            style={{marginBottom: 0}}
                        >
                            <option value="">Все залы</option>
                            {halls.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Расписание */}
            {loading ? (
                <div style={styles.loading}>
                    <div className="spinner"></div>
                    <p>Загрузка расписания...</p>
                </div>
            ) : (
                <div className="card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>День</th>
                                <th>Время</th>
                                <th>Тип</th>
                                <th>Зал</th>
                                {!isTrainer && <th>Тренер</th>}
                                <th>Мест</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTrainings.length === 0 ? (
                                <tr>
                                    <td colSpan={isTrainer ? 7 : 8} style={styles.emptyCell}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📅</div>
                                            <p>Нет занятий на выбранную дату</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTrainings.map(training => {
                                    const trainer = trainers.find(t => t.id === training.trainer);
                                    const hall = halls.find(h => h.id === training.hall);
                                    const type = trainingTypes.find(t => t.id === training.training_type);
                                    const dateTime = new Date(training.date_time);
                                    const dayName = dateTime.toLocaleDateString('ru-RU', { weekday: 'long' });
                                    const time = dateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                                    
                                    const canEditThis = isAdmin || (isTrainer && training.trainer === user?.trainer);
                                    const canRegister = isAdmin || (isTrainer && training.trainer === user?.trainer);
                                    
                                    return (
                                        <tr key={training.id}>
                                            <td style={{textTransform: 'capitalize'}}>{dayName}</td>
                                            <td style={{fontWeight: 600, color: '#4169E1'}}>{time}</td>
                                            <td>{type?.name || training.training_type || '—'}</td>
                                            <td>{hall?.name || '—'}</td>
                                            {!isTrainer && (
                                                <td>{trainer ? `${trainer.surname} ${trainer.name}` : '—'}</td>
                                            )}
                                            <td>
                                                <span style={styles.slotsInfo}>
                                                    {training.registered_clients || 0}/{training.max_clients}
                                                </span>
                                            </td>
                                            <td>
                                                <span 
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: `${getStatusColor(training.status)}15`,
                                                        color: getStatusColor(training.status),
                                                    }}
                                                >
                                                    {training.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={styles.actions}>
                                                    {canRegister && training.status === 'Запланирована' && (
                                                        <button 
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleRegisterClick(training)}
                                                        >
                                                            + Записать
                                                        </button>
                                                    )}
                                                    {canEditThis && (
                                                        <button 
                                                            className="btn btn-sm btn-outline"
                                                            onClick={() => handleEdit(training)}
                                                        >
                                                            ✏️
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button 
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDelete(training)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Модальное окно создания/редактирования */}
            {(modalMode === 'create' || modalMode === 'edit') && (
                <Modal 
                    title={modalMode === 'create' ? 'Новое занятие' : 'Редактировать занятие'} 
                    onClose={() => setModalMode(null)}
                >
                    <form onSubmit={modalMode === 'create' ? handleCreateSubmit : handleUpdateSubmit}>
                        <div className="form-label">Дата и время *</div>
                        <input
                            type="datetime-local"
                            className="form-input"
                            value={formData.date_time}
                            onChange={e => setFormData({ ...formData, date_time: e.target.value })}
                            required
                        />

                        {!isTrainer && (
                            <>
                                <div className="form-label">Тренер *</div>
                                <select
                                    className="form-select"
                                    value={formData.trainer}
                                    onChange={e => setFormData({ ...formData, trainer: e.target.value })}
                                    required
                                >
                                    <option value="">Выберите тренера</option>
                                    {trainers.filter(t => t.is_active !== false).map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.surname} {t.name} ({t.specialization || 'Без специализации'})
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}

                        <div className="form-label">Тип занятия *</div>
                        <select
                            className="form-select"
                            value={formData.training_type}
                            onChange={e => setFormData({ ...formData, training_type: e.target.value })}
                            required
                        >
                            <option value="">Выберите тип</option>
                            {trainingTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>

                        <div className="form-label">Зал *</div>
                        <select
                            className="form-select"
                            value={formData.hall}
                            onChange={e => setFormData({ ...formData, hall: e.target.value })}
                            required
                        >
                            <option value="">Выберите зал</option>
                            {halls.map(h => (
                                <option key={h.id} value={h.id}>
                                    {h.name} (до {h.capacity} чел.)
                                </option>
                            ))}
                        </select>

                        <div style={styles.formRow}>
                            <div style={{flex: 1}}>
                                <div className="form-label">Макс. участников</div>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    value={formData.max_clients}
                                    onChange={e => setFormData({ ...formData, max_clients: e.target.value })}
                                />
                            </div>
                            <div style={{flex: 1}}>
                                <div className="form-label">Статус</div>
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Запланирована">Запланирована</option>
                                    <option value="Проведена">Проведена</option>
                                    <option value="Отменена">Отменена</option>
                                </select>
                            </div>
                        </div>

                        <div style={styles.modalButtons}>
                            <button type="submit" className="btn btn-primary" style={{flex: 1}}>
                                {modalMode === 'create' ? 'Создать' : 'Сохранить'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setModalMode(null)}
                                style={{flex: 1}}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Модальное окно записи клиента */}
            {modalMode === 'register' && selectedTraining && (
                <Modal 
                    title="Записать клиента на занятие" 
                    onClose={() => setModalMode(null)}
                >
                    <div style={styles.registerInfo}>
                        <p><strong>Занятие:</strong> {trainingTypes.find(t => t.id === selectedTraining.training_type)?.name || selectedTraining.training_type}</p>
                        <p><strong>Время:</strong> {new Date(selectedTraining.date_time).toLocaleString('ru-RU')}</p>
                        <p><strong>Свободных мест:</strong> {selectedTraining.max_clients - (selectedTraining.registered_clients || 0)}</p>
                    </div>

                    <form onSubmit={handleRegisterSubmit}>
                        <div className="form-label">Выберите клиента *</div>
                        <select
                            className="form-select"
                            value={registerClientId}
                            onChange={e => setRegisterClientId(e.target.value)}
                            required
                        >
                            <option value="">-- Выберите клиента --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.surname} {c.name} ({c.phone})
                                </option>
                            ))}
                        </select>

                        <div style={styles.modalButtons}>
                            <button type="submit" className="btn btn-success" style={{flex: 1}}>
                                Записать
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setModalMode(null)}
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
    filtersCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    filtersGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
    },
    filterLabel: {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#7f8c8d',
        marginBottom: '6px',
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
    emptyCell: {
        textAlign: 'center',
        padding: '40px',
    },
    slotsInfo: {
        fontWeight: '600',
        color: '#2c3e50',
    },
    actions: {
        display: 'flex',
        gap: '6px',
    },
    formRow: {
        display: 'flex',
        gap: '16px',
    },
    registerInfo: {
        background: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
    },
    modalButtons: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px',
    },
};

export default Schedule;