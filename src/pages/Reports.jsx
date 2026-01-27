import { useState } from 'react';
import { reportApi } from '../api/api';

const styles = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    card: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', textAlign: 'center' },
    button: { marginTop: '15px', padding: '10px 20px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    loading: { opacity: 0.5, cursor: 'not-allowed' }
};

const Reports = () => {
    const [loading, setLoading] = useState(null);

    const downloadReport = async (type) => {
        setLoading(type);
        try {
            let response;
            
            // Вызываем соответствующий метод API
            if (type === 'revenue') {
                response = await reportApi.getRevenue();
            } else if (type === 'attendance') {
                response = await reportApi.getAttendance();
            } else if (type === 'trainer_performance') {
                response = await reportApi.getTrainers();
            }
            
            // response.data теперь содержит Blob
            const blob = response.data;
            
            // Создаем временную ссылку для скачивания
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report_${type}_${new Date().toLocaleDateString()}.pdf`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            // Освобождаем память
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Ошибка при генерации отчета. Проверьте права доступа.');
            console.log(error)
        } finally {
            setLoading(null);
        }
    };

    const reportTypes = [
        { id: 'revenue', title: 'Финансовый отчет', desc: 'Доходы, долги и статистика платежей' },
        { id: 'attendance', title: 'Отчет посещаемости', desc: 'Анализ визитов клиентов в зал' },
        { id: 'trainer_performance', title: 'Работа тренеров', desc: 'Количество занятий и рейтинг сотрудников' }
    ];

    return (
        <div>
            <h2 style={{ marginBottom: '20px' }}>Аналитическая отчетность</h2>
            <div style={styles.grid}>
                {reportTypes.map((report) => (
                    <div key={report.id} style={styles.card}>
                        <h3>{report.title}</h3>
                        <p style={{ color: '#7f8c8d' }}>{report.desc}</p>
                        <button 
                            style={loading === report.id ? {...styles.button, ...styles.loading} : styles.button}
                            onClick={() => downloadReport(report.id)}
                            disabled={loading === report.id}
                        >
                            {loading === report.id ? 'Генерация...' : 'Скачать PDF'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reports;