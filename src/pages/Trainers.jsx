import { useState, useEffect } from 'react';
import { trainerApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const Trainers = () => {
    const { user } = useAuth();
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        secondname: '',
        specialization: '',
        phone: ''
    });

    useEffect(() => {
        loadTrainers();
    }, []);

    const loadTrainers = async () => {
        setLoading(true);
        try {
            const res = await trainerApi.getAll();
            setTrainers(res.data || []);
        } catch (error) {
            console.error('Ошибка загрузки тренеров:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await trainerApi.update(editing.id, formData);
            } else {
                await trainerApi.create(formData);
            }
            setModalOpen(false);
            setEditing(null);
            setFormData({ name: '', surname: '', secondname: '', specialization: '', phone: '' });
            loadTrainers();
        } catch (error) {
            alert('Ошибка сохранения: ' + (error.response?.data?.phone?.[0] || 'Проверьте данные'));
        }
    };

    const handleEdit = (trainer) => {
        // Тренер может редактировать только свои данные
        if (user.role === 'trainer') {
            if (user.trainer !== trainer.id) {
                alert('Вы можете редактировать только свои данные');
                return;
            }
        }
        setEditing(trainer);
        setFormData(trainer);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Удалить тренера?')) return;
        
        try {
            await trainerApi.delete(id);
            loadTrainers();
        } catch (error) {
            alert('Ошибка удаления');
        }
    };

    const columns = [
        { key: 'surname', label: 'Фамилия' },
        { key: 'name', label: 'Имя' },
        { key: 'specialization', label: 'Специализация' },
        { key: 'phone', label: 'Телефон' },
    ];

    const canEdit = user?.role === 'admin';
    const canDelete = user?.role === 'admin';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Тренеры</h2>
                {user?.role === 'admin' && (
                    <button 
                        className="btn-primary" 
                        onClick={() => {
                            setEditing(null);
                            setFormData({ name: '', surname: '', secondname: '', specialization: '', phone: '' });
                            setModalOpen(true);
                        }}
                    >
                        + Добавить тренера
                    </button>
                )}
            </div>

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <div style={{ background: '#fff', borderRadius: '8px', padding: '20px' }}>
                    <Table
                        columns={columns}
                        data={trainers}
                        actions={(row) => (
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {(canEdit || (user.role === 'trainer' && user.trainer === row.id)) && (
                                    <button onClick={() => handleEdit(row)} style={styles.btnEdit}>
                                        ✏️ Изменить
                                    </button>
                                )}
                                {canDelete && (
                                    <button onClick={() => handleDelete(row.id)} style={styles.btnDelete}>
                                        🗑️
                                    </button>
                                )}
                            </div>
                        )}
                    />
                </div>
            )}

            {isModalOpen && (
                <Modal 
                    title={editing ? 'Редактировать тренера' : 'Новый тренер'} 
                    onClose={() => setModalOpen(false)}
                >
                    <form onSubmit={handleSubmit}>
                        <input
                            className="form-input"
                            placeholder="Фамилия *"
                            value={formData.surname}
                            onChange={e => setFormData({ ...formData, surname: e.target.value })}
                            required
                        />
                        <input
                            className="form-input"
                            placeholder="Имя *"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <input
                            className="form-input"
                            placeholder="Отчество"
                            value={formData.secondname || ''}
                            onChange={e => setFormData({ ...formData, secondname: e.target.value })}
                        />
                        <input
                            className="form-input"
                            placeholder="Специализация *"
                            value={formData.specialization}
                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                            required
                        />
                        <input
                            className="form-input"
                            placeholder="Телефон *"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                                {editing ? 'Сохранить' : 'Создать'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                style={{ flex: 1, padding: '10px', background: '#ecf0f1', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
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
    btnEdit: { padding: '6px 12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    btnDelete: { padding: '6px 12px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};

export default Trainers;