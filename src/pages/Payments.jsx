import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

const styles = {
    container: { maxWidth: '800px', margin: '0 auto' },
    form: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '30px' },
    input: { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' },
    button: { padding: '10px 20px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    error: { color: '#e74c3c', marginBottom: '15px', fontWeight: 'bold' },
    success: { color: '#27ae60', marginBottom: '15px', fontWeight: 'bold' }
};

const Payments = () => {
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({ client: '', amount: '', purpose: 'Абонемент' });
    const [status, setStatus] = useState({ type: '', message: '' });

    // Загрузка списка клиентов для Select
    const loadClients = useCallback(async () => {
        try {
            const { data } = await api.get('clients/');
            setClients(data);
        } catch (err) {
            console.error("Ошибка при загрузке клиентов", err);
        }
    }, []);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        try {
            // Отправка на Django: /api/payments/
            await api.post('payments/', formData);
            setStatus({ type: 'success', message: 'Платеж успешно зарегистрирован!' });
            setFormData({ client: '', amount: '', purpose: 'Абонемент' }); // Очистка
        } catch (err) {
            // Ловим ошибку валидации от Django (например, отрицательная сумма)
            const errorMsg = err.response?.data?.amount?.[0] || 'Ошибка при сохранении платежа';
            setStatus({ type: 'error', message: errorMsg });
        }
    };

    return (
        <div style={styles.container}>
            <h2>Регистрация платежа</h2>
            
            {status.message && (
                <div style={status.type === 'error' ? styles.error : styles.success}>
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
                <label>Выберите клиента:</label>
                <select 
                    style={styles.input}
                    value={formData.client}
                    onChange={(e) => setFormData({...formData, client: e.target.value})}
                    required
                >
                    <option value="">--- Выберите из списка ---</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.surname} {c.name}</option>
                    ))}
                </select>

                <label>Сумма (руб.):</label>
                <input 
                    type="number"
                    style={styles.input}
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="Например: 5000"
                    required
                />

                <label>Назначение:</label>
                <select 
                    style={styles.input}
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                >
                    <option value="Абонемент">Оплата абонемента</option>
                    <option value="Разовое">Разовое занятие</option>
                    <option value="Доп.услуги">Дополнительные услуги</option>
                </select>

                <button type="submit" style={styles.button}>Провести платеж</button>
            </form>
        </div>
    );
};

export default Payments;