import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

const styles = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' },
    card: { background: '#fff', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #27ae60', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    time: { fontWeight: 'bold', color: '#2c3e50', fontSize: '1.1em' },
    trainer: { color: '#7f8c8d', fontSize: '0.9em' },
    badge: { padding: '2px 8px', borderRadius: '12px', fontSize: '0.8em', float: 'right' }
};

const Schedule = () => {
    const [trainings, setTrainings] = useState([]);
    const [filter, setFilter] = useState('all');

    const loadSchedule = useCallback(async () => {
        try {
            const { data } = await api.get('trainings/');
            setTrainings(data);
        } catch (err) {
            console.error("Ошибка загрузки расписания", err);
        }
    }, []);

    useEffect(() => {
        loadSchedule();
    }, [loadSchedule]);

    return (
        <div>
            <div style={styles.header}>
                <h2>Расписание занятий</h2>
                <select onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px' }}>
                    <option value="all">Все направления</option>
                    <option value="yoga">Йога</option>
                    <option value="crossfit">Кроссфит</option>
                </select>
            </div>

            <div style={styles.grid}>
                {trainings.map(item => (
                    <div key={item.id} style={styles.card}>
                        <span style={{...styles.badge, backgroundColor: item.available_slots > 0 ? '#d4edda' : '#f8d7da'}}>
                            {item.available_slots > 0 ? `Мест: ${item.available_slots}` : 'Мест нет'}
                        </span>
                        <div style={styles.time}>{item.start_time.split('T')[1].substring(0, 5)} - {item.name}</div>
                        <div style={styles.trainer}>Тренер: {item.trainer_name}</div>
                        <div style={{ marginTop: '10px' }}>
                            <button 
                                disabled={item.available_slots === 0}
                                style={{ width: '100%', cursor: 'pointer' }}
                                onClick={() => alert(`Запись на ${item.name}`)}
                            >
                                Записать клиента
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Schedule;