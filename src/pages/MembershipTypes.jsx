import { useState, useEffect } from 'react';
import { membershipTypeApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const MembershipTypes = () => {
    const { user } = useAuth();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        duration_days: '',
        price: '',
        description: ''
    });

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setLoading(true);
        try {
            const res = await membershipTypeApi.getAll();
            setTypes(res.data || []);
        } catch (error) {
            console.error('Ошибка загрузки типов абонементов:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Менеджер может редактировать только цену
        if (user.role === 'manager' && editing) {
            try {
                await membershipTypeApi.update(editing.id, { price: formData.price });
                setModalOpen(false);
                loadTypes();
            } catch (error) {
                alert('Ошибка обновления цены');
            }
            return;
        }

        // Админ может создавать/полностью редактировать
        try {
            if (editing) {
                await membershipTypeApi.update(editing.id, formData);
            } else {
                await membershipTypeApi.create(formData);
            }
            setModalOpen(false);
            setEditing(null);
            setFormData({ name: '', duration_days: '', price: '', description: '' });
            loadTypes();
        } catch (error) {
            alert('Ошибка сохранения: ' + (error.response?.data?.detail || 'Проверьте данные'));
        }
    };

    const handleEdit = (type) => {
        setEditing(type);
        setFormData(type);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Удалить тип абонемента?')) return;
        
        try {
            await membershipTypeApi.delete(id);
            loadTypes();
        } catch (error) {
            alert('Ошибка удаления. Возможно, тип используется.');
        }
    };

    const columns = [
        { key: 'name', label: 'Название' },
        { key: 'duration_days', label: 'Срок (дней)' },
        { key: 'price', label: 'Цена (₽)' },
        { key: 'description', label: 'Описание' },
    ];

    const canCreate = user?.role === 'admin';
    const canEdit = user?.role === 'admin' || user?.role === 'manager';
    const canDelete = user?.role === 'admin';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Типы абонементов</h2>
                {canCreate && (
                    <button 
                        className="btn-primary" 
                        onClick={() => {
                            setEditing(null);
                            setFormData({ name: '', duration_days: '', price: '', description: '' });
                            setModalOpen(true);
                        }}
                    >
                        + Добавить тип
                    </button>
                )}
            </div>

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <div style={{ background: '#fff', borderRadius: '8px', padding: '20px' }}>
                    <Table
                        columns={columns}
                        data={types}
                        actions={canEdit ? (row) => (
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => handleEdit(row)} style={styles.btnEdit}>
                                    {user.role === 'manager' ? '💰 Цена' : '✏️ Изменить'}
                                </button>
                                {canDelete && (
                                    <button onClick={() => handleDelete(row.id)} style={styles.btnDelete}>
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ) : null}
                    />
                </div>
            )}

            {isModalOpen && (
                <Modal 
                    title={
                        editing 
                            ? (user.role === 'manager' ? 'Изменить цену' : 'Редактировать тип абонемента')
                            : 'Новый тип абонемента'
                    } 
                    onClose={() => setModalOpen(false)}
                >
                    <form onSubmit={handleSubmit}>
                        {user.role !== 'manager' && (
                            <>
                                <input
                                    className="form-input"
                                    placeholder="Название *"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    disabled={user.role === 'manager' && editing}
                                />
                                <input
                                    className="form-input"
                                    type="number"
                                    placeholder="Длительность (дней) *"
                                    value={formData.duration_days}
                                    onChange={e => setFormData({ ...formData, duration_days: e.target.value })}
                                    required
                                    disabled={user.role === 'manager' && editing}
                                />
                            </>
                        )}
                        
                        <input
                            className="form-input"
                            type="number"
                            step="0.01"
                            placeholder="Цена (₽) *"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            required
                        />

                        {user.role !== 'manager' && (
                            <textarea
                                className="form-input"
                                placeholder="Описание"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                disabled={user.role === 'manager' && editing}
                            />
                        )}

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
    btnEdit: { padding: '6px 12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
    btnDelete: { padding: '6px 12px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};

export default MembershipTypes;