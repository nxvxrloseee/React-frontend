import axios from 'axios';

// Используем переменную окружения для URL сервера
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Перехватчик для добавления токена в каждый запрос
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Перехватчик для обработки ошибок (например, если токен истек)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            // Здесь можно добавить логику обновления токена через /auth/refresh/
            // Если и это не помогло — разлогиниваем пользователя
        }
        return Promise.reject(error);
    }
);

// --- МЕТОДЫ API ---

export const authApi = {
    login: (credentials) => api.post('/auth/login/', credentials),
    refresh: (refresh) => api.post('/auth/refresh/', { refresh }),
};

export const clientApi = {
    // Поиск реализован на бэкенде через query-параметр ?search=
    getAll: (search = '') => api.get(`/clients/${search ? `?search=${search}` : ''}`),
    getById: (id) => api.get(`/clients/${id}/`),
    create: (data) => api.post('/clients/', data),
    update: (id, data) => api.put(`/clients/${id}/`, data),
    delete: (id) => api.delete(`/clients/${id}/`),
};

export const trainingApi = {
    getSchedule: () => api.get('/trainings/'),
    register: (trainingId, clientId) => api.post(`/trainings/${trainingId}/register_client/`, { client_id: clientId }),
};

export const reportApi = {
    // Получаем PDF как blob (двоичные данные) для скачивания
    getRevenue: () => api.get('/reports/revenue/', { responseType: 'blob' }),
    getAttendance: () => api.get('/reports/attendance/', { responseType: 'blob' }),
    getTrainers: () => api.get('/reports/trainer_performance/', { responseType: 'blob' }),
};

export default api;