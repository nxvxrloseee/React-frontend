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
        
        if (options.responseType === 'blob') return { data: await response.blob(), status: response.status };
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

// Membership Types API
export const membershipTypeApi = {
    getAll: () => apiRequest('/memberships/'),
    getById: (id) => apiRequest(`/memberships/${id}/`),
    create: (data) => apiRequest('/memberships/', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/memberships/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/memberships/${id}/`, { method: 'DELETE' }),
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

// Dashboard Stats API
export const statsApi = {
    getDashboard: () => apiRequest('/stats/dashboard/'),
};

// Reports API
export const reportApi = {
    getRevenue: () => apiRequest('/reports/revenue/', { method: 'GET', responseType: 'blob' }),
    getAttendance: () => apiRequest('/reports/attendance/', { method: 'GET', responseType: 'blob' }),
    getTrainers: () => apiRequest('/reports/trainer_performance/', { method: 'GET', responseType: 'blob' }),
    getExpiringMemberships: () => apiRequest('/reports/expiring_memberships/', { method: 'GET', responseType: 'blob' }),
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