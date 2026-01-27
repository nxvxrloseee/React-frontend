import { useState, useEffect, useCallback } from 'react';
import { clientApi } from '../api/api';

const styles = {
    searchInput: { width: '100%', padding: '10px', marginBottom: '20px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    row: { borderBottom: '1px solid #eee' }
};

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const loadClients = useCallback(async () => {
        try {
            // fetch API возвращает { data, status, headers }
            const response = await clientApi.getAll(searchTerm);
            setClients(response.data);
        } catch (error) {
            console.error('Ошибка загрузки клиентов', error)
        }
    }, [searchTerm]);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    return (
        <div>
            <h2>Управление клиентами</h2>
            <div>
                <input
                    type="text"
                    placeholder="Поиск по фамилии или телефону..."
                    style={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <table style={styles.table}>
                <thead>
                    <tr style={{ backgroundColor: '#ecf0f1' }}>
                        <th>Фамилия</th>
                        <th>Имя</th>
                        <th>Телефон</th>
                        <th>Дата регистрации</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map(client => (
                        <tr key={client.id} style={styles.row}>
                            <td>{client.surname}</td>
                            <td>{client.name}</td>
                            <td>{client.phone}</td>
                            <td>{new Date(client.registration_date).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Clients;