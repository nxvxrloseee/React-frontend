import { useEffect, useState } from 'react';
import { trainerApi } from '../api/api';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const Trainers = () => {
    const { can, isAdmin, isTrainer, user } = usePermissions();
    
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [specializationFilter, setSpecializationFilter] = useState('all');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        secondname: '',
        phone: '',
        email: '',
        specialization: '',
        experience_years: '',
        salary: '',
        is_active: true,
    });

    useEffect(() => { 
        loadTrainers(); 
    }, []);

    const loadTrainers = async () => {
        setLoading(true);
        try {
            const res = await trainerApi.getAll();
            let data = res.data || [];
            
            // Тренер видит ограниченную информацию о других тренерах
            if (isTrainer) {
                data = data.map(t => ({
                    ...t,
                    // Скрываем зарплату для других тренеров
                    salary: t.id === user?.trainer ? t.salary : null,
                    phone: t.id === user?.trainer ? t.phone : '***',
                }));
            }
            
            setTrainers(data);
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
            resetForm();
            loadTrainers();
        } catch (error) {
            alert('Ошибка сохранения: ' + (error.response?.data?.phone?.[0] || 'Проверьте данные'));
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            surname: '',
            secondname: '',
            phone: '',
            email: '',
            specialization: '',
            experience_years: '',
            salary: '',
            is_active: true,
        });
    };

    const handleEdit = (trainer) => {
        // Тренер может редактировать только свои данные
        if (isTrainer && trainer.id !== user?.trainer) {
            alert('Вы можете редактировать только свой профиль');
            return;
        }
        
        setEditing(trainer);
        setFormData({
            name: trainer.name || '',
            surname: trainer.surname || '',
            secondname: trainer.secondname || '',
            phone: trainer.phone || '',
            email: trainer.email || '',
            specialization: trainer.specialization || '',
            experience_years: trainer.experience_years || '',
            salary: trainer.salary || '',
            is_active: trainer.is_active !== false,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Вы уверены, что хотите удалить тренера?')) return;
        
        try {
            await trainerApi.delete(id);
            loadTrainers();
        } catch (error) {
            alert('Ошибка удаления. Возможно, у тренера есть активные занятия.');
        }
    };

    // Получить уникальные специализации
    const specializations = [...new Set(trainers.map(t => t.specialization).filter(Boolean))];

    // Фильтрация тренеров
    const filteredTrainers = trainers.filter(trainer => {
        const fullName = `${trainer.surname} ${trainer.name} ${trainer.secondname || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                             trainer.phone?.includes(searchTerm) ||
                             trainer.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (specializationFilter === 'all') return matchesSearch;
        return matchesSearch && trainer.specialization === specializationFilter;
    });

    const columns = [
        { 
            key: 'fullName', 
            label: 'ФИО',
            render: (_, row) => (
                <div>
                    <div style={{fontWeight: 600}}>
                        {`${row.surname} ${row.name} ${row.secondname || ''}`.trim()}
                    </div>
                    {row.id === user?.trainer && (
                        <span className="badge badge-info" style={{fontSize: '10px'}}>Это вы</span>
                    )}
                </div>
            )
        },
        { key: 'phone', label: 'Телефон' },
        { 
            key: 'specialization', 
            label: 'Специализация',
            render: (val) => val || <span style={{color: '#95a5a6'}}>Не указана</span>
        },
        { 
            key: 'experience_years', 
            label: 'Опыт (лет)',
            render: (val) => val ? `${val} лет` : '—'
        },
        { 
            key: 'is_active', 
            label: 'Статус',
            render: (val) => (
                <span className={`badge ${val !== false ? 'badge-success' : 'badge-secondary'}`}>
                    {val !== false ? 'Активен' : 'Неактивен'}
                </span>
            )
        },
    ];

    // Добавляем колонку с зарплатой только для админа
    if (isAdmin) {
        columns.push({
            key: 'salary',
            label: 'Зарплата',
            render: (val) => val ? `${parseFloat(val).toLocaleString()} ₽` : '—'
        });
    }

    return (
        <div style={styles.container}>
            {/* Заголовок */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Тренеры</h1>
                    <p style={styles.subtitle}>
                        Всего: {trainers.length} • Активных: {trainers.filter(t => t.is_active !== false).length}
                    </p>
                </div>
                {can('trainers', 'create') && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            setEditing(null);
                            resetForm();
                            setModalOpen(true);
                        }}
                    >
                        + Добавить тренера
                    </button>
                )}
            </div>

            {/* Фильтры */}
            <div style={styles.filters}>
                <input
                    type="text"
                    placeholder="Поиск по ФИО, телефону, специализации..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    style={{flex: 1, maxWidth: '400px'}}
                />
                <div style={styles.filterButtons}>
                    <button 
                        className={`filter-btn ${specializationFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setSpecializationFilter('all')}
                    >
                        Все
                    </button>
                    {specializations.map(spec => (
                        <button 
                            key={spec}
                            className={`filter-btn ${specializationFilter === spec ? 'active' : ''}`}
                            onClick={() => setSpecializationFilter(spec)}
                        >
                            {spec}
                        </button>
                    ))}
                </div>
            </div>

            {/* Карточки тренеров (мобильный вид) или таблица */}
            {loading ? (
                <div style={styles.loading}>
                    <div className="spinner"></div>
                    <p>Загрузка тренеров...</p>
                </div>
            ) : (
                <div className="card">
                    <Table
                        columns={columns}
                        data={filteredTrainers}
                        actions={(row) => {
                            // Тренер видит кнопку редактирования только для себя
                            const canEditThis = isAdmin || (isTrainer && row.id === user?.trainer);
                            
                            return (
                                <div style={styles.actions}>
                                    {canEditThis && (
                                        <button 
                                            className="btn btn-sm btn-outline"
                                            onClick={() => handleEdit(row)}
                                        >
                                            ✏️ {isTrainer ? 'Мой профиль' : 'Изменить'}
                                        </button>
                                    )}
                                    {can('trainers', 'delete') && (
                                        <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(row.id)}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            );
                        }}
                    />
                    {filteredTrainers.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">🏋️</div>
                            <p className="empty-state-text">
                                {searchTerm || specializationFilter !== 'all' 
                                    ? 'Тренеры не найдены' 
                                    : 'Список тренеров пуст'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Модальное окно */}
            {isModalOpen && (
                <Modal 
                    title={editing ? 'Редактировать тренера' : 'Новый тренер'} 
                    onClose={() => setModalOpen(false)}
                    size="large"
                >
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGrid}>
                            <div>
                                <div className="form-label">Фамилия *</div>
                                <input
                                    className="form-input"
                                    placeholder="Введите фамилию"
                                    value={formData.surname}
                                    onChange={e => setFormData({ ...formData, surname: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <div className="form-label">Имя *</div>
                                <input
                                    className="form-input"
                                    placeholder="Введите имя"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="form-label">Отчество</div>
                        <input
                            className="form-input"
                            placeholder="Введите отчество"
                            value={formData.secondname}
                            onChange={e => setFormData({ ...formData, secondname: e.target.value })}
                        />
                        
                        <div style={styles.formGrid}>
                            <div>
                                <div className="form-label">Телефон *</div>
                                <input
                                    className="form-input"
                                    placeholder="+7 (999) 123-45-67"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <div className="form-label">Email</div>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="example@mail.ru"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-label">Специализация</div>
                        <select
                            className="form-select"
                            value={formData.specialization}
                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                        >
                            <option value="">Выберите специализацию</option>
                            <option value="Йога">Йога</option>
                            <option value="Силовые">Силовые тренировки</option>
                            <option value="Кардио">Кардио</option>
                            <option value="Персональная">Персональные тренировки</option>
                            <option value="Групповые">Групповые занятия</option>
                            <option value="Плавание">Плавание</option>
                            <option value="Единоборства">Единоборства</option>
                        </select>
                        
                        <div style={styles.formGrid}>
                            <div>
                                <div className="form-label">Опыт работы (лет)</div>
                                <input
                                    className="form-input"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.experience_years}
                                    onChange={e => setFormData({ ...formData, experience_years: e.target.value })}
                                />
                            </div>
                            {isAdmin && (
                                <div>
                                    <div className="form-label">Зарплата (₽)</div>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.salary}
                                        onChange={e => setFormData({ ...formData, salary: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            Активен (принимает клиентов)
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
        flexWrap: 'wrap',
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
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
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

export default Trainers;