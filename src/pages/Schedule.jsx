import { useState, useEffect } from 'react';
import { trainingApi, referenceApi, clientApi } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Schedule = () => {
    const { user } = useAuth();
    
    const [trainings, setTrainings] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [halls, setHalls] = useState([]);
    const [types, setTypes] = useState([]);
    const [clients, setClients] = useState([]);

    const [filters, setFilters] = useState({ 
        date: new Date().toISOString().split('T')[0], 
        trainer: '' 
    });

    const [modalMode, setModalMode] = useState(null);
    const [selectedTraining, setSelectedTraining] = useState(null);
    
    const [createForm, setCreateForm] = useState({
        date_time: '',
        trainer: '',
        training_type: '',
        hall: '',
        max_clients: 10,
        status: 'Запланирована'
    });
    const [registerClientId, setRegisterClientId] = useState('');
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        loadSchedule();
        loadReferences();
    }, []);

    const loadSchedule = async () => {
        try {
            const res = await trainingApi.getAll();
            let data = res.data || [];
            
            // Тренер видит только свои занятия
            if (user.role === 'trainer' && user.trainer) {
                data = data.filter(t => t.trainer === user.trainer);
            }
            
            setTrainings(data);
        } catch (error) {
            console.error('Failed to load schedule', error);
        }
    };

    const loadReferences = async () => {
        try {
            const [trainerRes, typeRes, clientRes, hallRes] = await Promise.all([
                referenceApi.getTrainers(),
                referenceApi.getMembershipTypes(),
                clientApi.getAll(),
                referenceApi.getHalls()
            ]);
            
            setTrainers(trainerRes.data);
            setTypes(typeRes.data);
            setClients(clientRes.data);
            setHalls(hallRes.data);
        } catch (error) {
            console.error('Failed to load references', error);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        
        // Тренер может создавать только свои занятия
        let dataToSend = { ...createForm };
        if (user.role === 'trainer') {
            if (!user.trainer) {
                setStatusMsg({ type: 'error', text: 'У вашего аккаунта не привязан профиль тренера' });
                return;
            }
            dataToSend.trainer = user.trainer;
        }
        
        try {
            await trainingApi.create(dataToSend);
            setStatusMsg({ type: 'success', text: 'Занятие успешно создано' });
            setModalMode(null);
            setCreateForm({
                date_time: '',
                trainer: '',
                training_type: '',
                hall: '',
                max_clients: 10,
                status: 'Запланирована'
            });
            loadSchedule();
        } catch (error) {
            console.log(error);
            setStatusMsg({ type: 'error', text: 'Ошибка при создании занятия' });
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        
        // Тренер может записывать только на свои занятия
        if (user.role === 'trainer' && selectedTraining.trainer !== user.trainer) {
            setStatusMsg({ type: 'error', text: 'Вы можете записывать клиентов только на свои занятия' });
            return;
        }
        
        try {
            await trainingApi.register(selectedTraining.id, registerClientId);
            setStatusMsg({ type: 'success', text: 'Клиент успешно записан' });
            setModalMode(null);
            setRegisterClientId('');
        } catch (error) {
            const msg = error.response?.data?.error || 'Ошибка записи (возможно мест нет)';
            setStatusMsg({ type: 'error', text: msg });
        }
    };

    const handleEdit = (training) => {
        // Тренер может редактировать только свои занятия
        if (user.role === 'trainer' && training.trainer !== user.trainer) {
            alert('Вы можете редактировать только свои занятия');
            return;
        }
        
        setSelectedTraining(training);
        setCreateForm({
            date_time: training.date_time,
            trainer: training.trainer,
            training_type: training.training_type,
            hall: training.hall,
            max_clients: training.max_clients,
            status: training.status
        });
        setModalMode('edit');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await trainingApi.update(selectedTraining.id, createForm);
            setStatusMsg({ type: 'success', text: 'Занятие обновлено' });
            setModalMode(null);
            loadSchedule();
        } catch (error) {
            setStatusMsg({ type: 'error', text: 'Ошибка обновления' });
        }
    };

    const handleDelete = async (training) => {
        if (user.role === 'trainer' && training.trainer !== user.trainer) {
            alert('Вы можете удалять только свои занятия');
            return;
        }
        
        if (!confirm('Удалить занятие?')) return;
        
        try {
            await trainingApi.delete(training.id);
            loadSchedule();
        } catch (error) {
            alert('Ошибка удаления');
        }
    };

    const filteredTrainings = trainings.filter(t => {
        const matchesDate = t.date_time.startsWith(filters.date);
        const matchesTrainer = filters.trainer ? t.trainer === parseInt(filters.trainer) : true;
        return matchesDate && matchesTrainer;
    });

    const canCreate = user?.role !== 'manager';
    const canEdit = user?.role !== 'manager';
    const canDelete = user?.role === 'admin';

    return (
        <div>
            <div style={styles.header}>
                <h2>Расписание занятий</h2>
                {canCreate && (
                    <button style={styles.btnPrimary} onClick={() => {
                        setModalMode('create');
                        setStatusMsg({ type: '', text: '' });
                    }}>
                        + Добавить занятие
                    </button>
                )}
            </div>

            {statusMsg.text && (
                <div style={{
                    padding: '10px', 
                    marginBottom: '15px', 
                    borderRadius: '4px',
                    backgroundColor: statusMsg.type === 'error' ? '#fadbd8' : '#d4efdf',
                    color: statusMsg.type === 'error' ? '#c0392b' : '#1e8449'
                }}>
                    {statusMsg.text}
                </div>
            )}

            <div style={styles.filterBar}>
                <input 
                    type="date" 
                    style={styles.input} 
                    value={filters.date}
                    onChange={e => setFilters({...filters, date: e.target.value})}
                />
                {user.role !== 'trainer' && (
                    <select 
                        style={styles.input}
                        value={filters.trainer}
                        onChange={e => setFilters({...filters, trainer: e.target.value})}
                    >
                        <option value="">Все тренеры</option>
                        {trainers.map(t => (
                            <option key={t.id} value={t.id}>{t.surname} {t.name}</option>
                        ))}
                    </select>
                )}
            </div>

            <div style={styles.grid}>
                {filteredTrainings.length === 0 ? (
                    <p style={{color: '#7f8c8d'}}>Нет занятий на выбранную дату.</p>
                ) : (
                    filteredTrainings.map(training => (
                        <div key={training.id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.timeBadge}>
                                    {new Date(training.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <span style={{fontWeight: 'bold'}}>{training.type_name}</span>
                            </div>
                            <div style={styles.cardBody}>
                                <p><strong>Тренер:</strong> {training.trainer_name}</p>
                                <p><strong>Зал:</strong> {training.hall_name}</p>
                                <p><strong>Места:</strong> {training.max_clients}</p>
                                <p style={{
                                    color: training.status === 'Отменена' ? '#e74c3c' : '#27ae60',
                                    fontWeight: 'bold'
                                }}>
                                    {training.status}
                                </p>
                            </div>
                            <div style={styles.cardFooter}>
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                    <button 
                                        style={styles.btnSecondary}
                                        onClick={() => {
                                            setSelectedTraining(training);
                                            setModalMode('register');
                                            setStatusMsg({type:'', text:''});
                                        }}
                                        disabled={training.status !== 'Запланирована'}
                                    >
                                        Записать клиента
                                    </button>
                                    {canEdit && (
                                        <button 
                                            style={styles.btnEdit}
                                            onClick={() => handleEdit(training)}
                                        >
                                            ✏️
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button 
                                            style={styles.btnDelete}
                                            onClick={() => handleDelete(training)}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Модальное окно создания/редактирования */}
            {(modalMode === 'create' || modalMode === 'edit') && (
                <div style={styles.modalOverlay} onClick={() => setModalMode(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3>{modalMode === 'create' ? 'Новое занятие' : 'Редактирование занятия'}</h3>
                        <form onSubmit={modalMode === 'create' ? handleCreateSubmit : handleUpdate}>
                            <label style={styles.label}>Дата и время</label>
                            <input 
                                type="datetime-local" 
                                style={styles.inputFull}
                                value={createForm.date_time}
                                onChange={e => setCreateForm({...createForm, date_time: e.target.value})}
                                required 
                            />

                            {user.role !== 'trainer' && (
                                <>
                                    <label style={styles.label}>Тренер</label>
                                    <select 
                                        style={styles.inputFull}
                                        value={createForm.trainer}
                                        onChange={e => setCreateForm({...createForm, trainer: e.target.value})}
                                        required
                                    >
                                        <option value="">Выберите тренера</option>
                                        {trainers.map(t => <option key={t.id} value={t.id}>{t.surname} {t.name}</option>)}
                                    </select>
                                </>
                            )}

                            <label style={styles.label}>Тип тренировки</label>
                            <select 
                                style={styles.inputFull}
                                value={createForm.training_type}
                                onChange={e => setCreateForm({...createForm, training_type: e.target.value})}
                                required
                            >
                                <option value="">Выберите тип</option>
                                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>

                            <label style={styles.label}>Зал</label>
                            <select 
                                style={styles.inputFull}
                                value={createForm.hall}
                                onChange={e => setCreateForm({...createForm, hall: e.target.value})}
                                required
                            >
                                <option value="">Выберите зал</option>
                                {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>

                            <label style={styles.label}>Лимит участников</label>
                            <input 
                                type="number" 
                                style={styles.inputFull}
                                value={createForm.max_clients}
                                onChange={e => setCreateForm({...createForm, max_clients: e.target.value})}
                            />

                            {modalMode === 'edit' && (
                                <>
                                    <label style={styles.label}>Статус</label>
                                    <select 
                                        style={styles.inputFull}
                                        value={createForm.status}
                                        onChange={e => setCreateForm({...createForm, status: e.target.value})}
                                    >
                                        <option value="Запланирована">Запланирована</option>
                                        <option value="Отменена">Отменена</option>
                                        <option value="Завершена">Завершена</option>
                                    </select>
                                </>
                            )}

                            <div style={styles.btnGroup}>
                                <button type="submit" style={styles.btnPrimary}>
                                    {modalMode === 'create' ? 'Создать' : 'Сохранить'}
                                </button>
                                <button type="button" onClick={() => setModalMode(null)} style={styles.btnCancel}>
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно записи клиента */}
            {modalMode === 'register' && selectedTraining && (
                <div style={styles.modalOverlay} onClick={() => setModalMode(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3>Запись на {selectedTraining.type_name}</h3>
                        <p style={{fontSize: '0.9em', color: '#666'}}>
                            {new Date(selectedTraining.date_time).toLocaleString()} <br/>
                            Тренер: {selectedTraining.trainer_name}
                        </p>
                        <form onSubmit={handleRegisterSubmit}>
                            <label style={styles.label}>Выберите клиента</label>
                            <select 
                                style={styles.inputFull}
                                value={registerClientId}
                                onChange={e => setRegisterClientId(e.target.value)}
                                required
                            >
                                <option value="">Выберите из списка</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.surname} {c.name} - {c.phone}</option>
                                ))}
                            </select>
                            
                            <div style={styles.btnGroup}>
                                <button type="submit" style={styles.btnPrimary}>Записать</button>
                                <button type="button" onClick={() => setModalMode(null)} style={styles.btnCancel}>Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    filterBar: { display: 'flex', gap: '10px', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    card: { background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' },
    cardHeader: { background: '#f8f9fa', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' },
    cardBody: { padding: '15px', fontSize: '14px', lineHeight: '1.6' },
    cardFooter: { padding: '15px', borderTop: '1px solid #eee' },
    timeBadge: { background: '#3498db', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' },
    input: { padding: '8px', border: '1px solid #ddd', borderRadius: '4px' },
    inputFull: { width: '100%', padding: '10px', margin: '5px 0 15px', border: '1px solid #ddd', borderRadius: '4px' },
    label: { display: 'block', fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' },
    btnPrimary: { background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', flex: 1 },
    btnSecondary: { background: '#34495e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', flex: 1, fontSize: '13px' },
    btnEdit: { background: '#3498db', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' },
    btnDelete: { background: '#e74c3c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' },
    btnCancel: { background: '#ecf0f1', color: '#2c3e50', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', flex: 1 },
    btnGroup: { display: 'flex', gap: '10px', marginTop: '10px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '30px', borderRadius: '8px', width: '450px', maxWidth: '90%' },
};

export default Schedule;