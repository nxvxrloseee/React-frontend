const Table = ({ columns, data, actions }) => {
    const renderCell = (column, row) => {
        if (column.render) {
            return column.render(row[column.key], row);
        }
        
        const value = row[column.key];
        
        // Обработка булевых значений
        if (typeof value === 'boolean') {
            return value ? '✓' : '✗';
        }
        
        // Обработка null/undefined
        if (value === null || value === undefined) {
            return '-';
        }
        
        return value;
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
                <thead>
                    <tr style={styles.headerRow}>
                        {columns.map(col => (
                            <th key={col.key} style={styles.th}>{col.label}</th>
                        ))}
                        {actions && <th style={styles.th}>Действия</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td 
                                colSpan={columns.length + (actions ? 1 : 0)} 
                                style={styles.emptyCell}
                            >
                                Нет данных
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr key={row.id || index} style={styles.row}>
                                {columns.map(col => (
                                    <td key={col.key} style={styles.td}>
                                        {renderCell(col, row)}
                                    </td>
                                ))}
                                {actions && (
                                    <td style={styles.td}>
                                        {actions(row)}
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
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
    },
    headerRow: {
        backgroundColor: '#f8f9fa',
        borderBottom: '2px solid #dee2e6',
    },
    th: {
        padding: '12px',
        textAlign: 'left',
        fontWeight: '600',
        color: '#495057',
    },
    row: {
        borderBottom: '1px solid #dee2e6',
        transition: 'background-color 0.2s',
    },
    td: {
        padding: '12px',
    },
    emptyCell: {
        padding: '20px',
        textAlign: 'center',
        color: '#6c757d',
    },
};

export default Table;