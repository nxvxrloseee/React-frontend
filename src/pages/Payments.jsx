import { useState, useEffect } from 'react';
import { api, clientApi } from '../api/api';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Состояние формы нового платежа
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        client: '',
        amount: '',
        payment_method: 'Cash',
        comment: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Загружаем платежи и клиентов параллельно
            const [payRes, clientRes] = await Promise.all([
                api.get('/payments/'),
                clientApi.getAll()
            ]);
            setPayments(payRes.data);
            setClients(clientRes.data);
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePayment = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/payments/', formData);
            if (response.status === 201 || response.status === 200) {
                setShowModal(false);
                setFormData({ client: '', amount: '', payment_method: 'Cash', comment: '' });
                loadData(); // Обновляем список
            }
        } catch (error) {
            console.log(error);
            alert("Ошибка при регистрации платежа");
        }
    };

    // Фильтрация платежей по ФИО клиента
    const filteredPayments = payments.filter(p => 
        p.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>Учет платежей</h2>
                <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
                    + Зарегистрировать оплату
                </button>
            </div>

            <div style={styles.filterBar}>
                <input 
                    type="text" 
                    placeholder="Поиск по фамилии клиента..." 
                    style={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.trHead}>
                            <th>ID</th>
                            <th>Дата</th>
                            <th>Клиент</th>
                            <th>Сумма</th>
                            <th>Метод</th>
                            <th>Комментарий</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.length > 0 ? filteredPayments.map(p => (
                            <tr key={p.id} style={styles.tr}>
                                <td>{p.id}</td>
                                <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                                <td style={{fontWeight: '500'}}>{p.client_name}</td>
                                <td style={styles.amountText}>{parseFloat(p.amount).toLocaleString()} ₽</td>
                                <td>
                                    <span style={{
                                        ...styles.badge, 
                                        backgroundColor: p.payment_method === 'Cash' ? '#e8f5e9' : '#e3f2fd',
                                        color: p.payment_method === 'Cash' ? '#2e7d32' : '#1565c0'
                                    }}>
                                        {p.payment_method === 'Cash' ? 'Наличные' : 'Карта'}
                                    </span>
                                </td>
                                <td style={styles.commentCell}>{p.comment || '-'}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Платежи не найдены</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Модальное окно создания платежа */}
            {showModal && (
                <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3>Новый платеж</h3>
                        <form onSubmit={handleCreatePayment}>
                            <label style={styles.label}>Клиент</label>
                            <select 
                                style={styles.input} 
                                required
                                value={formData.client}
                                onChange={e => setFormData({...formData, client: e.target.value})}
                            >
                                <option value="">-- Выберите клиента --</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.surname} {c.name}</option>
                                ))}
                            </select>

                            <label style={styles.label}>Сумма (₽)</label>
                            <input 
                                type="number" 
                                style={styles.input} 
                                required 
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                            />

                            <label style={styles.label}>Метод оплаты</label>
                            <select 
                                style={styles.input}
                                value={formData.payment_method}
                                onChange={e => setFormData({...formData, payment_method: e.target.value})}
                            >
                                <option value="Cash">Наличные</option>
                                <option value="Card">Банковская карта</option>
                            </select>

                            <label style={styles.label}>Комментарий</label>
                            <textarea 
                                style={{...styles.input, height: '80px'}}
                                value={formData.comment}
                                onChange={e => setFormData({...formData, comment: e.target.value})}
                            />

                            <div style={styles.btnGroup}>
                                <button type="submit" style={styles.btnPrimary}>Сохранить</button>
                                <button type="button" style={styles.btnCancel} onClick={() => setShowModal(false)}>Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '10px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    btnPrimary: { background: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    btnCancel: { background: '#bdc3c7', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' },
    filterBar: { marginBottom: '20px' },
    searchInput: { width: '100%', maxWidth: '400px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' },
    tableCard: { background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    trHead: { background: '#f8f9fa', borderBottom: '2px solid #eee' },
    tr: { borderBottom: '1px solid #eee' },
    amountText: { fontWeight: 'bold', color: '#2c3e50' },
    badge: { padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
    commentCell: { color: '#7f8c8d', fontSize: '13px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '30px', borderRadius: '8px', width: '450px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' },
    input: { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
    btnGroup: { display: 'flex', gap: '10px', marginTop: '10px' }
};

export default Payments;