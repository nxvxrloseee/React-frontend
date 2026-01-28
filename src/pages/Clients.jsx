import { useEffect, useState } from 'react';
import { clientApi } from '../api/api';
import ClientForm from '../components/clients/ClientFrom';
import ClientTable from '../components/clients/ClientTable';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [editing, setEditing] = useState(null);

    const [isOpen, setIsOpen] = useState(false);

    const load = async () => {
        const res = await clientApi.getAll();
        setClients(res.data);
    };

    useEffect(() => { load(); }, []);

    const create = async (data) => {
        await clientApi.create(data);
        load();
    };

    const update = async (id, data) => {
        await clientApi.update(id, data);
        setEditing(null);
        load();
    };

    const remove = async (id) => {
        if (confirm('Удалить клиента?')) {
            await clientApi.delete(id);
            load();
        }
    };

    return (
        <>
            <h1>Клиенты</h1>

            <ClientForm
                editing={editing}
                onSubmit={editing ? update : create}
                onCancel={() => setEditing(null)}
            />

            <ClientTable
                data={clients}
                onEdit={setEditing}
                onDelete={remove}
            />

            <Button onClick={() => setIsOpen(true)}>Добавить клиента</Button>

            {isOpen && (
                <Modal title="Клиент" onClose={() => setIsOpen(false)}>
                    <ClientForm 
                        onSubmit={(data) => {
                            create(data);
                            setIsOpen(false);
                        }}
                    />
                </Modal>
            )}
        </>
    );
};

export default Clients;
