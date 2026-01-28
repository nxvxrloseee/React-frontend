import Table from '../ui/Table';

const ClientTable = ({ data, onEdit, onDelete }) => {
    const columns = [
        { key: 'full_name', label: 'ФИО' },
        { key: 'phone', label: 'Телефон' },
        { key: 'email', label: 'Email' },
        { key: 'is_active', label: 'Статус' },
    ];

    return (
        <Table
            columns={columns}
            data={data}
            actions={(row) => (
                <>
                    <button onClick={() => onEdit(row)}>✏️</button>
                    <button onClick={() => onDelete(row.id)}>🗑</button>
                </>
            )}
        />
    );
};

export default ClientTable;
