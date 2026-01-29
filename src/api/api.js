const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

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
    
    // Удаляем Content-Type для blob запросов
    if (options.responseType === 'blob') {
        delete headers['Content-Type'];
    }
    
    const config = {
        method: options.method || 'GET',
        headers,
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }
    
    try {
        let response = await fetch(url, config);

        // Обработка 401 - попытка обновить токен
        if (response.status === 401 && !isRefreshing) {
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                isRefreshing = true;
                
                const refreshResponse = await fetch(`${API_URL}/auth/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    localStorage.setItem('access_token', data.access);
                    
                    config.headers['Authorization'] = `Bearer ${data.access}`;
                    isRefreshing = false;
                    return apiRequest(endpoint, options); 
                } else {
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
        
        // Обработка blob ответов (для PDF)
        if (options.responseType === 'blob') {
            return { data: await response.blob(), status: response.status };
        }
        
        const data = await response.json().catch(() => ({}));
        return { data, status: response.status };

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
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

// Clients API
export const clientApi = {
    getAll: (search = '') => apiRequest(search ? `/clients/?search=${search}` : '/clients/'),
    getById: (id) => apiRequest(`/clients/${id}/`),
    create: (data) => apiRequest('/clients/', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/clients/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/clients/${id}/`, { method: 'DELETE' }),
};

// Trainers API
export const trainerApi = {
    getAll: () => apiRequest('/trainers/'),
    getById: (id) => apiRequest(`/trainers/${id}/`),
    create: (data) => apiRequest('/trainers/', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/trainers/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/trainers/${id}/`, { method: 'DELETE' }),
};

// Halls API
export const hallApi = {
    getAll: () => apiRequest('/halls/'),
    getById: (id) => apiRequest(`/halls/${id}/`),
    create: (data) => apiRequest('/halls/', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/halls/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/halls/${id}/`, { method: 'DELETE' }),
};

// Membership API
export const membershipApi = {
    getAll: () => apiRequest('/memberships/'),
    getById: (id) => apiRequest(`/memberships/${id}/`),
    create: (data) => apiRequest('/memberships/', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/memberships/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/memberships/${id}/`, { method: 'DELETE' }),
};

// Membership Type API
export const membershipTypeApi = {
    getAll: () => apiRequest('/membership-types/'),
    getById: (id) => apiRequest(`/membership-types/${id}/`),
    create: (data) => apiRequest('/membership-types/', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/membership-types/${id}/`, { method: 'PUT', body: data }),
    patch: (id, data) => apiRequest(`/membership-types/${id}/`, { method: 'PATCH', body: data }),
    delete: (id) => apiRequest(`/membership-types/${id}/`, { method: 'DELETE' }),
};

// Trainings/Schedule API
export const trainingApi = {
    getAll: () => apiRequest('/trainings/'),
    getById: (id) => apiRequest(`/trainings/${id}/`),
    create: (data) => apiRequest('/trainings/', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/trainings/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/trainings/${id}/`, { method: 'DELETE' }),
    register: (trainingId, clientId) => apiRequest(`/trainings/${trainingId}/register_client/`, {
        method: 'POST',
        body: { client_id: clientId },
    }),
};

// Payments API
export const paymentApi = {
    getAll: () => apiRequest('/payments/'),
    getById: (id) => apiRequest(`/payments/${id}/`),
    create: (data) => apiRequest('/payments/', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/payments/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/payments/${id}/`, { method: 'DELETE' }),
};

// Attendance API
export const attendanceApi = {
    getAll: () => apiRequest('/attendance/'),
    getById: (id) => apiRequest(`/attendance/${id}/`),
    create: (data) => apiRequest('/attendance/', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/attendance/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/attendance/${id}/`, { method: 'DELETE' }),
};

// Reports API - ИСПРАВЛЕНО: убран Accept header
export const reportApi = {
    getRevenue: () => {
        const token = localStorage.getItem('access_token');
        return fetch(`${API_URL}/reports/revenue/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
        });
    },
    getAttendance: () => {
        const token = localStorage.getItem('access_token');
        return fetch(`${API_URL}/reports/attendance/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
        });
    },
    getTrainers: () => {
        const token = localStorage.getItem('access_token');
        return fetch(`${API_URL}/reports/trainer_performance/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
        });
    },
    getExpiringMemberships: () => {
        const token = localStorage.getItem('access_token');
        return fetch(`${API_URL}/reports/expiring_memberships/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
        });
    },
};

// Reference API (для dropdown'ов)
export const referenceApi = {
    getTrainers: () => trainerApi.getAll(),
    getHalls: () => hallApi.getAll(),
    getMembershipTypes: () => membershipTypeApi.getAll(),
};

// Generic export
export const api = {
    get: (url, options) => apiRequest(url, { ...options, method: 'GET' }),
    post: (url, body, options) => apiRequest(url, { ...options, method: 'POST', body }),
    put: (url, body, options) => apiRequest(url, { ...options, method: 'PUT', body }),
    delete: (url, options) => apiRequest(url, { ...options, method: 'DELETE' }),
};

export default api;