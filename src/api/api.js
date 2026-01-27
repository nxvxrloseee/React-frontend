const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Флаг, чтобы не зациклиться, если рефреш-токен тоже протух
let isRefreshing = false;

async function apiRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    let token = localStorage.getItem('access_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        method: options.method || 'GET',
        headers,
        ...options,
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }
    
    try {
        let response = await fetch(url, config);

        // --- ЛОГИКА ВОССТАНОВЛЕНИЯ СЕССИИ (401 Error) ---
        if (response.status === 401 && !isRefreshing) {
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                isRefreshing = true;
                
                // Пытаемся обновить токен
                const refreshResponse = await fetch(`${API_URL}/auth/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    // Сохраняем новый access токен
                    localStorage.setItem('access_token', data.access);
                    
                    // Повторяем изначальный запрос с новым токеном
                    config.headers['Authorization'] = `Bearer ${data.access}`;
                    isRefreshing = false;
                    return apiRequest(endpoint, options); 
                } else {
                    // Рефреш токен тоже не подошел — разлогиниваем
                    isRefreshing = false;
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(`HTTP Error: ${response.status}`);
            error.response = { status: response.status, data: errorData };
            throw error;
        }
        
        // Возвращаем данные
        if (options.responseType === 'blob') return { data: await response.blob(), status: response.status };
        const data = await response.json().catch(() => ({}));
        return { data, status: response.status };

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Методы API
export const authApi = {
    login: async (credentials) => {
        const res = await apiRequest('/auth/login/', {
            method: 'POST',
            body: credentials,
        });
        if (res.data.access) {
            localStorage.setItem('access_token', res.data.access);
            localStorage.setItem('refresh_token', res.data.refresh);
        }
        return res;
    },
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
    }
};

export const clientApi = {
    getAll: (search = '') => apiRequest(search ? `/clients/?search=${search}` : '/clients/'),
    create: (data) => apiRequest('/clients/', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/clients/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/clients/${id}/`, { method: 'DELETE' }),
};

export const trainingApi = {
    getSchedule: () => apiRequest('/trainings/'),
    create: (data) => apiRequest('/trainings/', { method: 'POST', body: data }),
    register: (trainingId, clientId) => apiRequest(`/trainings/${trainingId}/register_client/`, {
        method: 'POST',
        body: { client_id: clientId },
    }),
};

export const referenceApi = {
    getTrainers: () => apiRequest('/trainers/'),
    getHalls: () => apiRequest('/halls/'),
    getMembershipTypes: () => apiRequest('/memberships/'),
};

export const reportApi = {
    getRevenue: async () => apiRequest('/reports/revenue/', { method: 'GET', responseType: 'blob' }),
    getAttendance: async () => apiRequest('/reports/attendance/', { method: 'GET', responseType: 'blob' }),
    getTrainers: async () => apiRequest('/reports/trainer_performance/', { method: 'GET', responseType: 'blob' }),
};

// Generic export
export const api = {
    get: (url, options) => apiRequest(url, { ...options, method: 'GET' }),
    post: (url, body, options) => apiRequest(url, { ...options, method: 'POST', body }),
    put: (url, body, options) => apiRequest(url, { ...options, method: 'PUT', body }),
    delete: (url, options) => apiRequest(url, { ...options, method: 'DELETE' }),
};

export default api;