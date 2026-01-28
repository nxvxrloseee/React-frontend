import { useEffect, useState } from 'react';

const ClientForm = ({ editing, onSubmit, onCancel }) => {
    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        is_active: true,
    });

    useEffect(() => {
        if (editing) setForm(editing);
    }, [editing]);

    const change = e => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const submit = e => {
        e.preventDefault();
        editing ? onSubmit(editing.id, form) : onSubmit(form);
        setForm({ full_name: '', phone: '', email: '', is_active: true });
    };

    return (
        <form onSubmit={submit}>
            <input name="full_name" placeholder="ФИО" value={form.full_name} onChange={change} />
            <input name="phone" placeholder="Телефон" value={form.phone} onChange={change} />
            <input name="email" placeholder="Email" value={form.email || ''} onChange={change} />
            <label>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={change} />
                Активен
            </label>

            <button type="submit">{editing ? 'Сохранить' : 'Добавить'}</button>
            {editing && <button onClick={onCancel}>Отмена</button>}
        </form>
    );
};

export default ClientForm;
