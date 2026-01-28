import React, { useState } from 'react';
import api from '../api/api'; // Ваш настроенный axios инстанс
import axios from 'axios';
const Reports = () => {
    const [loading, setLoading] = useState(false);

const downloadReport = async (reportType, fileName) => {
    try {
        setLoading(true);
        
        // 1. Извлекаем актуальный токен
        const token = localStorage.getItem('token'); 
        
        // 2. Берем базовый URL из окружения Vite
        const baseURL = import.meta.env.VITE_API_URL; 

        // 3. Выполняем запрос
        const response = await axios({
            url: `${baseURL}/reports/${reportType}/`,
            method: 'GET',
            responseType: 'blob', // Обязательно для WeasyPrint PDF
            headers: {
                // ВАЖНО: Проверьте, что префикс Bearer совпадает с вашим бэкендом
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/pdf',
            },
        });

        // 4. Создаем объект в памяти браузера
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        
        // 5. Имитируем клик для скачивания
        link.click();

        // 6. Подметаем за собой
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        if (error.response && error.response.status === 401) {
            alert("Сессия истекла или токен невалиден. Перезайдите в систему.");
        } else {
            console.error('Ошибка при получении отчета:', error);
            alert("Не удалось скачать файл. Проверьте консоль.");
        }
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="reports-container" style={{ padding: '20px' }}>
            <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>Генерация отчетов</h1>
            
            <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                
                {/* Финансовый отчет */}
                <div style={styles.card}>
                    <div style={styles.icon}>💰</div>
                    <h3>Финансовый отчёт</h3>
                    <p style={styles.desc}>Доходы, типы оплат, выручка по дням.</p>
                    <button 
                        style={styles.button} 
                        onClick={() => downloadReport('revenue', 'financial_report.pdf')}
                        disabled={loading}
                    >
                        {loading ? 'Загрузка...' : 'Скачать PDF'}
                    </button>
                </div>

                {/* Отчет по посещаемости */}
                <div style={styles.card}>
                    <div style={styles.icon}>📈</div>
                    <h3>Посещаемость</h3>
                    <p style={styles.desc}>Загрузка залов, популярные занятия, пиковые часы.</p>
                    <button 
                        style={styles.button} 
                        onClick={() => downloadReport('attendance', 'attendance_report.pdf')}
                        disabled={loading}
                    >
                        {loading ? 'Загрузка...' : 'Скачать PDF'}
                    </button>
                </div>

                {/* Эффективность тренеров */}
                <div style={styles.card}>
                    <div style={styles.icon}>💪</div>
                    <h3>Эффективность тренеров</h3>
                    <p style={styles.desc}>Количество тренировок, рейтинг, принесенный доход.</p>
                    <button 
                        style={styles.button} 
                        onClick={() => downloadReport('trainer_performance', 'trainers_report.pdf')}
                        disabled={loading}
                    >
                        {loading ? 'Загрузка...' : 'Скачать PDF'}
                    </button>
                </div>

                {/* Истекающие абонементы */}
                <div style={styles.card}>
                    <div style={styles.icon}>⏳</div>
                    <h3>Истекающие абонементы</h3>
                    <p style={styles.desc}>Клиенты, у которых скоро закончится абонемент.</p>
                    <button 
                        style={{...styles.button, backgroundColor: '#e74c3c'}} 
                        onClick={() => downloadReport('expiring_memberships', 'expiring_memberships.pdf')}
                        disabled={loading}
                    >
                        {loading ? 'Загрузка...' : 'Скачать PDF'}
                    </button>
                </div>

            </div>
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        border: '1px solid #eee'
    },
    icon: {
        fontSize: '40px',
        marginBottom: '15px'
    },
    desc: {
        color: '#7f8c8d',
        marginBottom: '20px',
        flex: 1
    },
    button: {
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        width: '100%',
        transition: 'background 0.2s'
    }
};

export default Reports;