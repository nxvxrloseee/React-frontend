import { useState, useEffect } from 'react';
import { hallApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const Halls = () => {
    const { user } = useAuth();
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        capacity: '',
        equipment: ''
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
            setFormData({ name: '', capacity: '', equipment: '' });
            loadHalls();
        } catch (error) {
            alert('Ошибка сохранения: ' + (error.response?.data?.name?.[0] || 'Проверьте данные'));
        }
    };

    const handleEdit = (hall) => {
        setEditing(hall);
        setFormData(hall);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Удалить зал?')) return;
        
        try {
            await hallApi.delete(id);
            loadHalls();
        } catch (error) {
            alert('Ошибка удаления. Возможно, зал используется в расписании.');
        }
    };

    const columns = [
        { key: 'name', label: 'Название' },
        { key: 'capacity', label: 'Вместимость' },
        { key: 'equipment', label: 'Оборудование' },
    ];

    const isAdmin = user?.role === 'admin';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Залы</h2>
                {isAdmin && (
                    <button 
                        className="btn-primary" 
                        onClick={() => {
                            setEditing(null);
                            setFormData({ name: '', capacity: '', equipment: '' });
                            setModalOpen(true);
                        }}
                    >
                        + Добавить зал
                    </button>
                )}
            </div>

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <div style={{ background: '#fff', borderRadius: '8px', padding: '20px' }}>
                    <Table
                        columns={columns}
                        data={halls}
                        actions={isAdmin ? (row) => (
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => handleEdit(row)} style={styles.btnEdit}>
                                    ✏️ Изменить
                                </button>
                                <button onClick={() => handleDelete(row.id)} style={styles.btnDelete}>
                                    🗑️
                                </button>
                            </div>
                        ) : null}
                    />
                </div>
            )}

            {isModalOpen && (
                <Modal 
                    title={editing ? 'Редактировать зал' : 'Новый зал'} 
                    onClose={() => setModalOpen(false)}
                >
                    <form onSubmit={handleSubmit}>
                        <input
                            className="form-input"
                            placeholder="Название зала *"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <input
                            className="form-input"
                            type="number"
                            placeholder="Вместимость (человек) *"
                            value={formData.capacity}
                            onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                            required
                        />
                        <textarea
                            className="form-input"
                            placeholder="Оборудование (например: беговые дорожки, тренажеры)"
                            value={formData.equipment || ''}
                            onChange={e => setFormData({ ...formData, equipment: e.target.value })}
                            rows="4"
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

export default Halls;