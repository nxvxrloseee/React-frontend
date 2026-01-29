import { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';

const Reports = () => {
    const { can, isTrainer } = usePermissions();
    const [loading, setLoading] = useState(false);
    const [loadingReport, setLoadingReport] = useState(null);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
    });
    const [selectedReports, setSelectedReports] = useState([]);

    const downloadReport = async (reportType, fileName) => {
        try {
            setLoading(true);
            setLoadingReport(reportType);
            
            const token = localStorage.getItem('access_token'); 
            const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

            // ИСПРАВЛЕНИЕ: Убираем заголовок Accept: application/pdf
            // Django REST Framework возвращает ошибку 406 Not Acceptable,
            // когда получает Accept заголовок, который не соответствует его рендерерам.
            const response = await fetch(`${baseURL}/reports/${reportType}/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert("Сессия истекла. Пожалуйста, войдите заново.");
                    window.location.href = '/login';
                    return;
                }
                if (response.status === 403) {
                    alert("У вас нет прав для скачивания этого отчёта.");
                    return;
                }
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Ошибка при получении отчета:', error);
            alert("Не удалось скачать файл. Проверьте подключение к серверу.");
        } finally {
            setLoading(false);
            setLoadingReport(null);
        }
    };

    const toggleReportSelection = (reportType) => {
        setSelectedReports(prev => 
            prev.includes(reportType)
                ? prev.filter(r => r !== reportType)
                : [...prev, reportType]
        );
    };

    const reports = [
        {
            id: 'revenue',
            icon: '💰',
            title: 'Финансовый отчёт',
            subtitle: 'Доходы/расходы',
            description: 'Общий доход, типы оплат, выручка по периодам',
            color: '#27ae60',
            permission: 'financial',
            fileName: 'financial_report.pdf',
        },
        {
            id: 'attendance',
            icon: '📊',
            title: 'Посещаемость залов',
            subtitle: 'Статистика посещений',
            description: 'Количество посещений, популярные занятия',
            color: '#3498db',
            permission: 'attendance',
            fileName: 'attendance_report.pdf',
        },
        {
            id: 'trainer_performance',
            icon: '💪',
            title: 'Активность тренеров',
            subtitle: 'Эффективность работы',
            description: 'Количество тренировок, загруженность, рейтинг',
            color: '#9b59b6',
            permission: 'attendance',
            fileName: 'trainers_report.pdf',
        },
        {
            id: 'expiring_memberships',
            icon: '⏳',
            title: 'Истекающие абонементы',
            subtitle: 'Требуют внимания',
            description: 'Клиенты с истекающими абонементами (7 дней)',
            color: '#e74c3c',
            permission: 'financial',
            fileName: 'expiring_memberships.pdf',
        },
    ];

    // Фильтруем отчёты по правам доступа
    const availableReports = reports.filter(report => {
        if (isTrainer) {
            // Тренер видит только отчёт по своим занятиям
            return report.id === 'trainer_performance' || report.id === 'attendance';
        }
        return can('reports', report.permission);
    });

    return (
        <div style={styles.container}>
            {/* Заголовок */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Отчёты</h1>
                    <p style={styles.subtitle}>
                        Выберите период для анализа
                    </p>
                </div>
            </div>

            {/* Выбор периода */}
            <div style={styles.periodSection}>
                <div style={styles.periodCard}>
                    <h3 style={styles.periodTitle}>Выберите период для анализа</h3>
                    <div style={styles.dateInputs}>
                        <div style={styles.dateGroup}>
                            <label style={styles.dateLabel}>С:</label>
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                                style={styles.dateInput}
                            />
                        </div>
                        <div style={styles.dateGroup}>
                            <label style={styles.dateLabel}>По:</label>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                                style={styles.dateInput}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Выбор типа отчёта */}
            <div style={styles.sectionTitle}>Выберите тип отчёта</div>
            <div style={styles.reportsGrid}>
                {availableReports.map(report => (
                    <div 
                        key={report.id}
                        style={{
                            ...styles.reportCard,
                            borderColor: selectedReports.includes(report.id) ? report.color : '#e0e4e8',
                            backgroundColor: selectedReports.includes(report.id) ? `${report.color}08` : 'white',
                        }}
                        onClick={() => toggleReportSelection(report.id)}
                    >
                        <div style={styles.reportHeader}>
                            <input
                                type="checkbox"
                                checked={selectedReports.includes(report.id)}
                                onChange={() => toggleReportSelection(report.id)}
                                style={styles.checkbox}
                            />
                            <div style={{...styles.reportIcon, backgroundColor: `${report.color}15`, color: report.color}}>
                                {report.icon}
                            </div>
                        </div>
                        <h3 style={styles.reportTitle}>{report.title}</h3>
                        <p style={styles.reportSubtitle}>{report.subtitle}</p>
                        <p style={styles.reportDescription}>{report.description}</p>
                        <button
                            style={{
                                ...styles.downloadBtn,
                                backgroundColor: report.color,
                                opacity: loading && loadingReport !== report.id ? 0.5 : 1,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                downloadReport(report.id, report.fileName);
                            }}
                            disabled={loading}
                        >
                            {loadingReport === report.id ? (
                                <>
                                    <span style={styles.btnSpinner}></span>
                                    Формирование...
                                </>
                            ) : (
                                <>
                                    📥 Скачать PDF
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Предпросмотр (заглушка) */}
            {selectedReports.length > 0 && (
                <div style={styles.previewSection}>
                    <h3 style={styles.previewTitle}>Предпросмотр отчёта</h3>
                    <div style={styles.previewContent}>
                        <p style={styles.previewPlaceholder}>
                            Выбрано отчётов: {selectedReports.length}
                        </p>
                        <p style={styles.previewHint}>
                            Нажмите "Скачать PDF" для формирования отчёта
                        </p>
                    </div>
                </div>
            )}

            {/* Кнопки экспорта */}
            <div style={styles.exportSection}>
                <button 
                    className="btn btn-primary btn-lg"
                    disabled={selectedReports.length === 0 || loading}
                    onClick={() => {
                        selectedReports.forEach(reportId => {
                            const report = reports.find(r => r.id === reportId);
                            if (report) {
                                downloadReport(report.id, report.fileName);
                            }
                        });
                    }}
                >
                    📄 Экспорт в PDF
                </button>
                <button className="btn btn-outline btn-lg">
                    🖨️ Печать
                </button>
                <button 
                    className="btn btn-secondary btn-lg"
                    onClick={() => setSelectedReports([])}
                >
                    🔄 Очистить
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '10px',
    },
    header: {
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
    periodSection: {
        marginBottom: '32px',
    },
    periodCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    periodTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#2c3e50',
        margin: '0 0 16px',
    },
    dateInputs: {
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
    },
    dateGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    dateLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#7f8c8d',
    },
    dateInput: {
        padding: '10px 14px',
        border: '2px solid #e0e4e8',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: '16px',
    },
    reportsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
    },
    reportCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '2px solid #e0e4e8',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    reportHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
    },
    checkbox: {
        width: '20px',
        height: '20px',
        cursor: 'pointer',
    },
    reportIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
    },
    reportTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#2c3e50',
        margin: '0 0 4px',
    },
    reportSubtitle: {
        fontSize: '13px',
        color: '#7f8c8d',
        margin: '0 0 12px',
    },
    reportDescription: {
        fontSize: '14px',
        color: '#95a5a6',
        margin: '0 0 20px',
        lineHeight: '1.5',
    },
    downloadBtn: {
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'transform 0.2s',
    },
    btnSpinner: {
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    previewSection: {
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    previewTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#2c3e50',
        margin: '0 0 16px',
    },
    previewContent: {
        background: '#f8f9fa',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
    },
    previewPlaceholder: {
        fontSize: '16px',
        color: '#7f8c8d',
        margin: '0 0 8px',
    },
    previewHint: {
        fontSize: '13px',
        color: '#95a5a6',
        margin: 0,
    },
    exportSection: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
    },
};

// Добавляем keyframes
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default Reports;