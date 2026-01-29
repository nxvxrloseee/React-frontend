const Table = ({ columns, data, actions, loading = false }) => {
    const renderCell = (column, row) => {
        if (column.render) {
            return column.render(row[column.key], row);
        }
        
        const value = row[column.key];
        
        // Обработка булевых значений
        if (typeof value === 'boolean') {
            return (
                <span className={`badge ${value ? 'badge-success' : 'badge-secondary'}`}>
                    {value ? 'Да' : 'Нет'}
                </span>
            );
        }
        
        // Обработка null/undefined
        if (value === null || value === undefined) {
            return <span style={{color: '#95a5a6'}}>—</span>;
        }
        
        return value;
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div className="spinner"></div>
                <p>Загрузка данных...</p>
            </div>
        );
    }

    return (
        <div style={styles.tableWrapper}>
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} style={col.width ? {width: col.width} : {}}>
                                {col.label}
                            </th>
                        ))}
                        {actions && <th style={{width: '150px'}}>Действия</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td 
                                colSpan={columns.length + (actions ? 1 : 0)} 
                                style={styles.emptyCell}
                            >
                                <div style={styles.emptyState}>
                                    <span style={styles.emptyIcon}>📋</span>
                                    <p>Нет данных для отображения</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr key={row.id || index}>
                                {columns.map(col => (
                                    <td key={col.key}>
                                        {renderCell(col, row)}
                                    </td>
                                ))}
                                {actions && (
                                    <td>
                                        <div style={styles.actionsCell}>
                                            {actions(row)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    tableWrapper: {
        overflowX: 'auto',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        gap: '16px',
        color: '#7f8c8d',
    },
    emptyCell: {
        padding: '40px',
        textAlign: 'center',
    },
    emptyState: {
        color: '#95a5a6',
    },
    emptyIcon: {
        fontSize: '32px',
        display: 'block',
        marginBottom: '12px',
    },
    actionsCell: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end',
    },
};

export default Table;