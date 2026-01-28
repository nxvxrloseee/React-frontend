import { useEffect, useState } from 'react';
import { clientApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const Clients = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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
        loadClients(); 
    }, []);

    const loadClients = async () => {
        setLoading(true);
        try {
            const res = await clientApi.getAll(searchTerm);
            setClients(res.data || []);
        } catch (error) {
            console.error('Ошибка загрузки клиентов:', error);
        } finally {
            setLoading(false);
        }
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
            loadClients();
        } catch (error) {
            const msg = error.response?.data?.phone?.[0] || error.response?.data?.detail || 'Ошибка сохранения';
            alert(msg);
        }
    };

    const handleEdit = (client) => {
        setEditing(client);
        setFormData(client);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Удалить клиента?')) return;
        
        try {
            await clientApi.delete(id);
            loadClients();
        } catch (error) {
            alert('Ошибка удаления. Возможно, у клиента есть активные абонементы.');
        }
    };

    const columns = [
        { key: 'surname', label: 'Фамилия' },
        { key: 'name', label: 'Имя' },
        { key: 'phone', label: 'Телефон' },
        { key: 'email', label: 'Email' },
        { 
            key: 'birth_date', 
            label: 'Дата рождения',
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        },
    ];

    const canEdit = user?.role === 'admin' || user?.role === 'manager';
    const canDelete = user?.role === 'admin';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                    <h2>Клиенты</h2>
                    <input
                        type="text"
                        placeholder="🔍 Поиск по ФИО или телефону..."
                        style={{
                            padding: '10px',
                            width: '100%',
                            maxWidth: '400px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            marginTop: '10px'
                        }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && loadClients()}
                    />
                </div>
                {canEdit && (
                    <button 
                        className="btn-primary" 
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

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <div style={{ background: '#fff', borderRadius: '8px', padding: '20px' }}>
                    <Table
                        columns={columns}
                        data={clients}
                        actions={(row) => (
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {canEdit && (
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
                    title={editing ? 'Редактировать клиента' : 'Новый клиент'} 
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
                            type="date"
                            placeholder="Дата рождения *"
                            value={formData.birth_date}
                            onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                            required
                        />
                        <input
                            className="form-input"
                            placeholder="Телефон *"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                        <input
                            className="form-input"
                            type="email"
                            placeholder="Email"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
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

export default Clients;