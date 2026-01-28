const Table = ({ columns, data, actions }) => (
    <table width="100%" cellPadding="8">
        <thead>
            <tr>
                {columns.map(col => <th key={col.key}>{col.label}</th>)}
                {actions && <th></th>}
            </tr>
        </thead>
        <tbody>
            {data.map(row => (
                <tr key={row.id}>
                    {columns.map(col => (
                        <td key={col.key}>{row[col.key] ?? '-'}</td>
                    ))}
                    {actions && <td>{actions(row)}</td>}
                </tr>
            ))}
        </tbody>
    </table>
);

export default Table;
